import Voice, { type SpeechErrorEvent, type SpeechResultsEvent } from '@react-native-voice/voice';
import { useEffect, useRef, useState } from 'react';
import type { VoiceAction } from '@/modules/workout';

interface UseVoiceInputProps {
  onCommand?: (action: VoiceAction) => void;
  continuous?: boolean;
}

export const useVoiceInput = ({ onCommand, continuous = false }: UseVoiceInputProps = {}) => {
  const [isRecording, setIsRecording] = useState(false);

  // Ref to track if we should be listening (to handle auto-restart)
  const shouldBeListening = useRef(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Run only on mount to setup global events
  useEffect(() => {
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;

    return () => {
      try {
        if (Voice) {
          Voice.destroy()
            .then(Voice.removeAllListeners)
            .catch(() => {
              console.log('Voice destroy ignored error');
            });
        }
      } catch {
        // Prepare for the worst (native module missing)
        console.log('Voice cleanup error ignored');
      }
      shouldBeListening.current = false;
    };
  }, []);

  const onSpeechStart = () => setIsRecording(true);

  const onSpeechEnd = () => {
    setIsRecording(false);
    if (continuous && shouldBeListening.current) {
      // Restart listening if we are in continuous mode
      setTimeout(startListening, 100);
    }
  };

  const onSpeechError = (_e: SpeechErrorEvent) => {
    setIsRecording(false);
    if (continuous && shouldBeListening.current) {
      setTimeout(startListening, 500);
    }
  };

  const onSpeechResults = (e: SpeechResultsEvent) => {
    const text = e.value?.[0]?.toLowerCase() || '';
    const detectedAction = parseCommand(text);
    if (detectedAction && onCommand) {
      onCommand(detectedAction);
    }
  };

  const parseCommand = (text: string): VoiceAction | null => {
    if (
      text.includes('próxima') ||
      text.includes('proxima') ||
      text.includes('feito') ||
      text.includes('concluído')
    ) {
      return 'next_set';
    } else if (
      text.includes('terminar treino') ||
      text.includes('finalizar') ||
      text.includes('acabei')
    ) {
      return 'finish_workout';
    } else if (text.includes('pausar') || text.includes('pause')) {
      return 'pause_timer';
    } else if (text.includes('retomar') || text.includes('voltar')) {
      return 'resume_timer';
    } else if (
      text.includes('repetir') ||
      text.includes('qu') ||
      text.includes('entendi') ||
      text.includes('instrução')
    ) {
      return 'repeat_instruction';
    }
    return null;
  };

  const startListening = async () => {
    try {
      shouldBeListening.current = true;
      if (Voice) {
        // Stop first to ensure clean state
        try {
          await Voice.stop();
        } catch {}

        try {
          await Voice.start('pt-BR');
        } catch (innerError) {
          console.log('Voice start error ignored', innerError);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const stopListening = async () => {
    try {
      shouldBeListening.current = false;
      if (Voice) {
        try {
          await Voice.stop();
        } catch (_innerError) {
          // Ignore specific null pointer that happens on Android
          console.log('Voice stop ignored error');
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Compatibility / Deprecated
  const stopAndProcess = async (): Promise<VoiceAction> => {
    await stopListening();
    return 'unknown';
  };

  return {
    isRecording,
    isProcessing: false,
    startListening,
    stopListening,
    stopAndProcess,
  };
};
