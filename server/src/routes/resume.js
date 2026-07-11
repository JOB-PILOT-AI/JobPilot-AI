import express from 'express'
import multer from 'multer'
import Resume from '../models/Resume.js'
import User from '../models/User.js'
import { authenticateToken } from '../middleware/auth.js'
import { parseResume } from '../services/resumeParser.js'
import { calculateATSScore } from '../services/atsScoring.js'

const router = express.Router()
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta'
const INTERVIEW_MODEL = process.env.INTERVIEW_MODEL || 'gemini-2.5-flash'
const DISABLE_GEMINI = process.env.DISABLE_GEMINI === 'true'
const requirePro = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select('isPro')
    if (!user?.isPro) {
      return res.status(403).json({ message: 'Exam Prep is available for Pro members only. Please upgrade to continue.' })
    }

    next()
  } catch (err) {
    res.status(500).json({ message: 'Could not verify Pro access', error: err.message })
  }
}

const isAllowedResumeFile = (file) => {
  const fileName = file.originalname.toLowerCase()

  return (
    file.mimetype === 'application/pdf' ||
    file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    fileName.endsWith('.pdf') ||
    fileName.endsWith('.docx')
  )
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!isAllowedResumeFile(file)) {
      return cb(new Error('Only PDF and DOCX files are supported'))
    }

    cb(null, true)
  },
})

const buildResumeResponse = (resume) => {
  const plainResume = typeof resume?.toObject === 'function' ? resume.toObject() : resume
  const atsAnalytics = plainResume?.atsAnalytics || calculateATSScore(plainResume || {})

  return {
    ...plainResume,
    atsAnalytics,
  }
}

const splitSentences = (value = '') =>
  String(value)
    .split(/\n|(?<=\.)\s+/)
    .map((item) => item.replace(/^[•\-\s]+/, '').trim())
    .filter(Boolean)

const buildGeneratedSummary = (resumeData = {}) => {
  const personalInfo = resumeData.personalInfo || {}
  const experience = Array.isArray(resumeData.experience) 
    ? resumeData.experience 
    : Array.isArray(resumeData.workExperience) 
      ? resumeData.workExperience 
      : []
  const skills = Array.isArray(resumeData.skills) ? resumeData.skills : []
  const latestRole = experience.find((item) => item.position || item.company) || {}
  const impactBullets = experience.flatMap((item) => splitSentences(item.description)).slice(0, 2)
  const topSkills = skills.slice(0, 5)
  const title = latestRole.position || personalInfo.title || 'Career professional'
  const company = latestRole.company ? ` at ${latestRole.company}` : ''
  const skillText = topSkills.length ? ` skilled in ${topSkills.join(', ')}` : ''
  const impactText = impactBullets.length
    ? ` Known for ${impactBullets.join(' ')}`
    : ' Focused on measurable outcomes, cross-functional collaboration, and execution quality.'

  return `${title}${company}${skillText}.${impactText}`.replace(/\s+/g, ' ').trim()
}

const cleanInterviewText = (value, max = 6000) => String(value || '').trim().slice(0, max)

const stripJsonFence = (value = '') =>
  String(value)
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

const extractJsonObjectText = (value = '') => {
  const text = stripJsonFence(value)
  if (!text) return ''

  const firstBrace = text.indexOf('{')
  const lastBrace = text.lastIndexOf('}')
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return ''
  }

  return text.slice(firstBrace, lastBrace + 1)
}

const parseModelJsonObject = (value = {}, context = 'AI response') => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value
  }

  const jsonText = extractJsonObjectText(value)
  if (!jsonText) {
    throw new Error(`${context} did not include a JSON object`)
  }

  try {
    return JSON.parse(jsonText)
  } catch (error) {
    throw new Error(`${context} included invalid JSON: ${error.message}`)
  }
}

const readJsonResponse = async (response, context = 'AI service response') => {
  const text = await response.text()
  if (!text.trim()) {
    return {}
  }

  try {
    return JSON.parse(text)
  } catch (error) {
    throw new Error(`${context} was not valid JSON: ${error.message}`)
  }
}

const buildInterviewResumeContext = (resumeData = {}) => {
  const experience = Array.isArray(resumeData.experience)
    ? resumeData.experience
    : Array.isArray(resumeData.workExperience)
      ? resumeData.workExperience
      : []
  const projects = Array.isArray(resumeData.projects) ? resumeData.projects : []

  return [
    resumeData.personalInfo?.title ? `Title: ${cleanInterviewText(resumeData.personalInfo.title, 200)}` : '',
    resumeData.personalInfo?.summary || resumeData.summary
      ? `Summary: ${cleanInterviewText(resumeData.personalInfo?.summary || resumeData.summary, 1200)}`
      : '',
    `Skills: ${(resumeData.skills || []).slice(0, 30).map((item) => cleanInterviewText(item, 100)).join(', ')}`,
    ...experience.slice(0, 5).map((item) =>
      `Experience: ${cleanInterviewText(item.position, 150)} at ${cleanInterviewText(item.company, 150)} — ${cleanInterviewText(item.description, 1200)}`
    ),
    ...projects.slice(0, 5).map((item) =>
      `Project: ${cleanInterviewText(item.name || item.title, 150)} — ${cleanInterviewText(item.description, 1200)}`
    ),
  ].filter(Boolean).join('\n')
}

const scoreInterviewLocally = ({ questions = [], answers = [], durationSeconds = 0 }) => {
  const fillerPattern = /\b(um+|uh+|like|basically|actually|you know|kind of|sort of)\b/gi
  const resultPattern = /\b(result|impact|improved|increased|reduced|saved|delivered|achieved|grew|decreased|outcome|learned)\b/i
  const actionPattern = /\b(i built|i created|i designed|i led|i implemented|i investigated|i decided|i changed|i solved|my role)\b/i
  const contextPattern = /\b(situation|context|challenge|task|problem|goal)\b/i

  const responseFeedback = questions.map((question, index) => {
    const answer = cleanInterviewText(answers[index], 8000)
    const words = answer.split(/\s+/).filter(Boolean)
    const normalizedQuestionWords = new Set(
      String(question).toLowerCase().match(/[a-z]{4,}/g)?.filter((word) => !['what', 'when', 'where', 'which', 'would', 'about', 'your', 'from', 'with', 'that', 'this'].includes(word)) || []
    )
    const answerWords = new Set(String(answer).toLowerCase().match(/[a-z]{4,}/g) || [])
    const overlap = [...normalizedQuestionWords].filter((word) => answerWords.has(word)).length
    const relevance = answer
      ? Math.min(100, 42 + overlap * 9 + Math.min(words.length, 70) * 0.45)
      : 0
    const structureSignals = [contextPattern.test(answer), actionPattern.test(answer), resultPattern.test(answer)].filter(Boolean).length
    const structure = answer ? Math.min(100, 34 + structureSignals * 20 + (words.length >= 45 ? 10 : 0)) : 0
    const specificity = answer
      ? Math.min(100, 32 + (/\d|%|\$/.test(answer) ? 28 : 0) + (actionPattern.test(answer) ? 20 : 0) + (resultPattern.test(answer) ? 15 : 0))
      : 0
    const depth = answer ? Math.min(100, Math.round((words.length / 95) * 100)) : 0
    const score = Math.round(relevance * 0.3 + structure * 0.25 + specificity * 0.25 + depth * 0.2)
    const strengths = []
    const improvements = []

    if (actionPattern.test(answer)) strengths.push('Clearly explains personal ownership.')
    if (resultPattern.test(answer)) strengths.push('Connects the work to an outcome or learning.')
    if (/\d|%|\$/.test(answer)) strengths.push('Uses concrete evidence or measurable detail.')
    if (!strengths.length && answer) strengths.push('Provides a useful starting point that can be made more specific.')
    if (!answer) improvements.push('Answer this question before the next practice round.')
    else {
      if (words.length < 45) improvements.push('Add enough context, action, and result to make the example complete.')
      if (!actionPattern.test(answer)) improvements.push('Clarify exactly what you personally owned or decided.')
      if (!resultPattern.test(answer)) improvements.push('Close with the result, impact, or lesson learned.')
      if (!/\d|%|\$/.test(answer)) improvements.push('Add a number, scale, timeframe, or other concrete evidence when truthful.')
    }

    return {
      question: cleanInterviewText(question, 1000),
      score,
      relevance: Math.round(relevance),
      structure: Math.round(structure),
      specificity: Math.round(specificity),
      technicalDepth: Math.round(depth),
      strengths: strengths.slice(0, 2),
      improvements: improvements.slice(0, 3),
      improvedApproach: answer
        ? 'Lead with a direct answer, give brief context, explain your specific actions and tradeoffs, then close with a measurable result.'
        : 'Prepare a truthful example from your resume and structure it as context, action, tradeoff, and result.',
    }
  })

  const answered = responseFeedback.filter((item) => item.score > 0)
  const totalWords = answers.reduce((sum, answer) => sum + String(answer || '').split(/\s+/).filter(Boolean).length, 0)
  const fillerWords = answers.reduce((sum, answer) => sum + (String(answer || '').match(fillerPattern) || []).length, 0)
  const overallScore = answered.length
    ? Math.round(answered.reduce((sum, item) => sum + item.score, 0) / questions.length)
    : 0

  return {
    overallScore,
    summary: overallScore >= 75
      ? 'Strong, specific answers with a clear connection between your experience and the role.'
      : overallScore >= 50
        ? 'A solid foundation. Your next gain will come from clearer ownership, tradeoffs, and measurable outcomes.'
        : 'This round surfaced useful practice areas. Build complete examples with specific actions and results.',
    responseFeedback,
    strengths: [
      answered.length === questions.length ? 'Completed the full interview round.' : `Completed ${answered.length} of ${questions.length} interview responses.`,
      totalWords >= answered.length * 55 ? 'Gave answers with useful supporting detail.' : 'Kept responses concise.',
    ],
    priorities: [
      'Use a clear context → action → result structure.',
      'Name the technical or business tradeoff behind your decision.',
      'Add truthful metrics, scale, or outcomes wherever possible.',
    ],
    followUpQuestion: 'Choose one project from your resume: what was the hardest tradeoff you personally made, and how did you know it was the right decision?',
    speechMetrics: {
      totalWords,
      fillerWords,
      fillerRate: totalWords ? Number(((fillerWords / totalWords) * 100).toFixed(1)) : 0,
      estimatedWordsPerMinute: durationSeconds > 10 ? Math.round(totalWords / (durationSeconds / 60)) : 0,
    },
    source: 'local',
  }
}

