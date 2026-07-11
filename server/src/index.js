import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
const serverEnvPath = path.resolve(__dirname, '../.env')
dotenv.config({ path: serverEnvPath })
// Fallback to project root .env if server/.env is missing
dotenv.config()

// Import routes
import authRoutes from './routes/auth.js'
import resumeRoutes from './routes/resume.js'
import jobRoutes from './routes/jobs.js'
import caddieRoutes from './routes/caddie.js'
import careerRoutes from './routes/career.js'
import paymentRoutes, { razorpayWebhook } from './routes/payments.js'
import { seedJobs } from './utils/seeder.js'

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), razorpayWebhook)
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jobpilot'

console.log('Attempting to connect to MongoDB at:', MONGODB_URI)

mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log(' Connected to MongoDB successfully')

    if (process.env.NODE_ENV !== 'production') {
      await seedJobs()
    }
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  })
})

app.listen(PORT, () => {
  console.log(`JobPilot.AI server running on http://localhost:${PORT}`)
})
