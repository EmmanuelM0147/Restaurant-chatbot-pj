import React from 'react';
import { ShoppingBag } from 'lucide-react';
import type { Order } from '../../types';
import { formatCurrency } from '../../utils/menu';

type OrderSummaryProps = {
  order: Order;
};

export const OrderSummary: React.FC<OrderSummaryProps> = ({ order }) => {
  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <ShoppingBag className="h-5 w-5 text-primary" />
          <h3 className="font-medium text-gray-900">Order Summary</h3>
        </div>
      </div>
      
      <div className="p-4">
        <ul className="divide-y divide-gray-200">
          {order.items.map((item, index) => (
            <li key={index} className="py-3 flex justify-between">
              <div>
                <span className="font-medium">{item.name}</span>
                <span className="text-gray-600 ml-2">x{item.quantity}</span>
              </div>
              <span className="text-gray-900">{formatCurrency(item.subtotal)}</span>
            </li>
          ))}
        </ul>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between font-medium">
            <span>Total</span>
            <span className="text-primary">{formatCurrency(order.totalAmount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};