const evaluateInterviewWithGemini = async ({ resumeData, targetRole, track, questions, answers, durationSeconds }) => {
  if (!process.env.GEMINI_API_KEY) return null

  const localMetrics = scoreInterviewLocally({ questions, answers, durationSeconds })
  const responsePairs = questions.map((question, index) =>
    `QUESTION ${index + 1}: ${cleanInterviewText(question, 1000)}\nANSWER ${index + 1}: ${cleanInterviewText(answers[index] || 'No answer', 6000)}`
  ).join('\n\n')
  const prompt = `You are a rigorous but constructive senior interview coach. Evaluate the candidate using only the supplied resume and answers. Never invent facts. Score each answer for relevance, structure, specificity, and technical depth. A missing answer must score 0.

TARGET ROLE: ${cleanInterviewText(targetRole || 'Not specified', 250)}
INTERVIEW TRACK: ${track === 'nonTechnical' ? 'Behavioral' : 'Technical'}
RESUME:
${buildInterviewResumeContext(resumeData) || 'No resume supplied.'}

INTERVIEW:
${responsePairs}

Return ONLY valid JSON matching this exact shape:
{
  "overallScore": 0,
  "summary": "2 concise sentences",
  "strengths": ["specific strength", "specific strength"],
  "priorities": ["priority", "priority", "priority"],
  "followUpQuestion": "one challenging resume-related follow-up",
  "responseFeedback": [
    {
      "question": "question text",
      "score": 0,
      "relevance": 0,
      "structure": 0,
      "specificity": 0,
      "technicalDepth": 0,
      "strengths": ["specific strength"],
      "improvements": ["specific improvement"],
      "improvedApproach": "concise coaching, not a fabricated answer"
    }
  ]
}
All scores are integers from 0 to 100. Include exactly ${questions.length} responseFeedback entries in the original order.`

  const response = await fetch(
    `${GEMINI_API_BASE}/models/${encodeURIComponent(INTERVIEW_MODEL)}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.25,
          maxOutputTokens: 4000,
          responseMimeType: 'application/json',
        },
      }),
    }
  )
  const data = await readJsonResponse(response, 'AI interview evaluation HTTP response')
  if (!response.ok) throw new Error(data?.error?.message || 'AI interview evaluation failed')
  const raw = (data.candidates?.[0]?.content?.parts || []).map((part) => part.text || '').join('').trim()
  const parsed = parseModelJsonObject(raw, 'AI interview evaluation response')
  const aiFeedback = Array.isArray(parsed.responseFeedback) ? parsed.responseFeedback : []
  const normalizedFeedback = questions.map((question, index) => {
    const fallback = localMetrics.responseFeedback[index]
    const item = aiFeedback[index]
    if (!item || typeof item !== 'object') return fallback
    const normalizeScore = (value, fallbackValue) => {
      const score = Number(value)
      return Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : fallbackValue
    }
    return {
      ...fallback,
      ...item,
      question,
      score: normalizeScore(item.score, fallback.score),
      relevance: normalizeScore(item.relevance, fallback.relevance),
      structure: normalizeScore(item.structure, fallback.structure),
      specificity: normalizeScore(item.specificity, fallback.specificity),
      technicalDepth: normalizeScore(item.technicalDepth, fallback.technicalDepth),
      strengths: Array.isArray(item.strengths) ? item.strengths.slice(0, 3).map((text) => cleanInterviewText(text, 500)) : fallback.strengths,
      improvements: Array.isArray(item.improvements) ? item.improvements.slice(0, 3).map((text) => cleanInterviewText(text, 500)) : fallback.improvements,
      improvedApproach: cleanInterviewText(item.improvedApproach || fallback.improvedApproach, 1200),
    }
  })

  return {
    ...parsed,
    overallScore: Math.max(0, Math.min(100, Number(parsed.overallScore) || 0)),
    summary: cleanInterviewText(parsed.summary || localMetrics.summary, 1200),
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 4).map((text) => cleanInterviewText(text, 500)) : localMetrics.strengths,
    priorities: Array.isArray(parsed.priorities) ? parsed.priorities.slice(0, 4).map((text) => cleanInterviewText(text, 500)) : localMetrics.priorities,
    followUpQuestion: cleanInterviewText(parsed.followUpQuestion || localMetrics.followUpQuestion, 1200),
    responseFeedback: normalizedFeedback,
    speechMetrics: localMetrics.speechMetrics,
    source: 'ai',
  }
}

const buildInterviewPrep = (resumeData = {}, targetRole = '', track = 'technical') => {
  const personalInfo = resumeData.personalInfo || {}
  const experience = Array.isArray(resumeData.experience) 
    ? resumeData.experience 
    : Array.isArray(resumeData.workExperience) 
      ? resumeData.workExperience 
      : []
  const skills = Array.isArray(resumeData.skills) ? resumeData.skills : []
  const projects = Array.isArray(resumeData.projects) ? resumeData.projects : []
  const recentRole = String(experience[0]?.position || personalInfo.title || 'your recent role')
  const role = String(targetRole || recentRole)
  const topSkills = skills.slice(0, 6)
  const impact = experience.flatMap((item) => splitSentences(item.description)).slice(0, 4)
  const primaryProject = projects.find((item) => item.name || item.title || item.description) || {}
  const projectName = cleanInterviewText(primaryProject.name || primaryProject.title, 120)
  const recentCompany = cleanInterviewText(experience[0]?.company, 120)
  const primaryAchievement = cleanInterviewText(impact[0], 400)
  const normalizedTrack = track === 'nonTechnical' ? 'nonTechnical' : track === 'combined' ? 'combined' : 'technical'

  if (normalizedTrack === 'nonTechnical') {
    return {
      role,
      label: 'Non-technical',
      summary: `Behavioral and communication prep for ${role}.`,
      technicalRecommendations: [
        'Describe one project outcome with measurable impact, even for non-technical discussions.',
        `Connect your experience to ${role} and the team impact.`,
        'Frame problems, decisions, and outcomes cleanly in every answer.',
      ],
      nonTechnicalRecommendations: [
        'Use STAR format for behavioral answers.',
        'Share what you learned from setbacks and how you grew.',
        'Keep examples concise, specific, and aligned to the role.',
      ],
      focusAreas: [
        `Explain how your recent work experience supports the ${role} responsibilities.`,
        topSkills.length ? `Prepare concrete examples using ${topSkills.slice(0, 3).join(', ')}.` : 'Prepare strong examples for leadership and collaboration.',
        'Be ready to describe how you work with cross-functional stakeholders.',
      ],
      questions: [
        `Tell me about a time you solved a challenge while working on a team for ${role}.`,
        'Describe how you handled feedback or conflict with a teammate.',
        `Why is the ${role} role the right next step for you?`,
        'Share a story where you took ownership of a difficult outcome.',
        'How do you stay aligned with stakeholders in fast-moving environments?',
      ],
      talkingPoints: impact.length > 0 ? impact : [
        'Structure answers with situation, task, action, and result.',
        `Reference how your experience connects to ${role}.`,
        'Focus on impact, learning, and collaboration.',
      ],
    }
  }

  return {
    role,
    label: 'Technical',
    summary: `Technical prep for ${role} rounds, with architecture, debugging, and coding aptitude insights.`,
    technicalRecommendations: [
      topSkills.length ? `Prepare a deep project example that highlights ${topSkills[0]}.` : 'Prepare one strong technical story with measurable outcomes.',
      'Explain the architecture, tradeoffs, and results from your strongest project.',
      'Be ready to walk through a debugging or production-incident scenario.',
    ],
    nonTechnicalRecommendations: [
      'Use concise stories to communicate context and impact.',
      `Connect your experience to the needs of ${role}.`,
      'Describe team collaboration, ownership, and learning clearly.',
    ],
    focusAreas: [
      `Map your most recent technical accomplishments to the ${role} requirements.`,
      topSkills.length ? `Highlight proof points using ${topSkills.slice(0, 3).join(', ')}.` : 'Highlight your strongest technical and execution skills.',
      'Articulate measurable outcomes and engineering decisions.',
    ],
    questions: [
      projectName
        ? `Your resume highlights ${projectName}. Walk me through its architecture, your exact contribution, and the most important technical tradeoff you made.`
        : `Walk through the architecture of your strongest resume project, your exact contribution, and the most important technical tradeoff you made.`,
      topSkills[0]
        ? `You list ${topSkills[0]} as a skill. Describe the hardest problem you solved with it, then explain how you would approach the same problem differently today.`
        : 'Describe the hardest technical problem on your resume and how you would approach it differently today.',
      primaryAchievement
        ? `Your resume states: "${primaryAchievement}". What technical decisions produced that outcome, and how did you verify the result?`
        : 'Choose one achievement from your resume. What technical decisions produced it, and how did you verify the result?',
      recentCompany
        ? `Imagine a critical feature from your work at ${recentCompany} is failing in production with limited logging. Talk me through your investigation from first signal to permanent fix.`
        : 'A critical feature from your latest project is failing in production with limited logging. Talk me through your investigation from first signal to permanent fix.',
      topSkills.length > 1
        ? `Your resume includes ${topSkills.slice(0, 3).join(', ')}. How did these technologies interact in a real system, and where were the performance or reliability bottlenecks?`
        : 'How did the main technologies in your most recent system interact, and where were its performance or reliability bottlenecks?',
      `If you joined as a ${role}, how would you evaluate an unfamiliar codebase and deliver a safe, meaningful improvement in your first 30 days?`,
      'Looking across your technical experience, which engineering decision would you defend in a design review, and which one would you now change?',
    ],
    talkingPoints: impact.length > 0 ? impact : [
      'Describe problem, action, and result clearly.',
      `Relate your answer back to ${role}.`,
      'Show both technical depth and collaboration impact.',
    ],
  }
}

const generateResumeInterviewPrep = async (resumeData = {}, targetRole = '', track = 'technical') => {
  const basePrep = buildInterviewPrep(resumeData, targetRole, track)
  if (!process.env.GEMINI_API_KEY) return { ...basePrep, questionSource: 'resume-rules' }

  const normalizedTrack = track === 'nonTechnical' ? 'nonTechnical' : 'technical'
  const prompt = `You are a senior ${normalizedTrack === 'technical' ? 'technical' : 'behavioral'} interviewer conducting a realistic job interview.

Create exactly 8 distinct interview questions using ONLY facts present in the candidate's ATS resume. Tailor them to the target role. Never invent experience, projects, skills, employers, metrics, or technologies.

TARGET ROLE: ${cleanInterviewText(targetRole || basePrep.role, 250)}
INTERVIEW TYPE: ${normalizedTrack === 'technical' ? 'Technical and engineering' : 'Behavioral and communication'}
ATS RESUME:
${buildInterviewResumeContext(resumeData) || 'No resume details were available.'}

For a technical interview, cover:
1. Resume project architecture
2. A listed skill in depth
3. Validation of a resume achievement
4. Debugging or production incident
5. Performance, reliability, or scale
6. An engineering tradeoff
7. A target-role scenario
8. Technical ownership and learning

For a behavioral interview, cover ownership, collaboration, conflict, feedback, setbacks, prioritization, motivation, and role fit using resume context.

Return ONLY valid JSON:
{
  "summary": "one concise personalized session summary",
  "focusAreas": ["specific focus", "specific focus", "specific focus"],
  "questions": ["question 1", "question 2", "question 3", "question 4", "question 5", "question 6", "question 7", "question 8"]
}`

  try {
    const response = await fetch(
      `${GEMINI_API_BASE}/models/${encodeURIComponent(INTERVIEW_MODEL)}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.45,
            maxOutputTokens: 2200,
            responseMimeType: 'application/json',
          },
        }),
      }
    )
    const data = await readJsonResponse(response, 'AI question generation HTTP response')
    if (!response.ok) throw new Error(data?.error?.message || 'AI question generation failed')
    const raw = (data.candidates?.[0]?.content?.parts || []).map((part) => part.text || '').join('').trim()
    const parsed = parseModelJsonObject(raw, 'AI question generation response')
    const questions = Array.isArray(parsed.questions)
      ? parsed.questions.map((item) => cleanInterviewText(item, 1200)).filter(Boolean).slice(0, 8)
      : []

    if (questions.length < 5) throw new Error('AI returned too few interview questions')

    return {
      ...basePrep,
      summary: cleanInterviewText(parsed.summary || basePrep.summary, 800),
      focusAreas: Array.isArray(parsed.focusAreas)
        ? parsed.focusAreas.map((item) => cleanInterviewText(item, 500)).filter(Boolean).slice(0, 4)
        : basePrep.focusAreas,
      questions,
      questionSource: 'ai-resume',
    }
  } catch (error) {
    console.warn('AI resume question generation unavailable; using tailored rule-based questions.', error.message)
    return { ...basePrep, questionSource: 'resume-rules' }
  }
}

