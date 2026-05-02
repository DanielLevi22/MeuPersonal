import { AnthropicProvider } from "./providers/anthropic.provider";

// Single place to swap models or providers.
// Orchestrators import from here — never instantiate providers directly.
export const aiProviders = {
  reasoning: new AnthropicProvider("claude-sonnet-4-6"),
  fast: new AnthropicProvider("claude-haiku-4-5-20251001"),
} as const;

export type AIProviderKey = keyof typeof aiProviders;
