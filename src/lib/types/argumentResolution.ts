/**
 * Dynamic Arguments Type System
 *
 * Provides type definitions for runtime configuration resolution in NeuroLink.
 * Supports static values, synchronous functions, asynchronous functions,
 * and context-aware functions for multi-tenant, user-preference-based configurations.
 *
 * @module arguments/types
 * @version 1.0.0
 */

import type { AIProviderName } from "../constants/enums.js";
import type { UnknownRecord } from "./common.js";

// ============================================================================
// User and Tenant Types
// ============================================================================

/**
 * User preferences for AI interactions
 */
export type ArgumentUserPreferences = {
  /** Preferred AI provider */
  preferredProvider?: AIProviderName | string;
  /** Preferred model name */
  preferredModel?: string;
  /** Default temperature setting */
  temperature?: number;
  /** Default max tokens */
  maxTokens?: number;
  /** Thinking level for extended reasoning */
  thinkingLevel?: "minimal" | "low" | "medium" | "high";
  /** Preferred language */
  language?: string;
  /** User's timezone */
  timezone?: string;
  /** Response style preference */
  responseStyle?: "concise" | "detailed" | "conversational";
  /** Custom preferences */
  custom?: UnknownRecord;
};

/**
 * Tenant-level quotas and limits
 */
export type ArgumentTenantQuotas = {
  /** Maximum tokens per day */
  tokensPerDay?: number;
  /** Maximum tokens per month */
  tokensPerMonth?: number;
  /** Rate limit: requests per minute */
  requestsPerMinute?: number;
  /** Rate limit: requests per day */
  requestsPerDay?: number;
  /** Maximum tokens per single request */
  maxTokensPerRequest?: number;
  /** List of allowed provider names */
  allowedProviders?: string[];
  /** List of allowed model names */
  allowedModels?: string[];
};

/**
 * Tenant-level settings and defaults
 */
export type ArgumentTenantSettings = {
  /** Default provider for this tenant */
  defaultProvider?: AIProviderName | string;
  /** Default model for this tenant */
  defaultModel?: string;
  /** Default temperature */
  defaultTemperature?: number;
  /** Default max tokens */
  defaultMaxTokens?: number;
  /** Enable tool usage */
  enableTools?: boolean;
  /** Enable streaming responses */
  enableStreaming?: boolean;
  /** API key overrides per provider */
  apiKeyOverrides?: Record<string, string>;
  /** Model overrides per provider */
  modelOverrides?: Record<string, string>;
  /** Custom settings */
  custom?: UnknownRecord;
};

// ============================================================================
// Request Context Types
// ============================================================================

/**
 * User information within request context
 */
export type ArgumentRequestContextUser = {
  /** Unique user identifier */
  id: string;
  /** User email */
  email?: string;
  /** User display name */
  name?: string;
  /** User roles for authorization */
  roles?: string[];
  /** Fine-grained permissions */
  permissions?: string[];
  /** User preferences for AI */
  preferences?: ArgumentUserPreferences;
  /** Additional user metadata */
  metadata?: UnknownRecord;
};

/**
 * Tenant/organization information within request context
 */
export type ArgumentRequestContextTenant = {
  /** Unique tenant identifier */
  id: string;
  /** Tenant name */
  name?: string;
  /** Subscription plan */
  plan?: "free" | "starter" | "pro" | "enterprise";
  /** Tenant quotas */
  quotas?: ArgumentTenantQuotas;
  /** Tenant settings */
  settings?: ArgumentTenantSettings;
  /** Additional tenant metadata */
  metadata?: UnknownRecord;
};

/**
 * Session information within request context
 */
export type ArgumentRequestContextSession = {
  /** Unique session identifier */
  id: string;
  /** Session start timestamp (unix ms) */
  startedAt: number;
  /** Associated conversation ID */
  conversationId?: string;
  /** Session expiry timestamp */
  expiresAt?: number;
  /** Additional session metadata */
  metadata?: UnknownRecord;
};

/**
 * Resource information for the current operation
 */
export type ArgumentRequestContextResource = {
  /** Resource type (e.g., "document", "conversation") */
  type: string;
  /** Resource identifier */
  id?: string;
  /** Resource action being performed */
  action?: string;
  /** Additional resource metadata */
  metadata?: UnknownRecord;
};

