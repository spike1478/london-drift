import { useState, useEffect, useRef, useCallback } from 'react';

const FLIP_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

interface SolariBoardProps {
  text: string;
  onComplete?: () => void;
  speed?: number;
  className?: string;
  playClick?: () => void;
}

interface CharState {
  current: string;
  target: string;
  settled: boolean;
  flipsRemaining: number;
}

export function SolariBoard({
  text,
  onComplete,
  speed = 50,
  className = '',
  playClick,
}: SolariBoardProps) {
  const upper = text.toUpperCase();
  const [chars, setChars] = useState<CharState[]>(() =>
    Array.from(upper).map((target) => ({
      current: target === ' ' ? ' ' : FLIP_CHARS[Math.floor(Math.random() * FLIP_CHARS.length)],
      target,
      settled: target === ' ',
      flipsRemaining: target === ' ' ? 0 : 3 + Math.floor(Math.random() * 3),
    })),
  );
  const currentIndex = useRef(0);
  const completeCalled = useRef(false);

  const tick = useCallback(() => {
    setChars((prev) => {
      const next = [...prev];
      // Find the current character being resolved
      const idx = currentIndex.current;
      if (idx >= next.length) return prev;

      const ch = { ...next[idx] };
      if (ch.settled) {
        currentIndex.current++;
        return next;
      }

      if (ch.flipsRemaining <= 0) {
        ch.current = ch.target;
        ch.settled = true;
        currentIndex.current++;
      } else {
        ch.current = FLIP_CHARS[Math.floor(Math.random() * FLIP_CHARS.length)];
        ch.flipsRemaining--;
      }
      next[idx] = ch;
      return next;
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (currentIndex.current >= upper.length) {
        clearInterval(interval);
        if (!completeCalled.current) {
          completeCalled.current = true;
          onComplete?.();
        }
        return;
      }
      playClick?.();
      tick();
    }, speed);

    return () => clearInterval(interval);
  }, [speed, upper.length, tick, onComplete, playClick]);

  // Reset when text changes
  useEffect(() => {
    currentIndex.current = 0;
    completeCalled.current = false;
    setChars(
      Array.from(upper).map((target) => ({
        current: target === ' ' ? ' ' : FLIP_CHARS[Math.floor(Math.random() * FLIP_CHARS.length)],
        target,
        settled: target === ' ',
        flipsRemaining: target === ' ' ? 0 : 3 + Math.floor(Math.random() * 3),
      })),
    );
  }, [upper]);

  return (
    <div className={`inline-flex gap-[2px] ${className}`}>
      {chars.map((ch, i) => (
        <span
          key={i}
          className={`
            inline-flex items-center justify-center
            w-[1.4ch] h-8 font-mono text-lg font-bold
            bg-drift-card rounded-sm
            ${ch.settled ? 'text-white' : 'text-drift-accent'}
            ${!ch.settled && ch.current !== ch.target ? 'solari-char' : ''}
          `}
        >
          {ch.current}
        </span>
      ))}
    </div>
  );
}
