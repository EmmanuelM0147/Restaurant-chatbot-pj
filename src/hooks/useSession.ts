import { useState, useEffect } from 'react';
import { SessionManager, Session } from '../lib/session';

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initializeSession = async () => {
      try {
        const sessionManager = SessionManager.getInstance();
        const session = await sessionManager.initialize();
        setSession(session);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Session initialization failed'));
      } finally {
        setLoading(false);
      }
    };

    initializeSession();

    return () => {
      SessionManager.getInstance().cleanup();
    };
  }, []);

  const linkUser = async (userId: string) => {
    try {
      await SessionManager.getInstance().linkUser(userId);
      setSession(SessionManager.getInstance().getCurrentSession());
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to link user'));
      throw err;
    }
  };

  const updateMetadata = async (metadata: Record<string, unknown>) => {
    try {
      await SessionManager.getInstance().updateMetadata(metadata);
      setSession(SessionManager.getInstance().getCurrentSession());
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update metadata'));
      throw err;
    }
  };

  return {
    session,
    loading,
    error,
    linkUser,
    updateMetadata,
    deviceId: SessionManager.getInstance().getDeviceId(),
  };
}