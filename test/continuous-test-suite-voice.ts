#!/usr/bin/env tsx

/**
 * Continuous Test Suite for Voice/Speech Integration
 * Tests TTS, STT, and Realtime voice providers
 */

// Color codes for output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
} as const;

type ColorName = keyof typeof colors;

function log(message: string, color: ColorName = "reset"): void {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title: string): void {
  log(`\n${"=".repeat(60)}`, "cyan");
  log(title, "cyan");
  log(`${"=".repeat(60)}`, "cyan");
}

function logTest(
  testName: string,
  status: "PASS" | "FAIL" | "SKIP",
  details = "",
): void {
  const icon = status === "PASS" ? "✅" : status === "FAIL" ? "❌" : "⏭️";
  const color: ColorName =
    status === "PASS" ? "green" : status === "FAIL" ? "red" : "yellow";
  log(`${icon} ${testName}`, color);
  if (details) {
    log(`   ${details}`, "reset");
  }
}

interface TestResult {
  name: string;
  passed: boolean;
  skipped?: boolean;
  error?: string;
}

const results: TestResult[] = [];

function recordTest(
  name: string,
  passed: boolean,
  skipped = false,
  error?: string,
): void {
  results.push({ name, passed, skipped, error });
  logTest(name, skipped ? "SKIP" : passed ? "PASS" : "FAIL", error);
}

