import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Order, OrderItem } from '../types';

type OrderStore = {
  deviceId: string | null;
  currentOrder: Order | null;
  orderHistory: Order[];
  initializeOrder: () => void;
  addItem: (item: OrderItem) => void;
  removeItem: (itemId: number) => void;
  clearOrder: () => void;
  setOrderHistory: (orders: Order[]) => void;
};

export const useOrder = create<OrderStore>((set, get) => ({
  deviceId: null,
  currentOrder: null,
  orderHistory: [],
  
  initializeOrder: () => {
    // Get or create device ID
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = uuidv4();
      localStorage.setItem('deviceId', deviceId);
    }
    
    set({ deviceId });
    
    // Initialize empty order if none exists
    if (!get().currentOrder) {
      set({
        currentOrder: {
          deviceId,
          items: [],
          status: 'draft',
          total: 0,
        },
      });
    }
  },
  
  addItem: (item) => set((state) => {
    if (!state.currentOrder) return state;
    
    const existingItems = state.currentOrder.items;
    const existingItem = existingItems.find((i) => i.menuItemId === item.menuItemId);
    
    let newItems;
    if (existingItem) {
      newItems = existingItems.map((i) =>
        i.menuItemId === item.menuItemId
          ? { ...i, quantity: i.quantity + item.quantity }
          : i
      );
    } else {
      newItems = [...existingItems, item];
    }
    
    const total = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    
    return {
      currentOrder: {
        ...state.currentOrder,
        items: newItems,
        total,
      },
    };
  }),
  
  removeItem: (itemId) => set((state) => {
    if (!state.currentOrder) return state;
    
    const newItems = state.currentOrder.items.filter((i) => i.menuItemId !== itemId);
    const total = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    
    return {
      currentOrder: {
        ...state.currentOrder,
        items: newItems,
        total,
      },
    };
  }),
  
  clearOrder: () => set((state) => ({
    currentOrder: state.deviceId
      ? {
          deviceId: state.deviceId,
          items: [],
          status: 'draft',
          total: 0,
        }
      : null,
  })),
  
  setOrderHistory: (orders) => set({ orderHistory: orders }),
}));