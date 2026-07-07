import { useEffect, useState } from 'react'
import axios from 'axios'
import { useLocation, useNavigate } from 'react-router-dom'
import { Star, ShieldCheck, Rocket, Award } from 'lucide-react'
import Button from '../components/ui/Button'
import { useAuthStore } from '../store/authStore'
import ErrorBoundary from '../components/ErrorBoundary'

export default function Upgrade() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, refreshUser, token } = useAuthStore()
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [message, setMessage] = useState('')
  const [paymentConfigured, setPaymentConfigured] = useState(null)
  const requiredFeature = location.state?.requiredFeature
  const returnPath = location.state?.from || '/dashboard'
  const subscriptionStatus = user?.subscription?.status
  const hasVerifiedSubscription =
    user?.isPro && ['authenticated', 'active'].includes(subscriptionStatus)
  const hasLegacyProAccess = user?.isPro && !hasVerifiedSubscription
  const canUseProFeatures = Boolean(user?.isPro)

  const proFeatures = [
    {
      icon: ShieldCheck,
      title: 'Advanced ATS Insights',
      description: 'Receive deeper scoring, keyword optimization, and role-fit commentary for each resume upload.',
      path: '/resume-builder?panel=ats-insights',
      cta: 'Open ATS insights',
    },
    {
      icon: Rocket,
      title: 'Priority Matching',
      description: 'Get access to higher-quality job recommendations and premium application guidance.',
      path: '/jobs',
      cta: 'Open matches',
    },
    {
      icon: Award,
      title: 'Premium Resume Themes',
      description: 'Use exclusive pro resume layouts and ATS-safe design templates.',
      path: '/resume-builder?panel=themes&template=executive',
      cta: 'Open themes',
    },
    {
      icon: Star,
      title: 'Career Growth Support',
      description: 'Unlock better practice tests, interview preparation, and tracker analytics.',
      path: '/interview-prep?source=career-growth',
      cta: 'Open support',
    },
  ]

  useEffect(() => {
    if (!token) return
    axios.get('/api/payments/config')
      .then((response) => setPaymentConfigured(Boolean(response.data?.configured)))
      .catch(() => setPaymentConfigured(false))
  }, [token])

  const handleUpgrade = async () => {
    setIsUpgrading(true)
    setMessage('')
    try {
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://checkout.razorpay.com/v1/checkout.js'
          script.onload = resolve
          script.onerror = () => reject(new Error('Secure checkout could not load.'))
          document.head.appendChild(script)
        })
      }
      const { data } = await axios.post('/api/payments/subscription')
      const checkout = new window.Razorpay({
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: 'JobPilot.AI',
        description: 'JobPilot Pro — ₹499/month',
        prefill: { name: data.name, email: data.email },
        theme: { color: '#b64f52' },
        modal: {
          confirm_close: true,
          ondismiss: () => {
            setMessage('Checkout closed. You have not been charged.')
            setIsUpgrading(false)
          },
        },
        handler: async (payment) => {
          try {
            await axios.post('/api/payments/subscription/verify', payment)
            await refreshUser()
            setMessage('Payment verified. JobPilot Pro is now active!')
            if (returnPath && returnPath !== '/upgrade') navigate(returnPath, { replace: true })
          } catch (error) {
            setMessage(error.response?.data?.message || 'Payment verification failed. Please contact support with your payment ID.')
          } finally {
            setIsUpgrading(false)
          }
        },
      })
      checkout.on('payment.failed', (response) => {
        setMessage(response.error?.description || 'Payment failed. No Pro access was activated.')
        setIsUpgrading(false)
      })
      checkout.open()
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || 'Secure checkout could not start.')
      setIsUpgrading(false)
    }
  }

  const handleFeatureClick = (feature) => {
    if (canUseProFeatures) {
      navigate(feature.path, {
        state: {
          from: '/upgrade',
          requiredFeature: feature.title,
        },
      })
      return
    }

    setMessage(`${feature.title} is a Pro feature. Go and upgrade with JobPilot Pro to unlock it, then you can use this benefit right away.`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen page-shell text-foreground px-6 py-10">
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="rounded-[2rem] border border-white/10 bg-[#0b1118]/95 p-10 shadow-[0_28px_90px_rgba(0,0,0,0.24)]">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-3 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                  <Star size={16} /> {hasVerifiedSubscription ? 'JobPilot Pro Active' : hasLegacyProAccess ? 'Legacy Pro Access' : 'JobPilot Pro'}
                </div>
                <h1 className="mt-6 text-5xl font-semibold text-white">Upgrade to Pro</h1>
                <p className="mt-4 max-w-3xl text-lg leading-8 text-secondary">
                  {requiredFeature
                    ? `${requiredFeature} is available for Pro members only. Upgrade to continue.`
                    : 'Unlock premium ATS intelligence, expanded job matching, and priority career guidance.'}
                </p>
                <div className="mt-6 flex items-end gap-2">
                  <span className="text-5xl font-semibold text-white">₹499</span>
                  <span className="pb-1 text-sm text-secondary">/month · recurring</span>
                </div>
                <p className="mt-2 text-xs text-secondary">Cancel according to the subscription terms shown during secure checkout.</p>
                {hasLegacyProAccess && (
                  <div className="mt-4 max-w-xl rounded-xl border border-amber-300/20 bg-amber-300/[0.06] px-4 py-3 text-sm leading-6 text-amber-100">
                    Your account has legacy Pro access but no verified billing subscription. Complete checkout to activate the ₹499 monthly plan.
                  </div>
                )}
                {paymentConfigured === false && (
                  <div className="mt-4 max-w-xl rounded-xl border border-red-400/20 bg-red-500/[0.06] px-4 py-3 text-sm leading-6 text-red-100">
                    Secure checkout is not configured on the server yet. Add the Razorpay Test Mode keys, monthly plan ID, and webhook secret to the server environment, then restart it.
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleUpgrade}
                  disabled={isUpgrading || !token || hasVerifiedSubscription || paymentConfigured !== true}
                >
                  {isUpgrading
                    ? 'Opening secure checkout...'
                    : paymentConfigured === null
                      ? 'Checking payment setup...'
                      : paymentConfigured === false
                        ? 'Payment Setup Required'
                        : hasVerifiedSubscription
                      ? 'Pro Subscription Active'
                      : hasLegacyProAccess
                        ? 'Activate ₹499 Subscription'
                        : 'Subscribe for ₹499/month'}
                </Button>
                <Button variant="outline" size="lg" onClick={() => navigate('/dashboard')}>
                  Back to Dashboard
                </Button>
              </div>
            </div>
            {message && <div className="mt-6 rounded-2xl border border-white/10 bg-[#111418] px-6 py-4 text-sm text-foreground">{message}</div>}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {proFeatures.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => handleFeatureClick(item)}
                  className="group rounded-[1.5rem] border border-white/10 bg-[#111417] p-6 text-left shadow-[0_20px_60px_rgba(0,0,0,0.18)] transition hover:-translate-y-1 hover:border-primary/40 hover:bg-[#151922] focus:outline-none focus:ring-2 focus:ring-primary/50"
                  aria-label={`${canUseProFeatures ? item.cta : `Upgrade to use ${item.title}`}`}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                    <Icon size={24} />
                  </div>
                  <h2 className="mt-4 text-xl font-semibold text-white">{item.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-secondary">{item.description}</p>
                  <div className="mt-5 text-sm font-semibold text-primary transition group-hover:text-white">
                    {canUseProFeatures ? item.cta : 'Upgrade to use this'}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}