const buildPracticeTest = (resumeData = {}, track = 'technical') => {
  const personalInfo = resumeData.personalInfo || {}
  const experience = Array.isArray(resumeData.experience) 
    ? resumeData.experience 
    : Array.isArray(resumeData.workExperience) 
      ? resumeData.workExperience 
      : []
  const skills = Array.isArray(resumeData.skills) ? resumeData.skills : []
  const recentRole = String(experience[0]?.position || personalInfo.title || 'your target role')
  const topSkills = skills.slice(0, 4)
  const normalizedTrack = track === 'nonTechnical' ? 'nonTechnical' : track === 'combined' ? 'combined' : 'technical'
  const quoteSkill = topSkills.length > 0 ? topSkills[0] : 'programming'

  const shuffleArray = (items = []) => [...items].sort(() => Math.random() - 0.5)
  const makeQuestionItem = (template, index, category = template.category || 'Technical') => {
    const skill = topSkills.length > 0 ? topSkills[index % topSkills.length] : 'programming'
    const questionText = template.question
      .replace(/\{role\}/g, recentRole)
      .replace(/\{skill\}/g, skill)
      .replace(/\{index\}/g, index + 1)
    const answerText = template.answer
      .replace(/\{role\}/g, recentRole)
      .replace(/\{skill\}/g, skill)
    const options = shuffleArray([
      answerText,
      ...template.distractors.map((option) =>
        option.replace(/\{role\}/g, recentRole).replace(/\{skill\}/g, skill)
      ),
    ]).slice(0, 4)

    return {
      id: index + 1,
      category,
      difficulty: template.difficulty || (index % 5 === 0 ? 'Advanced' : index % 2 === 0 ? 'Intermediate' : 'Foundational'),
      question: questionText,
      options,
      answer: answerText,
      explanation: template.explanation || `The correct answer is "${answerText}" because it is the strongest, safest, and most interview-ready option for this scenario.`,
    }
  }

  const technicalTemplates = [
    {
      question: 'Which data structure is most appropriate for implementing a least-recently-used cache?',
      answer: 'Hash map with a doubly linked list',
      distractors: ['Binary search tree', 'Array', 'Stack'],
    },
    {
      question: 'What is the average time complexity of a hash table lookup?',
      answer: 'O(1)',
      distractors: ['O(n)', 'O(log n)', 'O(n log n)'],
    },
    {
      question: 'Which algorithm is best for searching a sorted array?',
      answer: 'Binary search',
      distractors: ['Linear search', 'Depth-first search', 'Bubble sort'],
    },
    {
      question: 'In a REST API, which HTTP verb is typically used to update an existing resource?',
      answer: 'PUT',
      distractors: ['GET', 'DELETE', 'PATCH'],
    },
    {
      question: 'What does ACID stand for in database transactions?',
      answer: 'Atomicity, Consistency, Isolation, Durability',
      distractors: ['Availability, Consistency, Isolation, Durability', 'Atomicity, Consistency, Independence, Durability', 'Asynchronous, Consistent, Isolated, Durable'],
    },
    {
      question: 'What is the primary purpose of unit tests?',
      answer: 'Validate individual pieces of code in isolation',
      distractors: ['Test system performance', 'Deploy code automatically', 'Review code style'],
    },
    {
      question: 'Which sorting algorithm typically performs best on mostly sorted arrays?',
      answer: 'Insertion sort',
      distractors: ['Selection sort', 'Heap sort', 'Merge sort'],
    },
    {
      question: 'In version control, what is the main reason to create a pull request?',
      answer: 'Review and merge code changes safely',
      distractors: ['Deploy code to production', 'Delete old branches', 'Run unit tests automatically'],
    },
    {
      question: 'What is the recommended growth strategy for a dynamic array when it reaches capacity?',
      answer: 'Allocate a larger array and copy elements',
      distractors: ['Shrink the array', 'Replace with a linked list', 'Use a fixed-size buffer'],
    },
    {
      question: 'Which concept helps avoid race conditions in concurrent programming?',
      answer: 'Mutex or lock',
      distractors: ['Garbage collection', 'REST API', 'CSS selectors'],
    },
    {
      question: 'Which measure indicates how quickly a function grows as input size increases?',
      answer: 'Time complexity',
      distractors: ['Memory usage', 'User experience', 'Code readability'],
    },
    {
      question: 'What is the main benefit of refactoring legacy code?',
      answer: 'Improve maintainability while preserving behavior',
      distractors: ['Add new features faster', 'Make code run more slowly', 'Remove all comments'],
    },
    {
      question: 'Which pattern helps separate creation logic from use in code?',
      answer: 'Factory pattern',
      distractors: ['Singleton pattern', 'Observer pattern', 'Decorator pattern'],
    },
    {
      question: 'What is a primary purpose of an API contract?',
      answer: 'Define expected behavior between services',
      distractors: ['Encrypt data', 'Store user credentials', 'Run database migrations'],
    },
    {
      question: 'Which approach is best when you need to handle high throughput and data spikes?',
      answer: 'Asynchronous queueing and backpressure control',
      distractors: ['Synchronous blocking I/O', 'Single-threaded polling', 'Inlining all functions'],
    },
    {
      question: 'What is the first step when debugging a production issue?',
      answer: 'Gather logs and reproduce the issue reliably',
      distractors: ['Refactor unrelated code', 'Add more features', 'Restart the entire system'],
    },
    {
      question: 'Which principle helps keep services independent and replaceable?',
      answer: 'Loose coupling',
      distractors: ['Tight coupling', 'Monolithic architecture', 'Hard-coded dependencies'],
    },
    {
      question: 'What is a common cause of high memory usage in applications?',
      answer: 'Unreleased object references or memory leaks',
      distractors: ['Low network bandwidth', 'Small disk space', 'Short function names'],
    },
    {
      question: 'Which testing style catches integration issues between components?',
      answer: 'Integration testing',
      distractors: ['Linting', 'Unit testing', 'Visual regression testing'],
    },
    {
      question: 'When planning a feature, why is it important to define success metrics?',
      answer: 'Measure progress and validate impact objectively',
      distractors: ['Avoid writing tests', 'Increase deployment frequency', 'Reduce team size'],
    },
    {
      question: 'Which answer best describes {skill} in a production environment?',
      answer: 'Using {skill} with clear performance and scalability tradeoffs',
      distractors: [
        'Ignoring {skill} requirements and pushing fast changes',
        'Writing code without reviewing {skill} implications',
        'Choosing {skill} randomly without data',
      ],
    },
    {
      question: 'Which concept is central to handling large datasets in modern applications?',
      answer: 'Batch processing or streaming with backpressure',
      distractors: ['Manual spreadsheet edits', 'Synchronous blocking I/O', 'Hard-coded limits'],
    },
    {
      question: 'What is the best first step when asked to design a new system?',
      answer: 'Clarify requirements and constraints with stakeholders',
      distractors: ['Start coding immediately', 'Design for all possible scale', 'Ignore non-functional needs'],
    },
    {
      question: 'For a programming aptitude question, what is the best approach to solve a new problem?',
      answer: 'Break it into smaller steps and verify with examples',
      distractors: ['Write the full solution immediately', 'Guess the answer and move on', 'Use only one test case'],
    },
    {
      question: 'Which tool is most helpful for tracking production incidents?',
      answer: 'Error monitoring and alerting system',
      distractors: ['Text editor', 'Graphic design software', 'Spreadsheet template'],
    },
    {
      question: 'Which metric should you review for API performance issues?',
      answer: 'Latency and error rate',
      distractors: ['Font size', 'Color palette', 'File extension'],
    },
    {
      question: 'What does it mean when a service is horizontally scalable?',
      answer: 'It can add more instances to handle load',
      distractors: ['It runs on a single machine only', 'It uses more CPU per request', 'It stores data in a local file'],
    },
    {
      question: 'Which practice improves collaboration on technical decisions?',
      answer: 'Document tradeoffs and gather stakeholder feedback',
      distractors: ['Skip meetings entirely', 'Work in isolation', 'Ignore performance data'],
    },
    {
      question: 'Which coding aptitude question is a good measure of logical thinking?',
      answer: 'Determine the output of a short algorithm given several inputs',
      distractors: ['Choose a random framework', 'Write a poem', 'Draw a diagram of the office layout'],
    },
    {
      question: 'How do you most effectively describe a complex technical decision?',
      answer: 'Start with the problem, options considered, and why you chose one',
      distractors: ['Use jargon without context', 'Skip the decision entirely', 'Talk about unrelated projects'],
    },
  ]

  const nonTechnicalTemplates = [
    {
      question: 'Which response is best when asked about a weakness during an interview?',
      answer: 'Share a real weakness and how you are improving it',
      distractors: ['Say you have none', 'Criticize the interviewer', 'Describe an unrelated skill'],
    },
    {
      question: 'What is the most important goal in a hiring manager conversation?',
      answer: 'Show how you deliver value and fit the team',
      distractors: ['Recite your resume verbatim', 'Talk only about salary', 'Discuss unrelated hobbies'],
    },
    {
      question: 'How should you answer a question about teamwork?',
      answer: 'Describe a collaborative challenge and your role in solving it',
      distractors: ['Talk about only your own contributions', 'Blame others', 'Give a vague generic answer'],
    },
    {
      question: 'Why is it useful to use STAR format in behavioral answers?',
      answer: 'It keeps responses structured and outcome-focused',
      distractors: ['It uses technical terms', 'It avoids giving examples', 'It shortens answers arbitrarily'],
    },
    {
      question: 'What should you emphasize when explaining a career change?',
      answer: 'How your past experience supports the new role',
      distractors: ['What you dislike about your old job', 'Only salary differences', 'Personal hobbies'],
    },
    {
      question: 'If asked about a difficult stakeholder, what is the best approach?',
      answer: 'Explain how you aligned priorities and kept communication open',
      distractors: ['Say you avoided them', 'Blame them completely', 'Ignore the question'],
    },
    {
      question: 'What is an important trait for a strong non-technical interview answer?',
      answer: 'Clarity and relevance to the role',
      distractors: ['Complex vocabulary', 'Long stories without a point', 'Technical jargon'],
    },
    {
      question: 'Which answer shows strong ownership?',
      answer: 'Describe a challenge you drove to resolution and the outcome',
      distractors: ['Talk about team success only', 'Mention your manager', 'Avoid responsibility'],
    },
    {
      question: 'How should you respond if you do not know an answer in an interview?',
      answer: 'Acknowledge it and explain how you would find the solution',
      distractors: ['Make up something', 'Stay silent', 'Criticize the question'],
    },
    {
      question: 'What is the most effective way to show cultural fit?',
      answer: 'Align your examples with company values and behavior',
      distractors: ['Use buzzwords without examples', 'Talk only about yourself', 'Discuss unrelated hobbies'],
    },
    {
      question: 'Which behavior demonstrates strong communication?',
      answer: 'Listening actively and summarizing the next step',
      distractors: ['Interrupting frequently', 'Using unclear terms', 'Monologuing without pause'],
    },
    {
      question: 'What is the best way to answer why you want this role?',
      answer: 'Connect your experience and motivation to the team mission',
      distractors: ['Say you need a job', 'Talk only about compensation', 'Mention unrelated goals'],
    },
    {
      question: 'When asked about a past failure, what should you highlight?',
      answer: 'What you learned and how you improved',
      distractors: ['Who was at fault', 'That it was not your responsibility', 'The negative outcome only'],
    },
    {
      question: 'Which approach is best for answering questions about leadership?',
      answer: 'Describe how you inspired others and drove results',
      distractors: ['Talk only about authority', 'Focus on yourself only', 'Avoid the situation'],
    },
    {
      question: 'What is a strong way to explain your resume story?',
      answer: 'Link your experiences into a consistent growth narrative',
      distractors: ['List jobs without connections', 'Use only bullet points', 'Focus on titles only'],
    },
    {
      question: 'How should you frame a time you had to adapt quickly?',
      answer: 'Describe the change, your response, and the positive result',
      distractors: ['Say you refused to change', 'Give a generic example', 'Blame others for the change'],
    },
    {
      question: 'Which answer demonstrates problem-solving in a non-technical context?',
      answer: 'Explain the challenge, your approach, and the impact',
      distractors: ['Describe the tools used', 'Mention only the data', 'Give a vague response'],
    },
    {
      question: 'What is the best way to present your communication style?',
      answer: 'Give a concrete example of clear, consistent team communication',
      distractors: ['Label yourself as a great communicator', 'Use buzzwords only', 'Talk about written skills only'],
    },
    {
      question: 'Which statement best describes {role}?',
      answer: 'A position focused on delivering results, collaborating strongly, and learning continuously in {role} contexts',
      distractors: [
        'A role focused only on technical output',
        'A position with no coordination required',
        'A job with no accountability for outcomes',
      ],
    },
    {
      question: 'What should you do after answering a behavior question?',
      answer: 'Summarize the result and what you learned',
      distractors: ['End abruptly', 'Change the subject', 'Ask an unrelated question'],
    },
    {
      question: 'When asked about working under pressure, what is effective?',
      answer: 'Show how you stayed organized and maintained quality',
      distractors: ['Say pressure does not affect you', 'Talk about only the stress', 'Ignore the context'],
    },
    {
      question: 'Which answer best reflects accountability?',
      answer: 'Describe a choice you made and how you owned the outcome',
      distractors: ['Talk about what others did', 'Avoid responsibility', 'Give a hypothetical example'],
    },
    {
      question: 'Why is it useful to ask the interviewer a question at the end?',
      answer: 'It shows curiosity and ensures alignment with expectations',
      distractors: ['It fills silence', 'It guarantees a job offer', 'It proves you know the company'],
    },
    {
      question: 'Which factor is most important when preparing for a company culture question?',
      answer: 'Understand the company values and how you fit them',
      distractors: ['Memorize the mission statement', 'Recite job requirements', 'Use generic phrases'],
    },
    {
      question: 'How should you discuss a team success story?',
      answer: 'Highlight your impact and the collaboration that made it possible',
      distractors: ['Take all credit yourself', 'Focus on failures only', 'Leave out other team members'],
    },
    {
      question: 'What is the best way to describe your learning mindset?',
      answer: 'Share an example where you learned and applied new knowledge',
      distractors: ['Claim you already know everything', 'Talk about unrelated hobbies', 'Mention only classes'],
    },
  ]

  const aptitudeTemplates = [
    {
      question: 'If a train travels 60 miles in 1.5 hours, what is its average speed in mph?',
      answer: '40',
      distractors: ['30', '50', '45'],
    },
    {
      question: 'Which number completes the sequence: 2, 4, 8, 16, ?',
      answer: '32',
      distractors: ['24', '30', '20'],
    },
    {
      question: 'If 5 workers can finish a job in 10 days, how many days will 10 workers take (same rate)?',
      answer: '5',
      distractors: ['15', '8', '20'],
    },
    {
      question: 'Which option best describes the mean of [2, 3, 7, 10]?',
      answer: '5.5',
      distractors: ['6', '7.5', '4.5'],
    },
    {
      question: 'Which shape has exactly four equal sides and four right angles?',
      answer: 'Square',
      distractors: ['Rectangle', 'Rhombus', 'Parallelogram'],
    },
    {
      question: 'What is 15% of 200?',
      answer: '30',
      distractors: ['20', '25', '40'],
    },
  ]

  const englishTemplates = [
    {
      question: 'Choose the correct sentence.',
      answer: 'She has been working here for two years.',
      distractors: ['She is working here since two years.', 'She works here from two years.', 'She has worked here since two years'],
    },
    {
      question: 'Select the best synonym for "concise".',
      answer: 'Brief',
      distractors: ['Confusing', 'Detailed', 'Delayed'],
    },
    {
      question: 'Choose the correctly punctuated sentence.',
      answer: 'Before the interview, review your resume, projects, and achievements.',
      distractors: ['Before the interview review your resume projects and achievements.', 'Before the interview, review your resume projects and achievements.', 'Before, the interview review your resume, projects, and achievements.'],
    },
    {
      question: 'Pick the sentence with correct subject-verb agreement.',
      answer: 'The list of shortlisted candidates is ready.',
      distractors: ['The list of shortlisted candidates are ready.', 'The shortlisted candidates is ready.', 'The lists of candidate is ready.'],
    },
    {
      question: 'What is the best antonym for "expand"?',
      answer: 'Reduce',
      distractors: ['Extend', 'Increase', 'Enlarge'],
    },
    {
      question: 'Choose the best professional email opening.',
      answer: 'Thank you for the opportunity to interview for the role.',
      distractors: ['Hey, I am waiting for your reply.', 'Give me interview details fast.', 'I need this job urgently.'],
    },
    {
      question: 'Select the word that best completes the sentence: The candidate spoke ____ during the HR round.',
      answer: 'confidently',
      distractors: ['confidence', 'confident', 'confide'],
    },
    {
      question: 'Choose the sentence that is most suitable for a workplace conversation.',
      answer: 'Could you please clarify the expected deadline?',
      distractors: ['Tell me the deadline now.', 'I do not understand anything.', 'Deadline?'],
    },
  ]

  const skillSpecificTemplates = {
    javascript: [
      { question: 'What is a closure in JavaScript?', answer: 'A function bundled together with its lexical environment', distractors: ['A way to close the browser window', 'A method to end a loop', 'A syntax error'] },
      { question: 'Which keyword is used to declare a block-scoped variable in JavaScript?', answer: 'let', distractors: ['var', 'const', 'def'] },
    ],
    python: [
      { question: 'What is a decorator in Python?', answer: 'A function that modifies the behavior of another function', distractors: ['A visual design element', 'A class attribute', 'A syntax error'] },
      { question: 'Which data structure in Python is immutable?', answer: 'Tuple', distractors: ['List', 'Dictionary', 'Set'] },
    ],
    react: [
      { question: 'What is a React Hook?', answer: 'A function that lets you hook into React state and lifecycle features', distractors: ['A class component method', 'A DOM element identifier', 'An external library'] },
      { question: 'What does the useState hook return?', answer: 'An array with the current state and a function to update it', distractors: ['An object with the current state', 'A string with the state value', 'A boolean indicating state change'] },
    ],
    node: [
      { question: 'What is the Event Loop in Node.js?', answer: 'A mechanism that handles asynchronous callbacks', distractors: ['A module for creating events', 'A database connection loop', 'A syntax loop like for or while'] },
      { question: 'Which framework is most commonly used with Node.js?', answer: 'Express', distractors: ['Django', 'Spring Boot', 'Laravel'] }
    ],
    java: [
      { question: 'What is the main difference between an interface and an abstract class in Java?', answer: 'A class can implement multiple interfaces but can extend only one abstract class', distractors: ['Interfaces can have constructors', 'Abstract classes cannot have methods', 'There is no difference'] },
      { question: 'What is the purpose of the garbage collector in Java?', answer: 'To automatically manage memory by reclaiming unused objects', distractors: ['To delete old files', 'To close unused network connections', 'To optimize database queries'] }
    ],
    sql: [
      { question: 'Which SQL statement is used to extract data from a database?', answer: 'SELECT', distractors: ['EXTRACT', 'GET', 'OPEN'] },
      { question: 'What is a primary key in SQL?', answer: 'A unique identifier for a record in a table', distractors: ['A password for the database', 'The first column in a table', 'A foreign key constraint'] }
    ],
    html: [
      { question: 'What does HTML stand for?', answer: 'Hyper Text Markup Language', distractors: ['Hyperlinks and Text Markup Language', 'Home Tool Markup Language', 'Hyper Tool Markup Language'] }
    ],
    css: [
      { question: 'What does CSS stand for?', answer: 'Cascading Style Sheets', distractors: ['Computer Style Sheets', 'Creative Style Sheets', 'Colorful Style Sheets'] }
    ],
    docker: [
      { question: 'What is a Docker container?', answer: 'A standalone, executable package that includes everything needed to run an application', distractors: ['A virtual machine', 'A physical server', 'A database schema'] }
    ],
    aws: [
      { question: 'Which AWS service is used for scalable object storage?', answer: 'Amazon S3', distractors: ['Amazon EC2', 'Amazon RDS', 'AWS Lambda'] }
    ],
    git: [
      { question: 'Which command is used to save your changes to the local repository?', answer: 'git commit', distractors: ['git push', 'git save', 'git add'] }
    ],
    typescript: [
      { question: 'What is TypeScript?', answer: 'A strongly typed superset of JavaScript', distractors: ['A new version of HTML', 'A CSS preprocessor', 'A database management system'] }
    ],
    angular: [
      { question: 'What is a Component in Angular?', answer: 'A building block of the UI containing a template, class, and styles', distractors: ['A database connection', 'A routing configuration', 'A server-side script'] }
    ]
  }

  let customizedTechnicalTemplates = [...technicalTemplates]
  let customizedNonTechnicalTemplates = [...nonTechnicalTemplates]

  const userSkillsLower = skills.map(skill => (typeof skill === 'string' ? skill.toLowerCase() : ''))
  const topUserSkills = userSkillsLower.filter(Boolean).slice(0, 15) // Limit to top 15 skills to ensure quality

  // Dynamic Generators: These multiply by your skills to create hundreds of unique MCQs
  const dynamicTechGenerators = [
    {
      question: 'When optimizing {dynamicSkill} for high scalability in a {role} environment, what is the recommended approach?',
      answer: 'Implement horizontal scaling and caching specific to {dynamicSkill} workloads',
      distractors: ['Run everything on a single server', 'Disable error logging to save memory', 'Rewrite the stack entirely without analyzing bottlenecks']
    },
    {
      question: 'How should you securely handle sensitive data when building features with {dynamicSkill}?',
      answer: 'Encrypt data at rest and in transit using established {dynamicSkill} best practices',
      distractors: ['Encode the data in Base64', 'Store plain text to improve {dynamicSkill} performance', 'Hide the data in client-side storage']
    },
    {
      question: 'What is the most effective way to debug a memory leak or performance bottleneck in {dynamicSkill}?',
      answer: 'Use dedicated {dynamicSkill} profiling tools to trace execution and memory retention',
      distractors: ['Randomly delete variables until memory drops', 'Restart the server every 10 minutes automatically', 'Increase hardware RAM and ignore the codebase']
    },
    {
      question: 'When writing tests for {dynamicSkill} components, what should be your primary focus?',
      answer: 'Testing the expected behaviors and public interfaces of the {dynamicSkill} module in isolation',
      distractors: ['Testing internal private variables exclusively', 'Connecting tests directly to production databases', 'Skipping tests if the {dynamicSkill} code compiles']
    },
    {
      question: 'What is a common anti-pattern to avoid when organizing a large {dynamicSkill} codebase?',
      answer: 'Creating tight coupling and circular dependencies between {dynamicSkill} modules',
      distractors: ['Separating concerns into modular packages', 'Using consistent naming conventions', 'Writing comprehensive API documentation']
    },
    {
      question: 'If a critical production service relying on {dynamicSkill} goes down, what is the best first step?',
      answer: 'Check error logs and monitoring metrics for the {dynamicSkill} service to identify the root cause',
      distractors: ['Immediately push untested changes to production', 'Blame the cloud provider without checking logs', 'Delete the {dynamicSkill} database tables to reset state']
    },
    {
      question: 'How can you ensure consistent code quality across a team working with {dynamicSkill}?',
      answer: 'Implement automated linting, formatting, and CI/CD pipelines for the {dynamicSkill} repository',
      distractors: ['Rely solely on manual visual inspections of {dynamicSkill} code', 'Allow each developer to use their own formatting rules', 'Never review pull requests to save time']
    }
  ]

  const dynamicNonTechGenerators = [
    {
      question: 'When leading a project utilizing {dynamicSkill}, how do you align stakeholders with conflicting priorities?',
      answer: 'Facilitate a discussion to find common ground and document decisions regarding the {dynamicSkill} integration',
      distractors: ['Ignore the conflict and build the {dynamicSkill} feature my way', 'Complain to management about the stakeholders', 'Halt all {dynamicSkill} development until they agree']
    },
    {
      question: 'Describe the best way to explain complex {dynamicSkill} concepts to non-technical team members.',
      answer: 'Use analogies and focus on the business value of {dynamicSkill} rather than technical jargon',
      distractors: ['Show them the raw {dynamicSkill} source code', 'Tell them it is too complicated to explain', 'Make them read the {dynamicSkill} official documentation']
    },
    {
      question: 'If a deadline for a critical {dynamicSkill} deliverable is at risk, how should you communicate this?',
      answer: 'Proactively notify stakeholders with a clear mitigation plan for the {dynamicSkill} tasks',
      distractors: ['Wait until the deadline passes to see if you can finish', 'Blame the tools and {dynamicSkill} complexity', 'Stop communicating entirely and work overnight']
    },
    {
      question: 'How do you handle a situation where a team member is struggling to learn {dynamicSkill}?',
      answer: 'Offer pairing sessions and share helpful {dynamicSkill} resources to support their learning',
      distractors: ['Take over their {dynamicSkill} tasks entirely', 'Ignore their struggles to focus on my work', 'Report them to management immediately']
    },
    {
      question: 'What is the most important factor when estimating a timeline for a {dynamicSkill} feature?',
      answer: 'Factoring in testing, potential unknowns, and complexity of the {dynamicSkill} implementation',
      distractors: ['Guessing the fastest possible time to impress management', 'Only counting the time to write the {dynamicSkill} code', 'Copying the timeline from a completely unrelated project']
    }
  ]

  // Generate the permutations
  topUserSkills.forEach(skill => {
    const displaySkill = skill.charAt(0).toUpperCase() + skill.slice(1)

    dynamicTechGenerators.forEach(gen => {
      customizedTechnicalTemplates.push({
        question: gen.question.replace(/\{dynamicSkill\}/g, displaySkill),
        answer: gen.answer.replace(/\{dynamicSkill\}/g, displaySkill),
        distractors: gen.distractors.map(d => d.replace(/\{dynamicSkill\}/g, displaySkill))
      })
    })

    dynamicNonTechGenerators.forEach(gen => {
      customizedNonTechnicalTemplates.push({
        question: gen.question.replace(/\{dynamicSkill\}/g, displaySkill),
        answer: gen.answer.replace(/\{dynamicSkill\}/g, displaySkill),
        distractors: gen.distractors.map(d => d.replace(/\{dynamicSkill\}/g, displaySkill))
      })
    })
  })

  userSkillsLower.forEach(userSkill => {
    Object.keys(skillSpecificTemplates).forEach(skillKey => {
      if (userSkill.includes(skillKey)) {
        customizedTechnicalTemplates.push(...skillSpecificTemplates[skillKey])
      }
    })
  })

  // Remove duplicates and shuffle to interleave skill-specific questions naturally
  const customizedAptitudeTemplates = shuffleArray([...new Set(aptitudeTemplates)])
  const customizedEnglishTemplates = shuffleArray([...new Set(englishTemplates)])
  customizedTechnicalTemplates = shuffleArray([...new Set(customizedTechnicalTemplates)])
  customizedNonTechnicalTemplates = shuffleArray([...new Set(customizedNonTechnicalTemplates)])

  const totalQuestions = 200
  const questions = Array.from({ length: totalQuestions }, (_, index) => {
    let templateList = customizedTechnicalTemplates
    let category = 'Technical'

    if (normalizedTrack === 'technical') {
      if (index % 3 === 2) {
        templateList = customizedAptitudeTemplates
        category = 'Aptitude'
      } else {
        templateList = customizedTechnicalTemplates
        category = index % 4 === 0 ? 'Resume Skill' : 'Technical'
      }
    } else if (normalizedTrack === 'nonTechnical') {
      const mod = index % 3
      if (mod === 0) {
        templateList = customizedNonTechnicalTemplates
        category = index % 4 === 0 ? 'Resume Story' : 'Behavioral'
      } else if (mod === 1) {
        templateList = customizedAptitudeTemplates
        category = 'Aptitude'
      } else {
        templateList = customizedEnglishTemplates
        category = 'English'
      }
    }
    else if (normalizedTrack === 'combined') {
      const mod = index % 3
      if (mod === 0) {
        templateList = customizedTechnicalTemplates
        category = 'Technical'
      } else if (mod === 1) {
        templateList = customizedNonTechnicalTemplates
        category = 'Behavioral'
      } else {
        templateList = customizedAptitudeTemplates
        category = 'Aptitude'
      }
    }

    const template = templateList[index % templateList.length]
    return makeQuestionItem(template, index, category)
  })

  if (normalizedTrack === 'nonTechnical') {
    return {
      track: 'nonTechnical',
      label: 'Non-technical',
      summary: `A non-technical placement-style test for ${recentRole}, with behavioral, aptitude, and English questions.`,
      recommendedFor: ['HR screen', 'Aptitude round', 'English communication', 'Manager round'],
      readinessTips: ['Use STAR answers', 'Practice quick aptitude calculations', 'Check grammar and professional tone'],
      questions,
    }
  }

  if (normalizedTrack === 'combined') {
    return {
      track: 'combined',
      label: 'Combined',
      summary: `A mixed aptitude and technical practice test tailored for ${recentRole}.`,
      recommendedFor: ['Screening', 'Technical + Behavioral practice', 'Aptitude review'],
      readinessTips: ['Mix of technical depth and aptitude speed', 'Practice time management', 'Review core projects'],
      questions,
    }
  }

  return {
    track: 'technical',
    label: 'Technical',
    summary: `Recommended for coding, system design, architecture, and ${quoteSkill} aptitude questions.`,
    recommendedFor: ['Engineering round', 'System design', 'Project deep dive', 'Technical hiring manager'],
    readinessTips: ['Review projects deeply', 'Prepare metrics', 'Practice explaining tradeoffs'],
    questions,
  }
}

