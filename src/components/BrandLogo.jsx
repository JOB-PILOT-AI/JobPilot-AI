export default function BrandLogo({ size = 'md', showText = true, subtitle, className = '' }) {
  const isLarge = size === 'lg'
  const markSize = isLarge ? 'h-14 w-14' : 'h-11 w-11'
  const titleSize = isLarge ? 'text-2xl' : 'text-xl'
  const badgeSize = isLarge ? 'px-1.5 py-0.5 text-[11px]' : 'px-1 py-0.5 text-[10px]'

  return (
    <div className={`flex min-w-0 items-center gap-3 ${className}`}>
      <div
        className={`${markSize} relative shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[#020817] shadow-[0_14px_36px_rgba(0,0,0,0.28)]`}
        aria-hidden="true"
      >
        <img src="/jobpilot-logo-mark.svg" alt="" className="h-full w-full object-cover" />
      </div>
      {showText && (
        <div className="min-w-0">
          <div className={`flex min-w-0 items-center gap-1.5 ${titleSize} font-black leading-none tracking-tight`}>
            <span className="truncate text-white">Job</span>
            <span className="truncate text-primary">Pilot</span>
            <span className={`${badgeSize} rounded bg-[#273b83] font-black leading-none text-white shadow-sm shadow-[#273b83]/30`}>
              AI
            </span>
          </div>
          {subtitle && (
            <div className="mt-1 truncate text-[10px] uppercase tracking-[0.16em] text-secondary">{subtitle}</div>
          )}
        </div>
      )}
    </div>
  )
}
