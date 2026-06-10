import express from 'express'
import axios from 'axios'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import User from '../models/User.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

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

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    )

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        plan: user.plan || 'Free',
      },
      token,
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

    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    )

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        plan: user.plan || 'Free',
      },
      token,
    })
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message })
  }
})

// GitHub Login
router.post('/github', async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ message: 'Authorization code is required' });
  }

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID || 'Ov23liyOm6IN25tXfJoC',
        client_secret: process.env.GITHUB_CLIENT_SECRET || 'd79c8218f1913fe128d5af66e12e9d5aafe9ee13',
        code,
      },
      { headers: { Accept: 'application/json' } }
    );

    const accessToken = tokenResponse.data.access_token;
    if (!accessToken) {
      return res.status(400).json({ message: 'Failed to retrieve access token from GitHub' });
    }

    // Get user profile
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    // Get user emails (useful if the primary email is set to private on GitHub)
    const emailResponse = await axios.get('https://api.github.com/user/emails', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const primaryEmail = emailResponse.data.find(e => e.primary)?.email;
    const githubUser = userResponse.data;
    const email = primaryEmail || githubUser.email;

    if (!email) {
      return res.status(400).json({ message: 'No email found associated with this GitHub account' });
    }

    // Find existing user or create a new one
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        name: githubUser.name || githubUser.login,
        email,
        password: Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10), // Random placeholder
      });
      await user.save();
    }

    // Sign the JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        plan: user.plan || 'Free',
      },
      token,
    });
  } catch (error) {
    console.error('GitHub OAuth Error:', error.response?.data || error.message);
    res.status(500).json({ message: 'GitHub authentication failed' });
  }
});

// Google Login
router.post('/google', async (req, res) => {
  const { code, redirectUri } = req.body;
  if (!code) {
    return res.status(400).json({ message: 'Authorization code is required' });
  }

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://oauth2.googleapis.com/token',
      {
        client_id: process.env.GOOGLE_CLIENT_ID || '228813641025-ouq3lac99qqcbuod8kplb17ifcbt5khe.apps.googleusercontent.com',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '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',
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri
      }
    );

    const accessToken = tokenResponse.data.access_token;
    if (!accessToken) {
      return res.status(400).json({ message: 'Failed to retrieve access token from Google' });
    }

    // Get user profile
    const userResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const googleUser = userResponse.data;
    const email = googleUser.email;

    if (!email) {
      return res.status(400).json({ message: 'No email found associated with this Google account' });
    }

    // Find existing user or create a new one
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        name: googleUser.name || email.split('@')[0],
        email,
        password: Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10), // Random placeholder
      });
      await user.save();
    }

    // Sign the JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        plan: user.plan || 'Free',
      },
      token,
    });
  } catch (error) {
    console.error('Google OAuth Error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Google authentication failed' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password')
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    res.json(user)
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch user', error: err.message })
  }
})

// Upgrade to Pro
router.post('/upgrade', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    user.plan = 'Pro'
    await user.save()
    res.json({ message: 'Successfully upgraded to Pro!', plan: user.plan })
  } catch (err) {
    res.status(500).json({ message: 'Upgrade failed', error: err.message })
  }
})

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email address is required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Return 200 instead of 404 to avoid Axios throwing an error on the frontend
      return res.status(200).json({ message: 'If an account with that email exists, a reset link has been sent.' });
    }

    // Generate a secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Use updateOne to safely update ONLY the token fields, bypassing full document validation
    await User.updateOne(
      { _id: user._id },
      { $set: { resetPasswordToken: resetToken, resetPasswordExpires: Date.now() + 3600000 } }
    );

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    // If Resend API key is available, send a real email
    const resendKey = process.env.RESEND_API_KEY || 're_7iSwQao6_4kVkohAs5Q8zM8sGLtztPhTs';
    if (resendKey) {
      try {
        await axios.post('https://api.resend.com/emails', {
          from: 'JobPilot AI <onboarding@resend.dev>', // Default testing address for Resend
          to: email,
          subject: 'Reset your JobPilot password',
          html: `<h2>Password Reset Request</h2>
                 <p>You requested a password reset. Click the link below to set a new password:</p>
                 <p><a href="${resetUrl}" style="display:inline-block;padding:10px 20px;background-color:#e07855;color:white;text-decoration:none;border-radius:5px;">Reset Password</a></p>
                 <p>If you didn't request this, you can safely ignore this email.</p>`
        }, {
          headers: { 'Authorization': `Bearer ${resendKey}` }
        });
      } catch (emailErr) {
        console.error('Failed to send email via Resend:', emailErr.response?.data || emailErr.message);
        // Fallback for local development
        console.log(`\n\n======================================================`);
        console.log(`🔐 PASSWORD RESET LINK REQUESTED FOR: ${email}`);
        console.log(resetUrl);
        console.log(`======================================================\n\n`);
      }
    } else {
      // Fallback for local development
      console.log(`\n\n======================================================`);
      console.log(`🔐 PASSWORD RESET LINK REQUESTED FOR: ${email}`);
      console.log(resetUrl);
      console.log(`======================================================\n\n`);
    }

    res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Error processing request', error: err.message });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() } // Check if token is still valid
    });
    if (!user) {
      return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
    }
    user.password = newPassword; // The pre-save hook in User.js will automatically hash this
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.json({ message: 'Password has been reset successfully.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Error resetting password', error: err.message });
  }
});

export default router
