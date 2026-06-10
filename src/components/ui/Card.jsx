export function Card({ children, className = '' }) {
  return (
    <div className={`bg-secondary/90 border border-border rounded-lg p-6 shadow-[0_24px_80px_rgba(0,0,0,0.24)] ${className}`}>
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
    <h2 className={`text-2xl font-bold tracking-tight text-foreground ${className}`}>
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
    <div className={`mt-4 pt-4 border-t border-border flex gap-2 ${className}`}>
      {children}
    </div>
  )
}
