import express from 'express'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import User from '../models/User.js'
import Resume from '../models/Resume.js'
import Application from '../models/Application.js'
import CareerAsset from '../models/CareerAsset.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()
const getJwtSecret = () => process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? undefined : 'your-secret-key')

const createToken = (user) =>
  jwt.sign(
    { userId: user._id, email: user.email },
    getJwtSecret(),
    { expiresIn: '7d' }
  )

const computeIsPro = (user) => {
  const isVerifiedSubscription = ['authenticated', 'active'].includes(user?.subscription?.status)
  const isTrialActive =
    user?.subscription?.status === 'trial' &&
    user?.subscription?.currentEnd &&
    new Date(user.subscription.currentEnd) > new Date()

  return Boolean(user?.isPro || isVerifiedSubscription || isTrialActive)
}

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  isPro: computeIsPro(user),
  subscription: user.subscription || null,
  location: user.location || '',
  currentRole: user.currentRole || '',
  yearsExperience: user.yearsExperience || 0,
  notificationPreferences: user.notificationPreferences,
  privacyPreferences: user.privacyPreferences,
})

const getAppUrl = (req) => {
  const requestOrigin = req.get('origin')
  if (process.env.NODE_ENV !== 'production' && requestOrigin) {
    return requestOrigin.replace(/\/$/, '')
  }

  const configuredUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || process.env.VITE_CLIENT_URL
  if (configuredUrl) return configuredUrl.replace(/\/$/, '')

  return `${req.protocol}://${req.get('host')}`.replace(/:\d+$/, ':5174')
}

const getSafeNextPath = (value) => {
  if (!value || typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) {
    return '/dashboard'
  }

  return value
}

const redirectWithAuth = (req, res, user) => {
  const token = createToken(user)
  const next = getSafeNextPath(req.query.state)
  const params = new URLSearchParams({
    token,
    user: JSON.stringify(publicUser(user)),
    next,
  })
  res.redirect(`${getAppUrl(req)}/login?${params.toString()}`)
}

const sendPasswordResetEmail = async ({ to, resetUrl }) => {
  if (!process.env.RESEND_API_KEY) {
    console.log('Password reset link:', resetUrl)
    return
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'JobPilot.AI <onboarding@resend.dev>',
      to,
      subject: 'Reset your JobPilot.AI password',
      html: `<p>Reset your JobPilot.AI password using this link:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 1 hour.</p>`,
    }),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(`Failed to send reset email: ${message}`)
  }
}

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' })
    }

    const user = new User({ name, email, password })
    await user.save()

    res.status(201).json({
      user: publicUser(user),
      token: createToken(user),
    })
  } catch (err) {
    res.status(500).json({ message: 'Signup failed', error: err.message })
  }
})

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' })
    }

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    if (!user.password) {
      return res.status(401).json({ message: 'Please sign in with your social account or reset your password.' })
    }

    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    res.json({
      user: publicUser(user),
      token: createToken(user),
    })
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message })
  }
})

router.get('/google', (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: `${getAppUrl(req)}/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    prompt: 'select_account',
    state: getSafeNextPath(req.query.next),
  })

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`)
})

router.get('/google/callback', async (req, res) => {
  try {
    const redirectUri = `${getAppUrl(req)}/auth/google/callback`
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: req.query.code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })
    const tokenData = await tokenResponse.json()
    if (!tokenResponse.ok) throw new Error(tokenData.error_description || 'Google auth failed')

    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    const profile = await profileResponse.json()
    if (!profileResponse.ok || !profile.email) throw new Error('Unable to read Google profile')

    let user = await User.findOne({ email: profile.email.toLowerCase() })
    if (!user) {
      user = new User({
        name: profile.name || profile.email.split('@')[0],
        email: profile.email,
        password: crypto.randomBytes(32).toString('hex'),
        googleId: profile.id,
        authProviders: ['google'],
      })
    } else {
      user.googleId = profile.id
      user.authProviders = Array.from(new Set([...(user.authProviders || []), 'google']))
    }
    await user.save()
    redirectWithAuth(req, res, user)
  } catch (err) {
    console.error('[Google OAuth Error]', err)
    res.redirect(`${getAppUrl(req)}/login?error=${encodeURIComponent(err.message)}`)
  }
})

