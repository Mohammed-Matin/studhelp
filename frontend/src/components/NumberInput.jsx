import { forwardRef, useRef } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

const NumberInput = forwardRef(({ className, min, max, step = 1, onChange, value, name, id, ...rest }, externalRef) => {
    const internalRef = useRef(null);

    // Merge refs so both react-hook-form and our internal logic can access the input
    const setRefs = (element) => {
        internalRef.current = element;
        if (typeof externalRef === 'function') {
            externalRef(element);
        } else if (externalRef) {
            externalRef.current = element;
        }
    };

    const triggerChange = () => {
        if (internalRef.current) {
            // Dispatch a native event so react-hook-form picks it up properly if it relies on events
            const event = new Event('input', { bubbles: true });
            internalRef.current.dispatchEvent(event);
            if (onChange) {
                // If it's controlled and expects a React synthetic event-like object
                onChange({
                    target: internalRef.current,
                    type: 'change'
                });
            }
        }
    };

    const handleIncrement = () => {
        if (internalRef.current) {
            internalRef.current.stepUp();
            triggerChange();
        }
    };

    const handleDecrement = () => {
        if (internalRef.current) {
            internalRef.current.stepDown();
            triggerChange();
        }
    };

    return (
        <div className={`relative flex items-center w-full ${className || ''}`}>
            <input
                type="number"
                id={id}
                name={name}
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={onChange}
                ref={setRefs}
                className="input-dark w-full pr-10 appearance-none hide-spinners"
                {...rest}
            />
            <div className="absolute right-2 flex flex-col items-center justify-center h-[calc(100%-4px)] py-1">
                <button
                    type="button"
                    tabIndex={-1}
                    onClick={handleIncrement}
                    className="text-theme-muted hover:text-cyan-400 hover:bg-(--hover-bg-strong) rounded flex-1 flex items-center justify-center px-1 transition-colors"
                >
                    <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                    type="button"
                    tabIndex={-1}
                    onClick={handleDecrement}
                    className="text-theme-muted hover:text-cyan-400 hover:bg-(--hover-bg-strong) rounded flex-1 flex items-center justify-center px-1 transition-colors"
                >
                    <ChevronDown className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
});

NumberInput.displayName = 'NumberInput';

export default NumberInput;
