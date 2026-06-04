import { forwardRef, useState, useEffect } from "react";
import FormError from './FormError';

const FilePicker = forwardRef(({ label, error, id, accept, onChange, ...rest }, ref) => {
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setPreview(url);
      } else {
        setPreview(null);
      }
    } else {
      setFileName(null);
      setPreview(null);
    }

    // Call the react-hook-form onChange if provided
    if (onChange) {
      onChange(e);
    }
  };

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && <label htmlFor={id} className="text-sm font-medium text-gray-700">{label}</label>}
      <div className="flex items-center gap-4">
        <label className={`cursor-pointer px-4 py-2 border rounded-md focus-within:ring-2 ${
          error ? 'border-red-500 focus-within:ring-red-500' : 'border-gray-300 focus-within:ring-blue-500'
        } bg-white hover:bg-gray-50 flex items-center justify-center text-sm text-gray-600`}>
          Choose File
          <input
            id={id}
            type="file"
            accept={accept}
            className="sr-only"
            ref={ref}
            onChange={handleFileChange}
            {...rest}
          />
        </label>

        {preview && (
          <img src={preview} alt="Preview" className="h-10 w-10 object-cover rounded-md border border-gray-200" />
        )}
        {!preview && fileName && (
          <span className="text-sm text-gray-600 truncate max-w-xs">{fileName}</span>
        )}
      </div>
      {error && <FormError message={error.message} />}
    </div>
  );
});

FilePicker.displayName = 'FilePicker';

export default FilePicker;
