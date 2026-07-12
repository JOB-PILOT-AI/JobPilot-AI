import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Sparkles } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '../components/ui/dialog'

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
    const base = import.meta.env.VITE_API_URL || ''
    const nextQuery = `?next=${encodeURIComponent(nextPath)}`
    const target = base ? `${base}/api/auth/${provider}${nextQuery}` : `/api/auth/${provider}${nextQuery}`
    window.location.href = target
  }

  return (
    <div className="min-h-screen page-shell text-foreground">
      
      <div className="mx-auto flex min-h-screen max-w-[1440px] flex-col lg:flex-row">
        <aside className="relative hidden w-full max-w-[48%] flex-col justify-between overflow-hidden border-r border-white/10 bg-[#07090c] px-8 py-12 lg:flex lg:px-10 lg:py-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_24rem),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.12),transparent_28rem)]" />
          <div className="relative z-10">
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-primary">
              JobPilot Professional
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-white lg:text-5xl">AI career intelligence for ambitious professionals.</h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-secondary lg:mt-6">
              Discover roles matched to your skills, build better resumes, and manage every application from one secure workspace.
            </p>
          </div>

          <div className="relative z-10 grid gap-5 rounded-2xl border border-white/10 bg-[#0e1117]/95 p-6 shadow-[0_32px_90px_rgba(0,0,0,0.32)] lg:rounded-[2rem] lg:p-8">
            <div className="text-xs uppercase tracking-[0.3em] text-secondary">Latest performance</div>
            <div className="text-4xl font-semibold text-white lg:text-5xl">94%</div>
            <div className="grid gap-2 text-sm text-secondary lg:gap-3">
              <div className="flex items-center justify-between rounded-xl px-3 py-2 bg-white/5 lg:rounded-2xl lg:px-4 lg:py-3">
                <span>Resume optimization</span>
                <span className="text-emerald-400">Expert review</span>
              </div>
              <div className="flex items-center justify-between rounded-xl px-3 py-2 bg-white/5 lg:rounded-2xl lg:px-4 lg:py-3">
                <span>Weekly job alerts</span>
                <span className="text-secondary">+142 roles</span>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex w-full flex-1 items-center justify-center px-4 py-8 sm:px-6 md:px-8 lg:px-16 lg:py-12">
          <div className="w-full max-w-md">
            <div className="mb-8 md:mb-10">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Secure access</p>
              <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">{isSignup ? 'Create your JobPilot account' : 'Sign in to JobPilot'}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400 md:mt-3">
                {isSignup ? 'Start your career journey with personalized job data, resume tools, and interview preparation.' : 'Sign in to continue tracking applications, building your profile, and getting matched to new roles.'}
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-white/10 bg-[#101418]/95 p-6 shadow-[0_32px_90px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-7 md:rounded-2xl lg:rounded-[2rem] lg:p-8">
              <div className="mb-6 rounded-2xl bg-slate-950/80 p-3 text-sm text-slate-300 shadow-sm shadow-black/10 md:mb-8 md:p-4">
                <div className="flex gap-3 md:gap-4">
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary md:h-11 md:w-11 md:rounded-2xl">
                    <Sparkles className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-white">Professional sign-in experience</p>
                    <p className="text-slate-400">Fast, modern authentication with secure email and OAuth access.</p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300 md:rounded-2xl md:px-4 md:py-3">
                  {error}
                </div>
              )}
              {resetMessage && (
                <div className="mb-4 rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-sm text-primary md:rounded-2xl md:px-4 md:py-3">
                  {resetMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
                {isSignup && (
                  <div>
                    <label className="mb-2 block text-xs font-medium text-slate-300 md:text-sm">Full name</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Alex Stratton"
                      className="h-10 border-white/10 bg-slate-950 text-sm focus:border-sky-500 focus:ring-sky-500/20 md:h-12"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-xs font-medium text-slate-300 md:text-sm">Email address</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@company.com"
                    className="h-10 border-white/10 bg-slate-950 text-sm focus:border-sky-500 focus:ring-sky-500/20 md:h-12"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-slate-300 md:text-sm">Password</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      required
                      className="h-10 border-white/10 bg-slate-950 pr-10 text-sm focus:border-sky-500 focus:ring-sky-500/20 md:h-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="-mt-1 flex flex-col gap-2 sm:gap-3 md:flex-row md:items-center md:justify-between">
                  <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-slate-300 md:text-sm">
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
                      className="text-left text-xs font-medium text-sky-400 transition hover:text-sky-300 md:text-sm md:text-right"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="mt-2 h-10 w-full rounded-lg text-sm font-semibold shadow-lg shadow-sky-500/20 transition hover:shadow-sky-500/30 md:h-12 md:rounded-2xl md:text-base"
                  disabled={isLoading}
                >
                  {isLoading ? 'Please wait...' : isSignup ? 'Sign Up' : 'Sign In'}
                </Button>
              </form>

              <div className="mt-5 text-center text-xs text-slate-500 md:mt-6">OR CONTINUE WITH</div>

              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 md:mt-4 md:gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => startOAuth('google')}
                  className="flex h-10 w-full items-center justify-center gap-2 border-white/10 bg-slate-950 text-sm text-slate-200 hover:bg-white/5 md:h-12 md:gap-3 md:text-base"
                >
                  <GoogleLogo />
                  <span className="hidden sm:inline">Google</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => startOAuth('github')}
                  className="flex h-10 w-full items-center justify-center gap-2 border-white/10 bg-slate-950 text-sm text-slate-200 hover:bg-white/5 md:h-12 md:gap-3 md:text-base"
                >
                  <GitHubLogo />
                  <span className="hidden sm:inline">GitHub</span>
                </Button>
              </div>

              <div className="mt-4 flex flex-col gap-2 text-center text-xs text-slate-400 md:mt-6 md:flex-row md:justify-between md:text-sm">
                <div className="md:text-left">
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
                <Dialog>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:border-sky-400 hover:bg-sky-500/10 hover:text-white md:px-4 md:text-sm"
                    >
                      Need help?
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm">
                    <DialogHeader>
                      <DialogTitle className="text-lg md:text-xl">Need help signing in?</DialogTitle>
                      <DialogDescription className="text-sm">
                        Our support team is happy to help with access, account setup, or any login issues.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3 rounded-lg border border-white/10 bg-slate-950/90 p-3 text-xs text-slate-200 md:rounded-2xl md:gap-4 md:p-4 md:text-sm">
                      <div>
                        <p className="font-semibold text-white">Ankit Kumar Singh</p>
                        <p>kumaranikant24@gmail.com</p>
                        <p>+91 74399 07360</p>
                      </div>
                      <div>
                        <p className="font-semibold text-white">Rohit Singh</p>
                        <p>rohitsingh24685@gmail.com</p>
                        <p>+91 70445 03324</p>
                      </div>
                      <div>
                        <p className="font-semibold text-white">Nawraj Singh</p>
                        <p>singhnawraj003@gmail.com</p>
                        <p>+91 79806 08611</p>
                      </div>
                    </div>
                    <DialogClose asChild>
                      <button
                        type="button"
                        className="mt-4 inline-flex w-full justify-center rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 md:mt-6 md:rounded-2xl md:py-3"
                      >
                        Close
                      </button>
                    </DialogClose>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  )
}