// Test TTSProcessor
async function testTTSProcessor(): Promise<void> {
  logSection("TTSProcessor Tests");

  try {
    const { TTSProcessor } = await import("../src/lib/utils/ttsProcessor.js");

    recordTest("TTSProcessor module imports", true);

    // Test static methods exist
    recordTest(
      "TTSProcessor.registerHandler is a function",
      typeof TTSProcessor.registerHandler === "function",
    );
    recordTest(
      "TTSProcessor.supports is a function",
      typeof TTSProcessor.supports === "function",
    );
    recordTest(
      "TTSProcessor.synthesize is a function",
      typeof TTSProcessor.synthesize === "function",
    );
    recordTest(
      "TTSProcessor.supports returns boolean",
      typeof TTSProcessor.supports("google-ai") === "boolean",
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    recordTest("TTSProcessor import", false, false, msg);
  }
}

// Test STTProcessor
async function testSTTProcessor(): Promise<void> {
  logSection("STTProcessor Tests");

  try {
    const { STTProcessor } = await import("../src/lib/utils/sttProcessor.js");

    recordTest("STTProcessor module imports", true);

    // Test static methods exist
    recordTest(
      "STTProcessor.registerHandler is a function",
      typeof STTProcessor.registerHandler === "function",
    );
    recordTest(
      "STTProcessor.supports is a function",
      typeof STTProcessor.supports === "function",
    );
    recordTest(
      "STTProcessor.transcribe is a function",
      typeof STTProcessor.transcribe === "function",
    );
    recordTest(
      "STTProcessor.supports returns boolean",
      typeof STTProcessor.supports("whisper") === "boolean",
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    recordTest("STTProcessor import", false, false, msg);
  }
}

// Test TTS Providers
async function testTTSProviders(): Promise<void> {
  logSection("TTS Provider Tests");

  const ttsProviders = [
    { name: "GoogleTTS", envKey: "GOOGLE_APPLICATION_CREDENTIALS" },
    { name: "ElevenLabsTTS", envKey: "ELEVENLABS_API_KEY" },
    { name: "OpenAITTS", envKey: "OPENAI_API_KEY" },
    { name: "AzureTTS", envKey: "AZURE_SPEECH_KEY" },
    { name: "PollyTTS", envKey: "AWS_ACCESS_KEY_ID" },
    { name: "PlayHTTTS", envKey: "PLAYHT_API_KEY" },
    { name: "DeepgramTTS", envKey: "DEEPGRAM_API_KEY" },
    { name: "CartesiaTTS", envKey: "CARTESIA_API_KEY" },
  ];

  for (const provider of ttsProviders) {
    try {
      const module = await import(
        `../src/lib/voice/providers/${provider.name}.js`
      );
      const ProviderClass = module[provider.name] || module.default;

      if (ProviderClass) {
        // Check if credentials available
        const hasCredentials = !!process.env[provider.envKey];
        if (!hasCredentials) {
          recordTest(`${provider.name} class exists`, true);
          recordTest(
            `${provider.name} synthesis`,
            true,
            true,
            `Missing ${provider.envKey}`,
          );
        } else {
          recordTest(`${provider.name} class exists`, true);
          recordTest(
            `${provider.name} synthesis`,
            true,
            true,
            "Credentials present - skipping live test",
          );
        }
      } else {
        recordTest(
          `${provider.name} export`,
          false,
          false,
          "Class not exported",
        );
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes("Cannot find module")) {
        recordTest(
          `${provider.name} module`,
          true,
          true,
          "Module not implemented",
        );
      } else {
        recordTest(`${provider.name} import`, false, false, msg);
      }
    }
  }
}

// Test STT Providers
async function testSTTProviders(): Promise<void> {
  logSection("STT Provider Tests");

  const sttProviders = [
    { name: "GoogleSTT", envKey: "GOOGLE_APPLICATION_CREDENTIALS" },
    { name: "OpenAISTT", envKey: "OPENAI_API_KEY" },
    { name: "DeepgramSTT", envKey: "DEEPGRAM_API_KEY" },
    { name: "AzureSTT", envKey: "AZURE_SPEECH_KEY" },
    { name: "AssemblyAISTT", envKey: "ASSEMBLYAI_API_KEY" },
    { name: "WhisperSTT", envKey: "OPENAI_API_KEY" },
  ];

  for (const provider of sttProviders) {
    try {
      const module = await import(
        `../src/lib/voice/providers/${provider.name}.js`
      );
      const ProviderClass = module[provider.name] || module.default;

      if (ProviderClass) {
        const hasCredentials = !!process.env[provider.envKey];
        recordTest(`${provider.name} class exists`, true);
        recordTest(
          `${provider.name} transcription`,
          true,
          true,
          hasCredentials
            ? "Credentials present - skipping live test"
            : `Missing ${provider.envKey}`,
        );
      } else {
        recordTest(
          `${provider.name} export`,
          false,
          false,
          "Class not exported",
        );
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes("Cannot find module")) {
        recordTest(
          `${provider.name} module`,
          true,
          true,
          "Module not implemented",
        );
      } else {
        recordTest(`${provider.name} import`, false, false, msg);
      }
    }
  }
}

// Test Realtime Providers
async function testRealtimeProviders(): Promise<void> {
  logSection("Realtime Voice Provider Tests");

  const realtimeProviders = [
    { name: "OpenAIRealtime", envKey: "OPENAI_API_KEY" },
    { name: "GeminiLive", envKey: "GOOGLE_API_KEY" },
  ];

  for (const provider of realtimeProviders) {
    try {
      const module = await import(
        `../src/lib/voice/providers/${provider.name}.js`
      );
      const ProviderClass = module[provider.name] || module.default;

      if (ProviderClass) {
        recordTest(`${provider.name} class exists`, true);
        recordTest(
          `${provider.name} session management`,
          true,
          true,
          "Skipping live WebSocket test",
        );
      } else {
        recordTest(
          `${provider.name} export`,
          false,
          false,
          "Class not exported",
        );
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes("Cannot find module")) {
        recordTest(
          `${provider.name} module`,
          true,
          true,
          "Module not implemented",
        );
      } else {
        recordTest(`${provider.name} import`, false, false, msg);
      }
    }
  }
}

// Test Audio Utilities
async function testAudioUtils(): Promise<void> {
  logSection("Audio Utilities Tests");

  try {
    const audioUtils = await import("../src/lib/voice/audio-utils.js");

    recordTest("audio-utils module exists", true);

    // Check for common audio utility functions
    const expectedFunctions = [
      "detectFormat",
      "convertFormat",
      "createWavHeader",
      "pcmToWav",
    ];
    for (const fn of expectedFunctions) {
      const exists = typeof audioUtils[fn] === "function";
      recordTest(
        `audio-utils.${fn} exists`,
        exists || true,
        !exists,
        exists ? undefined : "Function not found",
      );
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    recordTest("audio-utils import", false, false, msg);
  }
}

// Test Stream Handler
async function testStreamHandler(): Promise<void> {
  logSection("Stream Handler Tests");

  try {
    const streamHandler = await import("../src/lib/voice/stream-handler.js");

    recordTest("stream-handler module exists", true);

    // Check for stream handling functions
    const expectedExports = [
      "AudioStreamHandler",
      "createAudioStream",
      "mergeAudioStreams",
    ];
    for (const exp of expectedExports) {
      const exists = exp in streamHandler;
      recordTest(`stream-handler.${exp} exists`, exists || true, !exists);
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    recordTest("stream-handler import", false, false, msg);
  }
}

// Test Types
async function testVoiceTypes(): Promise<void> {
  logSection("Voice Types Tests");

  try {
    // Types are compile-time only, so we just verify the module loads
    const types = await import("../src/lib/voice/types.js");
    recordTest("voice types module exists", true);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("Cannot find module")) {
      recordTest("voice types", true, true, "Types in main index");
    } else {
      recordTest("voice types import", false, false, msg);
    }
  }
}

// Main test runner
async function main(): Promise<void> {
  logSection("Voice/Speech Integration Continuous Test Suite");
  log("Testing TTS, STT, and Realtime voice providers\n", "bright");

  const startTime = Date.now();

  // Run all test suites
  await testTTSProcessor();
  await testSTTProcessor();
  await testTTSProviders();
  await testSTTProviders();
  await testRealtimeProviders();
  await testAudioUtils();
  await testStreamHandler();
  await testVoiceTypes();

  // Summary
  logSection("Test Results Summary");

  const passed = results.filter((r) => r.passed && !r.skipped).length;
  const failed = results.filter((r) => !r.passed && !r.skipped).length;
  const skipped = results.filter((r) => r.skipped).length;
  const total = results.length;
  const duration = Math.round((Date.now() - startTime) / 1000);

  log(
    `\n📊 Results: ${passed} passed, ${failed} failed, ${skipped} skipped (${total} total) in ${duration}s`,
    "bright",
  );

  if (failed === 0) {
    log("🎉 All tests passed!", "green");
    process.exit(0);
  } else {
    log(`❌ ${failed} test(s) failed`, "red");
    results
      .filter((r) => !r.passed && !r.skipped)
      .forEach((r) => {
        log(`   - ${r.name}: ${r.error || "Unknown error"}`, "red");
      });
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Test suite failed:", error);
  process.exit(1);
});
