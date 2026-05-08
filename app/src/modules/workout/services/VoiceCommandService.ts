import { useAuthStore } from '@/modules/auth/store/authStore';

export type VoiceAction =
  | 'next_set'
  | 'finish_workout'
  | 'pause_timer'
  | 'resume_timer'
  | 'repeat_instruction'
  | 'unknown';

const bffUrl = () => `${process.env.EXPO_PUBLIC_API_URL ?? ''}/api/ai/voice-command`;

export const VoiceCommandService = {
  analyzeCommand: async (base64Audio: string): Promise<VoiceAction> => {
    const token = useAuthStore.getState().session?.access_token;
    if (!token) return 'unknown';

    try {
      const response = await fetch(bffUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ base64Audio }),
      });

      if (!response.ok) return 'unknown';

      const data = (await response.json()) as { action?: string };
      return (data.action as VoiceAction) ?? 'unknown';
    } catch {
      return 'unknown';
    }
  },
};
