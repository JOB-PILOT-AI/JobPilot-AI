import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LockKeyhole, Sparkles } from 'lucide-react'
import Button from './ui/Button'
import { useAuthStore } from '../store/authStore'

export default function ProRoute() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, token, isHydrated } = useAuthStore()
  const featureName = location.pathname.includes('mock-interview')
    ? 'Mock Interview'
    : location.pathname.includes('practice-test')
      ? 'Practice Test'
      : 'Exam Prep'

  if (!isHydrated) {
    return null
  }

  if (!user || !token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (!user.isPro) {
    return (
      <div className="mx-auto flex min-h-[62vh] max-w-3xl items-center justify-center px-4">
        <div className="w-full rounded-2xl border border-primary/30 bg-[#0b1118]/95 p-8 text-center shadow-[0_28px_90px_rgba(0,0,0,0.28)] sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <LockKeyhole size={26} />
          </div>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            <Sparkles size={14} />
            Pro required
          </div>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Take Pro to use {featureName}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-secondary">
            This feature is only available for JobPilot Pro members. Upgrade your account to unlock mock interviews, practice tests, and premium exam preparation.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              variant="primary"
              size="lg"
              onClick={() =>
                navigate('/upgrade', {
                  state: {
                    from: location.pathname,
                    requiredFeature: featureName,
                  },
                })
              }
            >
              Go and Take Pro
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return <Outlet />
}
