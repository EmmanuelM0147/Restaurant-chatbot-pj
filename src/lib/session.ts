import { v4 as uuidv4 } from 'uuid';
import { supabase } from './supabase';

const DEVICE_ID_KEY = 'app_device_id';

export interface Session {
  id: string;
  deviceId: string;
  userId?: string;
  createdAt: Date;
  lastActive: Date;
  metadata: Record<string, unknown>;
}

export class SessionManager {
  private static instance: SessionManager;
  private deviceId: string;
  private currentSession: Session | null = null;
  private heartbeatInterval: number | null = null;

  private constructor() {
    this.deviceId = this.getOrCreateDeviceId();
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  private getOrCreateDeviceId(): string {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    
    if (!deviceId) {
      deviceId = uuidv4();
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    
    return deviceId;
  }

  public getDeviceId(): string {
    return this.deviceId;
  }

  public async initialize(): Promise<Session> {
    try {
      // Check for existing session
      const { data: existingSession, error: fetchError } = await supabase
        .from('sessions')
        .select('*')
        .eq('device_id', this.deviceId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingSession) {
        this.currentSession = this.transformSession(existingSession);
        await this.updateLastActive();
      } else {
        // Create new session
        const { data: newSession, error: createError } = await supabase
          .from('sessions')
          .insert([
            {
              device_id: this.deviceId,
              metadata: {},
            },
          ])
          .select()
          .single();

        if (createError) throw createError;

        if (!newSession) {
          throw new Error('Failed to create session');
        }

        this.currentSession = this.transformSession(newSession);
      }

      // Start heartbeat
      this.startHeartbeat();

      return this.currentSession;
    } catch (error) {
      console.error('Session initialization error:', error);
      throw error;
    }
  }

  private transformSession(rawSession: any): Session {
    return {
      id: rawSession.id,
      deviceId: rawSession.device_id,
      userId: rawSession.user_id,
      createdAt: new Date(rawSession.created_at),
      lastActive: new Date(rawSession.last_active),
      metadata: rawSession.metadata || {},
    };
  }

  private async updateLastActive(): Promise<void> {
    if (!this.currentSession) return;

    try {
      const { error } = await supabase
        .from('sessions')
        .update({ last_active: new Date().toISOString() })
        .eq('id', this.currentSession.id);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to update session last_active:', error);
    }
  }

  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Update last_active every 5 minutes
    this.heartbeatInterval = window.setInterval(() => {
      this.updateLastActive();
    }, 5 * 60 * 1000);
  }

  public async linkUser(userId: string): Promise<void> {
    if (!this.currentSession) return;

    try {
      const { error } = await supabase
        .from('sessions')
        .update({ user_id: userId })
        .eq('id', this.currentSession.id);

      if (error) throw error;

      this.currentSession.userId = userId;
    } catch (error) {
      console.error('Failed to link user to session:', error);
      throw error;
    }
  }

  public async updateMetadata(metadata: Record<string, unknown>): Promise<void> {
    if (!this.currentSession) return;

    try {
      const { error } = await supabase
        .from('sessions')
        .update({
          metadata: {
            ...this.currentSession.metadata,
            ...metadata,
          },
        })
        .eq('id', this.currentSession.id);

      if (error) throw error;

      this.currentSession.metadata = {
        ...this.currentSession.metadata,
        ...metadata,
      };
    } catch (error) {
      console.error('Failed to update session metadata:', error);
      throw error;
    }
  }

  public getCurrentSession(): Session | null {
    return this.currentSession;
  }

  public cleanup(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}