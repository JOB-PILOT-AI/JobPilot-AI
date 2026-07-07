import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Sparkles } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

const GoogleLogo = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38z" />
  </svg>
)

const GitHubLogo = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.09 3.29 9.4 7.86 10.93.58.1.79-.25.79-.56v-2.14c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.75 2.69 1.24 3.35.95.1-.74.4-1.24.73-1.53-2.55-.29-5.23-1.27-5.23-5.67 0-1.25.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.16 1.18.92-.25 1.9-.38 2.88-.39.98.01 1.96.14 2.88.39 2.2-1.49 3.16-1.18 3.16-1.18.62 1.58.23 2.75.11 3.04.73.8 1.18 1.83 1.18 3.08 0 4.41-2.69 5.38-5.25 5.66.41.36.78 1.06.78 2.14v3.15c0 .31.21.67.79.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
  </svg>
)

const getSafeNextPath = (value) => {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/dashboard'
  return value
}

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login, signup, forgotPassword, isLoading, error, clearError } = useAuthStore()
  const [isSignup, setIsSignup] = useState(false)
  const [resetMessage, setResetMessage] = useState('')
  const [formData, setFormData] = useState({ name: '', email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const nextPath = getSafeNextPath(searchParams.get('next'))

  useEffect(() => {
    const oauthError = searchParams.get('error')
    const token = searchParams.get('token')
    const userStr = searchParams.get('user')

    if (oauthError) {
      setResetMessage(decodeURIComponent(oauthError))
    }
    
    if (token && userStr) {
      localStorage.setItem('token', token)
      localStorage.setItem('user', userStr)
      window.location.href = nextPath // Force reload to authenticate via app initialization
    }
  }, [nextPath, searchParams])

  const handleSubmit = async (event) => {
    event.preventDefault()
    clearError()
    const result = isSignup
      ? await signup(formData.name || 'Alex Stratton', formData.email, formData.password, rememberMe)
      : await login(formData.email, formData.password, rememberMe)
    if (result.success) navigate(nextPath)
  }

  const handleForgotPassword = () => {
    clearError()
    navigate(`/forgot-password?email=${encodeURIComponent(formData.email)}`)
  }

  const startOAuth = (provider) => {
    const envApi = import.meta.env.VITE_API_URL || ''
    const defaultLocal = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) ? 'http://localhost:5002' : ''
    const base = envApi || defaultLocal || ''
    const nextQuery = `?next=${encodeURIComponent(nextPath)}`
    const target = base ? `${base}/api/auth/${provider}${nextQuery}` : `/api/auth/${provider}${nextQuery}`
    window.location.href = target
  }

  return (
    <div className="min-h-screen page-shell text-foreground">
      <div className="mx-auto flex min-h-screen max-w-[1440px] flex-col lg:flex-row">
        <aside className="relative hidden w-full max-w-[48%] flex-col justify-between overflow-hidden border-r border-white/10 bg-[#07090c] px-10 py-12 lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(182,79,82,0.16),transparent_28rem),radial-gradient(circle_at_bottom_right,rgba(73,215,202,0.08),transparent_24rem)]" />
          <div className="relative z-10">
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-primary">
              SYSTEM ACTIVE
            </div>
            <h1 className="text-5xl font-semibold tracking-tight text-white">Precision tools for career growth</h1>
            <p className="mt-6 max-w-xl text-sm leading-7 text-secondary">
              Intelligent job matching and engineering-focused workflows designed for the modern professional.
            </p>
          </div>

          <div className="relative z-10 grid gap-5 rounded-[2rem] border border-white/10 bg-[#0e1117]/95 p-8 shadow-[0_32px_90px_rgba(0,0,0,0.32)]">
            <div className="text-xs uppercase tracking-[0.3em] text-secondary">Match strength</div>
            <div className="text-5xl font-semibold text-white">94%</div>
            <div className="grid gap-3 text-sm text-secondary">
              <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                <span>Engine Status</span>
                <span className="text-accent">Active</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                <span>Daily Analysis</span>
                <span className="text-secondary">142 roles</span>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex w-full flex-1 items-center justify-center px-6 py-12 sm:px-12 lg:px-16">
          <div className="w-full max-w-md">
            <div className="mb-10">
              <p className="text-sm uppercase tracking-[0.28em] text-secondary">Welcome back</p>
              <h2 className="mt-4 text-3xl font-semibold text-white">Access your career mission control.</h2>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-[#101418]/95 p-8 shadow-[0_32px_90px_rgba(0,0,0,0.28)] backdrop-blur-xl">
              <div className="mb-8">
                <p className="text-sm text-secondary">Sign in with your email to continue.</p>
              </div>

              {error && (
                <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}
              {resetMessage && (
                <div className="mb-4 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
                  {resetMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {isSignup && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">Full name</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Alex Stratton"
                      className="h-12 border-white/10 bg-slate-950 focus:border-sky-500 focus:ring-sky-500/20"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Email address</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@company.com"
                    className="h-12 border-white/10 bg-slate-950 focus:border-sky-500 focus:ring-sky-500/20"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Password</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      required
                      className="h-12 border-white/10 bg-slate-950 pr-10 focus:border-sky-500 focus:ring-sky-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="-mt-1 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <label className="inline-flex cursor-pointer items-center gap-3 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-sky-500 focus:ring-sky-500"
                    />
                    Remember me
                  </label>
                  {!isSignup && (
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-left text-sm font-medium text-sky-400 transition hover:text-sky-300 sm:text-right"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="mt-2 h-12 w-full rounded-2xl text-base font-semibold shadow-lg shadow-sky-500/20 transition hover:shadow-sky-500/30"
                  disabled={isLoading}
                >
                  {isLoading ? 'Please wait...' : isSignup ? 'Sign Up' : 'Sign In'}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-slate-500">OR CONTINUE WITH</div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => startOAuth('google')}
                  className="flex h-12 w-full items-center justify-center gap-3 border-white/10 bg-slate-950 text-slate-200 hover:bg-white/5"
                >
                  <GoogleLogo />
                  Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => startOAuth('github')}
                  className="flex h-12 w-full items-center justify-center gap-3 border-white/10 bg-slate-950 text-slate-200 hover:bg-white/5"
                >
                  <GitHubLogo />
                  GitHub
                </Button>
              </div>

              <div className="mt-6 text-center text-sm text-slate-400">
                {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  onClick={() => {
                    setIsSignup(!isSignup)
                    clearError()
                    setResetMessage('')
                  }}
                  className="font-semibold text-white underline decoration-slate-700 decoration-2 underline-offset-4 hover:text-sky-300"
                >
                  {isSignup ? 'Sign in' : 'Sign up'}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