/**
 * Environment information
 */
export type ArgumentRequestContextEnvironment = {
  /** Node environment (development, production, etc.) */
  nodeEnv: string;
  /** Deployment region */
  region?: string;
  /** Deployment identifier */
  deploymentId?: string;
  /** Service version */
  version?: string;
};

/**
 * Complete request context passed to dynamic argument resolvers.
 * Contains all information about the current request, user, tenant, and session.
 */
export type ArgumentRequestContext = {
  /** Unique request identifier */
  requestId: string;

  /** Timestamp when context was created (unix ms) */
  timestamp: number;

  /** User information */
  user?: ArgumentRequestContextUser;

  /** Tenant/organization information */
  tenant?: ArgumentRequestContextTenant;

  /** Session information */
  session?: ArgumentRequestContextSession;

  /** Resource information */
  resource?: ArgumentRequestContextResource;

  /** Environment information */
  environment?: ArgumentRequestContextEnvironment;

  /** Runtime context values (mutable during request) */
  runtime?: Map<string, unknown>;

  /** Custom context extensions */
  custom?: UnknownRecord;
};

// ============================================================================
// Dynamic Resolution Context
// ============================================================================

/**
 * NeuroLink instance interface for resolution context
 * Provides access to NeuroLink capabilities during resolution
 */
export type DynamicResolutionNeuroLink = {
  /** Get list of available tools */
  getAvailableTools: () => Promise<string[]>;
  /** Check provider availability */
  getProviderStatus: (provider: string) => Promise<boolean>;
  /** Get runtime context map */
  getRuntimeContext: () => Map<string, unknown> | undefined;
};

/**
 * Context for dynamic argument resolution.
 * Combines request context with NeuroLink instance access.
 */
export type ArgumentResolutionContext = {
  /** Current request context */
  requestContext: ArgumentRequestContext;

  /** Access to NeuroLink instance methods (subset) */
  neurolink?: DynamicResolutionNeuroLink;

  /** Abort signal for cancellation */
  signal?: AbortSignal;
};

// ============================================================================
// Dynamic Argument Types
// ============================================================================

/**
 * Synchronous resolver function (no arguments)
 */
export type ArgumentSyncResolver<T> = () => T;

/**
 * Asynchronous resolver function (no arguments)
 */
export type ArgumentAsyncResolver<T> = () => Promise<T>;

/**
 * Context-aware synchronous resolver function
 */
export type ArgumentContextAwareSyncResolver<T> = (
  context: ArgumentResolutionContext,
) => T;

/**
 * Context-aware asynchronous resolver function
 */
export type ArgumentContextAwareAsyncResolver<T> = (
  context: ArgumentResolutionContext,
) => Promise<T>;

/**
 * Any resolver function type
 */
export type ArgumentResolverFunction<T> =
  | ArgumentSyncResolver<T>
  | ArgumentAsyncResolver<T>
  | ArgumentContextAwareSyncResolver<T>
  | ArgumentContextAwareAsyncResolver<T>;

/**
 * Dynamic argument type - can be static, function, or context-aware function.
 * This is the core type that enables runtime configuration resolution.
 *
 * @template T - The resolved value type
 *
 * @example Static value
 * ```typescript
 * const model: ArgumentDynamicArgument<string> = "gpt-4o";
 * ```
 *
 * @example Sync function
 * ```typescript
 * const model: ArgumentDynamicArgument<string> = () => process.env.MODEL || "gpt-4o";
 * ```
 *
 * @example Async function
 * ```typescript
 * const model: ArgumentDynamicArgument<string> = async () => {
 *   const config = await fetchConfig();
 *   return config.model;
 * };
 * ```
 *
 * @example Context-aware function
 * ```typescript
 * const model: ArgumentDynamicArgument<string> = ({ requestContext }) => {
 *   return requestContext.tenant?.plan === "enterprise"
 *     ? "claude-3-opus"
 *     : "gpt-4o-mini";
 * };
 * ```
 */
export type ArgumentDynamicArgument<T> = T | ArgumentResolverFunction<T>;

