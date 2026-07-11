import { Crown, Sparkles } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

export default function ProBadge({ className = '', compact = false, label = 'PRO' }) {
  const { user } = useAuthStore()

  if (!user?.isPro) return null

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-orange-500/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-100 shadow-[0_8px_24px_rgba(251,191,36,0.14)] ${className}`}
    >
      <Crown size={compact ? 12 : 14} className="fill-amber-300 text-amber-200" />
      <span>{compact ? label : `${label} MEMBER`}</span>
      {!compact && <Sparkles size={12} className="text-amber-300" />}
    </span>
  )
}
