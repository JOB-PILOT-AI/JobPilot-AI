export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) {
  const baseStyles = 'inline-flex min-h-11 min-w-0 items-center justify-center whitespace-nowrap font-semibold tracking-[0.01em] transition-all duration-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-0 disabled:translate-y-0 disabled:opacity-70'

  const variants = {
    primary: 'bg-primary text-white shadow-[0_22px_55px_rgba(182,79,82,0.18)] hover:bg-primary-dark hover:-translate-y-0.5',
    secondary: 'bg-[#141821] text-foreground shadow-sm shadow-black/20 hover:bg-[#1f2731]',
    outline: 'border border-white/10 bg-[#0e1219] text-foreground hover:border-primary/30 hover:bg-white/5',
    ghost: 'text-foreground hover:bg-white/10',
  }

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-5 py-2.5 text-sm sm:px-6',
    lg: 'px-8 py-3 text-base',
  }

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
