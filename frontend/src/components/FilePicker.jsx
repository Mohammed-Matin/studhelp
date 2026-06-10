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
      {label && <label htmlFor={id} className="text-sm font-medium text-theme-muted">{label}</label>}
      <div className="flex items-center gap-4">
        <label className={`cursor-pointer px-4 py-2.5 rounded-lg border focus-within:ring-2 transition-all duration-200 flex items-center justify-center text-sm ${
          error ? 'border-red-500 focus-within:ring-red-500/50 bg-red-500/10 text-red-500' 
                : 'border-theme hover:border-purple-500/50 bg-[var(--input-bg)] hover:bg-[var(--hover-bg)] text-theme focus-within:ring-purple-500/50'
        }`}>
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
          <img src={preview} alt="Preview" className="h-10 w-10 object-cover rounded-md border border-theme" />
        )}
        {!preview && fileName && (
          <span className="text-sm text-theme-muted truncate max-w-xs">{fileName}</span>
        )}
      </div>
      {error && <FormError message={error.message} />}
    </div>
  );
});

FilePicker.displayName = 'FilePicker';

export default FilePicker;
