import React from 'react';
import { MessageBubble } from './MessageBubble';
import { OrderSummary } from '../order/OrderSummary';
import { PaymentCard } from '../payment/PaymentCard';
import { OrderHistoryCard } from '../order/OrderHistoryCard';
import type { Message } from '../../types';

type MessageListProps = {
  messages: Message[];
};

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  return (
    <div className="space-y-4">
      {messages.map((message) => {
        // Determine content based on message type
        let content;
        
        switch (message.type) {
          case 'order':
            content = <OrderSummary order={message.data} />;
            break;
          case 'payment':
            content = <PaymentCard paymentInfo={message.data} />;
            break;
          case 'history':
            content = <OrderHistoryCard orders={message.data} />;
            break;
          default:
            content = message.content;
        }
        
        return (
          <MessageBubble
            key={message.id}
            message={{
              ...message,
              content: content,
            }}
          />
        );
      })}
    </div>
  );
};