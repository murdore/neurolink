/**
 * Voice and Speech Type Definitions for NeuroLink
 *
 * Core voice types: capabilities, provider config, composite voice,
 * audio utilities, events, agent types, and provider abstractions.
 *
 * STT types are in ./stt.ts
 * Realtime types are in ./realtime.ts
 * TTS types are in ./tts.ts
 *
 * @module types/voice
 */

// Re-export all TTS types
export * from "./tts.js";
// Re-export all STT types
export * from "./stt.js";
// Re-export all Realtime types
export * from "./realtime.js";

import type { AudioFormat, TTSOptions, TTSResult, TTSVoice } from "./tts.js";
import type { TTSHandler } from "./common.js";
import type { STTOptions, STTResult, STTHandler } from "./stt.js";
import type { RealtimeConfig, RealtimeHandler } from "./realtime.js";

// ============================================================================
// VOICE CAPABILITY / PROVIDER TYPES
// ============================================================================

/**
 * Voice capability types supported by providers
 */
export type VoiceCapability = "tts" | "stt" | "realtime" | "streaming";

/**
 * Voice provider types
 */
export type VoiceProviderType = "tts" | "stt" | "realtime";

/**
 * Voice provider name union type
 */
export type VoiceProviderName =
  // TTS providers
  | "google-tts"
  | "elevenlabs"
  | "openai-tts"
  | "azure-tts"
  | "sarvam"
  | "murf"
  | "playai"
  | "speechify"
  | "cartesia"
  // STT providers
  | "deepgram"
  | "gladia"
  | "whisper"
  | "assemblyai"
  | "google-stt"
  | "azure-stt"
  // Realtime providers
  | "openai-realtime"
  | "gemini-live";

/**
 * Base voice provider configuration
 */
export type VoiceProviderConfig = {
  /** Provider identifier */
  name: string;
  /** API key or credentials */
  apiKey?: string;
  /** Custom endpoint URL */
  baseUrl?: string;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Maximum retries for failed requests */
  maxRetries?: number;
  /** Provider-specific options */
  options?: Record<string, unknown>;
};

/**
 * Voice provider metadata for registry
 */
export type VoiceProviderMetadata = {
  /** Provider type (tts, stt, realtime) */
  type: VoiceProviderType;
  /** Provider display name */
  displayName: string;
  /** Supported capabilities */
  capabilities: VoiceCapability[];
  /** Supported audio formats */
  supportedFormats: AudioFormat[];
  /** Maximum text length for TTS or audio duration for STT */
  maxLength?: number;
  /** Whether streaming is supported */
  supportsStreaming: boolean;
  /** Provider-specific features */
  features?: string[];
};

// ============================================================================
// COMPOSITE VOICE TYPES
// ============================================================================

/**
 * Composite voice configuration for combined TTS + STT
 */
export type CompositeVoiceConfig = {
  /** TTS provider name or config object */
  ttsProvider?: string | VoiceProviderConfig;
  /** STT provider name or config object */
  sttProvider?: string | VoiceProviderConfig;
  /** Default TTS options */
  defaultTTSOptions?: TTSOptions;
  /** Default STT options */
  defaultSTTOptions?: STTOptions;
  /** TTS options (alias for defaultTTSOptions) */
  ttsOptions?: TTSOptions;
  /** STT options (alias for defaultSTTOptions) */
  sttOptions?: STTOptions;
  /** Whether to track conversation history */
  trackHistory?: boolean;
  /** Maximum number of history turns to keep */
  maxHistoryTurns?: number;
  /** Whether to enable streaming */
  streaming?: boolean;
  /** Latency optimization mode */
  latencyMode?: "low" | "balanced" | "quality";
};

/**
 * Composite voice session
 */
export type CompositeVoiceSession = {
  /** Session ID */
  id: string;
  /** TTS provider */
  ttsProvider: string;
  /** STT provider */
  sttProvider: string;
  /** Session start time */
  startedAt: Date;
  /** Whether session is active */
  isActive: boolean;
};

// ============================================================================
// AUDIO UTILITY TYPES
// ============================================================================

/**
 * Audio format details
 */
export type AudioFormatDetails = {
  /** Format name */
  format: AudioFormat;
  /** MIME type */
  mimeType: string;
  /** File extension */
  extension: string;
  /** Whether format supports streaming */
  supportsStreaming: boolean;
  /** Typical sample rates */
  sampleRates: number[];
  /** Bit depths */
  bitDepths: number[];
};

