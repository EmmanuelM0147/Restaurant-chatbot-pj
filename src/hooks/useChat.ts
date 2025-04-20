import { create } from 'zustand';
import type { Message } from '../types';

type ChatStore = {
  messages: Message[];
  addMessage: (message: Message) => void;
  clearMessages: () => void;
};

export const useChat = create<ChatStore>((set) => ({
  messages: [],
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message],
  })),
  clearMessages: () => set({ messages: [] }),
}));