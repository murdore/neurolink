/**
 * Dynamic Arguments Module
 *
 * Provides runtime configuration resolution for NeuroLink.
 * Supports static values, synchronous functions, asynchronous functions,
 * and context-aware functions for multi-tenant, user-preference-based configurations.
 *
 * All type definitions for this module live in `src/lib/types/argumentResolution.ts`.
 * This file only re-exports runtime values (classes, functions, constants).
 *
 * @module arguments
 * @version 1.0.0
 */

// ============================================================================
// Constants from Types
// ============================================================================

export { ArgumentErrorCodes } from "../types/index.js";

// ============================================================================
// Validator Exports
// ============================================================================

export {
  // Type guards
  isDynamicFunction,
  isContextAwareFunction,
  isAsyncFunction,
  getResolutionType,
  requiresContext,
  isAsyncArgument,

  // Request context guards
  isRequestContext,
  isRequestContextUser,
  isRequestContextTenant,
  isRequestContextSession,
  isDynamicResolutionContext,

  // Validation functions
  validateRequestContext,
  validateUser,
  validateTenant,
  validateSession,

  // Context creation
  generateRequestId,
  generateSessionId,
  createRequestContext,
  createMinimalContext,
  createResolutionContext,

  // Assertions
  assertContextProvided,
  assertDefined,

  // Type narrowing
  asStatic,
  asFunction,
} from "./ArgumentValidators.js";

// ============================================================================
// Resolver Exports
// ============================================================================

export {
  // Main resolver class
  ArgumentResolver,

  // Standalone resolution functions
  resolveDynamicArgument,
  resolveDynamicArguments,
  resolveDynamicConfig,

  // Helper utilities
  withFallback,
  conditional,
  memoize,
  lazy,
  transform,
  all,
  any,

  // Configuration
  configureDefaultResolver,
  resetDefaultResolver,
} from "./ArgumentResolver.js";

// ============================================================================
// Registry Exports
// ============================================================================

export {
  DynamicArgumentRegistry,
  getArgumentRegistry,
  registerResolver,
  resolveRegistered,
  resolverRef,
} from "./DynamicArgumentRegistry.js";

// ============================================================================
// Context Resolver Exports
// ============================================================================

export {
  // Context access
  getCurrentContext,
  requireCurrentContext,
  getContextValue,

  // Context scopes
  withRequestContext,
  withUpdatedContext,
  withUser,
  withTenant,
  withSession,

  // Runtime values
  setRuntimeValue,
  getRuntimeValue,
  deleteRuntimeValue,
  hasRuntimeValue,

  // Context builder
  RequestContextBuilder,

  // HTTP integration
  createContextFromRequest,
  getContextHeaders,

  // Utilities
  cloneContext,
  createCurrentResolutionContext,
  hasContext,
  getCurrentUserId,
  getCurrentTenantId,
  getCurrentTenantPlan,
  hasRole,
  hasPermission,
  isEnterpriseTenant,
} from "./resolvers/ContextResolver.js";

// ============================================================================
// Environment Resolver Exports
// ============================================================================

export {
  // Direct access
  getEnv,
  requireEnv,
  getEnvNumber,
  getEnvBoolean,
  getEnvJson,
  getEnvArray,

  // Dynamic argument factories
  fromEnv,
  fromEnvRequired,
  fromEnvNumber,
  fromEnvBoolean,
  fromEnvJson,
  fromEnvArray,

  // Environment selection
  envSelect,
  byEnvironment,

  // Advanced configuration
  createEnvResolver,
  createPrefixedEnv,
  fromEnvMultiple,
  fromDescriptor,

  // Validation
  validateEnvVars,
  assertEnvVars,
} from "./resolvers/EnvironmentResolver.js";

// ============================================================================
// Secret Resolver Exports
// ============================================================================

export {
  // Built-in providers
  envSecretProvider,
  createFileSecretProvider,
  createMockSecretProvider,

  // Secret manager
  SecretManager,

  // Dynamic argument factories
  fromSecret,
  fromSecretOptional,
  fromApiKey,
  fromTenantSecret,
  fromUserSecret,
  fromSecretChain,
  fromSecretWithTenantFallback,

  // Validation
  validateSecrets,
  assertSecrets,

  // Convenience functions
  getSecretSync,
  requireSecretSync,
  configureSecrets,
} from "./resolvers/SecretResolver.js";
