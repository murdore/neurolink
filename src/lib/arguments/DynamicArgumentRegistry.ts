/**
 * Dynamic Argument Registry
 *
 * Registry for managing named dynamic argument resolvers.
 * Enables registration, lookup, and lifecycle management of resolvers.
 *
 * @module arguments/registry
 * @version 1.0.0
 */
import { BaseRegistry } from "../core/infrastructure/index.js";
import { logger } from "../utils/logger.js";
import type {
  ArgumentDynamicArgument,
  ArgumentResolutionContext,
  ArgumentResolverMetadata,
  ArgumentRegisteredResolver,
  ArgumentRegisterResolverOptions,
  ArgumentResolverFilter,
  ArgumentResolutionOptions,
  ArgumentResolutionResult,
} from "../types/index.js";
import {
  getResolutionType,
  isAsyncArgument,
  requiresContext,
} from "./ArgumentValidators.js";
import { ArgumentResolver } from "./ArgumentResolver.js";

// ArgumentRegisterResolverOptions and ArgumentResolverFilter types are now in src/lib/types/argumentResolution.ts

// ============================================================================
// Dynamic Argument Registry
// ============================================================================

/**
 * Registry for managing named dynamic argument resolvers.
 *
 * @example Basic usage
 * ```typescript
 * const registry = DynamicArgumentRegistry.getInstance();
 *
 * // Register a resolver
 * registry.registerResolver("tenant-model", ({ requestContext }) => {
 *   return requestContext.tenant?.settings?.defaultModel || "gpt-4o";
 * });
 *
 * // Use the resolver
 * const result = await registry.resolve("tenant-model", context);
 * ```
 *
 * @example With options
 * ```typescript
 * registry.registerResolver(
 *   "cached-config",
 *   async () => await fetchRemoteConfig(),
 *   {
 *     description: "Fetches remote configuration",
 *     tags: ["config", "async"],
 *     defaultOptions: { cache: true, cacheTtl: 300000 }
 *   }
 * );
 * ```
 */
export class DynamicArgumentRegistry extends BaseRegistry<
  ArgumentRegisteredResolver<unknown>,
  ArgumentResolverMetadata
