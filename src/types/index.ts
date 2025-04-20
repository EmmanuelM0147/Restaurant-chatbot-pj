export type Message = {
  id: string;
  content: string | React.ReactNode;
  sender: 'user' | 'bot';
  timestamp: Date;
  type: 'text' | 'menu' | 'order' | 'payment' | 'history';
  data?: any;
};

export type MenuItem = {
  id: number;
  name: string;
  price: number;
  description: string;
  category: string;
};

export type OrderItem = {
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  notes?: string;
};

export type Order = {
  id?: string;
  deviceId: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentStatus?: PaymentStatus;
  scheduledFor?: Date;
  createdAt?: Date;
};

export type OrderStatus = 'draft' | 'pending' | 'placed' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed';

export type PaymentInfo = {
  orderId: string;
  amount: number;
  reference: string;
  authorization_url?: string;
};

export type PaymentMethod = 'card' | 'bank';

export type User = {
  id: string;
  deviceId: string;
  createdAt: Date;
};