router.get('/', authenticateToken, async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user.userId }).sort({ createdAt: -1 })
    res.json(resumes.map((resume) => buildResumeResponse(resume)))
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch resumes', error: err.message })
  }
})

// Create a resume from provided JSON (no file)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const payload = req.body.resumeData || req.body || {}

    const resumeData = {
      personalInfo: payload.personalInfo || {},
      summary: payload.summary || payload.personalInfo?.summary || '',
      workExperience: payload.experience || payload.workExperience || [],
      experience: payload.experience || payload.workExperience || [],
      education: payload.education || [],
      skills: payload.skills || [],
      projects: payload.projects || [],
      certifications: payload.certifications || [],
    }

    const atsData = calculateATSScore({ ...resumeData, workExperience: resumeData.workExperience || [] })

    const resume = new Resume({
      userId: req.user.userId,
      personalInfo: resumeData.personalInfo,
      summary: resumeData.summary,
      workExperience: resumeData.workExperience,
      experience: resumeData.experience,
      education: resumeData.education,
      skills: resumeData.skills,
      projects: resumeData.projects,
      certifications: resumeData.certifications,
      atsScore: {
        score: atsData.score,
        feedback: atsData.recommendations,
        keywordMatches: atsData.keywordMatches,
        lastCalculated: new Date(),
      },
      atsAnalytics: {
        ...atsData,
        lastCalculated: new Date(),
      },
      extractedContent: {
        text: payload.extractedText || '',
        rawText: payload.extractedText || '',
      },
      fileName: payload.fileName || 'created-manual',
      fileType: payload.fileType || 'application/json',
    })

    await resume.save()

    // Link resume to user and sync key fields
    try {
      const userUpdates = {}
      if (resume.skills && resume.skills.length > 0) userUpdates.skills = Array.from(new Set([...(resume.skills || [])]))
      if (resume.personalInfo?.location) userUpdates.location = resume.personalInfo.location
      userUpdates.resumeId = resume._id
      await User.findByIdAndUpdate(req.user.userId, { $set: userUpdates })
    } catch (updateErr) {
      console.error('Failed to link created resume to user:', updateErr)
    }

    res.status(201).json({ resume: buildResumeResponse(resume), resumeData })
  } catch (err) {
    res.status(500).json({ message: 'Failed to create resume', error: err.message })
  }
})

