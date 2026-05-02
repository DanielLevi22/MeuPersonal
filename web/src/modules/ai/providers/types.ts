export interface ToolDefinition {
  name: string;
  description?: string;
  input_schema: Record<string, unknown>;
  cache_control?: unknown;
}

export type ContentBlock =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: unknown }
  | { type: "tool_result"; tool_use_id: string; content: string; is_error?: boolean };

export interface LLMMessage {
  role: "user" | "assistant";
  content: string | ContentBlock[];
}

export interface SystemBlock {
  text: string;
  cacheControl?: boolean;
}

export interface ProviderTurnOptions {
  systemBlocks: SystemBlock[];
  messages: LLMMessage[];
  tools: readonly ToolDefinition[];
  maxTokens?: number;
}

export type ProviderStreamEvent =
  | { type: "text_delta"; content: string }
  | { type: "tool_use"; id: string; name: string; input: unknown }
  | { type: "turn_end"; fullContent: ContentBlock[]; stopReason: string };

export interface AIProvider {
  stream(options: ProviderTurnOptions): AsyncGenerator<ProviderStreamEvent>;
}
