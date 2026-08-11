import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: string;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  ariaLabel,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (optValue: string | number) => {
    onChange(optValue);
    setIsOpen(false);
  };

  return (
    <div 
      ref={containerRef} 
      className={`relative w-full text-left select-none ${isOpen ? 'z-50' : 'z-10'} ${className}`}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-2.5 px-3.5 py-2 rounded-xl bg-slate-950/90 border border-slate-800/80 text-xs text-slate-200 hover:border-slate-700/80 focus:outline-none transition-all active:scale-[0.98] cursor-pointer"
        aria-label={ariaLabel || 'Dropdown menu'}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate font-bold">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-emerald-400' : ''}`} />
      </button>

      {/* Dropdown Options Popup (High Z-Index & Solid Dark Surface) */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 w-full min-w-[180px] bg-[#090d16] border border-slate-700/80 rounded-xl shadow-2xl py-1.5 z-[100] max-h-60 overflow-y-auto animate-in fade-in duration-100">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={`w-full flex items-center justify-between px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer text-left ${
                  isSelected
                    ? 'bg-slate-800/90 text-emerald-400'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100'
                }`}
                role="option"
                aria-selected={isSelected}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
