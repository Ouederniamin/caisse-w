'use client';

import React, { useState, useEffect } from 'react';

interface MatriculeInputProps {
  value?: string;
  onChange: (fullMatricule: string) => void;
  className?: string;
  placeholder?: string;
}

/**
 * License plate style input for Tunisian matricules
 * Matches the mobile app design: black background, white text, white border
 * Format: XXX تونس XXXX (3 digits left, "تونس" center, 4 digits right)
 */
export default function MatriculeInput({ 
  value = '', 
  onChange, 
  className = '',
  placeholder = ''
}: MatriculeInputProps) {
  const [serieNumber, setSerieNumber] = useState('');
  const [uniqueNumber, setUniqueNumber] = useState('');

  // Parse existing value on mount or when value changes
  useEffect(() => {
    if (value) {
      const parts = value.match(/(\d{2,3})\s*تونس\s*(\d{3,4})/);
      if (parts) {
        setSerieNumber(parts[1]);
        setUniqueNumber(parts[2]);
      } else {
        // Try to parse digits only
        const digits = value.replace(/[^0-9]/g, '');
        if (digits.length >= 7) {
          setSerieNumber(digits.slice(0, 3));
          setUniqueNumber(digits.slice(-4));
        }
      }
    }
  }, [value]);

  const handleSerieChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, 3);
    setSerieNumber(cleaned);
    updateParent(cleaned, uniqueNumber);
  };

  const handleUniqueChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, 4);
    setUniqueNumber(cleaned);
    updateParent(serieNumber, cleaned);
  };

  const updateParent = (serie: string, unique: string) => {
    if (serie || unique) {
      const fullMatricule = `${serie} تونس ${unique}`;
      onChange(fullMatricule);
    } else {
      onChange('');
    }
  };

  return (
    <div className={`inline-flex items-center ${className}`}>
      {/* License plate container */}
      <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-1 shadow-lg">
        <div className="flex items-center justify-between gap-2 bg-black border-[3px] border-white rounded-md px-3 py-2 min-w-[280px]">
          {/* Left input - 3 digits */}
          <input
            type="text"
            inputMode="numeric"
            value={serieNumber}
            onChange={(e) => handleSerieChange(e.target.value)}
            maxLength={3}
            placeholder={placeholder ? "123" : ""}
            className="w-16 bg-transparent text-white text-2xl font-bold text-center outline-none placeholder-gray-500"
            style={{ fontFamily: 'monospace' }}
          />
          
          {/* Center - Arabic text */}
          <span 
            className="text-white text-xl font-bold tracking-wider px-2"
            style={{ fontFamily: 'Arial, sans-serif' }}
          >
            تونس
          </span>
          
          {/* Right input - 4 digits */}
          <input
            type="text"
            inputMode="numeric"
            value={uniqueNumber}
            onChange={(e) => handleUniqueChange(e.target.value)}
            maxLength={4}
            placeholder={placeholder ? "4567" : ""}
            className="w-20 bg-transparent text-white text-2xl font-bold text-center outline-none placeholder-gray-500"
            style={{ fontFamily: 'monospace' }}
          />
        </div>
      </div>
    </div>
  );
}
