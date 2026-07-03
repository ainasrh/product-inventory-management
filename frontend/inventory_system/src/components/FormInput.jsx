/**
 * Same API as before: label, name, value, onChange, error, required, type, placeholder.
 * Extra optional: hint (helper text shown when there's no error).
 */
export function FormInput({
  label,
  name,
  value,
  onChange,
  error,
  hint,
  required = false,
  type = 'text',
  placeholder,
  className = '',
  ...rest
}) {
  return (
    <div className={`mb-4 ${className}`}>
      <label htmlFor={name} className="block text-sm font-medium  mb-1.5">
        {label}
        {required && <span className="text-danger ml-0.5">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : hint ? `${name}-hint` : undefined}
        className={`w-full px-3.5 py-2.5 bg-card text-whote placeholder:text-text-muted rounded-xl text-sm
          border ${error ? 'border-red-500' : 'border-border'}
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent
          ${error ? 'focus:ring-red-500 focus:border-red-500' : ''}`}
        {...rest}
      />
      {error ? (
        <p id={`${name}-error`} className="text-red-500 text-xs mt-1.5">{error}</p>
      ) : hint ? (
        <p id={`${name}-hint`} className="text-text-muted text-xs mt-1.5">{hint}</p>
      ) : null}
    </div>
  );
}