router.delete('/', authenticateToken, async (req, res) => {
  try {
    const [deleteResult] = await Promise.all([
      Resume.deleteMany({ userId: req.user.userId }),
      User.updateOne({ _id: req.user.userId }, { $unset: { resumeId: '' } }),
    ])

    res.json({
      message: 'Resume data cleared successfully',
      deletedCount: deleteResult.deletedCount || 0,
    })
  } catch (err) {
    res.status(500).json({ message: 'Failed to clear resume data', error: err.message })
  }
})

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id)
    if (!resume || resume.userId.toString() !== req.user.userId) {
      return res.status(404).json({ message: 'Resume not found' })
    }
    res.json(buildResumeResponse(resume))
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch resume', error: err.message })
  }
})

router.post('/upload', authenticateToken, (req, res) => {
  upload.single('resume')(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ message: 'Resume must be 10MB or smaller' })
      }

      return res.status(400).json({ message: err.message || 'Invalid resume upload' })
    }

    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Resume file is required' })
      }

      const parsedData = await parseResume(req.file.buffer, req.file.mimetype, req.file.originalname)
      const resumeData = parsedData.resumeData || parsedData
      const atsData = calculateATSScore({
        ...resumeData,
        workExperience: resumeData.experience || parsedData.workExperience || [],
      })

      const resume = new Resume({
        userId: req.user.userId,
        personalInfo: resumeData.personalInfo,
        summary: resumeData.personalInfo?.summary || '',
        workExperience: resumeData.experience || [],
        experience: resumeData.experience || [],
        education: resumeData.education || [],
        skills: resumeData.skills || [],
        projects: resumeData.projects || [],
        certifications: resumeData.certifications || [],
        atsScore: {
          score: atsData.score,
          feedback: atsData.recommendations,
          keywordMatches: atsData.keywordMatches,
          lastCalculated: new Date(),
        },
        atsAnalytics: {
          ...atsData,
          lastCalculated: new Date(),
        },
        extractedContent: {
          text: parsedData.extractedText,
          rawText: parsedData.extractedText,
        },
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
      })

      await resume.save()

      // Auto-sync key resume features to the user's profile
      try {
        const userUpdates = {}
        if (resume.skills && resume.skills.length > 0) userUpdates.skills = Array.from(new Set([...(resume.skills || [])]))
        if (resume.personalInfo?.location) userUpdates.location = resume.personalInfo.location
        if (Object.keys(userUpdates).length > 0) {
          await User.findByIdAndUpdate(req.user.userId, {
            $set: {
              ...userUpdates,
              resumeId: resume._id,
            },
          })
        } else {
          // still set resumeId so frontend can locate latest resume
          await User.findByIdAndUpdate(req.user.userId, { $set: { resumeId: resume._id } })
        }
      } catch (updateErr) {
        console.error('Failed to sync resume to user:', updateErr)
      }

      res.status(201).json({
        resume: buildResumeResponse(resume),
        parsedResume: resumeData,
        resumeData,
        atsScore: atsData.score,
        feedback: atsData.recommendations,
        atsAnalytics: atsData,
      })
    } catch (error) {
      res.status(500).json({ message: 'Resume upload failed', error: error.message })
    }
  })
})