/**
 * Audio conversion options
 */
export type AudioConversionOptions = {
  /** Target format */
  targetFormat: AudioFormat;
  /** Target sample rate */
  sampleRate?: number;
  /** Target bit depth */
  bitDepth?: number;
  /** Number of channels */
  channels?: number;
  /** Normalize audio level */
  normalize?: boolean;
};

/**
 * Audio stream chunk for streaming operations
 */
export type AudioStreamChunk = {
  /** Audio data */
  data: Buffer;
  /** Chunk index */
  index: number;
  /** Whether this is the final chunk */
  isFinal: boolean;
  /** Audio format */
  format: AudioFormat;
  /** Sample rate */
  sampleRate: number;
  /** Timestamp offset in milliseconds */
  timestampMs: number;
  /** Duration of this chunk in milliseconds */
  durationMs: number;
};

// ============================================================================
// VOICE EVENT TYPES
// ============================================================================

/**
 * Voice event types for event-driven architectures
 */
export type VoiceEventType =
  | "synthesis.started"
  | "synthesis.progress"
  | "synthesis.completed"
  | "synthesis.error"
  | "transcription.started"
  | "transcription.partial"
  | "transcription.completed"
  | "transcription.error"
  | "realtime.connected"
  | "realtime.audio.received"
  | "realtime.text.received"
  | "realtime.disconnected"
  | "realtime.error";

/**
 * Voice event for event-driven operations
 */
export type VoiceEvent<T = unknown> = {
  type: VoiceEventType;
  timestamp: Date;
  provider: VoiceProviderName;
  data: T;
  metadata?: Record<string, unknown>;
};

/**
 * Voice operation result union
 */
export type VoiceResult = TTSResult | STTResult;

/**
 * Voice conversation turn
 */
export type VoiceTurn = {
  role: "user" | "assistant";
  text: string;
  audio?: Buffer;
  timestamp: Date;
  metadata?: {
    duration?: number;
    confidence?: number;
    language?: string;
    provider?: string;
    voice?: string;
    [key: string]: unknown;
  };
};

/**
 * Voice agent configuration
 */
export type VoiceAgentConfig = {
  /** System prompt for voice interactions */
  systemPrompt?: string;
  /** Voice settings for responses */
  voiceSettings?: {
    /** Voice ID for TTS responses */
    voiceId?: string;
    /** Language code */
    language?: string;
    /** Speaking rate */
    speed?: number;
    /** Voice pitch adjustment */
    pitch?: number;
  };
  /** STT settings for input */
  sttSettings?: Partial<STTOptions>;
  /** Realtime configuration (if using realtime mode) */
  realtimeConfig?: Partial<RealtimeConfig>;
  /** Mode of operation */
  mode?: "batch" | "realtime";
};

/**
 * Voice processing result from VoiceAgent
 */
export type VoiceProcessingResult = {
  /** Transcribed user input */
  userText: string;
  /** Generated assistant response */
  assistantText: string;
  /** Audio buffer of the response */
  audio: Buffer;
  /** Performance and timing metadata */
  metadata: {
    /** Time spent on transcription */
    transcriptionTime: number;
    /** Time spent on AI generation */
    generationTime: number;
    /** Time spent on synthesis */
    synthesisTime: number;
    /** Total processing time */
    totalTime: number;
    /** Input audio duration */
    inputDuration?: number;
    /** Output audio duration */
    outputDuration?: number;
  };
};

// ============================================================================
// VOICE PROVIDER TYPES (converted from interfaces)
// ============================================================================

/**
 * Abstract voice provider type
 *
 * All voice providers (TTS, STT, Realtime) implement this type.
 */
export type VoiceProvider = {
  /**
   * Provider name identifier
   */
  readonly name: string;

  /**
   * Get supported capabilities
   */
  getCapabilities(): VoiceCapability[];

  /**
   * Check if provider is properly configured
   */
  isConfigured(): boolean;

  /**
   * Validate provider configuration
   */
  validateConfig(): Promise<{ valid: boolean; errors: string[] }>;

  /**
   * Get provider-specific options schema
   */
  getOptionsSchema?(): Record<string, unknown>;
};

/**
 * TTS-capable voice provider type
 */