router.get('/github', (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: `${getAppUrl(req)}/auth/github/callback`,
    scope: 'read:user user:email',
    state: getSafeNextPath(req.query.next),
  })

  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`)
})

router.get('/github/callback', async (req, res) => {
  try {
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: req.query.code,
        redirect_uri: `${getAppUrl(req)}/auth/github/callback`,
      }),
    })
    const tokenData = await tokenResponse.json()
    if (!tokenResponse.ok || !tokenData.access_token) throw new Error(tokenData.error_description || 'GitHub auth failed')

    const [profileResponse, emailsResponse] = await Promise.all([
      fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${tokenData.access_token}`, 'User-Agent': 'JobPilot-AI' },
      }),
      fetch('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${tokenData.access_token}`, 'User-Agent': 'JobPilot-AI' },
      }),
    ])
    const profile = await profileResponse.json()
    const emails = await emailsResponse.json()
    const primaryEmail = Array.isArray(emails)
      ? emails.find((email) => email.primary && email.verified)?.email || 
        emails.find((email) => email.verified)?.email ||
        emails.find((email) => email.primary)?.email ||
        emails[0]?.email
      : null
    if (!profileResponse.ok || !primaryEmail) throw new Error('Unable to read GitHub email')

    let user = await User.findOne({ email: primaryEmail.toLowerCase() })
    if (!user) {
      user = new User({
        name: profile.name || profile.login || primaryEmail.split('@')[0],
        email: primaryEmail,
        password: crypto.randomBytes(32).toString('hex'),
        githubId: String(profile.id),
        authProviders: ['github'],
      })
    } else {
      user.githubId = String(profile.id)
      user.authProviders = Array.from(new Set([...(user.authProviders || []), 'github']))
    }
    await user.save()
    redirectWithAuth(req, res, user)
  } catch (err) {
    console.error('[GitHub OAuth Error]', err)
    res.redirect(`${getAppUrl(req)}/login?error=${encodeURIComponent(err.message)}`)
  }
})

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ message: 'Email is required' })

    const user = await User.findOne({ email: email.toLowerCase() })
    let resetUrl
    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex')
      user.resetPasswordToken = crypto.createHash('sha256').update(rawToken).digest('hex')
      user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000)
      await user.save()

      resetUrl = `${getAppUrl(req)}/reset-password/${rawToken}`
      await sendPasswordResetEmail({
        to: user.email,
        resetUrl,
      })
    }

    // In production we avoid exposing the reset token. For development, return the reset link so it can be opened directly.
    const responsePayload = { message: 'If an account exists, a reset link has been sent.' }
    if (process.env.NODE_ENV !== 'production' && resetUrl) responsePayload.resetLink = resetUrl

    res.json(responsePayload)
  } catch (err) {
    res.status(500).json({ message: 'Failed to send reset email', error: err.message })
  }
})

router.post('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' })
    }

    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex')
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: new Date() },
    })

    if (!user) return res.status(400).json({ message: 'Reset link is invalid or expired' })

    user.password = password
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    user.authProviders = Array.from(new Set([...(user.authProviders || []), 'email']))
    await user.save()

    res.json({ message: 'Password reset successful' })
  } catch (err) {
    res.status(500).json({ message: 'Password reset failed', error: err.message })
  }
})

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password')
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const trialExpired =
      user.subscription?.status === 'trial' &&
      user.subscription?.currentEnd &&
      new Date(user.subscription.currentEnd) <= new Date()

    if (trialExpired && user.isPro) {
      user.isPro = false
      await user.save()
    }

    res.json(publicUser(user))
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch user', error: err.message })
  }
})

// Update current user profile
router.put('/me', authenticateToken, async (req, res) => {
  try {
    const updates = {}
    const allowedFields = ['name', 'email', 'location', 'currentRole', 'yearsExperience', 'notificationPreferences', 'privacyPreferences']

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field]
      }
    })

    const user = await User.findByIdAndUpdate(req.user.userId, updates, {
      new: true,
      runValidators: true,
      select: '-password',
    })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json(user)
  } catch (err) {
    res.status(500).json({ message: 'Failed to update profile', error: err.message })
  }
})

// Change current user password
router.put('/me/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long.' })
    }

    const user = await User.findById(req.user.userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    if (user.password) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required.' })
      }
      const valid = await user.comparePassword(currentPassword)
      if (!valid) {
        return res.status(401).json({ message: 'Current password is incorrect.' })
      }
    }

    user.password = newPassword
    await user.save()

    res.json({ message: 'Password updated successfully.' })
  } catch (err) {
    res.status(500).json({ message: 'Failed to change password', error: err.message })
  }
})

router.get('/me/export', authenticateToken, async (req, res) => {
  try {
    const [user, resumes, applications, careerAssets] = await Promise.all([
      User.findById(req.user.userId).select('-password -resetPasswordToken -resetPasswordExpires').lean(),
      Resume.find({ userId: req.user.userId }).lean(),
      Application.find({ userId: req.user.userId }).populate('jobId').lean(),
      CareerAsset.find({ userId: req.user.userId }).lean(),
    ])
    if (!user) return res.status(404).json({ message: 'User not found' })

    res.setHeader('Content-Disposition', 'attachment; filename="jobpilot-data.json"')
    res.json({ exportedAt: new Date().toISOString(), user, resumes, applications, careerAssets })
  } catch (err) {
    res.status(500).json({ message: 'Failed to export account data', error: err.message })
  }
})

router.delete('/me', authenticateToken, async (req, res) => {
  try {
    await Promise.all([
      Resume.deleteMany({ userId: req.user.userId }),
      Application.deleteMany({ userId: req.user.userId }),
      CareerAsset.deleteMany({ userId: req.user.userId }),
    ])
    const user = await User.findByIdAndDelete(req.user.userId)
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json({ success: true, message: 'Account and associated data deleted.' })
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete account', error: err.message })
  }
})

router.put(['/me/upgrade', '/upgrade'], authenticateToken, (req, res) => {
  res.status(410).json({ message: 'Direct upgrades are disabled. Complete verified checkout to activate Pro.' })
})

export default router
