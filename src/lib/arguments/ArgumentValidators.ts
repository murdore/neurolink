/**
 * Argument Validators
 *
 * Type guards and validation utilities for dynamic arguments.
 * Provides runtime type checking and validation for argument resolution.
 *
 * @module arguments/validators
 * @version 1.0.0
 */
import type {
  ArgumentDynamicArgument,
  ArgumentResolutionContext,
  ArgumentRequestContext,
  ArgumentResolutionType,
  ArgumentResolverFunction,
  ArgumentAsyncResolver,
  ArgumentContextAwareSyncResolver,
  ArgumentContextAwareAsyncResolver,
  ArgumentRequestContextUser,
  ArgumentRequestContextTenant,
  ArgumentRequestContextSession,
  ArgumentCreateRequestContextOptions,
  ArgumentValidationResult,
} from "../types/index.js";

// ============================================================================
// Type Guards for Dynamic Arguments
// ============================================================================

/**
 * Check if a value is a function (any kind of resolver)
 */
export function isDynamicFunction<T>(
  value: ArgumentDynamicArgument<T>,
): value is ArgumentResolverFunction<T> {
  return typeof value === "function";
}

/**
 * Check if a function is context-aware (has parameters)
 * Context-aware functions have fn.length > 0
 */
export function isContextAwareFunction<T>(
  fn: ArgumentResolverFunction<T>,
): fn is
  | ArgumentContextAwareSyncResolver<T>
  | ArgumentContextAwareAsyncResolver<T> {
  return fn.length > 0;
}

/**
 * Check if a function returns a promise (async function)
 */
export function isAsyncFunction<T>(
  fn: ArgumentResolverFunction<T>,
): fn is ArgumentAsyncResolver<T> | ArgumentContextAwareAsyncResolver<T> {
  // Check if it's an async function
  return (
    fn.constructor.name === "AsyncFunction" ||
    // Some transpilers don't preserve AsyncFunction, check the string representation
    fn.toString().includes("async") ||
    // Check if [Symbol.toStringTag] indicates AsyncFunction
    Object.prototype.toString.call(fn) === "[object AsyncFunction]"
  );
}

/**
 * Determine the resolution type for a dynamic argument
 */
export function getResolutionType<T>(
  argument: ArgumentDynamicArgument<T>,
): ArgumentResolutionType {
  if (!isDynamicFunction(argument)) {
    return "static";
  }

  const isContextAware = isContextAwareFunction(argument);
  const isAsync = isAsyncFunction(argument);

  if (isContextAware && isAsync) {
    return "context-aware-async";
  }
  if (isContextAware) {
    return "context-aware";
  }
  if (isAsync) {
    return "async-function";
  }
  return "sync-function";
}

/**
 * Check if a dynamic argument requires context for resolution
 */
export function requiresContext<T>(
  argument: ArgumentDynamicArgument<T>,
): boolean {
  if (!isDynamicFunction(argument)) {
    return false;
  }
  return isContextAwareFunction(argument);
}

/**
 * Check if a dynamic argument is async
 */
export function isAsyncArgument<T>(
  argument: ArgumentDynamicArgument<T>,
): boolean {
  if (!isDynamicFunction(argument)) {
    return false;
  }
  return isAsyncFunction(argument);
}

// ============================================================================
// Type Guards for Request Context
// ============================================================================

/**
 * Check if a value is a valid ArgumentRequestContext
 */
export function isRequestContext(
  value: unknown,
): value is ArgumentRequestContext {
  if (!value || typeof value !== "object") {
    return false;
  }

  const ctx = value as Record<string, unknown>;

  return (
    typeof ctx.requestId === "string" &&
    typeof ctx.timestamp === "number" &&
    (ctx.user === undefined || isRequestContextUser(ctx.user)) &&
    (ctx.tenant === undefined || isRequestContextTenant(ctx.tenant)) &&
    (ctx.session === undefined || isRequestContextSession(ctx.session))
  );
}

