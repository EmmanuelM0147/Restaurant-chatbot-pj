import React, { createContext, useContext, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';
import type { User } from '../types';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  error: Error | null;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initializeUser = async () => {
      try {
        // Check for device ID in localStorage
        let deviceId = localStorage.getItem('deviceId');
        
        // If no device ID, create one and store it
        if (!deviceId) {
          deviceId = uuidv4();
          localStorage.setItem('deviceId', deviceId);
        }
        
        // Find or create user with this device ID
        const { data: existingUser, error: findError } = await supabase
          .from('users')
          .select('*')
          .eq('device_id', deviceId)
          .single();
          
        if (findError && findError.code !== 'PGRST116') {
          throw findError;
        }
        
        if (existingUser) {
          setUser({
            id: existingUser.id,
            deviceId: existingUser.device_id,
            createdAt: new Date(existingUser.created_at),
          });
        } else {
          // Create new user
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert([{ device_id: deviceId }])
            .select()
            .single();
            
          if (createError) throw createError;
          
          if (newUser) {
            setUser({
              id: newUser.id,
              deviceId: newUser.device_id,
              createdAt: new Date(newUser.created_at),
            });
          }
        }
      } catch (err) {
        console.error('Auth error:', err);
        setError(err instanceof Error ? err : new Error('Authentication failed'));
      } finally {
        setLoading(false);
      }
    };

    initializeUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};