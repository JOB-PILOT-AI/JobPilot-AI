import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { Card, CardTitle } from '../components/ui/Card'
import { Sparkles, Eye, EyeOff, CheckCircle2 } from 'lucide-react'

export default function ResetPassword() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { resetPassword, isLoading, error, clearError } = useAuthStore()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [validationError, setValidationError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearError()
    setValidationError('')
    
    if (password !== confirmPassword) {
      setValidationError("Passwords don't match")
      return
    }
    if (password.length < 6) {
      setValidationError("Password must be at least 6 characters")
      return
    }

    const result = await resetPassword(token, password)
    if (result.success) {
      setSuccessMessage(result.message)
      setTimeout(() => navigate('/login'), 3000)
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
          <CardTitle className="text-2xl mb-2">Create New Password</CardTitle>
          <p className="text-sm text-muted mb-6">Enter your new secure password below.</p>

          {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>}
          {validationError && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{validationError}</div>}
          
          {successMessage ? (
            <div className="py-4 text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20 text-green-400"><CheckCircle2 size={24} /></div>
              <p className="text-sm text-muted">{successMessage}</p>
              <p className="text-xs text-primary-soft">Redirecting to login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative">
                <label className="text-xs font-semibold text-muted uppercase mb-2 block">New Password</label>
                <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-[34px] text-muted hover:text-foreground">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted uppercase mb-2 block">Confirm Password</label>
                <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              </div>
              <Button type="submit" variant="primary" className="w-full" disabled={isLoading || !password || !confirmPassword}>
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>
          )}
          
          {!successMessage && (
            <div className="mt-6 text-center">
              <Link to="/login" className="text-sm font-semibold text-muted hover:text-foreground hover:underline inline-flex items-center">Cancel</Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}