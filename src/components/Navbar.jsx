import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import Button from './ui/Button'
import { Bell, Menu, Search, Sparkles, X } from 'lucide-react'
import { useState } from 'react'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-border/70 bg-[#080808]/90 backdrop-blur-xl">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-white shadow-lg shadow-primary/20">
              <Sparkles size={18} />
            </div>
            <div className="hidden sm:block leading-tight">
              <span className="block text-lg font-bold text-foreground">JobPilot.AI</span>
              <span className="text-[10px] uppercase tracking-[0.22em] text-muted">Career Intelligence</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-7">
            {user ? (
              <>
                <div className="rounded-md border border-border bg-tertiary/70 px-4 py-2 text-sm font-semibold text-accent">
                  Live Intelligence Active
                </div>
                <button className="text-muted transition hover:text-foreground" aria-label="Search">
                  <Search size={20} />
                </button>
                <button className="text-muted transition hover:text-foreground" aria-label="Notifications">
                  <Bell size={20} />
                </button>
                <div className="flex items-center gap-3 border-l border-border pl-6">
                  <div className="text-right leading-tight">
                    <div className="text-sm font-semibold text-foreground">{user.name}</div>
                    <div className="text-xs text-muted">Director Level</div>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleLogout}>Logout</Button>
                </div>
              </>
            ) : (
              <>
                <a href="#features" className="text-sm text-muted hover:text-foreground transition">Features</a>
                <a href="#pricing" className="text-sm text-muted hover:text-foreground transition">Pricing</a>
                <Button variant="primary" size="sm" onClick={() => navigate('/login')}>
                  Sign In
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-foreground"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-4 border-t border-border">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="block px-4 py-2 text-muted hover:text-foreground"
                  onClick={() => setIsOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/resume-builder"
                  className="block px-4 py-2 text-muted hover:text-foreground"
                  onClick={() => setIsOpen(false)}
                >
                  Resume Builder
                </Link>
                <Link
                  to="/jobs"
                  className="block px-4 py-2 text-muted hover:text-foreground"
                  onClick={() => setIsOpen(false)}
                >
                  Job Matches
                </Link>
                <Link
                  to="/settings"
                  className="block px-4 py-2 text-muted hover:text-foreground"
                  onClick={() => setIsOpen(false)}
                >
                  Settings
                </Link>
                <div className="px-4 py-2 border-t border-border mt-2">
                  <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <>
                <a href="#features" className="block px-4 py-2 text-muted hover:text-foreground">
                  Features
                </a>
                <a href="#pricing" className="block px-4 py-2 text-muted hover:text-foreground">
                  Pricing
                </a>
                <div className="px-4 py-2">
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => navigate('/login')}
                  >
                    Sign In
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
