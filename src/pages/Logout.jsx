import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import Button from '../components/ui/Button'

export default function Logout() {
  const navigate = useNavigate()
  const { logout } = useAuthStore()

  useEffect(() => {
    logout()
    const timer = window.setTimeout(() => {
      navigate('/login', { replace: true })
    }, 400)

    return () => window.clearTimeout(timer)
  }, [logout, navigate])

  return (
    <div className="min-h-screen page-shell text-foreground px-6 py-10">
      <div className="mx-auto max-w-xl rounded-[2rem] border border-white/10 bg-[#111418]/95 p-10 shadow-[0_30px_90px_rgba(0,0,0,0.25)]">
        <h1 className="text-4xl font-bold text-white">Signing you out...</h1>
        <p className="mt-4 text-base leading-7 text-secondary">
          Your session is ending and we&apos;re returning you to the login page now.
        </p>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
          <Button variant="primary" onClick={() => navigate('/login')}>
            Go to login
          </Button>
          <Button variant="outline" onClick={() => navigate('/')}>
            Return home
          </Button>
        </div>
      </div>
    </div>
  )
}
