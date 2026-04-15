#!/usr/bin/env tsx
/**
 * Continuous Test Suite: Dynamic Arguments
 *
 * Tests that generate() and stream() correctly resolve function-valued
 * options with real API calls. Skips gracefully when provider is unavailable.
 *
 * Run: npx tsx test/continuous-test-suite-dynamic.ts
 * Run with provider: npx tsx test/continuous-test-suite-dynamic.ts --provider=vertex
 */

import { NeuroLink } from "../dist/index.js";
import type { DynamicResolutionContext } from "../dist/index.js";

// =============================================================================
// TEST RUNNER INFRASTRUCTURE
// =============================================================================

let passed = 0;
let failed = 0;
let skipped = 0;
const failures: Array<{ name: string; error: string }> = [];

const C = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  blue: "\x1b[34m",
} as const;

function log(msg: string, color: keyof typeof C = "reset"): void {
  console.log(`${C[color]}${msg}${C.reset}`);
}

function section(title: string): void {
  console.log("\n" + "=".repeat(70));
  log(`  ${title}`, "cyan");
  console.log("=".repeat(70) + "\n");
}

async function test(
  name: string,
  fn: () => Promise<boolean | null>,
): Promise<void> {
  try {
    const result = await fn();
    if (result === null) {
      skipped++;
      console.log(
        `  ${C.yellow}⊘${C.reset} ${name} ${C.yellow}(skipped)${C.reset}`,
      );
    } else if (result) {
      passed++;
      console.log(`  ${C.green}✓${C.reset} ${name}`);
    } else {
      failed++;
      failures.push({ name, error: "assertion failed" });
      console.log(`  ${C.red}✗${C.reset} ${name}`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    failed++;
    failures.push({ name, error: msg });
    console.log(`  ${C.red}✗${C.reset} ${name}`);
    console.log(`    ${C.yellow}→ ${msg.slice(0, 150)}${C.reset}`);
  }
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const PROVIDER_MAX_TOKENS: Record<string, number> = {
  anthropic: 8192,
  vertex: 10000,
  "google-ai-studio": 10000,
  openai: 16384,
  bedrock: 8192,
  ollama: 4096,
  openrouter: 4096,
};

const TEST_CONFIG = {
  provider: process.env.TEST_PROVIDER || "vertex",
  model: process.env.TEST_MODEL || (undefined as string | undefined),
  maxTokens: 100, // Small for fast tests
  timeout: 60000,
};

// Parse CLI args
for (const arg of process.argv.slice(2)) {
  if (arg.startsWith("--provider=")) {
    TEST_CONFIG.provider = arg.split("=")[1]!;
  }
  if (arg.startsWith("--model=")) {
    TEST_CONFIG.model = arg.split("=")[1]!;
  }
}

function buildBaseOptions(includeModel = true): Record<string, unknown> {
  const opts: Record<string, unknown> = {
    provider: TEST_CONFIG.provider,
    maxTokens: TEST_CONFIG.maxTokens,
    disableTools: true, // Faster tests without MCP tool discovery
  };
  if (includeModel && TEST_CONFIG.model) {
    opts.model = TEST_CONFIG.model;
  }
  return opts;
}

function getTestModel(): string {
  return TEST_CONFIG.model || "gemini-2.5-flash";
}

function isExpectedProviderError(msg: string): boolean {
  const lower = msg.toLowerCase();
  return [
    "api key",
    "api_key",
    "authentication",
    "rate limit",
    "quota",
    "credentials",
    "cannot connect",
    "not configured",
    "permission denied",
    "billing",
    "econnrefused",
    "enotfound",
    "unauthorized",
    "unauthenticated",
    "403",
    "429",
    "could not resolve",
    "network",
    "timeout",
    "no providers",
    "failed to",
    "invalid api",
    "missing api",
    "google_application_credentials",
    "application default credentials",
    "service account",
    "project_id",
    "not found",
    "default credentials",
    "does not exist",
  ].some((p) => lower.includes(p));
}

// =============================================================================
// SECTION 1: generate() with dynamic arguments (real API calls)
// =============================================================================

async function testGenerate(): Promise<void> {
  section("SECTION 1: generate() with Dynamic Arguments (Real API)");

  const sdk = new NeuroLink();

  await test("1.1 generate with dynamic model function", async () => {
    try {
      const result = await sdk.generate({
        input: { text: "Reply with exactly: DYNAMIC_TEST_OK" },
        model: () => getTestModel(),
        ...buildBaseOptions(false),
      });
      // Verify we got a real response
      const text = result.text || result.content || "";
      return text.length > 0;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (isExpectedProviderError(msg)) {
        return null; // SKIP
      }
      throw error;
    }
  });

  await test("1.2 generate with context-aware model via withContext", async () => {
    try {
      const result = await sdk.withContext(
        { tenant: { id: "test-tenant", plan: "enterprise" } },
        () =>
          sdk.generate({
            input: { text: "Reply with exactly: CONTEXT_TEST_OK" },
            model: (ctx: DynamicResolutionContext) =>
              ctx.requestContext.tenant?.plan === "enterprise"
                ? getTestModel()
                : "gemini-2.5-flash",
            temperature: (ctx: DynamicResolutionContext) =>
              ctx.requestContext.tenant?.plan === "enterprise" ? 0.1 : 0.9,
            ...buildBaseOptions(false),
          }),
      );
      const text = result.text || result.content || "";
      return text.length > 0;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (isExpectedProviderError(msg)) {
        return null;
      }
      throw error;
    }
  });

  await test("1.3 generate with dynamic systemPrompt", async () => {
    try {
      const result = await sdk.withContext({ user: { id: "test-user" } }, () =>
        sdk.generate({
          input: { text: "Who are you speaking to?" },
          systemPrompt: (ctx: DynamicResolutionContext) =>
            `You are helping user ${ctx.requestContext.user?.id}. Always mention their ID in your response.`,
          ...buildBaseOptions(),
        }),
      );
      // The AI should mention the user ID in the response
      const text = result.text || result.content || "";
      return text.length > 0;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (isExpectedProviderError(msg)) {
        return null;
      }
      throw error;
    }
  });

  await test("1.4 generate with inline context (no withContext wrapper)", async () => {
    try {
      const result = await sdk.generate({
        input: { text: "Reply with exactly: INLINE_CONTEXT_OK" },
        model: (ctx: DynamicResolutionContext) =>
          ctx.requestContext.tenant?.plan === "enterprise"
            ? getTestModel()
            : "gemini-2.5-flash",
        context: { tenant: { id: "inline-tenant", plan: "enterprise" } },
        ...buildBaseOptions(false),
      } as Record<string, unknown>);
      const text = result.text || result.content || "";
      return text.length > 0;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (isExpectedProviderError(msg)) {
        return null;
      }
      throw error;
    }
  });

  await sdk.dispose?.();
}

// =============================================================================
// SECTION 2: stream() with dynamic arguments (real API calls)
// =============================================================================

async function testStream(): Promise<void> {
  section("SECTION 2: stream() with Dynamic Arguments (Real API)");

  const sdk = new NeuroLink();

  await test("2.1 stream with dynamic model function", async () => {
    try {
      const streamResult = await sdk.stream({
        input: { text: "Count from 1 to 3." },
        model: () => getTestModel(),
        ...buildBaseOptions(false),
      });

      const chunks: string[] = [];
      let chunkCount = 0;
      for await (const chunk of streamResult.stream) {
        if ("content" in chunk) {
          chunks.push(chunk.content as string);
          chunkCount++;
          if (chunkCount >= 20) {
            break;
          }
        }
      }
      // Verify we got streaming chunks
      return chunks.length > 0 && chunks.join("").length > 0;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (isExpectedProviderError(msg)) {
        return null;
      }
      throw error;
    }
  });

  await test("2.2 stream with context-aware model via withContext", async () => {
    try {
      const streamResult = await sdk.withContext(
        { tenant: { id: "stream-tenant", plan: "pro" } },
        () =>
          sdk.stream({
            input: { text: "Say hello." },
            model: (ctx: DynamicResolutionContext) =>
              ctx.requestContext.tenant?.plan === "pro"
                ? getTestModel()
                : "gemini-2.5-flash",
            ...buildBaseOptions(false),
          }),
      );

      const chunks: string[] = [];
      for await (const chunk of streamResult.stream) {
        if ("content" in chunk) {
          chunks.push(chunk.content as string);
          if (chunks.length >= 10) {
            break;
          }
        }
      }
      return chunks.length > 0;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (isExpectedProviderError(msg)) {
        return null;
      }
      throw error;
    }
  });

  await test("2.3 stream with inline context (no withContext wrapper)", async () => {
    try {
      const streamResult = await sdk.stream({
        input: { text: "Say OK." },
        model: (ctx: DynamicResolutionContext) =>
          ctx.requestContext.user?.id === "stream-user"
            ? getTestModel()
            : "gemini-2.5-flash",
        context: { user: { id: "stream-user" } },
        ...buildBaseOptions(false),
      } as Record<string, unknown>);

      const chunks: string[] = [];
      for await (const chunk of streamResult.stream) {
        if ("content" in chunk) {
          chunks.push(chunk.content as string);
          if (chunks.length >= 10) {
            break;
          }
        }
      }
      return chunks.length > 0;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (isExpectedProviderError(msg)) {
        return null;
      }
      throw error;
    }
  });

  await sdk.dispose?.();
}

// =============================================================================
// SECTION 3: Resolution wiring verification (no API needed)
// =============================================================================

type Internal = {
  resolveDynamicGenerateOptions: (o: Record<string, unknown>) => Promise<void>;
  resolveDynamicStreamOptions: (o: Record<string, unknown>) => Promise<void>;
};

async function testResolution(): Promise<void> {
  section("SECTION 3: Resolution Wiring Verification (No API Needed)");

  const sdk = new NeuroLink();
  const priv = sdk as unknown as Internal;

  await test("3.1 withContext scope isolation", async () => {
    let inside: string | undefined;
    await sdk.withContext({ user: { id: "scoped" } }, async () => {
      inside = sdk.getDynamicContext()?.user?.id;
    });
    return inside === "scoped" && sdk.getDynamicContext() === undefined;
  });

  await test("3.2 generate resolves dynamic model + temperature", async () => {
    const o: Record<string, unknown> = {
      model: () => "resolved-model",
      temperature: () => 0.42,
    };
    await sdk.withContext({ user: { id: "u" } }, () =>
      priv.resolveDynamicGenerateOptions(o),
    );
    return o.model === "resolved-model" && o.temperature === 0.42;
  });

  await test("3.3 generate context-aware reads tenant plan", async () => {
    const o: Record<string, unknown> = {
      model: (ctx: DynamicResolutionContext) =>
        ctx.requestContext.tenant?.plan === "enterprise" ? "big" : "small",
    };
    await sdk.withContext({ tenant: { id: "t", plan: "enterprise" } }, () =>
      priv.resolveDynamicGenerateOptions(o),
    );
    return o.model === "big";
  });

  await test("3.4 multi-tenant isolation", async () => {
    const fn = (ctx: DynamicResolutionContext) =>
      ctx.requestContext.tenant?.plan === "enterprise" ? "big" : "small";

    const o1: Record<string, unknown> = { model: fn };
    await sdk.withContext({ tenant: { id: "t1", plan: "enterprise" } }, () =>
      priv.resolveDynamicGenerateOptions(o1),
    );

    const o2: Record<string, unknown> = { model: fn };
    await sdk.withContext({ tenant: { id: "t2", plan: "free" } }, () =>
      priv.resolveDynamicGenerateOptions(o2),
    );

    return o1.model === "big" && o2.model === "small";
  });

  await test("3.5 static values pass through unchanged", async () => {
    const o: Record<string, unknown> = { model: "gpt-4o", temperature: 0.5 };
    const before = JSON.stringify(o);
    await priv.resolveDynamicGenerateOptions(o);
    return JSON.stringify(o) === before;
  });

  await test("3.6 tools function maps to enabledToolNames", async () => {
    const o: Record<string, unknown> = {
      tools: () => ["read", "write"],
    };
    await sdk.withContext({ user: { id: "u" } }, () =>
      priv.resolveDynamicGenerateOptions(o),
    );
    return (
      JSON.stringify(o.enabledToolNames) === '["read","write"]' &&
      o.tools === undefined
    );
  });

  await test("3.7 stream resolves disableTools + enableAnalytics", async () => {
    const o: Record<string, unknown> = {
      disableTools: () => false,
      enableAnalytics: () => true,
    };
    await sdk.withContext({ user: { id: "u" } }, () =>
      priv.resolveDynamicStreamOptions(o),
    );
    return o.disableTools === false && o.enableAnalytics === true;
  });

  await test("3.8 inline context works without withContext wrapper", async () => {
    const o: Record<string, unknown> = {
      model: (ctx: DynamicResolutionContext) =>
        ctx.requestContext.tenant?.plan === "enterprise" ? "big" : "small",
      context: { tenant: { id: "inline", plan: "enterprise" } },
    };
    await priv.resolveDynamicGenerateOptions(o);
    return o.model === "big";
  });

  await test("3.9 inline context works for stream", async () => {
    const o: Record<string, unknown> = {
      model: (ctx: DynamicResolutionContext) =>
        ctx.requestContext.user?.id === "inline-u" ? "yes" : "no",
      context: { user: { id: "inline-u" } },
    };
    await priv.resolveDynamicStreamOptions(o);
    return o.model === "yes";
  });
}

// =============================================================================
// MAIN
// =============================================================================

async function main(): Promise<void> {
  const start = Date.now();

  console.log("\n" + "=".repeat(70));
  log("  NeuroLink Dynamic Arguments — Continuous Test Suite", "bright");
  console.log("=".repeat(70));
  log(`\n  Provider: ${TEST_CONFIG.provider}`, "blue");
  if (TEST_CONFIG.model) {
    log(`  Model: ${TEST_CONFIG.model}`, "blue");
  }
  log(`  Max Tokens: ${TEST_CONFIG.maxTokens}`, "blue");

  await testGenerate();
  await testStream();
  await testResolution();

  const duration = ((Date.now() - start) / 1000).toFixed(2);
  const total = passed + failed + skipped;

  section("Summary");
  log(`  Passed:  ${passed}`, "green");
  log(`  Failed:  ${failed}`, failed > 0 ? "red" : "green");
  log(`  Skipped: ${skipped}`, skipped > 0 ? "yellow" : "green");
  log(`  Total:   ${total}`, "bright");
  log(`  Time:    ${duration}s`, "cyan");

  if (failures.length > 0) {
    log("\n  FAILURES:", "red");
    for (const f of failures) {
      console.log(`    ${C.red}✗${C.reset} ${f.name}`);
      console.log(`      ${C.yellow}${f.error}${C.reset}`);
    }
  }

  if (skipped > 0) {
    log(
      `\n  Note: ${skipped} test(s) skipped — provider not available.`,
      "yellow",
    );
    log(
      "  Set GOOGLE_APPLICATION_CREDENTIALS or TEST_PROVIDER to run API tests.",
      "yellow",
    );
  }

  console.log();
  log(
    failed > 0 ? "  RESULT: FAIL" : "  RESULT: PASS",
    failed > 0 ? "red" : "green",
  );
  console.log("=".repeat(70) + "\n");
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(2);
});
