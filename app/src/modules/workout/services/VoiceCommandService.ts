export type VoiceAction =
  | 'next_set'
  | 'finish_workout'
  | 'pause_timer'
  | 'resume_timer'
  | 'repeat_instruction'
  | 'unknown';

export const VoiceCommandService = {
  analyzeCommand: async (_base64Audio: string): Promise<VoiceAction> => {
    return 'unknown';
  },
};
