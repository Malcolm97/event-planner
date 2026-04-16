'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { PNG_LOCATIONS } from '@/lib/eventForm';

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  id?: string;
}

const MAX_SUGGESTIONS = 8;

export default function LocationAutocomplete({
  value,
  onChange,
  error,
  required,
  id: externalId,
}: LocationAutocompleteProps) {
  const generatedId = useId();
  const inputId = externalId ?? generatedId;
  const listId = `${inputId}-list`;

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const suggestions = value.trim().length > 0
    ? PNG_LOCATIONS.filter((loc) =>
        loc.town.toLowerCase().includes(value.toLowerCase()) ||
        loc.province.toLowerCase().includes(value.toLowerCase()),
      ).slice(0, MAX_SUGGESTIONS)
    : [];

  const showDropdown = open && suggestions.length > 0;

  const selectSuggestion = useCallback(
    (town: string) => {
      onChange(town);
      setOpen(false);
      setActiveIndex(-1);
      inputRef.current?.focus();
    },
    [onChange],
  );

  // Close when clicking outside.
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) {
      if (e.key === 'ArrowDown' && suggestions.length > 0) {
        setOpen(true);
        setActiveIndex(0);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((i) => (i <= 0 ? -1 : i - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && suggestions[activeIndex]) {
          selectSuggestion(suggestions[activeIndex].town);
        }
        break;
      case 'Escape':
        setOpen(false);
        setActiveIndex(-1);
        break;
      case 'Tab':
        setOpen(false);
        setActiveIndex(-1);
        break;
    }
  };

  // Scroll active item into view.
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const item = listRef.current.children[activeIndex] as HTMLElement | undefined;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  const baseInputClass = 'input-field w-full';
  const errorInputClass = 'border-red-500 focus:ring-red-500';

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        id={inputId}
        type="text"
        role="combobox"
        aria-expanded={showDropdown}
        aria-autocomplete="list"
        aria-controls={listId}
        aria-activedescendant={activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined}
        className={`${baseInputClass} ${error ? errorInputClass : ''}`}
        placeholder="Type a town, suburb or area name…"
        value={value}
        required={required}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => {
          if (value.trim()) setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />

      {showDropdown && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label="Location suggestions"
          className="absolute z-30 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg max-h-56 overflow-y-auto py-1"
        >
          {suggestions.map((loc, i) => (
            <li
              key={`${loc.town}-${loc.province}`}
              id={`${listId}-option-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              className={`flex items-center justify-between px-4 py-2.5 cursor-pointer text-sm select-none ${
                i === activeIndex
                  ? 'bg-yellow-50 text-gray-900'
                  : 'text-gray-800 hover:bg-gray-50'
              }`}
              onMouseDown={(e) => {
                // Prevent input blur before click registers.
                e.preventDefault();
                selectSuggestion(loc.town);
              }}
            >
              <span className="font-medium">{loc.town}</span>
              <span className="text-xs text-gray-400 ml-2">{loc.province}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
