import { forwardRef } from "react";
import FormError from './FormError';

const InputField = forwardRef(({ label, type = 'text', error, id, ...rest }, ref) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && <label htmlFor={id} className="text-sm font-medium text-gray-700">{label}</label>}
      <input
        id={id}
        type={type}
        ref={ref}
        className={`px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
          error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
        }`}
        {...rest}
      />
      {error && <FormError message={error.message} />}
    </div>
  );
});

InputField.displayName = 'InputField';

export default InputField;
