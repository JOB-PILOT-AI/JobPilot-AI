import { normalizeSkills } from '../../utils/normalizeSkills.js'

const toNumber = (value, fallback = 0) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

const unique = (items = []) => Array.from(new Set(items.filter(Boolean)))

const getResumeSkills = (resume, atsAnalytics) => {
  const normalized = atsAnalytics?.normalizedSkills || resume?.atsAnalytics?.normalizedSkills || resume?.skills || []
  return unique(normalizeSkills(normalized).map((skill) => skill.toLowerCase()))
}

const getJobSkills = (job) => {
  return unique(
    normalizeSkills([
      ...(Array.isArray(job.requiredSkills) ? job.requiredSkills : []),
      ...(Array.isArray(job.preferredSkills) ? job.preferredSkills : []),
    ]).map((skill) => skill.toLowerCase())
  )
}

const overlap = (left = [], right = []) => left.filter((item) => right.includes(item))

const difference = (left = [], right = []) => left.filter((item) => !right.includes(item))

const scoreRatio = (matchedCount, totalCount) => {
  if (!totalCount) return 0
  return Math.min(100, Math.round((matchedCount / totalCount) * 100))
}

const getResumeCompleteness = (resume, atsAnalytics) => {
  const profileCompletion = toNumber(atsAnalytics?.profileCompletion, 0)
  const experienceCount = Array.isArray(resume?.experience || resume?.workExperience) ? (resume.experience || resume.workExperience).length : 0
  const projectCount = Array.isArray(resume?.projects) ? resume.projects.length : 0
  const educationCount = Array.isArray(resume?.education) ? resume.education.length : 0

  const sections = [
    profileCompletion / 5,
    Math.min(experienceCount, 3) / 3,
    Math.min(projectCount, 3) / 3,
    Math.min(educationCount, 2) / 2,
  ]

  return Math.round((sections.reduce((sum, value) => sum + value, 0) / sections.length) * 100)
}

const getTechnicalAlignment = (resumeSkills, requiredSkills, preferredSkills) => {
  const coreOverlap = overlap(requiredSkills, resumeSkills)
  const broaderOverlap = overlap(preferredSkills, resumeSkills)
  const breadth = unique([...coreOverlap, ...broaderOverlap]).length
  const alignmentScore = requiredSkills.length > 0 ? (coreOverlap.length / requiredSkills.length) * 0.75 : 0.5
  const breadthScore = preferredSkills.length > 0 ? (broaderOverlap.length / preferredSkills.length) * 0.25 : 0.15

  return Math.min(100, Math.round(((alignmentScore + breadthScore + Math.min(breadth / 8, 0.2)) / 1.2) * 100))
}

const getConfidence = (matchPercentage, atsScore, job, resumeSkills) => {
  const dataDensity = [job.title, job.company, job.description].filter(Boolean).length / 3
  const skillDensity = Math.min(resumeSkills.length / 12, 1)
  const atsDensity = Math.min(toNumber(atsScore, 0) / 100, 1)

  return Math.max(40, Math.min(98, Math.round(matchPercentage * 0.45 + atsDensity * 25 + skillDensity * 15 + dataDensity * 10 + 10)))
}

const buildStrengths = ({ matchedRequired, matchedPreferred, technicalAlignment, resumeCompleteness }) => {
  const strengths = []

  if (matchedRequired.length >= 3) strengths.push('Strong required skill alignment')
  if (matchedPreferred.length >= 2) strengths.push('Relevant preferred skill coverage')
  if (technicalAlignment >= 70) strengths.push('Balanced technical stack alignment')
  if (resumeCompleteness >= 70) strengths.push('Resume profile and content are well structured')

  return strengths
}

const buildWeaknesses = ({ missingRequired, missingPreferred, technicalAlignment, resumeCompleteness }) => {
  const weaknesses = []

  if (missingRequired.length > 0) weaknesses.push('Required skill gaps remain')
  if (missingPreferred.length > 0) weaknesses.push('Preferred skill coverage is incomplete')
  if (technicalAlignment < 60) weaknesses.push('Technical stack alignment is limited')
  if (resumeCompleteness < 60) weaknesses.push('Resume completeness limits match confidence')

  return weaknesses
}

