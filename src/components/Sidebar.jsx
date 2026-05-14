import { Link, useLocation } from 'react-router-dom'
import {
  BarChart3,
  FileText,
  Briefcase,
  Settings,
  LogOut,
  ChevronLeft,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useState } from 'react'

export default function Sidebar() {
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const menuItems = [
    { label: 'Dashboard', icon: BarChart3, path: '/dashboard' },
    { label: 'Resume Builder', icon: FileText, path: '/resume-builder' },
    { label: 'Job Matches', icon: Briefcase, path: '/jobs' },
    { label: 'Settings', icon: Settings, path: '/settings' },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <div
      className={`bg-secondary border-r border-border transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      } h-screen flex flex-col fixed left-0 top-0 pt-20`}
    >
      {/* Header */}
      <div className="px-4 py-4 border-b border-border flex justify-between items-center">
        {!isCollapsed && <span className="font-semibold text-foreground">Menu</span>}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-muted hover:text-foreground transition"
        >
          <ChevronLeft size={20} className={`${isCollapsed ? 'rotate-180' : ''} transition`} />
        </button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 px-2 py-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.path)

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                active
                  ? 'bg-primary text-white'
                  : 'text-muted hover:bg-tertiary hover:text-foreground'
              }`}
            >
              <Icon size={20} />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-2 py-4 border-t border-border space-y-2">
        {!isCollapsed && (
          <div className="px-4 py-2 text-xs text-muted">
            <div className="font-semibold text-foreground mb-1">{user?.name}</div>
            <div className="truncate">{user?.email}</div>
          </div>
        )}
        <button
          onClick={() => {
            logout()
            window.location.href = '/'
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
