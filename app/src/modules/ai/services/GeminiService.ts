export interface GeminiGenerationConfig {
  temperature?: number;
  topK?: number;
  topP?: number;
  maxOutputTokens?: number;
  responseMimeType?: string;
}

export interface GeminiTool {
  functionDeclarations?: {
    name: string;
    description: string;
    parameters?: Record<string, unknown>;
  }[];
}

export const GeminiService = {
  generateContent: async <T>(
    prompt: string | Array<{ text?: string; inlineData?: Record<string, unknown> }>,
    config?: GeminiGenerationConfig & { model?: string },
    tools?: GeminiTool[]
  ): Promise<{ data: T | null; functionCall?: Record<string, unknown> }> => {
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('Gemini Service: No API Key found.');
      return { data: null };
    }

    const constructBody = (modelConfig?: GeminiGenerationConfig & { model?: string }) => {
      // Handle multimodal prompts (array of parts) vs simple text prompts
      const parts = Array.isArray(prompt) ? prompt : [{ text: prompt }];

      const body: Record<string, unknown> = {
        contents: [{ parts }],
        generationConfig: {
          responseMimeType: modelConfig?.responseMimeType,
          ...modelConfig,
          model: undefined, // ensure model isn't passed in config body
        },
      };

      if (tools && tools.length > 0) {
        body.tools = tools;
      }
      return body;
    };

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const callModel = async (modelName: string, attempt: number = 1) => {
      try {
        const body = constructBody(config);
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.warn(`Gemini API Error (${modelName}): ${response.status} - ${errorText}`);

          if (response.status === 429) {
            if (attempt < 3) {
              console.log(`Quota exceeded. Retrying in ${attempt * 1000}ms...`);
              await sleep(attempt * 1000);
              return callModel(modelName, attempt + 1);
            }
            return null;
          }
          return null;
        }

        const data = await response.json();
        return data;
      } catch (e) {
        console.warn(`Attempt with ${modelName} failed.`, e);
        return null;
      }
    };

    try {
      // 1. Try Primary Model (Default to 2.5-flash if not specified, matching NutriBot)
      const primaryModel = config?.model || 'gemini-2.5-flash';
      let data = await callModel(primaryModel);

      // 2. Fallback to 2.0-flash if primary failed (likely quota or 404)
      if (!data) {
        console.log(
          'GeminiService: Primary model failed, switching to fallback (gemini-2.0-flash)...'
        );
        data = await callModel('gemini-2.0-flash');
      }

      if (!data) throw new Error('All model attempts failed.');

      const candidate = data.candidates?.[0]?.content?.parts?.[0];

      // Check for Function Call
      if (candidate?.functionCall) {
        return { data: null, functionCall: candidate.functionCall };
      }

      const text = candidate?.text;

      if (!text) return { data: null };

      try {
        if (config?.responseMimeType === 'application/json') {
          return { data: JSON.parse(text) as T };
        }
        return { data: text as unknown as T };
      } catch (parseError) {
        console.error('Gemini Service: Failed to parse JSON response', parseError);
        return { data: null };
      }
    } catch (error) {
      console.error('Gemini Service Error:', error);
      return { data: null };
    }
  },

  streamContent: async (
    prompt: string | Array<{ text?: string; inlineData?: Record<string, unknown> }>,
    onToken: (text: string) => void,
    config?: GeminiGenerationConfig & { model?: string },
    tools?: GeminiTool[]
  ): Promise<{ functionCall?: Record<string, unknown> }> => {
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('Gemini Service: No API Key found.');
      return {};
    }

    const parts = Array.isArray(prompt) ? prompt : [{ text: prompt }];

    const body: Record<string, unknown> = {
      contents: [{ parts }],
      generationConfig: {
        responseMimeType: config?.responseMimeType,
        ...config,
        model: undefined,
      },
    };

    if (tools && tools.length > 0) {
      body.tools = tools;
    }

    // Use non-streaming API (reliable on React Native) + simulate streaming
    const primaryModel = config?.model || 'gemini-2.5-flash';

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const tryFetch = async (modelName: string) => {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error (${modelName}): ${response.status} - ${errorText}`);
      }
      return response.json();
    };

    try {
      let data: Record<string, unknown> | null = null;
      try {
        data = await tryFetch(primaryModel);
      } catch {
        console.log(
          'GeminiService stream: Primary model failed, switching to fallback (gemini-2.0-flash)...'
        );
        data = await tryFetch('gemini-2.0-flash');
      }

      // biome-ignore lint/suspicious/noExplicitAny: Gemini API response shape
      const candidate = (data as any)?.candidates?.[0]?.content?.parts?.[0];

      // If it's a function call, return immediately (no streaming needed)
      if (candidate?.functionCall) {
        return { functionCall: candidate.functionCall };
      }

      const fullText = candidate?.text;
      if (!fullText) return {};

      // Simulate streaming: reveal text word-by-word for a natural typing effect
      const words = fullText.split(/(\s+)/); // Split keeping whitespace
      const CHUNK_SIZE = 3; // Send 3 words at a time for speed

      for (let i = 0; i < words.length; i += CHUNK_SIZE) {
        const chunk = words.slice(i, i + CHUNK_SIZE).join('');
        onToken(chunk);
        await sleep(25); // 25ms between chunks for smooth typing effect
      }

      return {};
    } catch (error) {
      console.error('Gemini Stream Error:', error);
      throw error;
    }
  },
};