> {
  private static instance: DynamicArgumentRegistry;
  private resolver: ArgumentResolver;

  private constructor() {
    super();
    this.resolver = new ArgumentResolver();
  }

  /**
   * Get the singleton instance
   */
  static getInstance(): DynamicArgumentRegistry {
    if (!DynamicArgumentRegistry.instance) {
      DynamicArgumentRegistry.instance = new DynamicArgumentRegistry();
    }
    return DynamicArgumentRegistry.instance;
  }

  /**
   * Required by BaseRegistry - registers built-in resolvers
   */
  protected async registerAll(): Promise<void> {
    // Register built-in resolvers
    this.registerBuiltins();
    logger.debug("[DynamicArgumentRegistry] Built-in resolvers registered");
  }

  /**
   * Register built-in resolvers
   */
  private registerBuiltins(): void {
    // Environment variable resolver
    this.registerResolver(
      "env",
      (context: ArgumentResolutionContext) => {
        const key = context.requestContext.custom?.envKey as string;
        return key ? process.env[key] : undefined;
      },
      {
        description: "Resolves environment variables",
        tags: ["builtin", "env"],
      },
    );

    // Current timestamp resolver
    this.registerResolver("timestamp", () => Date.now(), {
      description: "Returns current timestamp",
      tags: ["builtin", "time"],
    });

    // Request ID resolver
    this.registerResolver(
      "request-id",
      (context: ArgumentResolutionContext) => context.requestContext.requestId,
      {
        description: "Returns current request ID",
        tags: ["builtin", "request"],
      },
    );

    // User ID resolver
    this.registerResolver(
      "user-id",
      (context: ArgumentResolutionContext) =>
        context.requestContext.user?.id || "anonymous",
      {
        description: "Returns current user ID",
        tags: ["builtin", "user"],
      },
    );

    // Tenant ID resolver
    this.registerResolver(
      "tenant-id",
      (context: ArgumentResolutionContext) =>
        context.requestContext.tenant?.id || "default",
      {
        description: "Returns current tenant ID",
        tags: ["builtin", "tenant"],
      },
    );

    // Tenant plan resolver
    this.registerResolver(
      "tenant-plan",
      (context: ArgumentResolutionContext) =>
        context.requestContext.tenant?.plan || "free",
      {
        description: "Returns current tenant plan",
        tags: ["builtin", "tenant"],
      },
    );
  }

  /**
   * Register a new resolver
   */
  registerResolver<T>(
    id: string,
    resolver: ArgumentDynamicArgument<T>,
    options: ArgumentRegisterResolverOptions<T> = {},
  ): void {
    // Check if already registered
    if (this.has(id) && !options.override) {
      throw new Error(
        `Resolver '${id}' already registered. Use override: true to replace.`,
      );
    }

    // Compute resolution type for logging (but use simpler checks for metadata)
    const _resType = getResolutionType(resolver); // Keep for potential future use
    void _resType; // Silence unused variable warning
    const isAsync = isAsyncArgument(resolver);
    const needsContext = requiresContext(resolver);

    const metadata: ArgumentResolverMetadata = {
      name: id,
      description: options.description,
      version: options.version,
      isAsync,
      requiresContext: needsContext,
      tags: options.tags,
    };

    const registeredResolver: ArgumentRegisteredResolver<T> = {
      id,
      resolver,
      metadata,
      defaultOptions: options.defaultOptions,
    };

    // Use parent class register method
    super.register(
      id,
      async () => registeredResolver as ArgumentRegisteredResolver<unknown>,
      [],
      { metadata },
    );

    logger.debug(`[DynamicArgumentRegistry] Registered resolver: ${id}`, {
      isAsync,
      requiresContext: needsContext,
      tags: options.tags,
    });
  }

  /**
   * Unregister a resolver
   */
  unregister(id: string): boolean {
    if (!this.has(id)) {
      return false;
    }

    // Access the protected items map
    const deleted = (
      this as unknown as { items: Map<string, unknown> }
    ).items.delete(id);
    logger.debug(`[DynamicArgumentRegistry] Unregistered resolver: ${id}`);
    return deleted;
  }

  /**
   * Resolve a registered resolver by ID
   */
  async resolve<T>(
    id: string,
    context?: ArgumentResolutionContext,
    options?: ArgumentResolutionOptions<T>,
  ): Promise<ArgumentResolutionResult<T>> {
    await this.ensureInitialized();

    const entry = await this.get(id);
    if (!entry) {
      throw new Error(`Resolver '${id}' not found`);
    }

    const mergedOptions: ArgumentResolutionOptions<T> = {
      ...(entry.defaultOptions as ArgumentResolutionOptions<T> | undefined),
      ...options,
      argumentId: id,
    };

    return this.resolver.resolve<T>(
      entry.resolver as ArgumentDynamicArgument<T>,
      context,
      mergedOptions,
    );
  }

  /**
   * Get resolver metadata by ID
   */
  async getMetadata(id: string): Promise<ArgumentResolverMetadata | undefined> {
    await this.ensureInitialized();

    const entry = await this.get(id);
    return entry?.metadata;
  }

  /**
   * List all registered resolvers with optional filtering
   */
  listResolvers(filter?: ArgumentResolverFilter): Array<{
    id: string;
    metadata: ArgumentResolverMetadata;
  }> {
    const all = this.list();

    if (!filter) {
      return all;
    }

    return all.filter(({ id, metadata }) => {
      // Filter by tags
      if (filter.tags && filter.tags.length > 0) {
        const hasTags = filter.tags.every((tag) =>
          metadata.tags?.includes(tag),
        );
        if (!hasTags) {
          return false;
        }
      }

      // Filter by async
      if (filter.isAsync !== undefined && metadata.isAsync !== filter.isAsync) {
        return false;
      }

      // Filter by context requirement
      if (
        filter.requiresContext !== undefined &&
        metadata.requiresContext !== filter.requiresContext
      ) {
        return false;
      }

      // Filter by name pattern
      if (filter.namePattern) {
        const pattern =
          filter.namePattern instanceof RegExp
            ? filter.namePattern
            : new RegExp(
                filter.namePattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
              );
        if (!pattern.test(id)) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Get resolvers by tag
   */
  getByTag(
    tag: string,
  ): Array<{ id: string; metadata: ArgumentResolverMetadata }> {
    return this.listResolvers({ tags: [tag] });
  }

  /**
   * Check if a resolver exists
   */
  hasResolver(id: string): boolean {
    return this.has(id);
  }

  /**
   * Create a dynamic argument that uses a registered resolver
   *
   * @example
   * ```typescript
   * const registry = DynamicArgumentRegistry.getInstance();
   * registry.registerResolver("model-selector", ({ requestContext }) => {
   *   return requestContext.tenant?.plan === "enterprise" ? "claude-3-opus" : "gpt-4o";
   * });
   *
   * // Create a reference to use elsewhere
   * const modelArg = registry.createRef("model-selector");
   *
   * // Use it in generate options
   * await neurolink.generate({
   *   model: modelArg,
   *   input: { text: "Hello" }
   * });
   * ```
   */
  createRef<T>(id: string): ArgumentDynamicArgument<T> {
    return async (context: ArgumentResolutionContext): Promise<T> => {
      const result = await this.resolve<T>(id, context);
      return result.value;
    };
  }

  /**
   * Compose multiple resolvers into a single resolver
   *
   * @example
   * ```typescript
   * const composed = registry.compose(
   *   ["base-model", "tenant-override", "user-preference"],
   *   (results) => results.find(r => r !== undefined) || "gpt-4o"
   * );
   * ```
   */
  compose<T, R>(
    ids: string[],
    combiner: (results: T[]) => R,
  ): ArgumentDynamicArgument<R> {
    return async (context: ArgumentResolutionContext): Promise<R> => {
      const results = await Promise.all(
        ids.map(async (id) => {
          const result = await this.resolve<T>(id, context, {
            throwOnError: false,
          });
          return result.value;
        }),
      );

      return combiner(results);
    };
  }

  /**
   * Create a resolver chain with fallback behavior
   */
  chain<T>(...ids: string[]): ArgumentDynamicArgument<T | undefined> {
    return async (
      context: ArgumentResolutionContext,
    ): Promise<T | undefined> => {
      for (const id of ids) {
        try {
          const result = await this.resolve<T>(id, context, {
            throwOnError: false,
          });
          if (result.value !== undefined && result.value !== null) {
            return result.value;
          }
        } catch {
          // Continue to next resolver
        }
      }
      return undefined;
    };
  }

  /**
   * Dispose of the registry
   */
  dispose(): void {
    this.resolver.dispose();
    this.clear();
  }

  /**
   * Reset the singleton instance (for testing)
   */
  static resetInstance(): void {
    if (DynamicArgumentRegistry.instance) {
      DynamicArgumentRegistry.instance.dispose();
      DynamicArgumentRegistry.instance =
        null as unknown as DynamicArgumentRegistry;
    }
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Get the global registry instance
 */
export function getArgumentRegistry(): DynamicArgumentRegistry {
  return DynamicArgumentRegistry.getInstance();
}

/**
 * Register a resolver in the global registry
 */
export function registerResolver<T>(
  id: string,
  resolver: ArgumentDynamicArgument<T>,
  options?: ArgumentRegisterResolverOptions<T>,
): void {
  getArgumentRegistry().registerResolver(id, resolver, options);
}

/**
 * Resolve using a registered resolver from the global registry
 */
export async function resolveRegistered<T>(
  id: string,
  context?: ArgumentResolutionContext,
  options?: ArgumentResolutionOptions<T>,
): Promise<ArgumentResolutionResult<T>> {
  return getArgumentRegistry().resolve(id, context, options);
}

/**
 * Create a reference to a registered resolver
 */
export function resolverRef<T>(id: string): ArgumentDynamicArgument<T> {
  return getArgumentRegistry().createRef(id);
}