router.post('/summary', authenticateToken, async (req, res) => {
  try {
    const resumeData = req.body.resumeData || req.body
    res.json({ summary: buildGeneratedSummary(resumeData) })
  } catch (err) {
    console.error('Summary Error:', err)
    res.json({ summary: 'A dedicated professional focused on measurable outcomes, cross-functional collaboration, and execution quality.' })
  }
})

router.post('/interview-prep', authenticateToken, requirePro, async (req, res) => {
  try {
    const resumeData = req.body.resumeData || req.body
    const prep = await generateResumeInterviewPrep(resumeData, req.body.targetRole, req.body.track)
    res.json({ prep })
  } catch (err) {
    console.error('Interview Prep Error:', err)
    res.json({ 
      prep: {
        role: req.body.targetRole || 'Professional',
        label: 'General',
        summary: 'Standard interview preparation guide.',
        technicalRecommendations: ['Prepare a deep project example.', 'Review fundamental concepts.'],
        nonTechnicalRecommendations: ['Use STAR format.', 'Connect your experience to the role.'],
        focusAreas: ['Highlight your strongest skills.', 'Be ready to describe cross-functional work.'],
        questions: ['Tell me about a time you solved a difficult challenge.', 'Why are you a good fit for this role?'],
        talkingPoints: ['Structure answers clearly.', 'Focus on impact and learning.']
      }
    })
  }
})

