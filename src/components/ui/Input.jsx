import { forwardRef } from 'react'

const Input = forwardRef(
  ({ className = '', type = 'text', placeholder = '', error = '', ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          type={type}
          placeholder={placeholder}
          className={`w-full bg-[#141212] text-foreground border border-[#6b5555]/70 rounded-sm px-4 py-3 text-sm transition-colors duration-200 placeholder:text-muted/45 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/70 ${
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
