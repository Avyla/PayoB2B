'use client';
import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import 'cally';

interface CustomDatePickerProps {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  placeholderText?: string;
  className?: string;
  showTimeSelect?: boolean;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  selected,
  onChange,
  placeholderText = "Seleccionar fecha",
  showTimeSelect = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLElement>(null);

  const [time, setTime] = useState(
    selected 
      ? `${String(selected.getHours()).padStart(2, '0')}:${String(selected.getMinutes()).padStart(2, '0')}` 
      : '00:00'
  );

  const handleOpen = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
      });
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    
    // Also update position on resize or scroll if open
    const updatePosition = () => {
      if (buttonRef.current && isOpen) {
        const rect = buttonRef.current.getBoundingClientRect();
        setCoords({
          top: rect.bottom + window.scrollY + 8,
          left: rect.left + window.scrollX,
        });
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  // Handle custom event for Cally
  useEffect(() => {
    const currentCalendar = calendarRef.current;
    
    const handleDateChange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const dateStr = target.value;
      if (!dateStr) return;
      
      const date = new Date(dateStr);
      // Adjust for timezone offset to avoid previous day bug
      date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
      
      if (showTimeSelect && time) {
        const [hours, minutes] = time.split(':').map(Number);
        date.setHours(hours, minutes, 0, 0);
      } else {
        date.setHours(0, 0, 0, 0);
      }
      
      onChange(date);
      if (!showTimeSelect) {
        setIsOpen(false);
      }
    };

    if (currentCalendar) {
      currentCalendar.addEventListener('change', handleDateChange);
    }
    return () => {
      if (currentCalendar) {
        currentCalendar.removeEventListener('change', handleDateChange);
      }
    };
  }, [showTimeSelect, time, onChange]);

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setTime(newTime);
    if (selected) {
      const newDate = new Date(selected);
      const [hours, minutes] = newTime.split(':').map(Number);
      newDate.setHours(hours, minutes, 0, 0);
      onChange(newDate);
    }
  };

  const formatDate = (d: Date) => {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    if (showTimeSelect) {
      return `${day}/${month}/${year} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
    return `${day}/${month}/${year}`;
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="w-full sm:w-48 bg-slate-50 border border-slate-300 rounded-lg text-sm p-2 font-medium text-slate-800 text-left hover:bg-white focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all flex justify-between items-center"
        onClick={handleOpen}
      >
        {selected ? formatDate(selected) : <span className="text-slate-400">{placeholderText}</span>}
        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>

      {isOpen && typeof window !== 'undefined' && createPortal(
        <div
          ref={popoverRef}
          style={{
            position: 'absolute',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            zIndex: 99999,
          }}
          className="bg-white border border-slate-200 shadow-xl rounded-xl p-3 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-200 min-w-max"
        >
          <calendar-date
            ref={calendarRef}
            value={selected ? selected.toISOString().split('T')[0] : undefined}
            locale="es"
          >
            <svg aria-label="Previous" slot="previous" className="w-4 h-4 text-slate-500 hover:text-slate-800 cursor-pointer" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m15 18l-6-6l6-6"/></svg>
            <svg aria-label="Next" slot="next" className="w-4 h-4 text-slate-500 hover:text-slate-800 cursor-pointer" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m9 18l6-6l-6-6"/></svg>
            <calendar-month></calendar-month>
          </calendar-date>
          
          {showTimeSelect && (
            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-sm font-medium text-slate-700">Hora</span>
              <input 
                type="time" 
                value={time}
                onChange={handleTimeChange}
                className="bg-slate-50 border border-slate-300 rounded-md p-1.5 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
};
