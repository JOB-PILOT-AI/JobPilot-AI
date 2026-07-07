import express from 'express'
import User from '../models/User.js'
import Resume from '../models/Resume.js'
import Application from '../models/Application.js'
import { authenticateOptional } from '../middleware/auth.js'

const router = express.Router()
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta'
const DEFAULT_MODEL = 'gemini-1.5-flash-latest'
const RETIRED_MODELS = new Set([
  'gemini-pro',
  'gemini-pro-latest',
  'gemini-1.0-pro',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'gemini-2.5-flash',
])

const normalizeModelName = (model) =>
  String(model || '')
    .trim()
    .replace(/^models\//, '')

const getConfiguredModel = () => {
  const configuredModel = normalizeModelName(process.env.CADDIE_MODEL)

  if (!configuredModel || RETIRED_MODELS.has(configuredModel)) {
    return DEFAULT_MODEL
  }

  return configuredModel
}

const callGemini = (apiKey, model, body) =>
  fetch(
    `${GEMINI_API_BASE}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  )

const buildLocalAnswer = (message) => {
  const text = String(message || '').trim()
  if (!text) return 'Ask me anything and I will help.'

  return `I am Caddie, your JobPilot AI helper. I can answer this once the Gemini API key is configured on the server. Add GEMINI_API_KEY to your .env file, restart the backend, and ask me again: "${text}"`
}

// Diagnostic endpoint to list available models
router.get('/models', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return res.json({ 
        error: 'No GEMINI_API_KEY configured',
        setupRequired: true 
      })
    }

    const response = await fetch(
      `${GEMINI_API_BASE}/models?pageSize=1000&key=${encodeURIComponent(apiKey)}`,
      { method: 'GET' }
    )

    const data = await response.json()
    res.status(response.status).json(data)
  } catch (err) {
    console.error('Error listing models:', err)
    res.status(500).json({ message: 'Failed to list models' })
  }
})

router.post('/chat', authenticateOptional, async (req, res) => {
  try {
    const { message, history = [] } = req.body || {}
    const userMessage = String(message || '').trim()

    if (!userMessage) {
      return res.status(400).json({ message: 'Please enter a question for Caddie.' })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return res.json({
        answer: buildLocalAnswer(userMessage),
        setupRequired: true,
      })
    }

    let personalContext = ''
    if (req.user) {
      const user = await User.findById(req.user.userId)
      if (user?.privacyPreferences?.allowCaddieContext !== false) {
        const [resume, applications] = await Promise.all([
          Resume.findOne({ userId: req.user.userId }).sort({ updatedAt: -1 }),
          Application.find({ userId: req.user.userId }).populate('jobId').sort({ updatedAt: -1 }).limit(10),
        ])
        personalContext = [
          `User: ${user.name || ''}; target role: ${user.currentRole || 'not set'}; location: ${user.location || 'not set'}.`,
          resume ? `Resume skills: ${(resume.skills || []).slice(0, 30).join(', ')}.` : '',
          applications.length
            ? `Applications: ${applications.map((item) => `${item.jobId?.title || 'Role'} at ${item.jobId?.company || 'Company'} (${item.status})`).join('; ')}.`
            : '',
          'Use this context only when relevant. Never invent missing personal facts.',
        ].filter(Boolean).join('\n')
      }
    }

    // Build contents array - system instruction as first user message
    const contents = [
      {
        role: 'user',
        parts: [{
          text: `You are Caddie, a friendly robot AI helper inside JobPilot.AI. Answer clearly and freely. Be practical, concise, and helpful. If the user asks about careers, jobs, resumes, interviews, coding, study, or the app, give direct guidance. Do not claim to take actions you cannot perform.\n${personalContext}`
        }]
      },
      {
        role: 'model',
        parts: [{ text: 'I understand. I am ready to help.' }]
      }
    ]

    // Add history (last 8 messages)
    for (const item of history.slice(-8)) {
      contents.push({
        role: item.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: String(item.content || '') }]
      })
    }

    // Add current user message
    contents.push({
      role: 'user',
      parts: [{ text: userMessage }]
    })

    const requestBody = {
      contents,
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 700,
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
      ],
    }

    const configuredModel = getConfiguredModel()
    let model = configuredModel
    let response = await callGemini(apiKey, model, requestBody)
    let data = await response.json()

    // A stale CADDIE_MODEL should not break chat after Google retires a model.
    if (response.status === 404 && model !== DEFAULT_MODEL) {
      model = DEFAULT_MODEL
      response = await callGemini(apiKey, model, requestBody)
      data = await response.json()
    }

    if (!response.ok) {
      return res.status(response.status).json({
        message: data?.error?.message || 'Caddie could not answer right now.',
        error: data?.error,
      })
    }

    const answer =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      data.output_text ||
      data.steps
        ?.flatMap((step) => step.content || step.output || [])
        ?.map((content) => content.text || '')
        ?.join('')
        ?.trim()

    res.json({
      answer: answer || 'I am here, but I could not generate a response this time.',
      model,
    })
  } catch (err) {
    console.error('Caddie chat error:', err)
    res.status(500).json({ message: 'Caddie is unavailable right now. Please try again.' })
  }
})

export default router
