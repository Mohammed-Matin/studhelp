import { Loader2 } from 'lucide-react';

const Button = ({ children, isLoading = false, disabled = false, type = 'button', className = '', ...rest }) => {
  return (
    <button
      type={type}
      disabled={isLoading || disabled}
      className={`relative flex items-center justify-center px-4 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...rest}
    >
      {isLoading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
      {children}
    </button>
  );
};

export default Button;
