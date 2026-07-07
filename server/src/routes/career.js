import express from 'express'
import CareerAsset from '../models/CareerAsset.js'
import Resume from '../models/Resume.js'
import Application from '../models/Application.js'
import User from '../models/User.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta'
const MODEL = 'gemini-1.5-flash-latest'
const assetTypes = new Set([
  'tailored-resume',
  'cover-letter',
  'networking-message',
  'screening-answers',
  'interview-feedback',
])

const clean = (value, max = 12000) => String(value || '').trim().slice(0, max)

const resumeText = (resume) => {
  if (!resume) return ''
  const experience = [...(resume.experience || []), ...(resume.workExperience || [])]
    .map((item) => `${item.position || ''} at ${item.company || ''}: ${item.description || ''}`)
    .join('\n')
  return [
    resume.personalInfo?.title,
    resume.personalInfo?.summary || resume.summary,
    `Skills: ${(resume.skills || []).join(', ')}`,
    experience,
    (resume.projects || []).map((item) => `${item.name}: ${item.description}`).join('\n'),
  ].filter(Boolean).join('\n')
}

const promptFor = ({ type, role, company, jobDescription, tone, questions, answer, resume }) => {
  const shared = `Use only facts present in the resume. Never invent employers, skills, dates, degrees, metrics, or achievements.
Resume:
${resumeText(resume) || 'No resume content available.'}

Target role: ${role || 'Not specified'}
Company: ${company || 'Not specified'}
Job description: ${jobDescription || 'Not supplied'}`

  const prompts = {
    'tailored-resume': `${shared}
Rewrite the candidate's professional summary, skills ordering, and experience bullet phrasing for this job. Preserve truth. Clearly separate Summary, Priority Skills, Tailored Experience, and Missing Keywords. Mark missing keywords as gaps, never as candidate skills.`,
    'cover-letter': `${shared}
Write a concise, specific cover letter in a ${tone || 'professional'} tone. Use 3-4 short paragraphs and a clear closing. Do not use placeholders or claim unavailable facts.`,
    'networking-message': `${shared}
Write three versions: a LinkedIn connection note under 280 characters, a recruiter outreach message, and a polite follow-up. Keep the tone ${tone || 'warm and professional'}.`,
    'screening-answers': `${shared}
Draft concise, truthful screening answers for these questions:
${questions || 'Why are you interested in this role?\\nWhat makes you a strong fit?\\nWhen can you start?'}
Flag any answer that needs user-specific information.`,
    'interview-feedback': `${shared}
Interview question: ${questions || 'Tell me about yourself.'}
Candidate answer: ${answer || 'No answer provided.'}
Act as an interview coach. Give a score out of 100, strengths, missing evidence, a tighter STAR structure, and an improved answer that preserves only known facts.`,
  }

  return prompts[type]
}

const generate = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured')

  const response = await fetch(
    `${API_BASE}/models/${MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.5, maxOutputTokens: 1400 },
      }),
    }
  )
  const data = await response.json()
  if (!response.ok) throw new Error(data?.error?.message || 'AI generation failed')
  return (data.candidates?.[0]?.content?.parts || []).map((part) => part.text || '').join('').trim()
}

router.get('/workspace', authenticateToken, async (req, res) => {
  try {
    const [user, resume, applications, assets] = await Promise.all([
      User.findById(req.user.userId).select('-password').populate('jobMatches.jobId'),
      Resume.findOne({ userId: req.user.userId }).sort({ updatedAt: -1 }),
      Application.find({ userId: req.user.userId }).populate('jobId').sort({ updatedAt: -1 }),
      CareerAsset.find({ userId: req.user.userId }).sort({ createdAt: -1 }).limit(20),
    ])

    const counts = applications.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1
      return acc
    }, {})
    const active = applications.filter((item) => !['rejected', 'withdrawn'].includes(item.status))
    const interviews = applications.filter((item) => ['interview', 'shortlisted'].includes(item.status)).length
    const appliedJobIds = new Set(applications.map((item) => String(item.jobId?._id || item.jobId)))
    const savedJobs = (user?.jobMatches || [])
      .filter((item) => item.jobId && !appliedJobIds.has(String(item.jobId._id || item.jobId)))
      .map((item) => ({
        _id: item._id,
        kind: 'saved',
        status: 'saved',
        jobId: item.jobId,
        matchScore: { overall: item.matchScore || 0 },
        notes: item.notes || '',
        nextAction: item.nextAction || '',
        nextActionAt: item.nextActionAt || null,
        savedAt: item.savedAt,
      }))

    res.json({
      user,
      resume,
      applications,
      savedJobs,
      assets,
      analytics: {
        total: applications.length + savedJobs.length,
        saved: savedJobs.length,
        active: active.length,
        interviews,
        offers: (counts.offer || 0) + (counts.accepted || 0),
        responseRate: applications.length
          ? Math.round((applications.filter((item) => item.status !== 'applied').length / applications.length) * 100)
          : 0,
        counts,
      },
    })
  } catch (error) {
    res.status(500).json({ message: 'Failed to load career workspace', error: error.message })
  }
})

router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const type = clean(req.body.type, 40)
    if (!assetTypes.has(type)) return res.status(400).json({ message: 'Unsupported generation type' })

    const user = await User.findById(req.user.userId)
    if (user?.privacyPreferences?.allowResumeAnalysis === false) {
      return res.status(403).json({ message: 'Resume analysis is disabled in your privacy settings.' })
    }

    const resume = await Resume.findOne({ userId: req.user.userId }).sort({ updatedAt: -1 })
    if (!resume) return res.status(400).json({ message: 'Upload or create a resume first.' })

    const input = {
      type,
      role: clean(req.body.role, 200),
      company: clean(req.body.company, 200),
      jobDescription: clean(req.body.jobDescription),
      tone: clean(req.body.tone, 100),
      questions: clean(req.body.questions, 4000),
      answer: clean(req.body.answer, 6000),
      resume,
    }
    const content = await generate(promptFor(input))
    const title = `${type.replaceAll('-', ' ')}${input.role ? ` · ${input.role}` : ''}`
    const asset = await CareerAsset.create({
      userId: req.user.userId,
      type,
      title,
      content,
      metadata: {
        company: input.company,
        role: input.role,
        jobDescription: input.jobDescription,
        tone: input.tone,
      },
    })
    res.status(201).json({ asset })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Generation failed' })
  }
})

router.delete('/assets/:id', authenticateToken, async (req, res) => {
  const asset = await CareerAsset.findOneAndDelete({ _id: req.params.id, userId: req.user.userId })
  if (!asset) return res.status(404).json({ message: 'Asset not found' })
  res.json({ success: true })
})

export default router