// ============================================================================
// Resolution Types
// ============================================================================

/**
 * Type of resolution that was performed
 */
export type ArgumentResolutionType =
  | "static"
  | "sync-function"
  | "async-function"
  | "context-aware"
  | "context-aware-async";

/**
 * Result of resolving a dynamic argument
 */
export type ArgumentResolutionResult<T> = {
  /** The resolved value */
  value: T;

  /** Type of resolution performed */
  resolutionType: ArgumentResolutionType;

  /** Whether result was from cache */
  fromCache: boolean;

  /** Time taken to resolve (ms) */
  resolutionTime: number;

  /** Cache key if caching was used */
  cacheKey?: string;

  /** Error that occurred during resolution (if throwOnError is false) */
  error?: Error;
};

/**
 * Options for resolution behavior
 */
export type ArgumentResolutionOptions<T = unknown> = {
  /** Whether to throw on resolution error (default: true) */
  throwOnError?: boolean;

  /** Default value to use if resolution fails */
  defaultValue?: T;

  /** Timeout in milliseconds for async resolution */
  timeout?: number;

  /** Whether to cache the result */
  cache?: boolean;

  /** Cache TTL in milliseconds */
  cacheTtl?: number;

  /** Cache strategy */
  cacheStrategy?: ArgumentCacheStrategy;

  /** Unique identifier for caching (auto-generated if not provided) */
  argumentId?: string;

  /** Abort signal for cancellation */
  signal?: AbortSignal;
};

// ============================================================================
// Caching Types
// ============================================================================

/**
 * Cache strategy for resolved values
 */
export type ArgumentCacheStrategy =
  | "per-request" // Cache for current request only
  | "per-user" // Cache per user
  | "per-tenant" // Cache per tenant
  | "global"; // Global cache

/**
 * Cache entry with metadata
 */
export type ArgumentCacheEntry<T> = {
  /** Cached value */
  value: T;

  /** When the entry was created */
  createdAt: number;

  /** When the entry expires */
  expiresAt: number;

  /** Cache strategy used */
  strategy: ArgumentCacheStrategy;

  /** Additional cache metadata */
  metadata?: UnknownRecord;
};

/**
 * Cache statistics
 */
export type ArgumentCacheStats = {
  /** Total cache hits */
  hits: number;

  /** Total cache misses */
  misses: number;

  /** Current cache size */
  size: number;

  /** Hit rate percentage */
  hitRate: number;
};

// ============================================================================
// Dynamic Configuration Types
// ============================================================================

/**
 * Convert a type to have dynamic argument versions of each property
 */
export type ArgumentDynamicConfig<T> = {
  [K in keyof T]: ArgumentDynamicArgument<T[K]>;
};

/**
 * Convert dynamic config back to resolved static values
 */
export type ArgumentResolvedConfig<T> = {
  [K in keyof T]: T[K] extends ArgumentDynamicArgument<infer U> ? U : T[K];
};

/**
 * Extract the resolved type from a ArgumentDynamicArgument
 */
export type ArgumentResolved<T> =
  T extends ArgumentDynamicArgument<infer U> ? U : T;

/**
 * Batch resolution result
 */
export type BatchResolutionResult<T extends readonly unknown[]> = {
  /** ArgumentResolved values in order */
  values: { [K in keyof T]: ArgumentResolutionResult<ArgumentResolved<T[K]>> };

  /** Total resolution time */
  totalTime: number;

  /** Number of cache hits */
  cacheHits: number;

  /** Number of errors (if throwOnError is false) */
  errors: number;
};

// ============================================================================
// Resolver Registration Types
// ============================================================================

/**
 * Resolver metadata for registration
 */
export type ArgumentResolverMetadata = {
  /** Resolver name */
  name: string;

  /** Resolver description */
  description?: string;

  /** Resolver version */
  version?: string;

  /** Whether resolver is async */
  isAsync: boolean;

  /** Whether resolver requires context */
  requiresContext: boolean;

  /** Estimated resolution time (ms) */
  estimatedTime?: number;

  /** Tags for categorization */
  tags?: string[];
};

/**
 * Registered resolver entry
 */
