import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useOrder } from '../context/OrderContext';
import { Message } from '../types';
import { MessageList } from './MessageList';
import { InputForm } from './InputForm';

const VALID_OPTIONS = [0, 1, 97, 98, 99];

const WELCOME_MESSAGE = `Welcome to FoodBot! Choose an option:
1️⃣ Place a new order
9️⃣9️⃣ Checkout current order
9️⃣8️⃣ View order history
9️⃣7️⃣ View current order
0️⃣ Cancel order`;

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentOrder, orderHistory, createOrder, cancelOrder } = useOrder();

  useEffect(() => {
    // Add welcome message on mount
    if (messages.length === 0) {
      setMessages([
        {
          id: uuidv4(),
          content: WELCOME_MESSAGE,
          type: 'system',
          timestamp: new Date(),
        },
      ]);
    }
  }, []);

  const addMessage = (content: string, type: Message['type'] = 'user') => {
    setMessages((prev) => [
      ...prev,
      {
        id: uuidv4(),
        content,
        type,
        timestamp: new Date(),
      },
    ]);
  };

  const handleInput = async (value: string) => {
    const numValue = parseInt(value, 10);

    if (!VALID_OPTIONS.includes(numValue)) {
      addMessage('Invalid option. Please choose a valid option from the menu.', 'error');
      return;
    }

    addMessage(value);
    setLoading(true);

    try {
      switch (numValue) {
        case 1:
          createOrder();
          addMessage('Here\'s our menu:\n1. Burger ($5.99)\n2. Pizza ($8.99)\n\nEnter the number of the item you\'d like to order.', 'system');
          break;

        case 99:
          if (!currentOrder) {
            addMessage('No current order to checkout.', 'error');
          } else {
            // Handle checkout
            addMessage('Order placed successfully! Your order number is #123456', 'system');
          }
          break;

        case 98:
          if (orderHistory.length === 0) {
            addMessage('No order history found.', 'system');
          } else {
            const historyMessage = orderHistory
              .map((order) => `Order #${order.id}: ${order.items.length} items - $${order.totalAmount}`)
              .join('\n');
            addMessage(historyMessage, 'system');
          }
          break;

        case 97:
          if (!currentOrder) {
            addMessage('No current order found.', 'system');
          } else {
            const orderDetails = `Current Order:\n${currentOrder.items
              .map((item) => `${item.name} x${item.quantity} - $${item.subtotal}`)
              .join('\n')}\nTotal: $${currentOrder.totalAmount}`;
            addMessage(orderDetails, 'system');
          }
          break;

        case 0:
          if (!currentOrder) {
            addMessage('No current order to cancel.', 'error');
          } else {
            await cancelOrder(currentOrder.id!);
            addMessage('Order cancelled successfully.', 'system');
          }
          break;
      }
    } catch (error) {
      addMessage('An error occurred. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto">
      <div className="flex-1 overflow-y-auto p-4">
        <MessageList messages={messages} />
      </div>
      <div className="border-t p-4">
        <InputForm onSubmit={handleInput} isLoading={loading} />
      </div>
    </div>
  );
};