const buildExplanation = ({ strengths, weaknesses, matchedRequired, missingRequired, matchedPreferred, missingPreferred, atsAnalytics }) => {
  const explanation = []

  if (matchedRequired.length > 0) {
    explanation.push(`Required skills matched: ${matchedRequired.slice(0, 4).join(', ')}`)
  }

  if (matchedPreferred.length > 0) {
    explanation.push(`Preferred skills matched: ${matchedPreferred.slice(0, 4).join(', ')}`)
  }

  if (missingRequired.length > 0) {
    explanation.push(`Missing required skills: ${missingRequired.slice(0, 4).join(', ')}`)
  }

  if (missingPreferred.length > 0) {
    explanation.push(`Missing preferred skills: ${missingPreferred.slice(0, 4).join(', ')}`)
  }

  if (atsAnalytics?.healthLabel) {
    explanation.push(`ATS profile health: ${atsAnalytics.healthLabel}`)
  }

  if (strengths.length > 0) {
    explanation.push(`Strength areas: ${strengths.slice(0, 3).join(', ')}`)
  }

  if (weaknesses.length > 0) {
    explanation.push(`Weakness areas: ${weaknesses.slice(0, 3).join(', ')}`)
  }

  return explanation
}

export const calculateJobMatch = (resume = {}, job = {}, context = {}) => {
  const atsAnalytics = context.atsAnalytics || resume.atsAnalytics || null
  const resumeSkills = getResumeSkills(resume, atsAnalytics)
  const requiredSkills = getJobSkills({ requiredSkills: job.requiredSkills || [] })
  const preferredSkills = getJobSkills({ requiredSkills: job.preferredSkills || [] })

  const matchedRequired = overlap(requiredSkills, resumeSkills)
  const matchedPreferred = overlap(preferredSkills, resumeSkills)
  const missingRequired = difference(requiredSkills, resumeSkills)
  const missingPreferred = difference(preferredSkills, resumeSkills)

  const requiredScore = scoreRatio(matchedRequired.length, requiredSkills.length)
  const preferredScore = scoreRatio(matchedPreferred.length, preferredSkills.length)
  const diversityScore = Math.min(100, Math.round((resumeSkills.length / 12) * 100))
  const technicalAlignment = getTechnicalAlignment(resumeSkills, requiredSkills, preferredSkills)
  const resumeCompleteness = getResumeCompleteness(resume, atsAnalytics)
  const atsScore = toNumber(atsAnalytics?.score, 0)

  const matchPercentage = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        requiredScore * 0.42 +
        preferredScore * 0.16 +
        diversityScore * 0.1 +
        technicalAlignment * 0.12 +
        resumeCompleteness * 0.08 +
        atsScore * 0.12
      )
    )
  )

  const strengths = buildStrengths({ matchedRequired, matchedPreferred, technicalAlignment, resumeCompleteness })
  const weaknesses = buildWeaknesses({ missingRequired, missingPreferred, technicalAlignment, resumeCompleteness })
  const confidence = getConfidence(matchPercentage, atsScore, job, resumeSkills)
  const explanation = buildExplanation({ strengths, weaknesses, matchedRequired, missingRequired, matchedPreferred, missingPreferred, atsAnalytics })

  return {
    matchPercentage,
    matchedSkills: unique([...matchedRequired, ...matchedPreferred]),
    missingSkills: unique([...missingRequired, ...missingPreferred]),
    strengths,
    weaknesses,
    confidence,
    explanation,
    technicalAlignment,
    atsContribution: atsScore,
    requiredSkillMatch: requiredScore,
    preferredSkillMatch: preferredScore,
    resumeCompleteness,
    summary: explanation.slice(0, 3),
  }
}
