import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.ts';
import { getProgress } from '../api/sync.ts';

interface AuthPanelProps {
  onSynced?: () => void;
}

export function AuthPanel({ onSynced }: AuthPanelProps) {
  const { isAuthed, userId, register, authenticate, logout, getToken } = useAuth();
  const [showRestore, setShowRestore] = useState(false);
  const [restoreId, setRestoreId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const handleRegister = async () => {
    setLoading(true);
    setError(null);
    try {
      await register();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!restoreId.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await authenticate(restoreId.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    const token = getToken();
    if (!token) return;
    setSyncing(true);
    setError(null);
    try {
      await getProgress(token);
      onSynced?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  if (isAuthed) {
    return (
      <div className="rounded-lg border border-green-700/30 bg-green-950/20 p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-green-400 text-lg">&#10003;</span>
          <span className="text-green-300 font-medium">Progress saved</span>
        </div>
        {userId && (
          <p className="text-xs text-zinc-500 mb-3 font-mono break-all">
            ID: {userId}
          </p>
        )}
        <div className="flex gap-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-3 py-1.5 text-sm rounded bg-zinc-800 text-zinc-200 hover:bg-zinc-700 disabled:opacity-50 transition-colors"
          >
            {syncing ? 'Syncing...' : 'Sync now'}
          </button>
          <button
            onClick={logout}
            className="px-3 py-1.5 text-sm rounded text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Sign out
          </button>
        </div>
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-700/30 bg-zinc-900/50 p-4">
      <h3 className="text-zinc-200 font-medium mb-2">Save your progress across devices</h3>
      <p className="text-zinc-500 text-sm mb-4">
        Uses a passkey stored on your device. No passwords needed.
      </p>

      <div className="flex flex-col gap-2">
        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full px-4 py-2 rounded bg-blue-600 text-white font-medium hover:bg-blue-500 disabled:opacity-50 transition-colors"
        >
          {loading && !showRestore ? 'Setting up...' : 'Save with Passkey'}
        </button>

        {!showRestore ? (
          <button
            onClick={() => setShowRestore(true)}
            className="w-full px-4 py-2 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
          >
            Restore Progress
          </button>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={restoreId}
              onChange={(e) => setRestoreId(e.target.value)}
              placeholder="Your user ID"
              className="flex-1 px-3 py-2 rounded bg-zinc-800 text-zinc-200 border border-zinc-700 placeholder:text-zinc-600 text-sm"
            />
            <button
              onClick={handleRestore}
              disabled={loading || !restoreId.trim()}
              className="px-4 py-2 rounded bg-zinc-700 text-zinc-200 hover:bg-zinc-600 disabled:opacity-50 transition-colors"
            >
              {loading ? '...' : 'Go'}
            </button>
          </div>
        )}
      </div>

      {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
    </div>
  );
}
