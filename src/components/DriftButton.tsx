interface DriftButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function DriftButton({ onClick, disabled }: DriftButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        min-w-[200px] h-[60px] rounded-full font-mono text-xl font-bold tracking-widest
        transition-all
        ${disabled
          ? 'bg-drift-card text-white/40 cursor-not-allowed'
          : 'bg-drift-accent text-white drift-button-glow hover:brightness-110 active:scale-95 cursor-pointer'
        }
      `}
    >
      DRIFT
    </button>
  );
}
