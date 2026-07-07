export function Card({ children, className = '' }) {
  return (
    <div className={`rounded-[2rem] border border-white/10 bg-[#101217]/95 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl ${className}`}>
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
    <h2 className={`text-2xl font-semibold text-foreground ${className}`}>
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
