
const FormError = ({ message }) => {
  if (!message) return null;

  return (
    <span className="text-sm text-red-500 mt-1 block">
      {message}
    </span>
  );
};

export default FormError;
