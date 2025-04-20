import type { Message, User, Order } from '../types';
import { menuItems, formatCurrency } from './menu';
import { getCurrentOrder, saveCurrentOrder, clearCurrentOrder } from './storage';
import axios from 'axios';

type ChatbotResponse = Omit<Message, 'id' | 'sender' | 'timestamp'>;

// Main function to process user messages
export async function processUserMessage(
  message: string,
  user: User | null,
  currentOrder: Order | null
): Promise<ChatbotResponse[]> {
  const command = parseInt(message);

  try {
    switch (command) {
      case 1: // Show menu
        return handleMenuDisplay();
      
      case 97: // View current order
        return handleCurrentOrder();
      
      case 98: // View order history
        return handleOrderHistory();
      
      case 99: // Checkout
        return handleCheckout(currentOrder);
      
      case 0: // Cancel order
        return handleCancelOrder();
      
      default:
        // Check if it's a menu item selection
        if (command > 0 && command <= menuItems.length) {
          return handleItemSelection(command);
        }
        
        return [{
          content: "Invalid option. Please choose a valid option from the menu.",
          type: 'text'
        }];
    }
  } catch (error) {
    console.error('Error processing message:', error);
    return [{
      content: "Sorry, something went wrong. Please try again.",
      type: 'text'
    }];
  }
}

function handleMenuDisplay(): ChatbotResponse[] {
  const categorizedMenu = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof menuItems>);

  let menuText = "📋 Here's our menu:\n\n";
  
  Object.entries(categorizedMenu).forEach(([category, items]) => {
    menuText += `${category}\n`;
    items.forEach(item => {
      menuText += `${item.id}. ${item.name} - ${formatCurrency(item.price)}\n   ${item.description}\n`;
    });
    menuText += '\n';
  });

  menuText += "\nEnter the number of the item you'd like to order.";

  return [{
    content: menuText,
    type: 'text'
  }];
}

async function handleItemSelection(itemId: number): Promise<ChatbotResponse[]> {
  const item = menuItems.find(i => i.id === itemId);
  if (!item) {
    return [{
      content: "Item not found. Please select a valid menu item.",
      type: 'text'
    }];
  }

  let order = getCurrentOrder();
  if (!order) {
    order = {
      deviceId: localStorage.getItem('deviceId') || '',
      items: [],
      totalAmount: 0,
      status: 'draft'
    };
  }

  const existingItem = order.items.find(i => i.menuItemId === item.id);
  if (existingItem) {
    existingItem.quantity += 1;
    existingItem.subtotal = existingItem.quantity * existingItem.price;
  } else {
    order.items.push({
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      subtotal: item.price
    });
  }

  order.totalAmount = order.items.reduce((sum, item) => sum + item.subtotal, 0);
  saveCurrentOrder(order);

  return [
    {
      content: `Added ${item.name} to your order.`,
      type: 'text'
    },
    {
      content: '',
      type: 'order',
      data: order
    },
    {
      content: "Would you like to add anything else? Type 1 to view the menu again or 99 to checkout.",
      type: 'text'
    }
  ];
}

async function handleCurrentOrder(): Promise<ChatbotResponse[]> {
  const order = getCurrentOrder();
  
  if (!order || order.items.length === 0) {
    return [{
      content: "You don't have any items in your order. Type 1 to view the menu.",
      type: 'text'
    }];
  }

  return [
    {
      content: "Here's your current order:",
      type: 'text'
    },
    {
      content: '',
      type: 'order',
      data: order
    }
  ];
}

async function handleOrderHistory(): Promise<ChatbotResponse[]> {
  const history = localStorage.getItem('orderHistory');
  const orders = history ? JSON.parse(history) : [];

  if (orders.length === 0) {
    return [{
      content: "You haven't placed any orders yet. Type 1 to view the menu and place your first order!",
      type: 'text'
    }];
  }

  return [
    {
      content: "Here are your previous orders:",
      type: 'text'
    },
    {
      content: '',
      type: 'history',
      data: orders
    }
  ];
}

async function handleCheckout(currentOrder: Order | null): Promise<ChatbotResponse[]> {
  if (!currentOrder || currentOrder.items.length === 0) {
    return [{
      content: "You don't have any items in your order. Type 1 to view the menu.",
      type: 'text'
    }];
  }

  try {
    const response = await axios.post('/api/payment/initialize', {
      amount: currentOrder.totalAmount,
      deviceId: currentOrder.deviceId
    });

    return [
      {
        content: "Great! Let's proceed with your payment.",
        type: 'text'
      },
      {
        content: '',
        type: 'payment',
        data: {
          orderId: currentOrder.id,
          amount: currentOrder.totalAmount,
          reference: response.data.reference,
          authorization_url: response.data.authorization_url
        }
      }
    ];
  } catch (error) {
    console.error('Payment initialization error:', error);
    return [{
      content: "Sorry, we couldn't process your payment right now. Please try again later.",
      type: 'text'
    }];
  }
}

async function handleCancelOrder(): Promise<ChatbotResponse[]> {
  const order = getCurrentOrder();
  
  if (!order) {
    return [{
      content: "You don't have any active order to cancel.",
      type: 'text'
    }];
  }

  clearCurrentOrder();

  return [{
    content: "Your order has been cancelled. Type 1 to start a new order.",
    type: 'text'
  }];
}