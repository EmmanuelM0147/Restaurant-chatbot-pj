import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

type InputFormProps = {
  onSubmit: (value: string) => void;
  isLoading: boolean;
};

export const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading }) => {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input is a number
    if (!/^\d+$/.test(value)) {
      setError('Please enter a valid number');
      return;
    }

    onSubmit(value);
    setValue('');
    setError('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError('');
          }}
          className={`flex-1 px-4 py-2 border rounded-lg ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter an option number..."
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !value}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            'Send'
          )}
        </button>
      </div>
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
    </form>
  );
};