import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { body, validationResult } from 'express-validator';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Menu items with preparation times
const menuItems = [
  { 
    id: 1, 
    name: 'Classic Burger', 
    price: 9.99, 
    description: 'Juicy beef patty with fresh lettuce, tomato, and our special sauce',
    prepTime: 15,
    category: 'Mains'
  },
  { 
    id: 2, 
    name: 'Veggie Pizza', 
    price: 12.99, 
    description: 'Fresh vegetables on a crispy crust with house-made tomato sauce',
    prepTime: 20,
    category: 'Mains'
  },
  { 
    id: 3, 
    name: 'Caesar Salad', 
    price: 7.99, 
    description: 'Crisp romaine lettuce with parmesan, croutons, and Caesar dressing',
    prepTime: 10,
    category: 'Starters'
  },
  { 
    id: 4, 
    name: 'French Fries', 
    price: 3.99, 
    description: 'Crispy golden fries seasoned with sea salt',
    prepTime: 8,
    category: 'Sides'
  },
  { 
    id: 5, 
    name: 'Soft Drink', 
    price: 1.99, 
    description: 'Choice of Coca-Cola, Sprite, or Fanta',
    prepTime: 1,
    category: 'Beverages'
  }
];

// Tax rate
const TAX_RATE = 0.075; // 7.5%

// Chatbot endpoint
app.post('/api/chatbot', [
  body('message').isString().trim().notEmpty(),
  body('deviceId').isString().trim().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { message, deviceId } = req.body;
    const command = parseInt(message);

    switch (command) {
      case 1: // Show menu
        // Group items by category
        const menuByCategory = menuItems.reduce((acc, item) => {
          if (!acc[item.category]) {
            acc[item.category] = [];
          }
          acc[item.category].push(item);
          return acc;
        }, {});

        return res.json({
          type: 'menu',
          content: {
            categories: menuByCategory,
            message: 'Enter item number to add to order. Type 97 to view current order.'
          }
        });

      case 97: // Current order
        const { data: currentOrder } = await supabase
          .from('orders')
          .select('*')
          .eq('device_id', deviceId)
          .eq('status', 'pending')
          .single();

        if (!currentOrder) {
          return res.json({
            type: 'current_order',
            content: null,
            message: 'No current order. Type 1 to view the menu.'
          });
        }

        // Calculate tax and total
        const subtotal = currentOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = subtotal * TAX_RATE;
        const total = subtotal + tax;

        // Calculate estimated prep time
        const prepTime = currentOrder.items.reduce((maxTime, item) => {
          const menuItem = menuItems.find(m => m.id === item.menuItemId);
          return Math.max(maxTime, menuItem ? menuItem.prepTime : 0);
        }, 0);

        return res.json({
          type: 'current_order',
          content: {
            ...currentOrder,
            subtotal,
            tax,
            total,
            prepTime,
          }
        });

      case 98: // Order history
        const { startDate, endDate } = req.query;
        let query = supabase
          .from('order_history')
          .select('*')
          .eq('device_id', deviceId)
          .order('created_at', { ascending: false });

        if (startDate) {
          query = query.gte('created_at', startDate);
        }
        if (endDate) {
          query = query.lte('created_at', endDate);
        }

        const { data: orderHistory } = await query;

        return res.json({
          type: 'history',
          content: orderHistory || []
        });

      case 99: // Complete order
        const { data: pendingOrder } = await supabase
          .from('orders')
          .select('*')
          .eq('device_id', deviceId)
          .eq('status', 'pending')
          .single();

        if (!pendingOrder) {
          return res.status(404).json({
            type: 'error',
            content: 'No pending order found'
          });
        }

        // Initialize Paystack payment
        const payment = await initializePayment(pendingOrder.total, deviceId);
        return res.json({
          type: 'payment',
          content: payment
        });

      case 0: // Cancel order
        const { error: cancelError } = await supabase
          .from('orders')
          .update({ status: 'cancelled' })
          .eq('device_id', deviceId)
          .eq('status', 'pending');

        if (cancelError) throw cancelError;

        return res.json({
          type: 'success',
          content: 'Order cancelled successfully',
          message: 'Type 1 to view the menu and start a new order.'
        });

      default:
        // Check if the input is a menu item ID
        const menuItem = menuItems.find(item => item.id === command);
        if (menuItem) {
          // Add item to order
          const { data: order } = await supabase
            .from('orders')
            .select('*')
            .eq('device_id', deviceId)
            .eq('status', 'pending')
            .single();

          if (order) {
            // Update existing order
            const existingItem = order.items.find(item => item.menuItemId === menuItem.id);
            let updatedItems;

            if (existingItem) {
              updatedItems = order.items.map(item =>
                item.menuItemId === menuItem.id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              );
            } else {
              updatedItems = [...order.items, {
                menuItemId: menuItem.id,
                name: menuItem.name,
                price: menuItem.price,
                quantity: 1
              }];
            }

            await supabase
              .from('orders')
              .update({ items: updatedItems })
              .eq('id', order.id);
          } else {
            // Create new order
            await supabase
              .from('orders')
              .insert([{
                device_id: deviceId,
                items: [{
                  menuItemId: menuItem.id,
                  name: menuItem.name,
                  price: menuItem.price,
                  quantity: 1
                }],
                status: 'pending'
              }]);
          }

          return res.json({
            type: 'success',
            content: `Added ${menuItem.name} to your order.`,
            message: 'Type 97 to view your current order or continue adding items.'
          });
        }

        return res.status(400).json({
          type: 'error',
          content: 'Invalid command. Type 1 for menu, 97 for current order, 98 for history, 99 to checkout, or 0 to cancel.'
        });
    }
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({
      type: 'error',
      content: 'An error occurred processing your request'
    });
  }
});

// Initialize Paystack payment
async function initializePayment(amount, deviceId) {
  try {
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        amount: Math.round(amount * 100), // Convert to kobo
        callback_url: `${process.env.FRONTEND_URL}/payment/callback`,
        metadata: {
          device_id: deviceId
        }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Paystack initialization error:', error);
    throw new Error('Payment initialization failed');
  }
}

// Paystack callback
app.get('/api/paystack/callback', async (req, res) => {
  try {
    const { reference } = req.query;
    const { data: transaction } = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      }
    );

    if (transaction.data.status === 'success') {
      const deviceId = transaction.data.metadata.device_id;

      // Get the order details
      const { data: order } = await supabase
        .from('orders')
        .select('*')
        .eq('device_id', deviceId)
        .eq('status', 'pending')
        .single();

      if (order) {
        // Move order to history
        await supabase
          .from('order_history')
          .insert([{
            device_id: deviceId,
            order_id: order.id,
            items: order.items,
            total: order.total,
            payment_status: 'paid'
          }]);

        // Update order status
        await supabase
          .from('orders')
          .update({ 
            status: 'completed',
            payment_status: 'paid'
          })
          .eq('id', order.id);
      }

      res.redirect(`${process.env.FRONTEND_URL}/payment/success`);
    } else {
      res.redirect(`${process.env.FRONTEND_URL}/payment/error`);
    }
  } catch (error) {
    console.error('Paystack callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/payment/error`);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});