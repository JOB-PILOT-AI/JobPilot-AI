import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import Button from './ui/Button'
import { Menu, X } from 'lucide-react'
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
    <nav className="bg-secondary border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">JP</span>
            </div>
            <span className="text-foreground font-bold hidden sm:inline">JobPilot.AI</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {user ? (
              <>
                <Link to="/dashboard" className="text-muted hover:text-foreground transition">
                  Dashboard
                </Link>
                <Link to="/resume-builder" className="text-muted hover:text-foreground transition">
                  Resume Builder
                </Link>
                <Link to="/jobs" className="text-muted hover:text-foreground transition">
                  Job Matches
                </Link>
                <Link to="/skill-dna" className="text-muted hover:text-foreground transition">
                  Skill DNA
                </Link>
                <Link to="/settings" className="text-muted hover:text-foreground transition">
                  Settings
                </Link>
                <div className="flex items-center gap-4 pl-8 border-l border-border">
                  <span className="text-sm text-muted">{user.name}</span>
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <>
                <a href="#features" className="text-muted hover:text-foreground transition">
                  Features
                </a>
                <a href="#pricing" className="text-muted hover:text-foreground transition">
                  Pricing
                </a>
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
                  to="/skill-dna"
                  className="block px-4 py-2 text-muted hover:text-foreground"
                  onClick={() => setIsOpen(false)}
                >
                  Skill DNA
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
