import React from 'react';
import { format } from 'date-fns';
import { UserCircle, Bot } from 'lucide-react';
import type { Message } from '../../types';

type MessageBubbleProps = {
  message: Message;
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  
  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} message-enter message-enter-active`}
    >
      {!isUser && (
        <div className="mr-2 flex-shrink-0">
          <Bot className="h-8 w-8 rounded-full bg-primary/10 p-1 text-primary" />
        </div>
      )}
      
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-primary text-white'
            : 'bg-gray-100 text-gray-800'
        }`}
      >
        {typeof message.content === 'string' ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          message.content
        )}
        
        <div
          className={`mt-1 text-xs ${
            isUser ? 'text-primary-light' : 'text-gray-500'
          }`}
        >
          {format(message.timestamp, 'h:mm a')}
        </div>
      </div>
      
      {isUser && (
        <div className="ml-2 flex-shrink-0">
          <UserCircle className="h-8 w-8 rounded-full bg-primary/10 p-1 text-primary" />
        </div>
      )}
    </div>
  );
};