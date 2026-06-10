import { useNavigate } from 'react-router-dom'
import { Link, useLocation } from 'react-router-dom'
import {
  BarChart3,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  Home,
  Sparkles,
  LayoutDashboard,
  GraduationCap,
  Video,
  BookOpen,
  ChevronDown,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useState } from 'react'

export default function Sidebar({ isCollapsed: controlledCollapsed, onToggle }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [uncontrolledCollapsed, setUncontrolledCollapsed] = useState(false)
  const [openMenus, setOpenMenus] = useState({})
  const isCollapsed = controlledCollapsed ?? uncontrolledCollapsed

  const menuItems = [
    { label: 'Home', icon: Home, path: '/' },
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Resume Builder', icon: FileText, path: '/resume-builder' },
    { label: 'Job Matches', icon: Sparkles, path: '/jobs' },
    { 
      label: 'Interview Prep', 
      icon: GraduationCap, 
      subItems: [
        { label: 'Mock Interview', icon: Video, path: '/mock-interview' },
        { label: 'Practice Tests', icon: BookOpen, path: '/practice' }
      ] 
    },
    { label: 'Settings', icon: Settings, path: '/settings' },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <div
      className={`bg-[#1b1b1c] border-r border-border transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      } h-screen flex flex-col fixed left-0 top-0 pt-0 z-40`}
    >
      <div className="px-5 py-5 border-b border-border flex justify-between items-center">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-white">
              <Sparkles size={19} />
            </div>
            <div className="leading-tight">
              <div className="text-xl font-bold text-primary-soft">JobPilot.AI</div>
              <div className="text-[10px] uppercase tracking-[0.24em] text-muted">Career Intelligence</div>
            </div>
          </div>
        )}
        <button
          onClick={() => {
            if (onToggle) {
              onToggle()
              return
            }

            setUncontrolledCollapsed((prev) => !prev)
          }}
          className="text-muted hover:text-foreground transition"
        >
          <ChevronLeft size={20} className={`${isCollapsed ? 'rotate-180' : ''} transition`} />
        </button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 px-2 py-8 space-y-3">
        {menuItems.map((item) => {
          const Icon = item.icon

          if (item.subItems) {
            const isOpen = openMenus[item.label]
            const isSubActive = item.subItems.some((sub) => isActive(sub.path))

            return (
              <div key={item.label} className="space-y-1">
                <button
                  onClick={() => {
                    if (isCollapsed) {
                      if (onToggle) onToggle()
                      else setUncontrolledCollapsed(false)
                      setOpenMenus((prev) => ({ ...prev, [item.label]: true }))
                    } else {
                      setOpenMenus((prev) => ({ ...prev, [item.label]: !prev[item.label] }))
                    }
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-md text-lg transition ${
                    isSubActive && !isOpen
                      ? 'bg-primary/20 text-primary-soft'
                      : 'text-[#e2d8d8] hover:bg-tertiary hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={20} />
                    {!isCollapsed && <span>{item.label}</span>}
                  </div>
                  {!isCollapsed && (
                    <ChevronDown
                      size={16}
                      className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    />
                  )}
                </button>

                {!isCollapsed && isOpen && (
                  <div className="pl-11 pr-2 space-y-1 mt-1">
                    {item.subItems.map((sub) => {
                      const SubIcon = sub.icon
                      const active = isActive(sub.path)

                      return (
                        <Link
                          key={sub.path}
                          to={sub.path}
                          className={`flex items-center gap-3 px-4 py-2.5 rounded-md text-sm transition ${
                            active
                              ? 'bg-primary text-white shadow-lg shadow-primary/20'
                              : 'text-muted hover:bg-tertiary hover:text-foreground'
                          }`}
                        >
                          <SubIcon size={16} />
                          <span>{sub.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

          const active = isActive(item.path)

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-md text-lg transition ${
                active
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-[#e2d8d8] hover:bg-tertiary hover:text-foreground'
              }`}
            >
              <Icon size={20} />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-border space-y-3">
        {!isCollapsed && (
          <div className="rounded-lg border border-primary/25 bg-primary/10 p-4">
            <div className="font-semibold text-primary-soft">Upgrade to Pro</div>
            <p className="mt-2 text-xs leading-5 text-muted">Unlock advanced ATS insights and premium matching algorithms.</p>
            <button className="mt-4 w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white">
              Upgrade Now
            </button>
          </div>
        )}
        {!isCollapsed && (
          <div className="px-4 py-2 text-xs text-muted">
            <div className="font-semibold text-foreground mb-1">{user?.name}</div>
            <div className="truncate">{user?.email}</div>
          </div>
        )}
        <button
          onClick={() => {
            logout()
            navigate('/')
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-muted hover:bg-tertiary hover:text-foreground transition"
        >
          <LogOut size={20} />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  )
}