/**
 * Check if a value is a valid ArgumentRequestContextUser
 */
export function isRequestContextUser(
  value: unknown,
): value is ArgumentRequestContextUser {
  if (!value || typeof value !== "object") {
    return false;
  }

  const user = value as Record<string, unknown>;
  return typeof user.id === "string";
}

/**
 * Check if a value is a valid ArgumentRequestContextTenant
 */
export function isRequestContextTenant(
  value: unknown,
): value is ArgumentRequestContextTenant {
  if (!value || typeof value !== "object") {
    return false;
  }

  const tenant = value as Record<string, unknown>;
  return typeof tenant.id === "string";
}

/**
 * Check if a value is a valid ArgumentRequestContextSession
 */
export function isRequestContextSession(
  value: unknown,
): value is ArgumentRequestContextSession {
  if (!value || typeof value !== "object") {
    return false;
  }

  const session = value as Record<string, unknown>;
  return (
    typeof session.id === "string" && typeof session.startedAt === "number"
  );
}

/**
 * Check if a value is a valid ArgumentResolutionContext
 */
export function isDynamicResolutionContext(
  value: unknown,
): value is ArgumentResolutionContext {
  if (!value || typeof value !== "object") {
    return false;
  }

  const ctx = value as Record<string, unknown>;
  return isRequestContext(ctx.requestContext);
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validation result
 */
// ArgumentValidationResult type is now in src/lib/types/argumentResolution.ts

/**
 * Validate a request context
 */
export function validateRequestContext(
  context: unknown,
): ArgumentValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!context || typeof context !== "object") {
    return { valid: false, errors: ["Context must be an object"], warnings };
  }

  const ctx = context as Record<string, unknown>;

  // Required fields
  if (!ctx.requestId || typeof ctx.requestId !== "string") {
    errors.push("requestId is required and must be a string");
  }

  if (!ctx.timestamp || typeof ctx.timestamp !== "number") {
    errors.push("timestamp is required and must be a number");
  }

  // Optional user validation
  if (ctx.user !== undefined) {
    const userValidation = validateUser(ctx.user);
    errors.push(...userValidation.errors);
    warnings.push(...userValidation.warnings);
  }

  // Optional tenant validation
  if (ctx.tenant !== undefined) {
    const tenantValidation = validateTenant(ctx.tenant);
    errors.push(...tenantValidation.errors);
    warnings.push(...tenantValidation.warnings);
  }

  // Optional session validation
  if (ctx.session !== undefined) {
    const sessionValidation = validateSession(ctx.session);
    errors.push(...sessionValidation.errors);
    warnings.push(...sessionValidation.warnings);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate user context
 */
export function validateUser(user: unknown): ArgumentValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!user || typeof user !== "object") {
    return { valid: false, errors: ["user must be an object"], warnings };
  }

  const u = user as Record<string, unknown>;

  if (!u.id || typeof u.id !== "string") {
    errors.push("user.id is required and must be a string");
  }

  if (u.email !== undefined && typeof u.email !== "string") {
    errors.push("user.email must be a string");
  }

  if (u.roles !== undefined) {
    if (!Array.isArray(u.roles)) {
      errors.push("user.roles must be an array");
    } else if (!u.roles.every((r) => typeof r === "string")) {
      errors.push("user.roles must contain only strings");
    }
  }

  if (u.permissions !== undefined) {
    if (!Array.isArray(u.permissions)) {
      errors.push("user.permissions must be an array");
    } else if (!u.permissions.every((p) => typeof p === "string")) {
      errors.push("user.permissions must contain only strings");
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate tenant context
 */
export function validateTenant(tenant: unknown): ArgumentValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!tenant || typeof tenant !== "object") {
    return { valid: false, errors: ["tenant must be an object"], warnings };
  }

  const t = tenant as Record<string, unknown>;

  if (!t.id || typeof t.id !== "string") {
    errors.push("tenant.id is required and must be a string");
  }

  const validPlans = ["free", "starter", "pro", "enterprise"];
  if (t.plan !== undefined && !validPlans.includes(t.plan as string)) {
    warnings.push(`tenant.plan should be one of: ${validPlans.join(", ")}`);
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate session context
 */
export function validateSession(session: unknown): ArgumentValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!session || typeof session !== "object") {
    return { valid: false, errors: ["session must be an object"], warnings };
  }

  const s = session as Record<string, unknown>;

  if (!s.id || typeof s.id !== "string") {
    errors.push("session.id is required and must be a string");
  }

  if (!s.startedAt || typeof s.startedAt !== "number") {
    errors.push("session.startedAt is required and must be a number");
  }

  if (s.expiresAt !== undefined && typeof s.expiresAt !== "number") {
    errors.push("session.expiresAt must be a number");
  }

  // Check for expired session
  if (typeof s.expiresAt === "number" && s.expiresAt < Date.now()) {
    warnings.push("session has expired");
  }

  return { valid: errors.length === 0, errors, warnings };
}

