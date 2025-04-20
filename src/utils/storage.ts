import { v4 as uuidv4 } from 'uuid';
import type { Order } from '../types';

const DEVICE_ID_KEY = 'deviceId';
const CURRENT_ORDER_KEY = 'currentOrder';

export const getDeviceId = (): string => {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  
  if (!deviceId) {
    deviceId = uuidv4();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  
  return deviceId;
};

export const getCurrentOrder = (): Order | null => {
  const stored = localStorage.getItem(CURRENT_ORDER_KEY);
  if (!stored) return null;
  
  const order = JSON.parse(stored);
  return {
    ...order,
    createdAt: order.createdAt ? new Date(order.createdAt) : undefined,
    scheduledFor: order.scheduledFor ? new Date(order.scheduledFor) : undefined,
  };
};

export const saveCurrentOrder = (order: Order): void => {
  localStorage.setItem(CURRENT_ORDER_KEY, JSON.stringify(order));
};

export const clearCurrentOrder = (): void => {
  localStorage.removeItem(CURRENT_ORDER_KEY);
};