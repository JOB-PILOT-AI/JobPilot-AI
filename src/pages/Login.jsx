import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { Card, CardTitle, CardContent } from '../components/ui/Card'
import { Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const { login, signup, isLoading, error, clearError } = useAuthStore()
  const [isSignup, setIsSignup] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  })
  const [formErrors, setFormErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const errors = {}
    if (!formData.email) errors.email = 'Email is required'
    if (!formData.password) errors.password = 'Password is required'
    if (isSignup && !formData.name) errors.name = 'Name is required'
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
      {/* Left Side - Branding & Background */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/20 to-background flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-96 h-96 bg-primary rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-primary rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">JP</span>
            </div>
            <span className="text-xl font-bold text-foreground">JobPilot.AI</span>
          </div>

          <div>
            <h1 className="text-5xl font-bold text-foreground mb-6 text-balance">
              Precision tools for career growth
            </h1>
            <p className="text-lg text-muted">
              Intelligent job matching and engineering-focused workflows designed for the
              modern professional.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center text-primary font-bold">
              94%
            </div>
            <div>
              <div className="font-semibold">Match Accuracy</div>
              <div className="text-sm text-muted">AI-powered matching</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center text-primary font-bold">
              25K
            </div>
            <div>
              <div className="font-semibold">Active Engineers</div>
              <div className="text-sm text-muted">Global community</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Logo for mobile */}
          <div className="lg:hidden flex items-center gap-2 mb-12">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">JP</span>
            </div>
            <span className="font-bold text-foreground">JobPilot.AI</span>
          </div>

          <Card className="border-0 bg-secondary/50 backdrop-blur">
            <div>
              <CardTitle className="text-2xl mb-2">Welcome Back</CardTitle>
              <p className="text-sm text-muted mb-6">
                Access your career mission control.
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
                    placeholder="••••••••"
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
              </div>

              {!isSignup && (
                <div className="flex justify-end">
                  <Link to="/forgot" className="text-xs text-primary hover:underline">
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
                <span className="px-2 bg-secondary text-muted">OR CONTINUE WITH</span>
              </div>
            </div>

            <Button variant="outline" className="w-full">
              Google Workspace
            </Button>

            <div className="mt-6 text-center text-sm text-muted">
              {isSignup ? (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignup(false)
                      setFormData({ name: '', email: '', password: '' })
                      setFormErrors({})
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
                      setFormData({ name: '', email: '', password: '' })
                      setFormErrors({})
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
              By signing in, you agree to our{' '}
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
