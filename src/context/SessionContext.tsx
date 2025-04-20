import React, { createContext, useContext } from 'react';
import { useSession } from '../hooks/useSession';
import type { Session } from '../lib/session';

interface SessionContextType {
  session: Session | null;
  loading: boolean;
  error: Error | null;
  linkUser: (userId: string) => Promise<void>;
  updateMetadata: (metadata: Record<string, unknown>) => Promise<void>;
  deviceId: string;
}

const SessionContext = createContext<SessionContextType>({
  session: null,
  loading: true,
  error: null,
  linkUser: async () => {},
  updateMetadata: async () => {},
  deviceId: '',
});

export const useSessionContext = () => useContext(SessionContext);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const sessionData = useSession();

  return (
    <SessionContext.Provider value={sessionData}>
      {children}
    </SessionContext.Provider>
  );
};