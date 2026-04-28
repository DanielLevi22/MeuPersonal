export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
}

const BFF_URL = `${process.env.EXPO_PUBLIC_API_URL}/api/ai/student/nutribot`;

export const NutriBotService = {
  sendMessage: async (
    chatHistory: ChatMessage[],
    userMessage: string,
    authToken: string
  ): Promise<string> => {
    const response = await fetch(BFF_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        message: userMessage,
        history: chatHistory.slice(-6).map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!response.ok) {
      throw new Error(`nutribot BFF error: ${response.status}`);
    }

    const data = (await response.json()) as { reply: string };
    return data.reply;
  },
};