export type TTSProvider = VoiceProvider & {
  /**
   * Synthesize text to speech
   */
  synthesize(text: string, options: TTSOptions): Promise<TTSResult>;

  /**
   * Stream synthesized audio chunks
   */
  synthesizeStream?(
    text: string,
    options: TTSOptions,
  ): AsyncIterable<TTSStreamChunk>;

  /**
   * Get available voices
   */
  getVoices(languageCode?: string): Promise<TTSVoice[]>;

  /**
   * Maximum text length supported
   */
  readonly maxTextLength: number;
};

// ============================================================================
// TTS STREAM CHUNK
// ============================================================================

/**
 * TTS stream chunk for streaming synthesis
 */
export type TTSStreamChunk = {
  /** Audio data chunk */
  data: Buffer;
  /** Chunk sequence number */
  index: number;
  /** Whether this is the final chunk */
  isFinal: boolean;
  /** Audio format */
  format: string;
  /** Sample rate */
  sampleRate?: number;
  /** Timestamp offset in audio (milliseconds) */
  timestampMs?: number;
};

// ============================================================================
// ERROR CODES
// ============================================================================

/**
 * Voice error codes (general)
 */
export const VOICE_ERROR_CODES = {
  PROVIDER_NOT_FOUND: "VOICE_PROVIDER_NOT_FOUND",
  INVALID_CONFIGURATION: "VOICE_INVALID_CONFIGURATION",
  INITIALIZATION_FAILED: "VOICE_INITIALIZATION_FAILED",
  OPERATION_CANCELLED: "VOICE_OPERATION_CANCELLED",
  // General
  PROVIDER_NOT_CONFIGURED: "VOICE_PROVIDER_NOT_CONFIGURED",
  PROVIDER_NOT_SUPPORTED: "VOICE_PROVIDER_NOT_SUPPORTED",
  FEATURE_NOT_SUPPORTED: "VOICE_FEATURE_NOT_SUPPORTED",
  // TTS specific
  TTS_EMPTY_TEXT: "VOICE_TTS_EMPTY_TEXT",
  TTS_TEXT_TOO_LONG: "VOICE_TTS_TEXT_TOO_LONG",
  TTS_SYNTHESIS_FAILED: "VOICE_TTS_SYNTHESIS_FAILED",
  // STT specific
  STT_EMPTY_AUDIO: "VOICE_STT_EMPTY_AUDIO",
  STT_INVALID_FORMAT: "VOICE_STT_INVALID_FORMAT",
  STT_TRANSCRIPTION_FAILED: "VOICE_STT_TRANSCRIPTION_FAILED",
  // Realtime specific
  REALTIME_CONNECTION_FAILED: "VOICE_REALTIME_CONNECTION_FAILED",
  REALTIME_SESSION_ERROR: "VOICE_REALTIME_SESSION_ERROR",
  // Network
  NETWORK_ERROR: "VOICE_NETWORK_ERROR",
  TIMEOUT: "VOICE_TIMEOUT",
} as const;

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Supported audio formats with details
 */
export const AUDIO_FORMAT_DETAILS: Partial<
  Record<AudioFormat, AudioFormatDetails>
> = {
  mp3: {
    format: "mp3",
    mimeType: "audio/mpeg",
    extension: ".mp3",
    supportsStreaming: true,
    sampleRates: [8000, 16000, 22050, 24000, 44100, 48000],
    bitDepths: [16],
  },
  wav: {
    format: "wav",
    mimeType: "audio/wav",
    extension: ".wav",
    supportsStreaming: false,
    sampleRates: [8000, 16000, 22050, 24000, 44100, 48000],
    bitDepths: [8, 16, 24, 32],
  },
  ogg: {
    format: "ogg",
    mimeType: "audio/ogg",
    extension: ".ogg",
    supportsStreaming: true,
    sampleRates: [8000, 16000, 22050, 24000, 44100, 48000],
    bitDepths: [16],
  },
  opus: {
    format: "opus",
    mimeType: "audio/opus",
    extension: ".opus",
    supportsStreaming: true,
    sampleRates: [8000, 12000, 16000, 24000, 48000],
    bitDepths: [16],
  },
  m4a: {
    format: "m4a",
    mimeType: "audio/mp4",
    extension: ".m4a",
    supportsStreaming: false,
    sampleRates: [44100, 48000],
    bitDepths: [16],
  },
  flac: {
    format: "flac",
    mimeType: "audio/flac",
    extension: ".flac",
    supportsStreaming: false,
    sampleRates: [44100, 48000, 96000],
    bitDepths: [16, 24],
  },
  webm: {
    format: "webm",
    mimeType: "audio/webm",
    extension: ".webm",
    supportsStreaming: true,
    sampleRates: [44100, 48000],
    bitDepths: [16],
  },
  mp4: {
    format: "mp4",
    mimeType: "audio/mp4",
    extension: ".mp4",
    supportsStreaming: false,
    sampleRates: [44100, 48000],
    bitDepths: [16],
  },
  mpeg: {
    format: "mpeg",
    mimeType: "audio/mpeg",
    extension: ".mpeg",
    supportsStreaming: true,
    sampleRates: [8000, 16000, 22050, 24000, 44100, 48000],
    bitDepths: [16],
  },
  mpga: {
    format: "mpga",
    mimeType: "audio/mpeg",
    extension: ".mpga",
    supportsStreaming: true,
    sampleRates: [8000, 16000, 22050, 24000, 44100, 48000],
    bitDepths: [16],
  },
};

