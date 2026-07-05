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
  minDate?: Date | null;
  maxDate?: Date | null;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  selected,
  onChange,
  placeholderText = "Seleccionar fecha",
  showTimeSelect = true,
  minDate,
  maxDate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLElement>(null);

  // Temporary state for when the popover is open
  const [tempSelected, setTempSelected] = useState<Date | null>(selected);
  const [tempTime, setTempTime] = useState(
    selected 
      ? `${String(selected.getHours()).padStart(2, '0')}:${String(selected.getMinutes()).padStart(2, '0')}` 
      : '00:00'
  );

  // We no longer sync `tempSelected` and `tempTime` on every `selected` prop change
  // using an effect (which causes unnecessary re-renders). Instead, they are
  // initialized cleanly inside `handleOpen` right before the popover appears.

  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const popoverHeight = 380; // Estimated height of calendar + time + button
      const spaceBelow = window.innerHeight - rect.bottom;
      
      let top = rect.bottom + window.scrollY + 8;
      
      // Flip logic: if not enough space below, and enough space above (or just more space above), flip it!
      if (spaceBelow < popoverHeight && rect.top > spaceBelow) {
        top = rect.top + window.scrollY - popoverHeight - 8;
      }

      setCoords({
        top,
        left: rect.left + window.scrollX,
      });
    }
  };

  const handleOpen = () => {
    setTempSelected(selected);
    setTempTime(
      selected 
        ? `${String(selected.getHours()).padStart(2, '0')}:${String(selected.getMinutes()).padStart(2, '0')}` 
        : '00:00'
    );
    if (!isOpen) {
      updatePosition();
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
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', updatePosition, { capture: true, passive: true });
      window.addEventListener('resize', updatePosition, { passive: true });
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', updatePosition, { capture: true } as EventListenerOptions);
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
      
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      
      if (showTimeSelect && tempTime) {
        const [hours, minutes] = tempTime.split(':').map(Number);
        date.setHours(hours, minutes, 0, 0);
      } else {
        date.setHours(0, 0, 0, 0);
      }
      
      setTempSelected(date);
      
      // If we don't show time select, we apply immediately
      if (!showTimeSelect) {
        onChange(date);
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
  }, [showTimeSelect, tempTime, onChange, isOpen]);

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setTempTime(newTime);
    if (tempSelected) {
      const newDate = new Date(tempSelected);
      const [hours, minutes] = newTime.split(':').map(Number);
      newDate.setHours(hours, minutes, 0, 0);
      setTempSelected(newDate);
    }
  };

  const handleApply = () => {
    if (tempSelected) {
      onChange(tempSelected);
    }
    setIsOpen(false);
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

  const getLocalFormattedDate = (d: Date | null | undefined) => {
    if (!d) return undefined;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="w-full sm:w-48 bg-transparent border border-slate-200 rounded-md text-sm px-3 py-2 font-medium text-slate-700 text-left hover:bg-slate-50 hover:border-slate-300 focus:bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none transition-all flex justify-between items-center"
        onClick={handleOpen}
      >
        {selected ? formatDate(selected) : <span className="text-slate-400 font-normal">{placeholderText}</span>}
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
          className="bg-white border border-slate-200 shadow-lg rounded-lg p-3 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-150 min-w-max max-h-[50vh] overflow-y-auto"
        >
          <calendar-date
            ref={calendarRef}
            value={getLocalFormattedDate(tempSelected)}
            min={getLocalFormattedDate(minDate)}
            max={getLocalFormattedDate(maxDate)}
            locale="es"
            className="text-sm font-medium"
            style={{
              '--color-accent': '#0f172a',
              '--color-text-on-accent': '#ffffff',
            } as any}
          >
            <svg aria-label="Previous" slot="previous" className="w-4 h-4 text-slate-500 hover:text-slate-800 cursor-pointer" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m15 18l-6-6l6-6"/></svg>
            <svg aria-label="Next" slot="next" className="w-4 h-4 text-slate-500 hover:text-slate-800 cursor-pointer" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m9 18l6-6l-6-6"/></svg>
            <calendar-month></calendar-month>
          </calendar-date>
          
          {showTimeSelect && (
            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Hora</span>
              <input 
                type="time" 
                value={tempTime}
                onChange={handleTimeChange}
                className="bg-transparent border border-slate-200 rounded-md px-2 py-1 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>
          )}
          
          {showTimeSelect && (
            <button
              type="button"
              onClick={handleApply}
              className="mt-1 w-full bg-slate-900 text-white rounded-md py-2 text-sm font-bold hover:bg-slate-800 transition-colors shrink-0"
            >
              Aplicar Fecha y Hora
            </button>
          )}
        </div>,
        document.body
      )}
    </>
  );
};
