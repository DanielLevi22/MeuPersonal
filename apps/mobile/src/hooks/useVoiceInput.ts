import { VoiceAction } from '@/modules/workout/services/VoiceCommandService';
import Voice, { SpeechResultsEvent } from '@react-native-voice/voice';
import { useEffect, useRef, useState } from 'react';

interface UseVoiceInputProps {
  onCommand?: (action: VoiceAction) => void;
  continuous?: boolean;
}

export const useVoiceInput = ({ onCommand, continuous = false }: UseVoiceInputProps = {}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [result, setResult] = useState('');
  
  // Ref to track if we should be listening (to handle auto-restart)
  const shouldBeListening = useRef(false);

  useEffect(() => {
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
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

  const onSpeechError = (e: any) => {
      console.log('Voice Error:', e);
      setIsRecording(false);
      if (continuous && shouldBeListening.current) {
          // Restart on error too (often happens with "No speech detected")
          setTimeout(startListening, 500); 
      }
  };

  const onSpeechResults = (e: SpeechResultsEvent) => {
    const text = e.value?.[0]?.toLowerCase() || '';
    setResult(text);
    console.log('Heard:', text);

    const detectedAction = parseCommand(text);
    if (detectedAction && onCommand) {
        onCommand(detectedAction);
        // Optional: Reset result after command? 
        // Or stop/start to clear buffer? 
        // For now, let's just keep listening.
        
        // If we want to avoid double triggers, we might want to clear text or pause briefly.
        // But naive implementation first.
    }
  };

  const parseCommand = (text: string): VoiceAction | null => {
      if (text.includes('próxima') || text.includes('proxima') || text.includes('feito') || text.includes('concluído')) {
          return 'next_set';
      } else if (text.includes('terminar treino') || text.includes('finalizar') || text.includes('acabei')) {
          return 'finish_workout';
      } else if (text.includes('pausar') || text.includes('pause')) {
          return 'pause_timer';
      } else if (text.includes('retomar') || text.includes('voltar')) {
          return 'resume_timer';
      } else if (text.includes('repetir') || text.includes('qu') || text.includes('entendi') || text.includes('instrução')) {
          return 'repeat_instruction';
      }
      return null;
  };

  const startListening = async () => {
    try {
      shouldBeListening.current = true;
      // Stop first to ensure clean state
      try { await Voice.stop(); } catch {}
      
      setResult('');
      await Voice.start('pt-BR');
    } catch (e) {
      console.error(e);
    }
  };

  const stopListening = async () => {
    try {
      shouldBeListening.current = false;
      await Voice.stop();
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
    stopAndProcess, // Kept for interface compatibility if needed transiently
    result
  };
};
