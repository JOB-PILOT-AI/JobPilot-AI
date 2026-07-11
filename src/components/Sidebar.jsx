import { useNavigate } from 'react-router-dom'
import { Link, useLocation } from 'react-router-dom'
import {
  BarChart3,
  FileText,
  Briefcase,
  Radar,
  Settings,
  LogOut,
  ChevronLeft,
  MessageSquare,
  Home,
  ClipboardList,
  WandSparkles,
  Rocket,
  Send,
  Globe2,
  CalendarDays,
  Users,
  TrendingUp,
  UserCheck,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useState } from 'react'
import BrandLogo from './BrandLogo'
import ProBadge from './ProBadge'

export default function Sidebar({ isCollapsed: controlledCollapsed, onToggle }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [uncontrolledCollapsed, setUncontrolledCollapsed] = useState(false)
  const isCollapsed = controlledCollapsed ?? uncontrolledCollapsed

  const menuItems = [
    { label: 'Home', icon: Home, path: '/' },
    { label: 'Dashboard', icon: BarChart3, path: '/dashboard' },
    { label: 'Career Autopilot', icon: Rocket, path: '/career-autopilot' },
    { label: 'Resume Builder', icon: FileText, path: '/resume-builder' },
    { label: 'Branding Toolkit', icon: UserCheck, path: '/branding-toolkit' },
    { label: 'Interview Scheduling', icon: CalendarDays, path: '/interview-scheduling' },
    { label: 'Recruiter Access', icon: Users, path: '/recruiter-access' },
    { label: 'Salary Guidance', icon: TrendingUp, path: '/salary-guidance' },
    { label: 'Auto Apply Kit', icon: Send, path: '/auto-apply-kit' },
    { label: 'Portfolio Builder', icon: Globe2, path: '/portfolio-builder' },
    { label: 'Career Studio', icon: WandSparkles, path: '/career-studio' },
    { label: 'Applications', icon: ClipboardList, path: '/applications' },
    { label: 'Job Matches', icon: Briefcase, path: '/jobs' },
    { label: 'Interview Prep', icon: MessageSquare, path: '/interview-prep' },
    { label: 'Skill DNA', icon: Radar, path: '/skill-dna' },
    { label: 'Settings', icon: Settings, path: '/settings' },
  ]

  const isActive = (path) => {
    if (path === '/interview-prep') {
      return ['/interview-prep', '/mock-interview', '/practice-test'].includes(location.pathname)
    }

    return location.pathname === path
  }

  return (
    <div
      className={`border-r border-white/10 bg-[#101114] transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-72'
      } fixed bottom-0 left-0 top-[72px] z-40 flex flex-col overflow-hidden shadow-[8px_0_40px_rgba(0,0,0,0.35)]`}
    >
      <div className="shrink-0 px-4 py-4 flex items-center justify-between">
        {isCollapsed ? (
          <BrandLogo showText={false} />
        ) : (
          <BrandLogo subtitle="Career Intelligence" />
        )}
        <button
          onClick={() => {
            if (onToggle) {
              onToggle()
              return
            }

            setUncontrolledCollapsed((prev) => !prev)
          }}
          className="rounded-full border border-white/10 bg-[#101214] p-2 text-secondary transition hover:border-primary hover:text-white"
        >
          <ChevronLeft size={18} className={`${isCollapsed ? 'rotate-180' : ''} transition`} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 pb-4">
        <nav className="space-y-1.5 py-4">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-4 rounded-2xl px-4 py-3 text-base transition ${
                  active
                    ? 'bg-primary text-white shadow-[0_10px_40px_rgba(182,79,82,0.18)]'
                    : 'text-secondary hover:bg-[#111418] hover:text-white'
                }`}
              >
                <Icon size={20} className="shrink-0" />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-white/10 px-1 pt-4 space-y-3">
          {!isCollapsed && (
            <div className="rounded-2xl border border-white/10 bg-[#111418] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.16)]">
              <div className="mb-2 text-lg font-semibold text-white">Upgrade to Pro</div>
              <p className="mb-4 text-sm leading-5 text-secondary">Unlock advanced ATS insights and premium matching algorithms.</p>
              <button
                onClick={() => navigate('/upgrade')}
                className="w-full rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-dark"
              >
                Upgrade Now
              </button>
            </div>
          )}
          {!isCollapsed && (
            <div className="rounded-2xl border border-white/10 bg-[#111418] px-4 py-3 text-xs text-secondary">
              <div className="mb-1 flex items-center gap-2">
                <div className="truncate font-semibold text-white">{user?.name}</div>
                <ProBadge compact className="shrink-0" />
              </div>
              <div className="truncate">{user?.email}</div>
            </div>
          )}
          <button
            onClick={() => navigate('/logout')}
            className="w-full flex items-center gap-3 rounded-2xl border border-white/10 bg-[#111418] px-4 py-3 text-secondary transition hover:bg-[#16181e] hover:text-white"
          >
            <LogOut size={20} className="shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </div>
    </div>
  )
}
