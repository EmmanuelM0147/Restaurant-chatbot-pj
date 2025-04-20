import React, { useState, useRef, useEffect } from 'react';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { useAuth } from '../../context/AuthContext';
import { useOrder } from '../../context/OrderContext';
import { v4 as uuidv4 } from 'uuid';
import type { Message } from '../../types';
import { processUserMessage } from '../../utils/chatbot';

const WELCOME_MESSAGE = `Welcome to FoodChat! Choose an option:

1️⃣ Place a new order
9️⃣9️⃣ Checkout current order
9️⃣8️⃣ View order history
9️⃣7️⃣ View current order
0️⃣ Cancel order`;

export const ChatContainer: React.FC = () => {
  const { user } = useAuth();
  const { currentOrder } = useOrder();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Add initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: uuidv4(),
        content: WELCOME_MESSAGE,
        sender: 'bot',
        timestamp: new Date(),
        type: 'text'
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  // Scroll to bottom when messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleUserMessage = async (content: string) => {
    if (!content.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: uuidv4(),
      content,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };
    
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    
    try {
      // Show typing indicator
      setTimeout(async () => {
        // Process the message to get bot response
        const botResponses = await processUserMessage(content, user, currentOrder);
        
        // Add bot responses
        const newMessages = botResponses.map(response => ({
          id: uuidv4(),
          ...response,
          sender: 'bot' as const,
          timestamp: new Date()
        }));
        
        setMessages(prev => [...prev, ...newMessages]);
        setLoading(false);
      }, 500); // Simulate typing delay
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: uuidv4(),
        content: "Sorry, I'm having trouble processing your request right now. Please try again later.",
        sender: 'bot',
        timestamp: new Date(),
        type: 'text'
      };
      
      setMessages(prev => [...prev, errorMessage]);
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col rounded-lg bg-white shadow-md overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4">
        <MessageList messages={messages} />
        {loading && (
          <div className="flex items-center mt-2 text-gray-500 typing-animation p-3 rounded-lg bg-gray-100 w-24 ml-2">
            <span className="h-2 w-2 bg-gray-500 rounded-full mr-1"></span>
            <span className="h-2 w-2 bg-gray-500 rounded-full mr-1"></span>
            <span className="h-2 w-2 bg-gray-500 rounded-full"></span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="border-t border-gray-200 p-4">
        <ChatInput onSendMessage={handleUserMessage} isLoading={loading} />
      </div>
    </div>
  );
};