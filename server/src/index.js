import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)


const serverEnvPath = path.resolve(__dirname, '../.env')
dotenv.config({ path: serverEnvPath })

dotenv.config()

// Import routes
import authRoutes from './routes/auth.js'
import resumeRoutes from './routes/resume.js'
import jobRoutes from './routes/jobs.js'
import caddieRoutes from './routes/caddie.js'
import careerRoutes from './routes/career.js'
import paymentRoutes, { razorpayWebhook } from './routes/payments.js'


const app = express()
const PORT = process.env.PORT || 5000
const isProduction = process.env.NODE_ENV === 'production'
const distPath = path.resolve(__dirname, '../../dist')

const normalizeOrigins = (value = '') =>
  String(value)
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean)

const configuredOrigins = [
  ...normalizeOrigins(process.env.CLIENT_URL),
  ...normalizeOrigins(process.env.FRONTEND_URL),
  ...normalizeOrigins(process.env.VITE_CLIENT_URL),
  ...normalizeOrigins(process.env.CORS_ORIGIN),
]

const localOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5000',
  'http://localhost:5173',
  'http://localhost:5174',
]

const allowedOrigins = new Set([
  ...configuredOrigins,
  ...(isProduction ? [] : localOrigins),
])

const requiredProductionEnv = ['MONGODB_URI', 'JWT_SECRET']
const missingProductionEnv = isProduction
  ? requiredProductionEnv.filter((name) => !process.env[name])
  : []

if (missingProductionEnv.length > 0) {
  throw new Error(`Missing required production environment variables: ${missingProductionEnv.join(', ')}`)
}

// Middleware
app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true)

    const normalizedOrigin = origin.replace(/\/$/, '')
    if (allowedOrigins.has(normalizedOrigin)) {
      return callback(null, true)
    }

    return callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
}))
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), razorpayWebhook)
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || (isProduction ? undefined : 'mongodb://localhost:27017/jobpilot')
const safeMongoLogTarget = MONGODB_URI?.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')

console.log('Attempting to connect to MongoDB at:', safeMongoLogTarget)

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log(' Connected to MongoDB successfully')
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message)
    console.error('Full error:', err)
  })

// API Routes (must be before static file serving)
app.use('/api/auth', authRoutes) // Existing auth routes
app.use('/api/resume', resumeRoutes) // Existing resume routes
app.use('/api/jobs', jobRoutes) // Existing job routes
app.use('/api/caddie', caddieRoutes)
app.use('/api/career', careerRoutes)
app.use('/api/payments', paymentRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' })
})

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath))
  app.get(/^\/(?!api(?:\/|$)).*/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  })
})

app.listen(PORT, () => {
  console.log(`JobPilot.AI server running on port ${PORT}`)
})