// ============================================================================
// VOICE ERROR TYPES
// ============================================================================

import type { ErrorCategory, ErrorSeverity } from "../constants/enums.js";

export type VoiceErrorOptions = {
  code: string;
  message: string;
  category?: ErrorCategory;
  severity?: ErrorSeverity;
  retriable?: boolean;
  context?: Record<string, unknown>;
  originalError?: Error;
  provider?: string;
};

// ============================================================================
// AUDIO UTILITY TYPES (INTERNAL)
// ============================================================================

export type AudioMetadata = {
  format: AudioFormat;
  duration: number;
  sampleRate: number;
  channels: number;
  bitDepth: number;
  samples: number;
  size: number;
};

// ============================================================================
// STREAM HANDLER TYPES
// ============================================================================

export type StreamHandlerConfig = {
  chunkDurationMs?: number;
  sampleRate?: number;
  bytesPerSample?: number;
  format?: AudioFormat;
  highWaterMark?: number;
  bufferTimeoutMs?: number;
};

export type StreamEvents = {
  chunk: (chunk: AudioStreamChunk) => void;
  end: () => void;
  error: (error: Error) => void;
  drain: () => void;
  pause: () => void;
  resume: () => void;
};

// ============================================================================
// VOICE AGENT TYPES
// ============================================================================

export type VoiceAgentEvent =
  | "transcription.started"
  | "transcription.completed"
  | "generation.started"
  | "generation.completed"
  | "synthesis.started"
  | "synthesis.completed"
  | "error";

export type VoiceAgentEventData = {
  "transcription.started": { audio: Buffer };
  "transcription.completed": { result: STTResult };
  "generation.started": { prompt: string };
  "generation.completed": { result: Record<string, unknown> };
  "synthesis.started": { text: string };
  "synthesis.completed": { result: TTSResult };
  error: { error: Error; stage: string };
};

// ============================================================================
// VOICE HANDLER TYPES
// ============================================================================

export type VoiceHandler = TTSHandler | STTHandler | RealtimeHandler;

export type VoiceProviderEntry = {
  id: string;
  type: VoiceProviderType;
  factory: () => Promise<VoiceHandler>;
  metadata: VoiceProviderMetadata;
  instance?: VoiceHandler;
  aliases: string[];
};

// ============================================================================
// PROVIDER-SPECIFIC TTS OPTION TYPES
// ============================================================================

export type AzureTTSOptions = TTSOptions & {
  useSSML?: boolean;
  ssmlTemplate?: string;
  outputFormat?: string;
  wordBoundary?: boolean;
};

export type ElevenLabsModel =
  | "eleven_multilingual_v2"
  | "eleven_turbo_v2_5"
  | "eleven_turbo_v2"
  | "eleven_monolingual_v1";

export type ElevenLabsTTSOptions = TTSOptions & {
  model?: ElevenLabsModel;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  useSpeakerBoost?: boolean;
};

export type GoogleVoiceType =
  | "Standard"
  | "WaveNet"
  | "Neural2"
  | "Studio"
  | "Polyglot";

export type GoogleTTSOptions = TTSOptions & {
  voiceType?: GoogleVoiceType;
  sampleRateHertz?: number;
  effectsProfileId?: string[];
};

export type OpenAIVoice =
  | "alloy"
  | "echo"
  | "fable"
  | "onyx"
  | "nova"
  | "shimmer";

export type OpenAITTSModel = "tts-1" | "tts-1-hd";

export type OpenAITTSOptions = TTSOptions & {
  model?: OpenAITTSModel;
};
