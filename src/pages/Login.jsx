import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { Card, CardTitle, CardContent } from '../components/ui/Card'
import { BarChart3, Eye, EyeOff, Sparkles, Github } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const { login, signup, isLoading, error, clearError } = useAuthStore()
  const [isSignup, setIsSignup] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [formErrors, setFormErrors] = useState({})
  const [strength, setStrength] = useState(0)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }))
    }

    // Calculate password strength in real-time
    if (name === 'password' && isSignup) {
      let score = 0
      if (value.length >= 8) score += 1
      if (/[A-Z]/.test(value)) score += 1
      if (/[0-9]/.test(value)) score += 1
      if (/[^A-Za-z0-9]/.test(value)) score += 1
      setStrength(score)
    }
  }

  const validateForm = () => {
    const errors = {}
    if (!formData.email) errors.email = 'Email is required'
    if (!formData.password) errors.password = 'Password is required'
    if (isSignup) {
      if (!formData.name) errors.name = 'Name is required'
      if (formData.password !== formData.confirmPassword) errors.confirmPassword = 'Passwords do not match'
    }
    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errors = validateForm()
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    clearError()

    if (isSignup) {
      const result = await signup(formData.name, formData.email, formData.password)
      if (result.success) {
        navigate('/dashboard')
      }
    } else {
      const result = await login(formData.email, formData.password)
      if (result.success) {
        navigate('/dashboard')
      }
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      <div className="relative hidden overflow-hidden border-r border-border lg:flex lg:w-[46%] flex-col justify-between p-12">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(182,77,80,0.22),transparent_42%),radial-gradient(circle_at_35%_45%,rgba(255,165,169,0.16),transparent_24rem)]" />
        <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:54px_54px]" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-primary rounded-md flex items-center justify-center">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <span className="block text-xl font-bold text-foreground">JobPilot.AI</span>
              <span className="text-xs uppercase tracking-[0.22em] text-muted">System: Active</span>
            </div>
          </div>

          <div>
            <h1 className="max-w-xl text-6xl font-bold tracking-tight text-foreground mb-8 text-balance">
              Precision tools for career growth
            </h1>
            <p className="max-w-xl text-xl leading-8 text-muted">
              Intelligent job matching and engineering-focused workflows designed for the
              modern professional.
            </p>
          </div>
        </div>

        <div className="relative z-10 max-w-md rounded-lg border border-border bg-[#171212]/80 p-8 backdrop-blur">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Match strength</div>
              <div className="mt-2 text-5xl font-bold text-primary-soft">94%</div>
            </div>
            <BarChart3 className="text-primary-soft" />
          </div>
          <div className="mt-8 space-y-5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Engine Status</span>
              <span className="font-semibold text-accent">Active</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Daily Analysis</span>
              <span className="font-semibold text-foreground">142 roles</span>
            </div>
            <div className="rounded-sm bg-[#101010] p-4">
              <div className="mb-3 text-xs uppercase tracking-[0.14em] text-muted">ATS Keyword Analysis</div>
              <div className="flex flex-wrap gap-2">
                <span className="bg-tertiary px-2 py-1 text-xs">Distributed Systems</span>
                <span className="bg-tertiary px-2 py-1 text-xs">Cloud Architecture</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-12">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="font-bold text-foreground">JobPilot.AI</span>
          </div>

          <Card className="border-border bg-[#171212]/90 p-10">
            <div>
              <CardTitle className="text-2xl mb-2">
                {isSignup ? 'Create your account' : 'Welcome Back'}
              </CardTitle>
              <p className="text-sm text-muted mb-6">
                {isSignup ? 'Join the career intelligence platform for modern engineers.' : 'Access your career mission control.'}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignup && (
                <div>
                  <label className="text-xs font-semibold text-muted uppercase mb-2 block">
                    Full Name
                  </label>
                  <Input
                    name="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    error={formErrors.name}
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-muted uppercase mb-2 block">
                  Email Address
                </label>
                <Input
                  name="email"
                  type="email"
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={handleChange}
                  error={formErrors.email}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted uppercase mb-2 block">
                  Password
                </label>
                <div className="relative">
                  <Input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={isSignup ? "Create a secure password" : "••••••••"}
                    value={formData.password}
                    onChange={handleChange}
                    error={formErrors.password}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted hover:text-foreground"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                
                {/* Password Strength Meter */}
                {isSignup && formData.password && (
                  <div className="mt-3">
                    <div className="flex gap-1 h-1.5 w-full rounded-full overflow-hidden bg-tertiary">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-full w-1/4 transition-all duration-300 ${
                            strength >= level
                              ? strength === 1 ? 'bg-red-500'
                              : strength === 2 ? 'bg-orange-400'
                              : strength === 3 ? 'bg-yellow-400'
                              : 'bg-green-500'
                              : 'bg-transparent'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between items-center mt-1.5">
                      <p className="text-[11px] text-muted">
                        Use 8+ chars, mix letters, numbers & symbols.
                      </p>
                      <p className="text-[11px] font-medium text-right">
                        {strength === 0 && <span className="text-red-500">Very Weak</span>}
                        {strength === 1 && <span className="text-red-500">Weak</span>}
                        {strength === 2 && <span className="text-orange-400">Fair</span>}
                        {strength === 3 && <span className="text-yellow-400">Good</span>}
                        {strength === 4 && <span className="text-green-500">Strong</span>}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              {isSignup && (
                <div>
                  <label className="text-xs font-semibold text-muted uppercase mb-2 block">
                    Confirm Password
                  </label>
                  <Input
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    error={formErrors.confirmPassword}
                  />
                </div>
              )}

              {!isSignup && (
                <div className="flex justify-end">
                  <Link to="/forgot" className="text-xs font-semibold uppercase tracking-wide text-primary-soft hover:underline">
                    Forgot password?
                  </Link>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : isSignup ? 'Create Account' : 'Sign In'}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#171212] text-muted">
                  {isSignup ? 'OR SIGN UP WITH' : 'OR CONTINUE WITH'}
                </span>
              </div>
            </div>

          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-center gap-2"
              type="button"
              onClick={() => {
                const clientId = 'Ov23liyOm6IN25tXfJoC';
                const redirectUri = window.location.origin + '/auth/github/callback';
                window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email`;
              }}
            >
              <Github size={18} />
              GitHub
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-center gap-2"
              type="button"
              onClick={() => {
                const clientId = '228813641025-ouq3lac99qqcbuod8kplb17ifcbt5khe.apps.googleusercontent.com';
                const redirectUri = window.location.origin + '/auth/google/callback';
                window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=email profile`;
              }}
            >
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </Button>
          </div>

            <div className="mt-6 text-center text-sm text-muted">
              {isSignup ? (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignup(false)
                      setFormData({ name: '', email: '', password: '', confirmPassword: '' })
                      setFormErrors({})
                      setStrength(0)
                      clearError()
                    }}
                    className="text-primary hover:underline font-semibold"
                  >
                    Sign in
                  </button>
                </>
              ) : (
                <>
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignup(true)
                      setFormData({ name: '', email: '', password: '', confirmPassword: '' })
                      setFormErrors({})
                      setStrength(0)
                      clearError()
                    }}
                    className="text-primary hover:underline font-semibold"
                  >
                    Sign up
                  </button>
                </>
              )}
            </div>
          </Card>

          <div className="mt-6 text-center text-xs text-muted">
            <p>
              By {isSignup ? 'signing up' : 'signing in'}, you agree to our{' '}
              <a href="#" className="text-primary hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-primary hover:underline">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
