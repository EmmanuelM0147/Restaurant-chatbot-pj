import React, { useState } from 'react';
import { CreditCard } from 'lucide-react';
import type { PaymentInfo } from '../../types';
import { formatCurrency } from '../../utils/menu';

type PaymentCardProps = {
  paymentInfo: PaymentInfo;
};

export const PaymentCard: React.FC<PaymentCardProps> = ({ paymentInfo }) => {
  const [email, setEmail] = useState('');

  const handlePayment = () => {
    if (!email) return;
    
    // Store email for future use
    localStorage.setItem('userEmail', email);
    
    // Redirect to Paystack checkout
    window.location.href = paymentInfo.authorization_url!;
  };

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <CreditCard className="h-5 w-5 text-primary" />
          <h3 className="font-medium text-gray-900">Payment</h3>
        </div>
      </div>
      
      <div className="p-4">
        <div className="mb-4">
          <p className="text-gray-700 font-medium">
            Total: {formatCurrency(paymentInfo.amount)}
          </p>
          <p className="text-sm text-gray-500">
            Order: #{paymentInfo.orderId.substring(0, 8)}
          </p>
        </div>
        
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Enter your email"
            required
          />
        </div>
        
        <button
          onClick={handlePayment}
          disabled={!email}
          className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark disabled:opacity-50"
        >
          Pay {formatCurrency(paymentInfo.amount)}
        </button>
      </div>
    </div>
  );
};