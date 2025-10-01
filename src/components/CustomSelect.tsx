"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  icon?: string;
  disabled?: boolean;
}

interface CustomSelectProps {
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  searchable?: boolean;
  className?: string;
  required?: boolean;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function CustomSelect({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  label,
  disabled = false,
  searchable = false,
  className = "",
  required = false,
  error,
  size = 'md'
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  // Get selected option
  const selectedOption = options.find(option => option.value === value);

  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-4 py-4 text-lg'
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleOptionClick = (option: SelectOption) => {
    if (!option.disabled) {
      onChange(option.value);
      setIsOpen(false);
    }
  };

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div ref={selectRef} className="relative">
        {/* Trigger Button */}
        <button
          type="button"
          onClick={toggleDropdown}
          disabled={disabled}
          className={`
            w-full ${sizeClasses[size]} text-left bg-white border border-gray-300 rounded-lg
            flex items-center justify-between
            ${disabled ? 'cursor-not-allowed opacity-50 bg-gray-50' : 'cursor-pointer hover:border-gray-400 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20'}
            transition-colors duration-200
          `}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span className={`truncate ${selectedOption ? 'text-gray-900' : 'text-gray-500'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            size={16}
            className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleOptionClick(option)}
                disabled={option.disabled}
                className={`
                  w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none
                  ${option.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  ${option.value === value ? 'bg-yellow-50 text-yellow-800 font-medium' : 'text-gray-900'}
                  transition-colors duration-150
                `}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
