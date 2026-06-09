import { forwardRef } from "react";
import FormError from './FormError';

const InputField = forwardRef(({ label, type = 'text', error, id, ...rest }, ref) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && <label htmlFor={id} className="text-sm font-medium text-theme-muted">{label}</label>}
      <input
        id={id}
        type={type}
        ref={ref}
        className={`input-dark ${error ? 'border-red-500' : ''}`}
        {...rest}
      />
      {error && <FormError message={error.message} />}
    </div>
  );
});

InputField.displayName = 'InputField';

export default InputField;