router.post('/interview-evaluate', authenticateToken, requirePro, async (req, res) => {
  try {
    const questions = Array.isArray(req.body.questions)
      ? req.body.questions.slice(0, 10).map((item) => cleanInterviewText(item, 1200))
      : []
    const answers = Array.isArray(req.body.answers)
      ? req.body.answers.slice(0, questions.length).map((item) => cleanInterviewText(item, 8000))
      : []

    if (!questions.length) {
      return res.status(400).json({ message: 'At least one interview question is required.' })
    }

    while (answers.length < questions.length) answers.push('')

    const input = {
      resumeData: req.body.resumeData || {},
      targetRole: cleanInterviewText(req.body.targetRole, 250),
      track: req.body.track === 'nonTechnical' ? 'nonTechnical' : 'technical',
      questions,
      answers,
      durationSeconds: Math.max(0, Math.min(10800, Number(req.body.durationSeconds) || 0)),
    }

    let evaluation
    try {
      evaluation = await evaluateInterviewWithGemini(input)
    } catch (aiError) {
      console.error('AI interview evaluation failed, using local evaluator:', aiError.message)
    }

    if (!evaluation) evaluation = scoreInterviewLocally(input)
    res.json({ evaluation })
  } catch (err) {
    console.error('Interview Evaluation Error:', err)
    res.status(500).json({ message: 'Could not evaluate this interview right now.' })
  }
})

