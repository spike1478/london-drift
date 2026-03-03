import { useState } from 'react';
import type { Riddle } from '../api/types';
import { checkAnswer } from '../engine/riddles';

interface RiddleModalProps {
  riddle: Riddle | null;
  onAnswer: (correct: boolean) => void;
  onClose: () => void;
}

export function RiddleModal({ riddle, onAnswer, onClose }: RiddleModalProps) {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<{ correct: boolean; actual: string | number | boolean } | null>(null);

  if (!riddle) return null;

  const inputType = typeof riddle.answer === 'number' ? 'number' : 'text';
  const isBoolean = typeof riddle.answer === 'boolean';

  function handleSubmit(answer: string) {
    const { correct, actualAnswer } = checkAnswer(riddle!, answer);
    setResult({ correct, actual: actualAnswer });
    setTimeout(() => {
      onAnswer(correct);
      setInput('');
      setResult(null);
    }, 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div
        className={`
          w-[90vw] max-w-md rounded-2xl p-6 shadow-2xl
          bg-drift-card border border-white/10
          ${result?.correct === true ? 'ring-2 ring-drift-success' : ''}
          ${result?.correct === false ? 'ring-2 ring-drift-warning' : ''}
        `}
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-mono font-bold text-drift-accent mb-4">Station Riddle</h3>
        <p className="text-white mb-6">{riddle.question}</p>

        {result ? (
          <div className={`text-center p-4 rounded-lg ${result.correct ? 'bg-drift-success/20' : 'bg-drift-warning/20'}`}>
            <p className="text-xl font-bold mb-1">
              {result.correct ? 'Correct!' : 'Not quite!'}
            </p>
            {!result.correct && (
              <p className="text-white/70 text-sm">The answer is {String(result.actual)}</p>
            )}
          </div>
        ) : isBoolean ? (
          <div className="flex gap-3">
            <button
              onClick={() => handleSubmit('yes')}
              className="flex-1 py-3 rounded-lg bg-drift-success/20 border border-drift-success/40 text-drift-success font-mono font-bold hover:bg-drift-success/30 transition-colors"
            >
              Yes
            </button>
            <button
              onClick={() => handleSubmit('no')}
              className="flex-1 py-3 rounded-lg bg-drift-warning/20 border border-drift-warning/40 text-drift-warning font-mono font-bold hover:bg-drift-warning/30 transition-colors"
            >
              No
            </button>
          </div>
        ) : (
          <form
            onSubmit={e => {
              e.preventDefault();
              if (input.trim()) handleSubmit(input);
            }}
            className="flex gap-3"
          >
            <input
              type={inputType}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={inputType === 'number' ? 'Enter a number' : 'Type your answer'}
              className="flex-1 px-4 py-3 rounded-lg bg-drift-surface border border-white/10 text-white font-mono placeholder:text-white/30 focus:outline-none focus:border-drift-accent"
              autoFocus
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="px-6 py-3 rounded-lg bg-drift-accent text-white font-mono font-bold hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Go
            </button>
          </form>
        )}

        <button
          onClick={onClose}
          className="mt-4 w-full text-center text-white/40 text-sm hover:text-white/60 transition-colors"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
