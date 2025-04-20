import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useSessionContext } from './SessionContext';
import { supabase } from '../lib/supabase';
import type { Order, OrderItem, OrderStatus } from '../types';

type OrderContextType = {
  currentOrder: Order | null;
  orderHistory: Order[];
  loading: boolean;
  error: Error | null;
  createOrder: () => void;
  addItemToOrder: (item: OrderItem) => void;
  removeItemFromOrder: (itemId: string) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  placeOrder: (scheduledFor?: Date) => Promise<Order | null>;
  cancelOrder: (orderId: string) => Promise<boolean>;
  getOrderById: (orderId: string) => Promise<Order | null>;
  refreshOrderHistory: () => Promise<void>;
  updateOrderScheduledTime: (orderId: string, scheduledTime: Date) => Promise<void>;
};

const OrderContext = createContext<OrderContextType>({
  currentOrder: null,
  orderHistory: [],
  loading: false,
  error: null,
  createOrder: () => {},
  addItemToOrder: () => {},
  removeItemFromOrder: () => {},
  updateItemQuantity: () => {},
  placeOrder: async () => null,
  cancelOrder: async () => false,
  getOrderById: async () => null,
  refreshOrderHistory: async () => {},
  updateOrderScheduledTime: async () => {},
});

export const useOrder = () => useContext(OrderContext);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { deviceId } = useSessionContext();
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Initialize a new order
  const createOrder = () => {
    setCurrentOrder({
      items: [],
      totalAmount: 0,
      status: 'draft',
      deviceId,
    });
  };

  // Add item to order
  const addItemToOrder = (item: OrderItem) => {
    if (!currentOrder) {
      createOrder();
    }
    
    setCurrentOrder(prevOrder => {
      if (!prevOrder) return null;
      
      const existingItemIndex = prevOrder.items.findIndex(
        i => i.menuItemId === item.menuItemId
      );
      
      let updatedItems: OrderItem[];
      
      if (existingItemIndex >= 0) {
        updatedItems = [...prevOrder.items];
        const existingItem = updatedItems[existingItemIndex];
        updatedItems[existingItemIndex] = {
          ...existingItem,
          quantity: existingItem.quantity + item.quantity,
          subtotal: (existingItem.quantity + item.quantity) * existingItem.price,
        };
      } else {
        updatedItems = [...prevOrder.items, item];
      }
      
      const totalAmount = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);
      
      return {
        ...prevOrder,
        items: updatedItems,
        totalAmount,
      };
    });
  };

  // Remove item from order
  const removeItemFromOrder = (itemId: string) => {
    if (!currentOrder) return;
    
    setCurrentOrder(prevOrder => {
      if (!prevOrder) return null;
      
      const updatedItems = prevOrder.items.filter(item => item.menuItemId !== itemId);
      const totalAmount = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);
      
      return {
        ...prevOrder,
        items: updatedItems,
        totalAmount,
      };
    });
  };

  // Update item quantity
  const updateItemQuantity = (itemId: string, quantity: number) => {
    if (!currentOrder) return;
    
    setCurrentOrder(prevOrder => {
      if (!prevOrder) return null;
      
      const updatedItems = prevOrder.items.map(item => {
        if (item.menuItemId === itemId) {
          return {
            ...item,
            quantity,
            subtotal: quantity * item.price,
          };
        }
        return item;
      });
      
      const filteredItems = updatedItems.filter(item => item.quantity > 0);
      const totalAmount = filteredItems.reduce((sum, item) => sum + item.subtotal, 0);
      
      return {
        ...prevOrder,
        items: filteredItems,
        totalAmount,
      };
    });
  };

  // Update order scheduled time
  const updateOrderScheduledTime = async (orderId: string, scheduledTime: Date): Promise<void> => {
    try {
      setLoading(true);
      
      const { error: updateError } = await supabase
        .from('orders')
        .update({ scheduled_for: scheduledTime.toISOString() })
        .eq('id', orderId)
        .eq('user_id', user?.id);
        
      if (updateError) throw updateError;
      
      await refreshOrderHistory();
    } catch (err) {
      console.error('Error updating scheduled time:', err);
      setError(err instanceof Error ? err : new Error('Failed to update scheduled time'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Place an order
  const placeOrder = async (scheduledFor?: Date): Promise<Order | null> => {
    if (!currentOrder) return null;
    
    try {
      setLoading(true);
      
      const orderData = {
        device_id: deviceId,
        user_id: user?.id,
        items: currentOrder.items,
        total_amount: currentOrder.totalAmount,
        status: 'placed' as OrderStatus,
        scheduled_for: scheduledFor?.toISOString(),
      };
      
      const { data, error: insertError } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();
        
      if (insertError) throw insertError;
      
      if (data) {
        const placedOrder: Order = {
          id: data.id,
          deviceId: data.device_id,
          items: data.items,
          totalAmount: data.total_amount,
          status: data.status,
          scheduledFor: data.scheduled_for ? new Date(data.scheduled_for) : undefined,
          createdAt: new Date(data.created_at),
        };
        
        setCurrentOrder(null);
        await refreshOrderHistory();
        
        return placedOrder;
      }
      
      return null;
    } catch (err) {
      console.error('Error placing order:', err);
      setError(err instanceof Error ? err : new Error('Failed to place order'));
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Cancel an order
  const cancelOrder = async (orderId: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId)
        .eq('device_id', deviceId);
        
      if (updateError) throw updateError;
      
      await refreshOrderHistory();
      return true;
    } catch (err) {
      console.error('Error cancelling order:', err);
      setError(err instanceof Error ? err : new Error('Failed to cancel order'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Get a specific order by ID
  const getOrderById = async (orderId: string): Promise<Order | null> => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .eq('device_id', deviceId)
        .single();
        
      if (error) throw error;
      
      if (data) {
        return {
          id: data.id,
          deviceId: data.device_id,
          items: data.items,
          totalAmount: data.total_amount,
          status: data.status,
          scheduledFor: data.scheduled_for ? new Date(data.scheduled_for) : undefined,
          createdAt: new Date(data.created_at),
        };
      }
      
      return null;
    } catch (err) {
      console.error('Error fetching order:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch order'));
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Refresh order history
  const refreshOrderHistory = async (): Promise<void> => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('device_id', deviceId)
        .order('scheduled_for', { ascending: true, nullsLast: true })
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      if (data) {
        const orders: Order[] = data.map(order => ({
          id: order.id,
          deviceId: order.device_id,
          items: order.items,
          totalAmount: order.total_amount,
          status: order.status,
          scheduledFor: order.scheduled_for ? new Date(order.scheduled_for) : undefined,
          createdAt: new Date(order.created_at),
        }));
        
        setOrderHistory(orders);
      }
    } catch (err) {
      console.error('Error fetching order history:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch order history'));
    } finally {
      setLoading(false);
    }
  };

  // Load order history when deviceId changes
  useEffect(() => {
    if (deviceId) {
      refreshOrderHistory();
    }
  }, [deviceId]);

  return (
    <OrderContext.Provider
      value={{
        currentOrder,
        orderHistory,
        loading,
        error,
        createOrder,
        addItemToOrder,
        removeItemFromOrder,
        updateItemQuantity,
        placeOrder,
        cancelOrder,
        getOrderById,
        refreshOrderHistory,
        updateOrderScheduledTime,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};