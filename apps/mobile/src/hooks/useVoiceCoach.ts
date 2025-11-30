import * as Speech from 'expo-speech';
import { useCallback, useEffect, useState } from 'react';

const MOTIVATIONAL_PHRASES = {
  start: [
    "Vamos começar! Foco total hoje.",
    "Hora de treinar! Dê o seu melhor.",
    "Prepare-se para superar seus limites.",
    "Vamos construir essa força! Começando agora."
  ],
  rest: [
    "Respire fundo. Recupere o fôlego.",
    "Aproveite o descanso. A próxima série vai ser intensa.",
    "Relaxe os músculos. Foco na recuperação.",
    "Mantenha o foco. Quase na hora de voltar."
  ],
  finish: [
    "Parabéns! Mais um treino pra conta.",
    "Excelente trabalho! Você se superou hoje.",
    "Treino finalizado com sucesso. Orgulho de você!",
    "Missão cumprida! Descanse bem agora."
  ],
  resume: [
    "Vamos lá! Hora de voltar.",
    "Acabou o descanso. Vamos com tudo!",
    "Prepare-se! 3, 2, 1, valendo.",
    "Foco na técnica. Vamos esmagar!"
  ]
};

export function useVoiceCoach() {
  const [isMuted, setIsMuted] = useState(false);

  const speak = useCallback((text: string) => {
    if (isMuted) return;
    
    Speech.speak(text, {
      language: 'pt-BR',
      pitch: 1.0,
      rate: 1.0,
    });
  }, [isMuted]);

  const getRandomPhrase = (category: keyof typeof MOTIVATIONAL_PHRASES) => {
    const phrases = MOTIVATIONAL_PHRASES[category];
    return phrases[Math.floor(Math.random() * phrases.length)];
  };

  const motivateStart = useCallback((userName?: string) => {
    const phrase = getRandomPhrase('start');
    const text = userName ? `Olá ${userName.split(' ')[0]}! ${phrase}` : phrase;
    speak(text);
  }, [speak]);

  const motivateRest = useCallback((seconds: number) => {
    const phrase = getRandomPhrase('rest');
    speak(`Descanso de ${seconds} segundos. ${phrase}`);
  }, [speak]);

  const motivateResume = useCallback(() => {
    const phrase = getRandomPhrase('resume');
    speak(phrase);
  }, [speak]);

  const motivateFinish = useCallback(() => {
    const phrase = getRandomPhrase('finish');
    speak(phrase);
  }, [speak]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      if (!prev) {
        Speech.stop();
      }
      return !prev;
    });
  }, []);

  // Stop speech when unmounting
  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  return {
    isMuted,
    toggleMute,
    speak,
    motivateStart,
    motivateRest,
    motivateResume,
    motivateFinish
  };
}