export type ArgumentRegisteredResolver<T = unknown> = {
  /** Unique resolver ID */
  id: string;

  /** Resolver (can be static value, function, or context-aware function) */
  resolver: ArgumentDynamicArgument<T>;

  /** Resolver metadata */
  metadata: ArgumentResolverMetadata;

  /** Default resolution options */
  defaultOptions?: ArgumentResolutionOptions<T>;
};

// ============================================================================
// Event Types
// ============================================================================

/**
 * Event payload types
 */
export type ArgumentResolutionStartEvent = {
  argumentId: string;
  resolutionType: ArgumentResolutionType;
  timestamp: number;
};

export type ArgumentResolutionCompleteEvent = {
  argumentId: string;
  resolutionType: ArgumentResolutionType;
  duration: number;
  fromCache: boolean;
};

export type ArgumentResolutionErrorEvent = {
  argumentId: string;
  error: Error;
  willRetry: boolean;
};

export type ArgumentCacheHitEvent = {
  argumentId: string;
  cacheKey: string;
  strategy: ArgumentCacheStrategy;
};

export type ArgumentCacheMissEvent = {
  argumentId: string;
  cacheKey: string;
  strategy: ArgumentCacheStrategy;
};

export type ArgumentCacheExpiredEvent = {
  argumentId: string;
  cacheKey: string;
};

/**
 * Events emitted during resolution.
 * Each event maps to an array of arguments for TypedEventEmitter compatibility.
 */
export type ArgumentResolutionEvents = {
  /** Resolution started */
  "resolution:start": [ArgumentResolutionStartEvent];

  /** Resolution completed */
  "resolution:complete": [ArgumentResolutionCompleteEvent];

  /** Resolution error */
  "resolution:error": [ArgumentResolutionErrorEvent];

  /** Cache hit */
  "cache:hit": [ArgumentCacheHitEvent];

  /** Cache miss */
  "cache:miss": [ArgumentCacheMissEvent];

  /** Cache entry expired */
  "cache:expired": [ArgumentCacheExpiredEvent];
};

// ============================================================================
// Error Types
// ============================================================================

/**
 * Error codes for dynamic arguments
 */
export const ArgumentErrorCodes = {
  RESOLUTION_FAILED: "ARGUMENT_RESOLUTION_FAILED",
  TIMEOUT: "ARGUMENT_RESOLUTION_TIMEOUT",
  CONTEXT_REQUIRED: "ARGUMENT_CONTEXT_REQUIRED",
  VALIDATION_FAILED: "ARGUMENT_VALIDATION_FAILED",
  CACHE_ERROR: "ARGUMENT_CACHE_ERROR",
  RESOLVER_NOT_FOUND: "ARGUMENT_RESOLVER_NOT_FOUND",
  INVALID_ARGUMENT: "ARGUMENT_INVALID_TYPE",
} as const;

export type ArgumentErrorCode =
  (typeof ArgumentErrorCodes)[keyof typeof ArgumentErrorCodes];

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Options for creating a request context
 */
export type ArgumentCreateRequestContextOptions = {
  /** Request ID (auto-generated if not provided) */
  requestId?: string;

  /** User information */
  user?: ArgumentRequestContextUser;

  /** Tenant information */
  tenant?: ArgumentRequestContextTenant;

  /** Session information */
  session?: ArgumentRequestContextSession;

  /** Resource information */
  resource?: ArgumentRequestContextResource;

  /** Environment information */
  environment?: Partial<ArgumentRequestContextEnvironment>;

  /** Custom extensions */
  custom?: UnknownRecord;
};

/**
 * Configuration for the argument resolver
 */
export type ArgumentResolverConfig = {
  /** Default timeout for async resolution (ms) */
  defaultTimeout?: number;

  /** Enable caching by default */
  enableCache?: boolean;

  /** Default cache TTL (ms) */
  defaultCacheTtl?: number;

  /** Default cache strategy */
  defaultCacheStrategy?: ArgumentCacheStrategy;

  /** Maximum cache size */
  maxCacheSize?: number;

  /** Cache cleanup interval (ms) */
  cacheCleanupInterval?: number;

  /** Throw on error by default */
  throwOnError?: boolean;

  /** Enable event emission */
  enableEvents?: boolean;
};