router.post('/practice-test', authenticateToken, requirePro, async (req, res) => {
  try {
    const resumeData = req.body.resumeData || req.body
    res.json({ test: buildPracticeTest(resumeData, req.body.track) })
  } catch (err) {
    console.error('Practice Test Error:', err)
    // Fallback response guarantees the frontend NEVER receives a 500 error and NEVER goes blank
    res.json({
      test: {
        track: req.body.track === 'nonTechnical' ? 'nonTechnical' : 'technical',
        label: 'Standard Practice',
        summary: 'We generated a standard practice test to help you prepare.',
        recommendedFor: ['General practice', 'Technical screen', 'Behavioral round'],
        readinessTips: ['Use STAR answers', 'Communicate clearly', 'Explain your tradeoffs'],
        questions: [
          {
            id: 1,
            question: 'Which of the following is a key software engineering principle?',
            options: ['Don\'t Repeat Yourself (DRY)', 'Always Repeat Yourself', 'Ignore Code Quality', 'Never Write Tests'],
            answer: 'Don\'t Repeat Yourself (DRY)'
          },
          {
            id: 2,
            question: 'When answering a behavioral interview question, which framework is most effective?',
            options: ['Situation, Task, Action, Result (STAR)', 'Only focus on the Result', 'Avoid giving specific details', 'Blame others for failures'],
            answer: 'Situation, Task, Action, Result (STAR)'
          }
        ]
      }
    })
  }
})

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id)
    if (!resume || resume.userId.toString() !== req.user.userId) {
      return res.status(404).json({ message: 'Resume not found' })
    }

    const payload = req.body.resumeData || req.body

    if (payload.personalInfo) {
      resume.personalInfo = {
        ...resume.personalInfo?.toObject?.(),
        ...payload.personalInfo,
      }
    }

    if (payload.summary !== undefined) {
      resume.summary = payload.summary
    }

    if (payload.experience || payload.workExperience) {
      resume.workExperience = payload.experience || payload.workExperience
      resume.experience = payload.experience || payload.workExperience
    }

    if (payload.education) {
      resume.education = payload.education
    }

    if (payload.skills) {
      resume.skills = payload.skills
    }

    if (payload.projects) {
      resume.projects = payload.projects
    }

    if (payload.certifications) {
      resume.certifications = payload.certifications
    }

    if (payload.personalInfo || payload.experience || payload.workExperience || payload.skills || payload.education || payload.projects || payload.certifications) {
      const atsData = calculateATSScore({
        ...resume.toObject(),
        workExperience: resume.workExperience || resume.experience || [],
      })
      resume.atsScore = {
        score: atsData.score,
        feedback: atsData.recommendations,
        keywordMatches: atsData.keywordMatches,
        lastCalculated: new Date(),
      }
      resume.atsAnalytics = {
        ...atsData,
        lastCalculated: new Date(),
      }
    }

    await resume.save()
    res.json(buildResumeResponse(resume))
  } catch (err) {
    res.status(500).json({ message: 'Failed to update resume', error: err.message })
  }
})

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id)
    if (!resume || resume.userId.toString() !== req.user.userId) {
      return res.status(404).json({ message: 'Resume not found' })
    }

    await resume.deleteOne()
    res.json({ message: 'Resume deleted successfully' })
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete resume', error: err.message })
  }
})

export default router
