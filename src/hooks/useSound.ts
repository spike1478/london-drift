import { useCallback, useState, useRef, useEffect } from 'react';

export function useSound() {
  const [isMuted, setIsMuted] = useState(
    () => localStorage.getItem('sound-muted') === 'true',
  );
  const clickAudioRef = useRef<HTMLAudioElement | null>(null);
  const chimeAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    clickAudioRef.current = new Audio('/sounds/click.mp3');
    chimeAudioRef.current = new Audio('/sounds/chime.mp3');
    clickAudioRef.current.volume = 0.3;
    chimeAudioRef.current.volume = 0.5;
  }, []);

  const playClick = useCallback(() => {
    if (isMuted || !clickAudioRef.current) return;
    const audio = clickAudioRef.current.cloneNode() as HTMLAudioElement;
    audio.volume = 0.3;
    audio.play().catch(() => {});
  }, [isMuted]);

  const playChime = useCallback(() => {
    if (isMuted || !chimeAudioRef.current) return;
    chimeAudioRef.current.currentTime = 0;
    chimeAudioRef.current.play().catch(() => {});
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      localStorage.setItem('sound-muted', String(!prev));
      return !prev;
    });
  }, []);

  return { playClick, playChime, isMuted, toggleMute };
}