// ============================================================================
// Context Creation Helpers
// ============================================================================

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Create a request context with defaults
 */
export function createRequestContext(
  options: ArgumentCreateRequestContextOptions = {},
): ArgumentRequestContext {
  const context: ArgumentRequestContext = {
    requestId: options.requestId || generateRequestId(),
    timestamp: Date.now(),
  };

  if (options.user) {
    context.user = options.user;
  }

  if (options.tenant) {
    context.tenant = options.tenant;
  }

  if (options.session) {
    context.session = options.session;
  }

  if (options.resource) {
    context.resource = options.resource;
  }

  if (options.environment) {
    context.environment = {
      nodeEnv:
        options.environment.nodeEnv || process.env.NODE_ENV || "development",
      ...options.environment,
    };
  }

  if (options.custom) {
    context.custom = options.custom;
  }

  return context;
}

/**
 * Create a minimal request context for testing
 */
export function createMinimalContext(
  requestId?: string,
): ArgumentRequestContext {
  return {
    requestId: requestId || generateRequestId(),
    timestamp: Date.now(),
  };
}

/**
 * Create a resolution context from a request context
 */
export function createResolutionContext(
  requestContext: ArgumentRequestContext,
  neurolink?: ArgumentResolutionContext["neurolink"],
  signal?: AbortSignal,
): ArgumentResolutionContext {
  return {
    requestContext,
    neurolink,
    signal,
  };
}

// ============================================================================
// Assertion Helpers
// ============================================================================

/**
 * Assert that context is provided when required
 */
export function assertContextProvided(
  context: ArgumentResolutionContext | undefined,
  argumentName?: string,
): asserts context is ArgumentResolutionContext {
  if (!context) {
    throw new Error(
      argumentName
        ? `Context required for resolving '${argumentName}'`
        : "Context required for context-aware argument resolution",
    );
  }

  if (!context.requestContext) {
    throw new Error("requestContext is required in ArgumentResolutionContext");
  }
}

/**
 * Assert that a value is not null or undefined
 */
export function assertDefined<T>(
  value: T | null | undefined,
  name: string,
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(`${name} is required but was ${value}`);
  }
}

// ============================================================================
// Type Narrowing Helpers
// ============================================================================

/**
 * Narrow a dynamic argument to its static value if not a function
 */
export function asStatic<T>(argument: ArgumentDynamicArgument<T>): T | null {
  if (isDynamicFunction(argument)) {
    return null;
  }
  return argument as T;
}

/**
 * Get the function from a dynamic argument, or null if static
 */
export function asFunction<T>(
  argument: ArgumentDynamicArgument<T>,
): ArgumentResolverFunction<T> | null {
  if (isDynamicFunction(argument)) {
    return argument;
  }
  return null;
}
