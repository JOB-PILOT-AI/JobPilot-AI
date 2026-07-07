import { forwardRef } from 'react'

const Input = forwardRef(
  ({ className = '', type = 'text', placeholder = '', error = '', ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          type={type}
          placeholder={placeholder}
          className={`w-full rounded-2xl border border-white/10 bg-[#0b1221] px-4 py-3 text-sm text-foreground transition-colors duration-200 placeholder:text-slate-500 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none ${error ? 'border-red-500' : ''} ${className}`}
          {...props}
        />
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