/**
 * Runtime value descriptor for environment/secret resolution
 */
export type RuntimeValueDescriptor = {
  /** Source of the value */
  source: "env" | "secret" | "config" | "runtime";

  /** Key/name of the value */
  key: string;

  /** Optional transformer function */
  transform?: (value: string) => unknown;

  /** Default value if not found */
  defaultValue?: unknown;

  /** Whether the value is required */
  required?: boolean;
};

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Result of argument validation
 */
export type ArgumentValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

// ============================================================================
// Registry Types
// ============================================================================

/**
 * Options for registering a resolver in the ArgumentDynamicArgumentRegistry
 */
export type ArgumentRegisterResolverOptions<T> = {
  /** Resolver description */
  description?: string;

  /** Resolver version */
  version?: string;

  /** Tags for categorization */
  tags?: string[];

  /** Default resolution options */
  defaultOptions?: ArgumentResolutionOptions<T>;

  /** Override if already registered */
  override?: boolean;
};

/**
 * Filter options for listing resolvers
 */
export type ArgumentResolverFilter = {
  /** Filter by tags */
  tags?: string[];

  /** Filter by async/sync */
  isAsync?: boolean;

  /** Filter by context requirement */
  requiresContext?: boolean;

  /** Filter by name pattern */
  namePattern?: string | RegExp;
};

// ============================================================================
// Environment Resolver Types
// ============================================================================

/**
 * Options for creating an environment-based resolver
 */
export type ArgumentEnvConfigOptions<T> = {
  /** Environment variable key */
  key: string;

  /** Default value if not set */
  defaultValue?: T;

  /** Whether the variable is required */
  required?: boolean;

  /** Transform function for the value */
  transform?: (value: string) => T;

  /** Validation function */
  validate?: (value: T) => boolean;

  /** Error message for validation failure */
  validationError?: string;
};

// ============================================================================
// Secret Resolver Types
// ============================================================================

/**
 * Interface for secret providers
 */
export type ArgumentSecretProvider = {
  /** Provider name */
  name: string;

  /** Get a secret by key */
  getSecret: (key: string) => Promise<string | undefined>;

  /** Check if provider is available */
  isAvailable: () => Promise<boolean>;

  /** Optional: List available secrets (for debugging) */
  listSecrets?: () => Promise<string[]>;
};

/**
 * Secret resolution result
 */
export type ArgumentSecretResolutionResult = {
  /** The resolved secret value */
  value: string | undefined;

  /** Which provider resolved the secret */
  provider: string;

  /** Whether the value was from cache */
  fromCache: boolean;

  /** Time taken to resolve */
  resolutionTime: number;
};

/**
 * Configuration for SecretManager
 */
export type ArgumentSecretManagerConfig = {
  /** Secret providers in priority order */
  providers?: ArgumentSecretProvider[];

  /** Enable caching */
  enableCache?: boolean;

  /** Cache TTL in milliseconds */
  cacheTtl?: number;

  /** Maximum cache size */
  maxCacheSize?: number;

  /** Enable audit logging */
  enableAuditLog?: boolean;

  /** Redact secrets in logs */
  redactInLogs?: boolean;
};

// ============================================================================
// Internal Implementation Types
// ============================================================================

/**
 * Cache entry for SecretManager internal cache.
 */
export type ArgumentSecretCacheEntry = {
  value: string;
  expiresAt: number;
  provider: string;
};

/**
 * CLI context data persisted to disk.
 */
export type CliContextData = {
  userId?: string;
  userEmail?: string;
  tenantId?: string;
  tenantPlan?: "free" | "starter" | "pro" | "enterprise";
  sessionId?: string;
  env?: "development" | "staging" | "production";
  runtimeContext?: Record<string, unknown>;
  updatedAt?: string;
};

/**
 * CLI context command options.
 */
export type CliContextOptions = {
  userId?: string;
  userEmail?: string;
  tenantId?: string;
  tenantPlan?: string;
  sessionId?: string;
  env?: string;
  runtimeContext?: string;
  format?: "text" | "json";
  key?: string;
};
