import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import { addDays, setHours, setMinutes, format } from 'date-fns';
import { Calendar, Clock } from 'lucide-react';
import "react-datepicker/dist/react-datepicker.css";

interface DeliverySchedulerProps {
  orderId: string;
  onSchedule: (scheduledTime: Date) => Promise<void>;
  initialDate?: Date;
  disabled?: boolean;
}

export const DeliveryScheduler: React.FC<DeliverySchedulerProps> = ({
  orderId,
  onSchedule,
  initialDate,
  disabled = false,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(initialDate || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set up available time slots (9 AM - 9 PM)
  const filterTime = (time: Date) => {
    const hour = time.getHours();
    return hour >= 9 && hour <= 21;
  };

  // Set minimum date to today and maximum date to 14 days from now
  const minDate = new Date();
  const maxDate = addDays(new Date(), 14);

  const handleSchedule = async () => {
    if (!selectedDate) return;

    try {
      setLoading(true);
      setError(null);
      await onSchedule(selectedDate);
    } catch (err) {
      setError('Failed to schedule delivery. Please try again.');
      console.error('Scheduling error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Schedule Delivery</h3>
        {orderId && (
          <span className="text-sm text-gray-500">
            Order #{orderId.substring(0, 8)}
          </span>
        )}
      </div>

      <div className="space-y-4">
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Date & Time
          </label>
          <div className="relative">
            <DatePicker
              selected={selectedDate}
              onChange={setSelectedDate}
              showTimeSelect
              timeIntervals={60}
              filterTime={filterTime}
              minDate={minDate}
              maxDate={maxDate}
              dateFormat="MMMM d, yyyy h:mm aa"
              className="input pl-10 w-full"
              placeholderText="Select delivery time"
              disabled={disabled || loading}
            />
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500 flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            Available: 9:00 AM - 9:00 PM
          </div>
          <button
            onClick={handleSchedule}
            disabled={!selectedDate || disabled || loading}
            className="btn btn-primary"
          >
            {loading ? 'Scheduling...' : 'Schedule Delivery'}
          </button>
        </div>
      </div>
    </div>
  );
};