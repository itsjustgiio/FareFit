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
  const [inputMode, setInputMode] = useState<'type' | 'dropdown'>('type');
  
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

  // Generate dropdown options
  const monthOptions = [
    { value: '', label: 'Month' },
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  const dayOptions = [
    { value: '', label: 'Day' },
    ...Array.from({ length: 31 }, (_, i) => ({
      value: (i + 1).toString().padStart(2, '0'),
      label: (i + 1).toString()
    }))
  ];

  const currentYear = new Date().getFullYear();
  const yearOptions = [
    { value: '', label: 'Year' },
    ...Array.from({ length: 120 }, (_, i) => {
      const year = currentYear - i;
      return { value: year.toString(), label: year.toString() };
    })
  ];

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      {/* Mode Toggle */}
      <div className="inline-flex items-center bg-white rounded-lg p-1 shadow-sm border border-gray-200 mb-3">
        <button
          onClick={() => setInputMode('type')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            inputMode === 'type' 
              ? 'bg-[#A8E6CF] text-[#102A43] shadow-sm' 
              : 'text-gray-600 hover:text-[#102A43]'
          }`}
        >
          Type
        </button>
        <button
          onClick={() => setInputMode('dropdown')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            inputMode === 'dropdown' 
              ? 'bg-[#A8E6CF] text-[#102A43] shadow-sm' 
              : 'text-gray-600 hover:text-[#102A43]'
          }`}
        >
          Select
        </button>
      </div>

      {inputMode === 'type' ? (
        /* Manual Input Mode */
        <div className="inline-flex items-center justify-center gap-2 p-4 rounded-2xl bg-white/50 backdrop-blur-sm border border-white/20 shadow-lg">
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
              className={`w-14 h-12 text-center text-lg font-bold rounded-lg border-2 outline-none transition-all duration-300 bg-white ${
                focused === 'month' 
                  ? 'border-[#A8E6CF] shadow-lg scale-105' 
                  : 'border-gray-200 hover:border-[#A8E6CF] hover:shadow-md'
              }`}
              style={{ color: '#102A43' }}
              maxLength={2}
            />
          </div>

          <span className="text-lg font-medium" style={{ color: '#102A43', opacity: 0.5 }}>/</span>

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
              className={`w-14 h-12 text-center text-lg font-bold rounded-lg border-2 outline-none transition-all duration-300 bg-white ${
                focused === 'day' 
                  ? 'border-[#A8E6CF] shadow-lg scale-105' 
                  : 'border-gray-200 hover:border-[#A8E6CF] hover:shadow-md'
              }`}
              style={{ color: '#102A43' }}
              maxLength={2}
            />
          </div>

          <span className="text-lg font-medium" style={{ color: '#102A43', opacity: 0.5 }}>/</span>

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
              className={`w-20 h-12 text-center text-lg font-bold rounded-lg border-2 outline-none transition-all duration-300 bg-white ${
                focused === 'year' 
                  ? 'border-[#A8E6CF] shadow-lg scale-105' 
                  : 'border-gray-200 hover:border-[#A8E6CF] hover:shadow-md'
              }`}
              style={{ color: '#102A43' }}
              maxLength={4}
            />
          </div>
        </div>
      ) : (
        /* Dropdown Mode */
        <div className="inline-flex items-center justify-center gap-2 p-4 rounded-2xl bg-white/50 backdrop-blur-sm border border-white/20 shadow-lg">
          {/* Month Dropdown */}
          <div className="relative">
            <select
              value={month}
              onChange={(e) => {
                setMonth(e.target.value);
                validateAndUpdate(e.target.value, day, year);
              }}
              className="w-32 h-12 text-sm font-medium rounded-lg border-2 outline-none transition-all duration-300 bg-white appearance-none cursor-pointer hover:border-[#A8E6CF] hover:shadow-md pl-3 pr-8"
              style={{ 
                color: '#102A43',
                borderColor: '#A8E6CF'
              }}
            >
              {monthOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

          </div>

          {/* Day Dropdown */}
          <div className="relative">
            <select
              value={day}
              onChange={(e) => {
                setDay(e.target.value);
                validateAndUpdate(month, e.target.value, year);
              }}
              className="w-16 h-12 text-sm font-medium rounded-lg border-2 outline-none transition-all duration-300 bg-white cursor-pointer hover:border-[#A8E6CF] hover:shadow-md pl-3 pr-2"
              style={{ 
                color: '#102A43',
                borderColor: '#A8E6CF'
              }}
            >
              {dayOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Year Dropdown */}
          <div className="relative">
            <select
              value={year}
              onChange={(e) => {
                setYear(e.target.value);
                validateAndUpdate(month, day, e.target.value);
              }}
              className="w-20 h-12 text-sm font-medium rounded-lg border-2 outline-none transition-all duration-300 bg-white appearance-none cursor-pointer hover:border-[#A8E6CF] hover:shadow-md pl-3 pr-6"
              style={{ 
                color: '#102A43',
                borderColor: '#A8E6CF'
              }}
            >
              {yearOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}