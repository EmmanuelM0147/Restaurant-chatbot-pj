import React from 'react';
import { format } from 'date-fns';
import { Rewind as ClockRewind } from 'lucide-react';
import type { Order } from '../../types';
import { formatCurrency } from '../../utils/menu';

type OrderHistoryCardProps = {
  orders: Order[];
};

export const OrderHistoryCard: React.FC<OrderHistoryCardProps> = ({ orders }) => {
  if (!orders.length) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg text-center">
        <p className="text-gray-600">No order history yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <ClockRewind className="h-5 w-5 text-primary" />
          <h3 className="font-medium text-gray-900">Order History</h3>
        </div>
      </div>
      
      <div className="p-4">
        <ul className="divide-y divide-gray-200">
          {orders.map((order) => (
            <li key={order.id} className="py-3">
              <div className="flex justify-between mb-2">
                <div>
                  <span className="font-medium">
                    Order #{order.id?.substring(0, 8)}
                  </span>
                  <span className="text-sm text-gray-500 ml-2">
                    {order.createdAt && format(order.createdAt, 'PPp')}
                  </span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {order.paymentStatus}
                </span>
              </div>
              
              <div className="text-sm text-gray-600">
                {order.items.length} {order.items.length === 1 ? 'item' : 'items'} · 
                {formatCurrency(order.totalAmount)}
              </div>
              
              {order.scheduledFor && (
                <div className="text-sm text-gray-500 mt-1">
                  Scheduled for: {format(order.scheduledFor, 'PPp')}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};