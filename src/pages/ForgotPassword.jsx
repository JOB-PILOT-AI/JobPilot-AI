import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { Card, CardTitle } from '../components/ui/Card'
import { Sparkles, ArrowLeft, Mail } from 'lucide-react'

export default function ForgotPassword() {
  const { forgotPassword, isLoading, error, clearError } = useAuthStore()
  const [email, setEmail] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) return
    
    clearError()
    setSuccessMessage('')
    
    const result = await forgotPassword(email)
    if (result.success) {
      setSuccessMessage(result.message)
      setEmail('')
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <span className="font-bold text-foreground text-xl">JobPilot.AI</span>
        </div>

        <Card className="border-border bg-[#171212]/90 p-10">
          <CardTitle className="text-2xl mb-2">Reset Password</CardTitle>
          <p className="text-sm text-muted mb-6">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>}
          {successMessage && <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm flex items-start gap-3"><Mail className="shrink-0 mt-0.5" size={16} />{successMessage}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-xs font-semibold text-muted uppercase mb-2 block">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <Button type="submit" variant="primary" className="w-full" disabled={isLoading || !email}>
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm font-semibold text-primary-soft hover:underline inline-flex items-center">
              <ArrowLeft size={14} className="mr-1" /> Back to login
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}