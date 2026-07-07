import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell, BriefcaseBusiness, ChevronDown, CircleUserRound, FileText,
  Globe2, LayoutDashboard, LogOut, Menu, Radar, Rocket, Search, Send, Settings, Sparkles, X,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import BrandLogo from './BrandLogo'

const primaryLinks = [
  { label: 'Home', path: '/', end: true },
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Autopilot', path: '/career-autopilot' },
  { label: 'Resume Builder', path: '/resume-builder' },
  { label: 'Job Matches', path: '/jobs' },
  { label: 'Skill DNA', path: '/skill-dna' },
]

const quickLinks = [
  { label: 'Dashboard', description: 'Career overview and resume health', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Career Autopilot', description: 'Daily plan, readiness score, and target roles', path: '/career-autopilot', icon: Rocket },
  { label: 'Auto Apply Kit', description: 'Generate resume summary, cover letter, and messages', path: '/auto-apply-kit', icon: Send },
  { label: 'Portfolio Builder', description: 'Create a portfolio website from your resume', path: '/portfolio-builder', icon: Globe2 },
  { label: 'Resume Builder', description: 'Build and optimize your resume', path: '/resume-builder', icon: FileText },
  { label: 'Career Studio', description: 'Tailor applications with AI', path: '/career-studio', icon: Sparkles },
  { label: 'Applications', description: 'Track notes, reminders, and stages', path: '/applications', icon: BriefcaseBusiness },
  { label: 'Skill DNA', description: 'Compare your skills against matched jobs', path: '/skill-dna', icon: Radar },
]

const linkClass = ({ isActive }) =>
  `relative inline-flex h-[72px] items-center px-1 text-sm font-medium transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-center after:transition-transform ${
    isActive
      ? 'text-white after:scale-x-100 after:bg-primary'
      : 'text-[#a99d98] after:scale-x-0 after:bg-primary hover:text-white hover:after:scale-x-100'
  }`

export default function Navbar({ variant = 'marketing' }) {
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [activeMenu, setActiveMenu] = useState(null)
  const [query, setQuery] = useState('')
  const isAppNav = variant === 'app'

  useEffect(() => {
    setIsMobileOpen(false)
    setActiveMenu(null)
    setQuery('')
  }, [location.pathname])

  const filteredQuickLinks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return quickLinks
    return quickLinks.filter((item) =>
      `${item.label} ${item.description}`.toLowerCase().includes(normalizedQuery)
    )
  }, [query])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const displayName = user?.name || 'Your account'
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#07090c]/95 shadow-[0_8px_30px_rgba(0,0,0,0.16)] backdrop-blur-xl">
      <nav
        className={`mx-auto flex h-[72px] items-center justify-between gap-6 ${
          isAppNav ? 'w-full px-5 lg:px-7' : 'max-w-[1536px] px-5 sm:px-8 lg:px-10'
        }`}
        aria-label="Primary navigation"
      >
        <Link to="/" className="shrink-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/60" aria-label="JobPilot AI home">
          <BrandLogo />
        </Link>

        <div className="hidden min-w-0 flex-1 items-center justify-end gap-8 lg:flex xl:gap-10">
          <div className="flex items-center gap-8 xl:gap-10">
            {primaryLinks.map((item) => (
              <NavLink key={item.path} to={item.path} end={item.end} className={linkClass}>
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="ml-2 flex items-center gap-2 border-l border-white/10 pl-6">
            {user && (
              <>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setActiveMenu(activeMenu === 'search' ? null : 'search')}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl border transition ${
                      activeMenu === 'search'
                        ? 'border-primary/40 bg-primary/10 text-white'
                        : 'border-transparent text-[#b8aca7] hover:border-white/10 hover:bg-white/[0.05] hover:text-white'
                    }`}
                    aria-label="Open quick search"
                    aria-expanded={activeMenu === 'search'}
                  >
                    <Search size={19} />
                  </button>

                  {activeMenu === 'search' && (
                    <div className="absolute right-0 top-12 w-[360px] overflow-hidden rounded-2xl border border-white/10 bg-[#0d1015] p-3 shadow-[0_28px_80px_rgba(0,0,0,0.55)]">
                      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#080b0f] px-3">
                        <Search size={17} className="text-secondary" />
                        <input
                          autoFocus
                          value={query}
                          onChange={(event) => setQuery(event.target.value)}
                          placeholder="Search JobPilot..."
                          className="h-11 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-secondary"
                        />
                      </div>
                      <div className="mt-2 space-y-1">
                        {filteredQuickLinks.map(({ icon: Icon, ...item }) => (
                          <button
                            key={item.path}
                            type="button"
                            onClick={() => navigate(item.path)}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-white/[0.06]"
                          >
                            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.05] text-primary"><Icon size={17} /></span>
                            <span>
                              <span className="block text-sm font-semibold text-white">{item.label}</span>
                              <span className="block text-xs text-secondary">{item.description}</span>
                            </span>
                          </button>
                        ))}
                        {!filteredQuickLinks.length && <div className="px-3 py-6 text-center text-sm text-secondary">No matching page found.</div>}
                      </div>
                    </div>
                  )}
                </div>

                <Link
                  to="/applications"
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-transparent text-[#b8aca7] transition hover:border-white/10 hover:bg-white/[0.05] hover:text-white"
                  aria-label="Application reminders"
                >
                  <Bell size={19} />
                  <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary ring-2 ring-[#07090c]" />
                </Link>
              </>
            )}

            <div className="relative">
              <button
                type="button"
                onClick={() => user ? setActiveMenu(activeMenu === 'account' ? null : 'account') : navigate('/login')}
                className="flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-2 text-white transition hover:border-white/20 hover:bg-white/[0.06]"
                aria-label={user ? 'Open account menu' : 'Sign in'}
                aria-expanded={activeMenu === 'account'}
              >
                {user ? (
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-[#78383d] text-[11px] font-bold shadow-lg shadow-primary/15">
                    {initials}
                  </span>
                ) : (
                  <CircleUserRound size={20} />
                )}
                {user && <ChevronDown size={14} className={`text-secondary transition ${activeMenu === 'account' ? 'rotate-180' : ''}`} />}
              </button>

              {user && activeMenu === 'account' && (
                <div className="absolute right-0 top-[52px] w-64 overflow-hidden rounded-2xl border border-white/10 bg-[#0d1015] p-2 shadow-[0_28px_80px_rgba(0,0,0,0.55)]">
                  <div className="border-b border-white/10 px-3 py-3">
                    <div className="truncate text-sm font-semibold text-white">{displayName}</div>
                    <div className="mt-1 truncate text-xs text-secondary">{user.currentRole || user.email}</div>
                  </div>
                  <Link to="/settings" className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-secondary transition hover:bg-white/[0.06] hover:text-white">
                    <Settings size={17} /> Account settings
                  </Link>
                  <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-secondary transition hover:bg-primary/10 hover:text-primary">
                    <LogOut size={17} /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-white transition hover:bg-white/[0.06] lg:hidden"
          onClick={() => setIsMobileOpen((current) => !current)}
          aria-label="Toggle navigation"
          aria-expanded={isMobileOpen}
        >
          {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {isMobileOpen && (
        <div className="border-t border-white/[0.08] bg-[#090c10] px-5 py-4 shadow-2xl lg:hidden">
          <div className="mx-auto max-w-[1536px] space-y-1">
            {primaryLinks.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) => `flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition ${isActive ? 'bg-primary/10 text-white' : 'text-secondary hover:bg-white/[0.05] hover:text-white'}`}
              >
                {item.label}<span className="text-primary">→</span>
              </NavLink>
            ))}
            {user ? (
              <>
                <NavLink to="/career-studio" className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-secondary hover:bg-white/[0.05] hover:text-white">Career Studio <span className="text-primary">→</span></NavLink>
                <NavLink to="/applications" className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-secondary hover:bg-white/[0.05] hover:text-white">Applications <span className="text-primary">→</span></NavLink>
                <NavLink to="/skill-dna" className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-secondary hover:bg-white/[0.05] hover:text-white">Skill DNA <span className="text-primary">→</span></NavLink>
                <NavLink to="/settings" className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-secondary hover:bg-white/[0.05] hover:text-white">Settings <span className="text-primary">→</span></NavLink>
                <button onClick={handleLogout} className="mt-2 flex w-full items-center gap-2 rounded-xl border border-primary/20 px-4 py-3 text-sm font-medium text-primary"><LogOut size={16} /> Sign out</button>
              </>
            ) : (
              <button onClick={() => navigate('/login')} className="mt-3 w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20">Sign in to JobPilot</button>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

          <div className="ml-2 flex items-center gap-2 border-l border-white/10 pl-6">
            {user && (
              <>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setActiveMenu(activeMenu === 'search' ? null : 'search')}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl border transition ${
                      activeMenu === 'search'
                        ? 'border-primary/40 bg-primary/10 text-white'
                        : 'border-transparent text-[#b8aca7] hover:border-white/10 hover:bg-white/[0.05] hover:text-white'
                    }`}
                    aria-label="Open quick search"
                    aria-expanded={activeMenu === 'search'}
                  >
                    <Search size={19} />
                  </button>

                  {activeMenu === 'search' && (
                    <div className="absolute right-0 top-12 w-[360px] overflow-hidden rounded-2xl border border-white/10 bg-[#0d1015] p-3 shadow-[0_28px_80px_rgba(0,0,0,0.55)]">
                      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#080b0f] px-3">
                        <Search size={17} className="text-secondary" />
                        <input
                          autoFocus
                          value={query}
                          onChange={(event) => setQuery(event.target.value)}
                          placeholder="Search JobPilot..."
                          className="h-11 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-secondary"
                        />
                      </div>
                      <div className="mt-2 space-y-1">
                        {filteredQuickLinks.map(({ icon: Icon, ...item }) => (
                          <button
                            key={item.path}
                            type="button"
                            onClick={() => navigate(item.path)}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-white/[0.06]"
                          >
                            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.05] text-primary"><Icon size={17} /></span>
                            <span>
                              <span className="block text-sm font-semibold text-white">{item.label}</span>
                              <span className="block text-xs text-secondary">{item.description}</span>
                            </span>
                          </button>
                        ))}
                        {!filteredQuickLinks.length && <div className="px-3 py-6 text-center text-sm text-secondary">No matching page found.</div>}
                      </div>
                    </div>
                  )}
                </div>

                <Link
                  to="/applications"
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-transparent text-[#b8aca7] transition hover:border-white/10 hover:bg-white/[0.05] hover:text-white"
                  aria-label="Application reminders"
                >
                  <Bell size={19} />
                  <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary ring-2 ring-[#07090c]" />
                </Link>
              </>
            )}

            <div className="relative">
              <button
                type="button"
                onClick={() => user ? setActiveMenu(activeMenu === 'account' ? null : 'account') : navigate('/login')}
                className="flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-2 text-white transition hover:border-white/20 hover:bg-white/[0.06]"
                aria-label={user ? 'Open account menu' : 'Sign in'}
                aria-expanded={activeMenu === 'account'}
              >
                {user ? (
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-[#78383d] text-[11px] font-bold shadow-lg shadow-primary/15">
                    {initials}
                  </span>
                ) : (
                  <CircleUserRound size={20} />
                )}
                {user && <ChevronDown size={14} className={`text-secondary transition ${activeMenu === 'account' ? 'rotate-180' : ''}`} />}
              </button>

              {user && activeMenu === 'account' && (
                <div className="absolute right-0 top-[52px] w-64 overflow-hidden rounded-2xl border border-white/10 bg-[#0d1015] p-2 shadow-[0_28px_80px_rgba(0,0,0,0.55)]">
                  <div className="border-b border-white/10 px-3 py-3">
                    <div className="truncate text-sm font-semibold text-white">{displayName}</div>
                    <div className="mt-1 truncate text-xs text-secondary">{user.currentRole || user.email}</div>
                  </div>
                  <Link to="/settings" className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-secondary transition hover:bg-white/[0.06] hover:text-white">
                    <Settings size={17} /> Account settings
                  </Link>
                  <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-secondary transition hover:bg-primary/10 hover:text-primary">
                    <LogOut size={17} /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-white transition hover:bg-white/[0.06] lg:hidden"
          onClick={() => setIsMobileOpen((current) => !current)}
          aria-label="Toggle navigation"
          aria-expanded={isMobileOpen}
        >
          {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {isMobileOpen && (
        <div className="border-t border-white/[0.08] bg-[#090c10] px-5 py-4 shadow-2xl lg:hidden">
          <div className="mx-auto max-w-[1536px] space-y-1">
            {primaryLinks.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) => `flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition ${isActive ? 'bg-primary/10 text-white' : 'text-secondary hover:bg-white/[0.05] hover:text-white'}`}
              >
                {item.label}<span className="text-primary">→</span>
              </NavLink>
            ))}
            {user ? (
              <>
                <NavLink to="/career-studio" className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-secondary hover:bg-white/[0.05] hover:text-white">Career Studio <span className="text-primary">→</span></NavLink>
                <NavLink to="/applications" className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-secondary hover:bg-white/[0.05] hover:text-white">Applications <span className="text-primary">→</span></NavLink>
                <NavLink to="/skill-dna" className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-secondary hover:bg-white/[0.05] hover:text-white">Skill DNA <span className="text-primary">→</span></NavLink>
                <NavLink to="/settings" className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-secondary hover:bg-white/[0.05] hover:text-white">Settings <span className="text-primary">→</span></NavLink>
                <button onClick={handleLogout} className="mt-2 flex w-full items-center gap-2 rounded-xl border border-primary/20 px-4 py-3 text-sm font-medium text-primary"><LogOut size={16} /> Sign out</button>
              </>
            ) : (
              <button onClick={() => navigate('/login')} className="mt-3 w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20">Sign in to JobPilot</button>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
