import axios from 'axios';
import type { Order, PaymentInfo } from '../types';
import { clearCurrentOrder } from './storage';

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

export async function initializePayment(order: Order): Promise<PaymentInfo> {
  try {
    const response = await axios.post('/api/payment/initialize', {
      amount: Math.round(order.totalAmount * 100), // Convert to kobo
      deviceId: order.deviceId,
      metadata: {
        order_id: order.id,
        device_id: order.deviceId
      }
    });

    return {
      orderId: order.id!,
      amount: order.totalAmount,
      reference: response.data.reference,
      authorization_url: response.data.authorization_url
    };
  } catch (error) {
    console.error('Payment initialization error:', error);
    throw new Error('Failed to initialize payment');
  }
}

export async function verifyPayment(reference: string): Promise<boolean> {
  try {
    const response = await axios.get(`/api/payment/verify/${reference}`);
    
    if (response.data.status === 'success') {
      clearCurrentOrder();
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Payment verification error:', error);
    return false;
  }
}

export function saveOrderToHistory(order: Order): void {
  const history = localStorage.getItem('orderHistory');
  const orders = history ? JSON.parse(history) : [];
  
  orders.unshift({
    ...order,
    completedAt: new Date().toISOString()
  });
  
  localStorage.setItem('orderHistory', JSON.stringify(orders.slice(0, 50))); // Keep last 50 orders
}