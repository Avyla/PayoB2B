'use client';
import React, { useState, useRef, useEffect } from 'react';

export interface DropdownOption {
  value: string;
  label: string;
}

interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  className?: string;
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Seleccionar...',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside, { passive: true });
    return () => document.removeEventListener('mousedown', handleClickOutside, { passive: true } as EventListenerOptions);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        className="w-full bg-transparent border border-slate-200 rounded-md text-sm px-3 py-2 font-medium text-slate-700 text-left hover:bg-slate-50 hover:border-slate-300 focus:bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none transition-all flex justify-between items-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate mr-2">
          {selectedOption ? selectedOption.label : <span className="text-slate-400">{placeholder}</span>}
        </span>
        <svg className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-[60] mt-1 left-0 w-full sm:min-w-[240px] max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          <ul className="max-h-60 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-slate-300">
            {options.length > 0 ? (
              options.map((option) => (
                <li key={option.value}>
                  <button
                    type="button"
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      value === option.value
                        ? 'bg-slate-100 text-slate-900 font-bold'
                        : 'text-slate-700 hover:bg-slate-50 font-medium'
                    }`}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                  >
                    <span className="block truncate">{option.label}</span>
                  </button>
                </li>
              ))
            ) : (
              <li className="px-4 py-3 text-sm text-slate-500 italic text-center">
                No hay opciones disponibles
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
