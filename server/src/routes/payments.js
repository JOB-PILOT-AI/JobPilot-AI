import crypto from 'crypto'
import express from 'express'
import User from '../models/User.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()
const API_BASE = 'https://api.razorpay.com/v1'
const PRICE_PAISE = 49900

const configured = () =>
  Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_PLAN_ID)

const safeEqual = (left, right) => {
  const leftBuffer = Buffer.from(String(left || ''), 'utf8')
  const rightBuffer = Buffer.from(String(right || ''), 'utf8')
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer)
}

const razorpayRequest = async (path, options = {}) => {
  const authorization = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64')
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Basic ${authorization}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data?.error?.description || 'Razorpay request failed')
  return data
}

router.get('/config', authenticateToken, (req, res) => {
  res.json({
    configured: configured(),
    keyId: configured() ? process.env.RAZORPAY_KEY_ID : '',
    plan: {
      name: 'JobPilot Pro',
      amount: PRICE_PAISE,
      currency: 'INR',
      interval: 'month',
      displayPrice: '₹499',
    },
  })
})

router.post('/subscription', authenticateToken, async (req, res) => {
  try {
    if (!configured()) {
      return res.status(503).json({ message: 'Payments are not configured yet. Add Razorpay test credentials and a monthly plan ID.' })
    }
    const user = await User.findById(req.user.userId)
    if (!user) return res.status(404).json({ message: 'User not found' })
    if (user.isPro && ['authenticated', 'active'].includes(user.subscription?.status)) {
      return res.status(409).json({ message: 'Your Pro subscription is already active.' })
    }
    if (user.subscription?.status === 'created' && user.subscription?.subscriptionId) {
      return res.json({
        subscriptionId: user.subscription.subscriptionId,
        keyId: process.env.RAZORPAY_KEY_ID,
        amount: PRICE_PAISE,
        currency: 'INR',
        name: user.name,
        email: user.email,
      })
    }

    const plan = await razorpayRequest(`/plans/${encodeURIComponent(process.env.RAZORPAY_PLAN_ID)}`)
    const planIsCorrect =
      Number(plan?.item?.amount) === PRICE_PAISE &&
      plan?.item?.currency === 'INR' &&
      plan?.period === 'monthly' &&
      Number(plan?.interval) === 1
    if (!planIsCorrect) {
      return res.status(503).json({
        message: 'The configured plan must be exactly ₹499 INR billed once per month. Check RAZORPAY_PLAN_ID.',
      })
    }

    const subscription = await razorpayRequest('/subscriptions', {
      method: 'POST',
      body: JSON.stringify({
        plan_id: process.env.RAZORPAY_PLAN_ID,
        total_count: Math.max(1, Math.min(100, Number(process.env.RAZORPAY_TOTAL_COUNT) || 60)),
        quantity: 1,
        customer_notify: true,
        notes: {
          userId: String(user._id),
          product: 'JobPilot Pro',
        },
      }),
    })

    user.subscription = {
      provider: 'razorpay',
      subscriptionId: subscription.id,
      planId: process.env.RAZORPAY_PLAN_ID,
      status: subscription.status || 'created',
    }
    await user.save()
    res.json({
      subscriptionId: subscription.id,
      keyId: process.env.RAZORPAY_KEY_ID,
      amount: PRICE_PAISE,
      currency: 'INR',
      name: user.name,
      email: user.email,
    })
  } catch (error) {
    res.status(502).json({ message: error.message || 'Could not create subscription.' })
  }
})

router.post('/subscription/verify', authenticateToken, async (req, res) => {
  try {
    const { razorpay_payment_id: paymentId, razorpay_subscription_id: subscriptionId, razorpay_signature: signature } = req.body || {}
    const user = await User.findById(req.user.userId)
    if (!user || !paymentId || !subscriptionId || !signature) {
      return res.status(400).json({ message: 'Incomplete payment verification details.' })
    }
    if (user.subscription?.subscriptionId !== subscriptionId) {
      return res.status(400).json({ message: 'Subscription does not belong to this account.' })
    }
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${paymentId}|${subscriptionId}`)
      .digest('hex')
    if (!safeEqual(expected, signature)) {
      return res.status(400).json({ message: 'Payment signature verification failed.' })
    }

    user.isPro = true
    user.subscription.status = 'authenticated'
    user.subscription.lastPaymentId = paymentId
    user.subscription.activatedAt = new Date()
    await user.save()
    res.json({ success: true, message: 'JobPilot Pro is active.' })
  } catch (error) {
    res.status(500).json({ message: 'Could not verify subscription.' })
  }
})

export const razorpayWebhook = async (req, res) => {
  try {
    if (!process.env.RAZORPAY_WEBHOOK_SECRET) return res.status(503).send('Webhook not configured')
    const signature = req.get('x-razorpay-signature')
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET).update(req.body).digest('hex')
    if (!safeEqual(expected, signature)) return res.status(400).send('Invalid signature')

    const payload = JSON.parse(req.body.toString('utf8'))
    const subscription = payload.payload?.subscription?.entity
    if (!subscription?.id) return res.status(200).json({ received: true })
    const user = await User.findOne({ 'subscription.subscriptionId': subscription.id })
    if (!user) return res.status(200).json({ received: true })

    const activeStatuses = new Set(['authenticated', 'active'])
    const inactiveStatuses = new Set(['cancelled', 'completed', 'halted', 'paused'])
    user.subscription.status = subscription.status
    if (subscription.current_start) user.subscription.currentStart = new Date(subscription.current_start * 1000)
    if (subscription.current_end) user.subscription.currentEnd = new Date(subscription.current_end * 1000)
    if (activeStatuses.has(subscription.status)) user.isPro = true
    if (inactiveStatuses.has(subscription.status)) user.isPro = false
    if (subscription.status === 'cancelled') user.subscription.cancelledAt = new Date()
    await user.save()
    res.json({ received: true })
  } catch (error) {
    res.status(400).send('Webhook processing failed')
  }
}

export default router
