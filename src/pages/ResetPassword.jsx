import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { Card, CardTitle, CardContent } from '../components/ui/Card'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '../components/ui/dialog'
import { useAuthStore } from '../store/authStore'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { token } = useParams()
  const tokenParam = token || searchParams.get('token') || ''
  const { forgotPassword, resetPassword, isLoading, error, clearError } = useAuthStore()
  const initialEmail = searchParams.get('email') || ''
  const isResetMode = Boolean(tokenParam)
  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [devResetLink, setDevResetLink] = useState('')

  const title = useMemo(
    () => (isResetMode ? 'Reset your password' : 'Forgot password'),
    [isResetMode]
  )

  const description = useMemo(
    () => (isResetMode
      ? 'Set a strong new password for your account. This link is valid for 1 hour.'
      : 'Enter your account email and we’ll send you a secure reset link.'
    ),
    [isResetMode]
  )

  const handleSubmit = async (event) => {
    event.preventDefault()
    clearError()
    setMessage('')
    setDevResetLink('')

    if (isResetMode) {
      const result = await resetPassword(tokenParam, password)
      if (result.success) {
        setMessage('Password reset successfully. Redirecting to login...')
        setTimeout(() => navigate('/login'), 900)
      }
      return
    }

    const result = await forgotPassword(email)
    if (result.success) {
      setMessage(result.data?.message || 'If you registered with this email, a reset link will be sent.')
      setDevResetLink(result.data?.resetLink || '')
    }
  }

  return (
    <div className="min-h-screen page-shell text-foreground">
      <div className="mx-auto flex min-h-screen max-w-[1440px] flex-col lg:flex-row">
        <aside className="relative hidden w-full max-w-[48%] flex-col justify-between overflow-hidden border-r border-white/10 bg-[#07090c] px-10 py-12 lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.14),_transparent_40%)]" />
          <div className="relative z-10">
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-sky-500/20 bg-sky-500/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-sky-200">
              PASSWORD RECOVERY
            </div>
            <h1 className="text-5xl font-semibold tracking-tight text-white">Secure reset flow for your account</h1>
            <p className="mt-6 max-w-xl text-sm leading-7 text-slate-400">
              Keep your access protected with one-time reset links and intelligent validation.
            </p>
          </div>

          <div className="relative z-10 grid gap-5 rounded-[2rem] border border-white/10 bg-slate-950/85 p-8 shadow-2xl shadow-black/20">
            <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Session health</div>
            <div className="text-5xl font-semibold text-white">99.8%</div>
            <div className="grid gap-2 text-sm text-slate-400">
              <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                <span>Active sessions</span>
                <span className="text-sky-300">2 devices</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                <span>Recent logins</span>
                <span className="text-slate-300">Today</span>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex w-full flex-1 items-center justify-center px-6 py-12 sm:px-12 lg:px-16">
          <div className="w-full max-w-md">
            <div className="mb-10">
              <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Password assistance</p>
              <h2 className="mt-4 text-3xl font-semibold text-white">{title}</h2>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-slate-900/95 p-8 shadow-2xl shadow-black/30">
              <div className="mb-8">
                <p className="text-sm text-slate-400">{description}</p>
              </div>

              {error && (
                <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}
              {message && (
                <div className="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                  {message}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {!isResetMode && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">Email address</label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="name@company.com"
                      className="h-12 border-white/10 bg-slate-950 focus:border-sky-500 focus:ring-sky-500/20"
                      required
                    />
                  </div>
                )}

                {isResetMode && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">New password</label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Minimum 6 characters"
                      minLength={6}
                      className="h-12 border-white/10 bg-slate-950 focus:border-sky-500 focus:ring-sky-500/20"
                      required
                    />
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  className="mt-2 h-12 w-full rounded-2xl text-base font-semibold shadow-lg shadow-sky-500/20 transition hover:shadow-sky-500/30"
                  disabled={isLoading}
                >
                  {isLoading ? 'Please wait...' : isResetMode ? 'Reset Password' : 'Send Reset Link'}
                </Button>
              </form>

              {devResetLink && (
                <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-900/80 p-4 text-xs text-slate-300">
                  <div className="mb-2 font-semibold text-foreground">Development reset link</div>
                  <a className="break-all text-sky-300 hover:underline" href={devResetLink}>
                    {devResetLink}
                  </a>
                </div>
              )}

              <div className="mt-8 flex flex-col items-center gap-3 text-center text-sm text-slate-400 sm:flex-row sm:justify-between sm:text-left">
                <div>
                  {isResetMode ? (
                    <button
                      type="button"
                      onClick={() => navigate('/login')}
                      className="font-semibold text-white underline decoration-slate-700 decoration-2 underline-offset-4 hover:text-sky-300"
                    >
                      Back to login
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => navigate('/login')}
                      className="font-semibold text-white underline decoration-slate-700 decoration-2 underline-offset-4 hover:text-sky-300"
                    >
                      Return to login
                    </button>
                  )}
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-sky-400 hover:bg-sky-500/10 hover:text-white"
                    >
                      Need help?
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Need help with account access?</DialogTitle>
                      <DialogDescription>
                        Contact one of our support specialists if you need help with password reset or login.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 rounded-2xl border border-white/10 bg-slate-950/90 p-4 text-sm text-slate-200">
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
                        className="mt-6 inline-flex w-full justify-center rounded-2xl bg-slate-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
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
