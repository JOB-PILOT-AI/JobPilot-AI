import { forwardRef } from 'react'

const Input = forwardRef(
  ({ className = '', type = 'text', placeholder = '', error = '', ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          type={type}
          placeholder={placeholder}
          className={`w-full bg-tertiary text-foreground border border-border rounded-lg px-4 py-2.5 text-sm transition-colors duration-200 placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
            error ? 'border-red-500' : ''
          } ${className}`}
          {...props}
        />
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
