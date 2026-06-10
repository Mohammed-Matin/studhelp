import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

const CustomSelect = forwardRef(({ options, placeholder, className, onChange, value, name, onBlur, ...rest }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    // If it's a controlled component via react-hook-form or generic state, keep an internal representation
    const [internalValue, setInternalValue] = useState(value !== undefined ? value : '');
    const containerRef = useRef(null);

    // Sync with external value if it changes
    useEffect(() => {
        if (value !== undefined) {
            setInternalValue(value);
        }
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
                if (isOpen && onBlur) {
                    onBlur({ target: { name } });
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onBlur, name]);

    const handleSelect = (optionValue) => {
        setInternalValue(optionValue);
        setIsOpen(false);
        if (onChange) {
            onChange({
                target: {
                    name,
                    value: optionValue
                }
            });
        }
    };

    const selectedOption = options.find(o => o.value === internalValue);

    return (
        <div className="relative w-full" ref={containerRef}>
            {/* Hidden native select to hold the ref for react-hook-form so it registers successfully */}
            <select
                className="hidden"
                value={internalValue}
                name={name}
                ref={ref}
                readOnly
                {...rest}
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>

            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-between w-full px-4 py-2.5 rounded-lg text-sm transition-all duration-200 outline-none
                    bg-[var(--input-bg)] border border-theme text-theme hover:border-purple-500/50 
                    focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/15
                    ${className || ''}`}
            >
                <span className={internalValue === '' ? 'text-theme-faint' : 'text-theme'}>
                    {selectedOption ? selectedOption.label : (placeholder || 'Select...')}
                </span>
                <ChevronDown className={`w-4 h-4 text-theme-muted transition-transform duration-200 ${isOpen ? 'rotate-180 text-purple-400' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-[var(--bg-elevated)] border border-theme rounded-xl shadow-2xl py-1.5 animate-fade-up max-h-60 overflow-y-auto glow-border">
                    {options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => handleSelect(option.value)}
                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors duration-150 flex items-center justify-between
                                ${internalValue === option.value 
                                    ? 'bg-purple-500/10 text-purple-400 font-medium' 
                                    : 'text-theme hover:bg-[var(--hover-bg-strong)]'
                                }`}
                        >
                            {option.label}
                            {internalValue === option.value && (
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
});

CustomSelect.displayName = 'CustomSelect';

export default CustomSelect;
