import React, { useEffect, useRef } from 'react';
import type { Message } from '../types';
import { format } from 'date-fns';

type MessageListProps = {
  messages: Message[];
};

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`p-3 rounded-lg ${
            message.type === 'user'
              ? 'bg-blue-500 text-white ml-auto'
              : message.type === 'error'
              ? 'bg-red-100 text-red-700'
              : 'bg-gray-100'
          } max-w-[80%] ${message.type === 'user' ? 'ml-auto' : ''}`}
        >
          <pre className="whitespace-pre-wrap font-sans">{message.content}</pre>
          <div className="text-xs mt-1 opacity-70">
            {format(message.timestamp, 'HH:mm')}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
};