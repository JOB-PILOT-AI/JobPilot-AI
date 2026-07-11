import { useEffect, useState } from 'react'
import axios from 'axios'
import { useLocation, useNavigate } from 'react-router-dom'
import { Star, ShieldCheck, Rocket, Award, CalendarDays } from 'lucide-react'
import Button from '../components/ui/Button'
import { useAuthStore } from '../store/authStore'
import ErrorBoundary from '../components/ErrorBoundary'

export default function Upgrade() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, refreshUser, token } = useAuthStore()
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [isStartingTrial, setIsStartingTrial] = useState(false)
  const [message, setMessage] = useState('')
  const [paymentConfigured, setPaymentConfigured] = useState(null)
  const [trialInfo, setTrialInfo] = useState({ days: 30, active: false, available: true, endsAt: null })
  const requiredFeature = location.state?.requiredFeature
  const returnPath = location.state?.from || '/dashboard'
  const subscriptionStatus = user?.subscription?.status
  const hasVerifiedSubscription =
    user?.isPro && ['authenticated', 'active'].includes(subscriptionStatus)
  const hasLegacyProAccess = user?.isPro && !hasVerifiedSubscription
  const canUseProFeatures = Boolean(user?.isPro)
  const isTrialCandidate = !user?.isPro && user?.subscription?.provider !== 'trial'
  const showTrialButton = isTrialCandidate && !hasVerifiedSubscription
  const trialEndDate = trialInfo.endsAt ? new Date(trialInfo.endsAt).toLocaleDateString() : null

  const proFeatures = [
    {
      icon: Rocket,
      title: 'Branding Toolkit',
      description: 'Generate a compelling resume headline and LinkedIn summary for your target role.',
      path: '/branding-toolkit',
      cta: 'Open branding toolkit',
    },
    {
      icon: CalendarDays,
      title: 'Interview Scheduling',
      description: 'Book recommended interview slots and keep your preparation on schedule.',
      path: '/interview-scheduling',
      cta: 'Open interview scheduling',
    },
    {
      icon: Award,
      title: 'Recruiter Access',
      description: 'Request referrals and connect with recruiters who specialize in your target role.',
      path: '/recruiter-access',
      cta: 'Open recruiter access',
    },
    {
      icon: Star,
      title: 'Salary Guidance',
      description: 'Compare market compensation ranges and prepare stronger negotiation positions.',
      path: '/salary-guidance',
      cta: 'Open salary guidance',
    },
  ]

  useEffect(() => {
    if (!token) return
    axios.get('/api/payments/config')
      .then((response) => {
        setPaymentConfigured(Boolean(response.data?.configured))
        setTrialInfo({
          days: Number(response.data?.trial?.days || 30),
          active: Boolean(response.data?.trial?.active),
          available: Boolean(response.data?.trial?.available),
          endsAt: response.data?.trial?.endsAt || null,
        })
      })
      .catch(() => {
        setPaymentConfigured(false)
      })
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

  const handleStartTrial = async () => {
    setIsStartingTrial(true)
    setMessage('')
    try {
      const { data } = await axios.post('/api/payments/trial')
      await refreshUser()
      setMessage(`Your free ${data.trialDays}-day trial is active until ${new Date(data.trialEndsAt).toLocaleDateString()}.`)
      if (returnPath && returnPath !== '/upgrade') {
        navigate(returnPath, { replace: true })
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not start free trial. Please try again.')
    } finally {
      setIsStartingTrial(false)
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
        <div className="mx-auto max-w-6xl space-y-10">
          <section className="rounded-[2rem] border border-white/10 bg-[#0b1118]/95 p-8 shadow-[0_28px_90px_rgba(0,0,0,0.24)] lg:p-10">
            <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:items-start">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-3 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                  <Star size={16} /> {hasVerifiedSubscription ? 'JobPilot Pro Active' : hasLegacyProAccess ? 'Legacy Pro Access' : 'JobPilot Pro'}
                </div>
                <div>
                  <h1 className="text-5xl font-semibold tracking-tight text-white sm:text-6xl">Upgrade to Pro</h1>
                  <p className="mt-5 max-w-2xl text-lg leading-8 text-secondary">
                    {requiredFeature
                      ? `${requiredFeature} is available for Pro members only. Upgrade to continue.`
                      : 'Unlock premium ATS intelligence, expanded job matching, and priority career guidance for faster hiring outcomes.'}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-end">
                  <div className="rounded-[1.75rem] bg-[#111418] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
                    <p className="text-sm uppercase tracking-[0.3em] text-secondary">Pro plan</p>
                    <div className="mt-4 flex items-end gap-3">
                      <span className="text-5xl font-semibold text-white">₹499</span>
                      <span className="pb-1 text-sm text-secondary">/month · recurring</span>
                    </div>
                    <p className="mt-3 text-sm text-secondary">Cancel anytime through secure checkout terms.</p>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-[1.5rem] border border-white/10 bg-[#111418] p-5 text-sm text-secondary">
                      Secure checkout is not configured on the server yet. Add the Razorpay Test Mode keys, monthly plan ID, and webhook secret to the server environment, then restart it.
                    </div>
                    {paymentConfigured === false && (
                      <div className="rounded-[1.5rem] border border-red-400/20 bg-red-500/[0.06] p-5 text-sm text-red-100">
                        Payment setup is required before Pro checkout can complete.
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-white/10 bg-[#111418] p-5 text-sm text-secondary">
                    <p className="font-semibold text-white">Free trial</p>
                    <p className="mt-2">{trialInfo.days}-day trial available for new users.</p>
                  </div>
                  <div className="rounded-[1.5rem] border border-white/10 bg-[#111418] p-5 text-sm text-secondary">
                    <p className="font-semibold text-white">Priority support</p>
                    <p className="mt-2">Access priority career guidance and premium match insights.</p>
                  </div>
                </div>
              </div>

              <aside className="space-y-6">
                <div className="rounded-[1.75rem] border border-white/10 bg-[#111418] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
                  <div className="mb-4 text-sm uppercase tracking-[0.3em] text-secondary">Join Pro</div>
                  <div className="space-y-4">
                    {showTrialButton && (
                      <Button
                        variant="secondary"
                        size="lg"
                        onClick={handleStartTrial}
                        disabled={isStartingTrial || !token || hasVerifiedSubscription}
                        className="w-full"
                      >
                        {isStartingTrial ? 'Starting free trial...' : `Start ${trialInfo.days}-day free trial`}
                      </Button>
                    )}
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleUpgrade}
                      disabled={isUpgrading || !token || hasVerifiedSubscription || paymentConfigured !== true}
                      className="w-full"
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
                    <Button variant="outline" size="lg" className="w-full" onClick={() => navigate('/dashboard')}>
                      Back to Dashboard
                    </Button>
                  </div>
                </div>

                {(trialInfo.active || (!trialInfo.active && trialInfo.available)) && (
                  <div className={`rounded-[1.75rem] border p-5 text-sm ${trialInfo.active ? 'border-emerald-300/20 bg-emerald-300/[0.08] text-emerald-100' : 'border-primary/20 bg-primary/5 text-primary'}`}>
                    <p className="font-semibold text-white">{trialInfo.active ? 'Trial Active' : 'Free trial available'}</p>
                    <p className="mt-2">
                      {trialInfo.active
                        ? `Your free trial is active until ${trialEndDate}. Enjoy Pro access while it lasts.`
                        : `Start a free ${trialInfo.days}-day trial now and access Pro features immediately.`}
                    </p>
                  </div>
                )}

                {hasLegacyProAccess && (
                  <div className="rounded-[1.75rem] border border-amber-300/20 bg-amber-300/[0.08] p-5 text-sm text-amber-100">
                    Your account has legacy Pro access but no verified billing subscription. Complete checkout to activate the ₹499 monthly plan.
                  </div>
                )}
              </aside>
            </div>

            {message && (
              <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-[#111418] px-6 py-5 text-sm text-foreground">
                {message}
              </div>
            )}
          </section>

          <section className="grid gap-6 md:grid-cols-2">
            {proFeatures.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => handleFeatureClick(item)}
                  className="group rounded-[1.75rem] border border-white/10 bg-[#111417] p-6 text-left shadow-[0_20px_60px_rgba(0,0,0,0.18)] transition hover:-translate-y-1 hover:border-primary/40 hover:bg-[#151922] focus:outline-none focus:ring-2 focus:ring-primary/50"
                  aria-label={`${canUseProFeatures ? item.cta : `Upgrade to use ${item.title}`}`}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                    <Icon size={24} />
                  </div>
                  <h2 className="mt-5 text-xl font-semibold text-white">{item.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-secondary">{item.description}</p>
                  <div className="mt-5 text-sm font-semibold text-primary transition group-hover:text-white">
                    {canUseProFeatures ? item.cta : 'Upgrade to use this'}
                  </div>
                </button>
              )
            })}
          </section>
        </div>
      </div>
    </ErrorBoundary>
  )
}
