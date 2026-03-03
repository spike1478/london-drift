import { type ReactNode } from 'react';
import { DarkModeToggle } from './DarkModeToggle';
import { useDarkMode } from '../hooks/useDarkMode';

interface LayoutProps {
  children: ReactNode;
  onMuteToggle: () => void;
  isMuted: boolean;
  onCompletionistOpen: () => void;
}

export function Layout({ children, onMuteToggle, isMuted, onCompletionistOpen }: LayoutProps) {
  const { isDark, toggle: toggleDark } = useDarkMode();

  return (
    <div className="min-h-screen bg-drift-bg text-white">
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-drift-surface/90 backdrop-blur-sm border-b border-white/10">
        <h1 className="text-lg font-bold text-drift-accent tracking-wide">London Drift</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={onMuteToggle}
            className="p-2 rounded-lg hover:bg-drift-card transition-colors"
            aria-label={isMuted ? 'Unmute sounds' : 'Mute sounds'}
          >
            {isMuted ? '\u{1F507}' : '\u{1F50A}'}
          </button>
          <button
            onClick={onCompletionistOpen}
            className="p-2 rounded-lg hover:bg-drift-card transition-colors"
            aria-label="Open completionist tab"
          >
            {'\u{1F3C6}'}
          </button>
          <DarkModeToggle isDark={isDark} onToggle={toggleDark} />
        </div>
      </header>
      <main className="pt-14">
        {children}
      </main>
    </div>
  );
}
