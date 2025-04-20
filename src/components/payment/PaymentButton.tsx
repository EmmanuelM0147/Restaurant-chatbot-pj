import React, { useState } from 'react';
import { useOrder } from '../../context/OrderContext';
import { useSessionContext } from '../../context/SessionContext';
import { CreditCard, Loader2 } from 'lucide-react';
import axios from 'axios';

interface PaymentButtonProps {
  orderId: string;
  amount: number;
  onSuccess: () => void;
  onError: (error: Error) => void;
}

export const PaymentButton: React.FC<PaymentButtonProps> = ({
  orderId,
  amount,
  onSuccess,
  onError,
}) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);
  const { session } = useSessionContext();

  const handlePayment = async () => {
    try {
      setLoading(true);

      const storedEmail = localStorage.getItem('user_email');
      if (!storedEmail && !showEmailInput) {
        setShowEmailInput(true);
        setLoading(false);
        return;
      }

      const paymentEmail = storedEmail || email;
      if (!paymentEmail) {
        throw new Error('Email is required');
      }

      // Save email for future use
      if (!storedEmail && email) {
        localStorage.setItem('user_email', email);
      }

      // Initialize payment
      const response = await axios.post('/api/payment/initialize', {
        orderId,
        amount: Math.round(amount * 100), // Convert to kobo
        email: paymentEmail,
      });

      // Redirect to Paystack checkout
      window.location.href = response.data.authorization_url;
    } catch (err) {
      console.error('Payment initialization failed:', err);
      onError(err instanceof Error ? err : new Error('Payment initialization failed'));
    } finally {
      setLoading(false);
    }
  };

  if (showEmailInput) {
    return (
      <div className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Enter your email to continue
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
            placeholder="your@email.com"
            required
          />
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handlePayment}
            disabled={!email || loading}
            className="btn btn-primary flex-1"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <CreditCard className="mr-2 h-5 w-5" />
                Continue to Payment
              </>
            )}
          </button>
          <button
            onClick={() => setShowEmailInput(false)}
            className="btn btn-outline"
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className="btn btn-primary w-full"
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <>
          <CreditCard className="mr-2 h-5 w-5" />
          Pay ₦{amount.toLocaleString()}
        </>
      )}
    </button>
  );
};