import React, { useState, useRef, useEffect } from 'react';

interface DateInputProps {
  value?: string;
  onChange: (date: string) => void;
  onValidationChange?: (isValid: boolean, error?: string) => void;
  placeholder?: string;
  className?: string;
  minDate?: string;
  maxDate?: string;
  required?: boolean;
}

export function DateInput({
  value = '',
  onChange,
  onValidationChange,
  placeholder = 'MM/DD/YYYY',
  className = '',
  minDate,
  maxDate,
  required = false
}: DateInputProps) {
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [year, setYear] = useState('');
  const [focused, setFocused] = useState<'month' | 'day' | 'year' | null>(null);
  
  const monthRef = useRef<HTMLInputElement>(null);
  const dayRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);

  // Initialize from value prop
  useEffect(() => {
    if (value && value.includes('-')) {
      // Parse YYYY-MM-DD format directly to avoid timezone issues
      const [y, m, d] = value.split('-');
      if (y && m && d) {
        setYear(y);
        setMonth(m);
        setDay(d);
      }
    }
  }, [value]);

  const validateAndUpdate = (m: string, d: string, y: string) => {
    // Only validate if all fields have values
    if (!m || !d || !y) {
      onValidationChange?.(false);
      return;
    }

    // Check basic format
    const monthNum = parseInt(m);
    const dayNum = parseInt(d);
    const yearNum = parseInt(y);

    if (monthNum < 1 || monthNum > 12) {
      onValidationChange?.(false, 'Invalid month');
      return;
    }

    if (dayNum < 1 || dayNum > 31) {
      onValidationChange?.(false, 'Invalid day');
      return;
    }

    if (y.length !== 4 || yearNum < 1900 || yearNum > new Date().getFullYear()) {
      onValidationChange?.(false, 'Invalid year');
      return;
    }

    // Create date and check if it's valid (use local time to avoid timezone issues)
    const date = new Date(yearNum, monthNum - 1, dayNum);
    if (date.getMonth() !== monthNum - 1 || date.getDate() !== dayNum) {
      onValidationChange?.(false, 'Invalid date');
      return;
    }

    // Check min/max dates if provided
    const dateString = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    
    if (minDate && dateString < minDate) {
      onValidationChange?.(false, 'Date is too early');
      return;
    }

    if (maxDate && dateString > maxDate) {
      onValidationChange?.(false, 'Date is too late');
      return;
    }

    // All good!
    onValidationChange?.(true);
    onChange(dateString);
  };

  const handleMonthChange = (newMonth: string) => {
    // Only allow 2 digits max
    if (newMonth.length > 2) return;
    
    setMonth(newMonth);
    
    // Auto-advance to day when month is complete
    if (newMonth.length === 2) {
      dayRef.current?.focus();
    }
    
    validateAndUpdate(newMonth, day, year);
  };

  const handleDayChange = (newDay: string) => {
    // Only allow 2 digits max
    if (newDay.length > 2) return;
    
    setDay(newDay);
    
    // Auto-advance to year when day is complete
    if (newDay.length === 2) {
      yearRef.current?.focus();
    }
    
    validateAndUpdate(month, newDay, year);
  };

  const handleYearChange = (newYear: string) => {
    // Only allow 4 digits max
    if (newYear.length > 4) return;
    
    setYear(newYear);
    validateAndUpdate(month, day, newYear);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    type: 'month' | 'day' | 'year'
  ) => {
    // Allow: backspace, delete, tab, escape, enter, arrow keys
    if ([8, 9, 27, 13, 37, 39, 38, 40, 46].includes(e.keyCode)) {
      return;
    }
    
    // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if ((e.ctrlKey || e.metaKey) && [65, 67, 86, 88].includes(e.keyCode)) {
      return;
    }
    
    // Ensure that it's a number
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault();
    }

    // Backspace navigation
    if (e.keyCode === 8) { // Backspace
      const target = e.target as HTMLInputElement;
      if (target.value === '' || target.selectionStart === 0) {
        if (type === 'day' && monthRef.current) {
          monthRef.current.focus();
        } else if (type === 'year' && dayRef.current) {
          dayRef.current.focus();
        }
      }
    }
  };

  return (
    <div className={`inline-flex items-center justify-center gap-4 p-6 rounded-2xl bg-white/50 backdrop-blur-sm border border-white/20 shadow-lg ${className}`}>
      {/* Month */}
      <div className="relative">
        <input
          ref={monthRef}
          type="text"
          value={month}
          onChange={(e) => handleMonthChange(e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, 'month')}
          onFocus={() => setFocused('month')}
          onBlur={() => setFocused(null)}
          placeholder="MM"
          className={`w-16 h-16 text-center text-2xl font-bold rounded-xl border-2 outline-none transition-all duration-300 bg-white/70 backdrop-blur-sm ${
            focused === 'month' 
              ? 'border-[#A8E6CF] shadow-lg scale-105 bg-white' 
              : 'border-gray-200 hover:border-[#A8E6CF] hover:shadow-md'
          }`}
          style={{ color: '#102A43' }}
          maxLength={2}
        />
      </div>

      {/* Day */}
      <div className="relative">
        <input
          ref={dayRef}
          type="text"
          value={day}
          onChange={(e) => handleDayChange(e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, 'day')}
          onFocus={() => setFocused('day')}
          onBlur={() => setFocused(null)}
          placeholder="DD"
          className={`w-16 h-16 text-center text-2xl font-bold rounded-xl border-2 outline-none transition-all duration-300 bg-white/70 backdrop-blur-sm ${
            focused === 'day' 
              ? 'border-[#A8E6CF] shadow-lg scale-105 bg-white' 
              : 'border-gray-200 hover:border-[#A8E6CF] hover:shadow-md'
          }`}
          style={{ color: '#102A43' }}
          maxLength={2}
        />
      </div>

      {/* Year */}
      <div className="relative">
        <input
          ref={yearRef}
          type="text"
          value={year}
          onChange={(e) => handleYearChange(e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, 'year')}
          onFocus={() => setFocused('year')}
          onBlur={() => setFocused(null)}
          placeholder="YYYY"
          className={`w-20 h-16 text-center text-2xl font-bold rounded-xl border-2 outline-none transition-all duration-300 bg-white/70 backdrop-blur-sm ${
            focused === 'year' 
              ? 'border-[#A8E6CF] shadow-lg scale-105 bg-white' 
              : 'border-gray-200 hover:border-[#A8E6CF] hover:shadow-md'
          }`}
          style={{ color: '#102A43' }}
          maxLength={4}
        />
      </div>
    </div>
  );
}