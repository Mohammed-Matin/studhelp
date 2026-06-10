import { forwardRef, useState } from "react";
import { Eye, EyeOff } from 'lucide-react';
import FormError from './FormError';

const InputField = forwardRef(({ label, type = 'text', error, id, ...rest }, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && <label htmlFor={id} className="text-sm font-medium text-theme-muted">{label}</label>}
      <div className="relative w-full">
        <input
          id={id}
          type={inputType}
          ref={ref}
          className={`input-dark w-full ${isPassword ? 'pr-10' : ''} ${error ? 'border-red-500 bg-red-500/10 text-red-500' : ''}`}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted hover:text-cyan-400 transition-colors focus:outline-none"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && <FormError message={error.message} />}
    </div>
  );
});

InputField.displayName = 'InputField';

export default InputField;
