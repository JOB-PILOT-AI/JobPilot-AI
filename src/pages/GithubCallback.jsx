import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Loader2 } from 'lucide-react'

export default function GithubCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { githubLogin } = useAuthStore()
  const code = searchParams.get('code')
  const isProcessed = useRef(false)

  useEffect(() => {
    if (!code || isProcessed.current) return
    isProcessed.current = true

    const authenticate = async () => {
      const result = await githubLogin(code)
      if (result?.success) {
        navigate('/dashboard')
      } else {
        navigate('/login')
      }
    }

    authenticate()
  }, [code, navigate, githubLogin])

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <Loader2 className="h-8 w-8 text-primary animate-spin" />
      <p className="text-sm font-semibold tracking-wide text-muted uppercase">
        Authenticating with GitHub...
      </p>
    </div>
  )
}