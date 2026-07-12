export function Card({ children, className = '' }) {
  return (
    <div className={`min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#101217]/95 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-6 ${className}`}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className = '' }) {
  return (
    <h2 className={`break-words text-xl font-semibold text-foreground sm:text-2xl ${className}`}>
      {children}
    </h2>
  )
}

export function CardContent({ children, className = '' }) {
  return (
    <div className={`text-sm leading-6 text-muted ${className}`}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`mt-4 pt-4 border-t border-white/10 flex gap-2 ${className}`}>
      {children}
    </div>
  )
}
