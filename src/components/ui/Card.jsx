export function Card({ children, className = '' }) {
  return (
    <div className={`bg-secondary border border-border rounded-xl p-6 ${className}`}>
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
    <h2 className={`text-2xl font-bold text-foreground ${className}`}>
      {children}
    </h2>
  )
}

export function CardContent({ children, className = '' }) {
  return (
    <div className={`text-sm text-muted ${className}`}>
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
