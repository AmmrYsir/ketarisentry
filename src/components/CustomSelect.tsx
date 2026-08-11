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
    <div ref={containerRef} className={`relative inline-block text-left select-none ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-2xl bg-slate-950/90 border border-slate-800/80 text-xs text-slate-200 hover:border-slate-700/80 focus:outline-none transition-all shadow-clay-inset active:scale-[0.98] cursor-pointer"
        aria-label={ariaLabel || 'Dropdown menu'}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate font-bold">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-emerald-400' : ''}`} />
      </button>

      {/* Dropdown Options Popup */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-full min-w-[170px] bg-slate-900/95 border border-slate-800/80 rounded-2xl shadow-clay-card py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 max-h-60 overflow-y-auto">
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

