import React, { useState } from 'react';
import { SendHorizonal, Paperclip, Mic } from 'lucide-react';

type ChatInputProps = {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
};

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (message.trim() && !isLoading) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end space-x-2">
      <div className="flex-1 relative">
        <textarea
          className="input min-h-[50px] w-full resize-none py-3 pr-10"
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          disabled={isLoading}
          rows={1}
        />
      </div>
      
      <button
        type="submit"
        className="btn-primary h-10 w-10 rounded-full flex items-center justify-center p-0"
        disabled={!message.trim() || isLoading}
      >
        <SendHorizonal className="h-5 w-5" />
      </button>
    </form>
  );
};