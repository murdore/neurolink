/**
 * Dynamic Arguments Module
 *
 * Provides dynamic configuration capabilities for NeuroLink,
 * enabling runtime resolution of configuration values through static values,
 * synchronous functions, asynchronous functions, or context-aware callbacks.
 *
 * All type definitions for this module live in `src/lib/types/dynamic.ts`
 * and are exposed via the types barrel (`src/lib/types/index.ts`).
 * This file only re-exports runtime values (classes, functions, constants).
 *
 * @module dynamic
 */

// Type guards (runtime)
export { isDynamicFunction, isContextAwareFunction } from "./resolution.js";

// Resolution utilities (runtime)
export {
  resolveDynamicArgument,
  resolveDynamicArguments,
  resolveDynamicConfig,
  memoizeDynamicArgument,
  withFallback,
  conditional,
  mapDynamicArgument,
  combineDynamicArguments,
  hasDynamicArgument,
  hasDynamicProperties,
  clearResolutionCache,
  getResolutionCacheStats,
  destroyResolver,
  resolutionCache,
  // Environment variable interpolation
  interpolateEnvVars,
  fromEnv,
  envVar,
  envSwitch,
  envJson,
  envNumber,
  envBoolean,
  envList,
} from "./dynamicResolver.js";

// Request context system (runtime)
export {
  createRequestContext,
  withRequestContext,
  getCurrentContext,
  requireContext,
  hasContext,
  updateCurrentContext,
  setRuntimeValue,
  getRuntimeValue,
  deleteRuntimeValue,
  clearRuntimeValues,
  createResolutionContext,
  createResolutionContextFromRequest,
  createContextFromRequest,
  RequestContextBuilder,
  createChildContext,
  withChildContext,
} from "./requestContext.js";

// Caching system (runtime)
export {
  DynamicCache,
  dynamicCache,
  createCacheKey,
  createStrategyCacheKey,
  withCache,
  invalidateCachePattern,
} from "./caching.js";
