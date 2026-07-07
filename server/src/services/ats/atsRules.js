import { normalizeSkills } from '../../utils/normalizeSkills.js'

const PROFILE_FIELDS = ['fullName', 'email', 'phone', 'linkedin', 'github']
const FRONTEND_SKILLS = new Set(['react', 'next.js', 'vue', 'angular', 'svelte', 'tailwind css', 'redux', 'redux toolkit', 'typescript', 'javascript'])
const BACKEND_SKILLS = new Set(['node.js', 'express.js', 'nestjs', 'django', 'flask', 'fastapi', 'spring boot', 'asp.net', 'laravel', 'ruby on rails', 'graphql', 'rest api', 'mongoose', 'prisma', 'sequelize', 'typeorm', 'koa', 'hapi', 'grpc'])
const DEPLOYMENT_SKILLS = new Set(['docker', 'kubernetes', 'aws', 'azure', 'google cloud platform', 'ci/cd', 'github actions', 'nginx', 'terraform', 'ansible', 'jenkins', 'vercel', 'netlify', 'render', 'railway', 'heroku', 'cloudflare', 'serverless'])
const MODERN_STACK = new Set(['react', 'next.js', 'typescript', 'node.js', 'express.js', 'mongodb', 'postgresql', 'docker', 'kubernetes', 'aws', 'graphql', 'ci/cd', 'github actions', 'prisma', 'redux toolkit', 'tailwind css'])

const hasText = (value) => typeof value === 'string' && value.trim().length > 0

const toArray = (value) => (Array.isArray(value) ? value.filter(Boolean) : [])

const getExperienceItems = (resume) => {
  const directExperience = toArray(resume.experience)
  if (directExperience.length > 0) {
    return directExperience
  }

  return toArray(resume.workExperience)
}

const buildSkillSet = (skills) => new Set(normalizeSkills(skills).map((skill) => skill.toLowerCase()))

const countSkillHits = (skillSet, skillGroup) =>
  Array.from(skillGroup).reduce((count, skill) => count + (skillSet.has(skill) ? 1 : 0), 0)

const categorizeCoverage = (skillSet) => ({
  frontend: countSkillHits(skillSet, FRONTEND_SKILLS),
  backend: countSkillHits(skillSet, BACKEND_SKILLS),
  deployment: countSkillHits(skillSet, DEPLOYMENT_SKILLS),
  modern: countSkillHits(skillSet, MODERN_STACK),
})

const getProfileCompletion = (resume) => {
  const personalInfo = resume.personalInfo || {}

  return PROFILE_FIELDS.reduce((count, field) => count + (hasText(personalInfo[field]) ? 1 : 0), 0)
}

const getTechnicalCategories = (skillSet) => {
  const categories = []

  if (countSkillHits(skillSet, FRONTEND_SKILLS) > 0) categories.push('frontend')
  if (countSkillHits(skillSet, BACKEND_SKILLS) > 0) categories.push('backend')
  if (countSkillHits(skillSet, DEPLOYMENT_SKILLS) > 0) categories.push('deployment')
  if (countSkillHits(skillSet, MODERN_STACK) >= 2) categories.push('modern')

  return categories
}

const countKeywordRichness = (normalizedSkills, resumeText) => {
  if (normalizedSkills.length === 0) return 0

  const uniqueMatches = new Set()

  for (const skill of normalizedSkills) {
    const normalized = skill.toLowerCase()
    if (resumeText.includes(normalized)) {
      uniqueMatches.add(normalized)
    }
  }

  return uniqueMatches.size
}

const countNumericMetricsInExperience = (experience) => {
  const text = (Array.isArray(experience) ? experience : []).map((e) => JSON.stringify(e || {})).join(' ')
  const matches = text.match(/\b\d{1,3}%?\b/g)
  return matches ? matches.length : 0
}

const hasActionVerbInExperience = (experience) => {
  const actionVerbs = ['led', 'developed', 'built', 'designed', 'implemented', 'launched', 'improved', 'reduced', 'increased', 'optimized', 'managed', 'created', 'owned', 'ship', 'automated', 'scaled']
  const text = (Array.isArray(experience) ? experience : []).map((e) => JSON.stringify(e || {})).join(' ').toLowerCase()
  return actionVerbs.some((v) => text.includes(v))
}

const hasConciseBullets = (experience) => {
  // Check that descriptions contain multiple short sentences or bullet-like entries
  for (const item of Array.isArray(experience) ? experience : []) {
    const desc = String(item.description || '')
    if (!desc) continue
    const sentences = desc.split(/[\.\n]/).map((s) => s.trim()).filter(Boolean)
    if (sentences.length >= 2 && sentences.every((s) => s.split(' ').length <= 30)) return true
  }
  return false
}

export const buildATSContext = (resume = {}) => {
  const personalInfo = resume.personalInfo || {}
  const experience = getExperienceItems(resume)
  const education = toArray(resume.education)
  const projects = toArray(resume.projects)
  const certifications = toArray(resume.certifications)
  const normalizedSkills = normalizeSkills(resume.skills || [])
  const skillSet = buildSkillSet(normalizedSkills)
  const resumeText = [
    personalInfo.fullName,
    personalInfo.email,
    personalInfo.phone,
    personalInfo.linkedin,
    personalInfo.github,
    personalInfo.summary,
    resume.summary,
    ...experience.map((item) => JSON.stringify(item || {})),
    ...education.map((item) => JSON.stringify(item || {})),
    ...projects.map((item) => JSON.stringify(item || {})),
    ...certifications.map((item) => JSON.stringify(item || {})),
    ...normalizedSkills,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return {
    resume,
    personalInfo,
    experience,
    education,
    projects,
    certifications,
    normalizedSkills,
    skillSet,
    resumeText,
    profileCompletion: getProfileCompletion(resume),
    technicalCategories: getTechnicalCategories(skillSet),
    skillCoverage: categorizeCoverage(skillSet),
    keywordRichness: countKeywordRichness(normalizedSkills, resumeText),
  }
}

export const atsRules = [
  {
    id: 'profile-full-name',
    title: 'Full name present',
    category: 'Profile Completeness',
    points: 5,
    validate: (context) => hasText(context.personalInfo.fullName),
    recommendation: 'Add your full name at the top of the resume',
  },
  {
    id: 'profile-email',
    title: 'Professional email present',
    category: 'Profile Completeness',
    points: 5,
    validate: (context) => hasText(context.personalInfo.email),
    recommendation: 'Include a professional email address in the header',
  },
  {
    id: 'profile-phone',
    title: 'Phone number present',
    category: 'Profile Completeness',
    points: 4,
    validate: (context) => hasText(context.personalInfo.phone),
    recommendation: 'Add a reachable phone number for recruiters',
  },
  {
    id: 'profile-linkedin',
    title: 'LinkedIn profile present',
    category: 'Profile Completeness',
    points: 3,
    validate: (context) => hasText(context.personalInfo.linkedin),
    recommendation: 'Add your LinkedIn profile to improve recruiter trust',
  },
  {
    id: 'profile-github',
    title: 'GitHub profile present',
    category: 'Profile Completeness',
    points: 3,
    validate: (context) => hasText(context.personalInfo.github),
    recommendation: 'Include your GitHub profile to showcase technical work',
  },
  {
    id: 'content-skills',
    title: 'Technical skills listed',
    category: 'Resume Content',
    points: 10,
    validate: (context) => context.normalizedSkills.length >= 5,
    recommendation: 'Add more technical skills to improve ATS strength',
  },
  {
    id: 'content-projects',
    title: 'Projects section included',
    category: 'Resume Content',
    points: 8,
    validate: (context) => context.projects.length >= 1,
    recommendation: 'Include at least one technical project with measurable impact',
  },
  {
    id: 'content-education',
    title: 'Education section included',
    category: 'Resume Content',
    points: 8,
    validate: (context) => context.education.length >= 1,
    recommendation: 'Add your education history to improve resume completeness',
  },
  {
    id: 'content-experience',
    title: 'Experience section included',
    category: 'Resume Content',
    points: 12,
    validate: (context) => context.experience.length >= 1,
    recommendation: 'Add professional experience entries with clear outcomes',
  },
  {
    id: 'technical-modern-stack',
    title: 'Modern technologies listed',
    category: 'Technical Quality',
    points: 10,
    validate: (context) => context.skillCoverage.modern >= 2,
    recommendation: 'Add modern technologies such as TypeScript, React, Docker, or AWS',
  },
  {
    id: 'technical-full-stack',
    title: 'Frontend and backend diversity',
    category: 'Technical Quality',
    points: 8,
    validate: (context) => context.skillCoverage.frontend > 0 && context.skillCoverage.backend > 0,
    recommendation: 'Show both frontend and backend experience to improve versatility',
  },
  {
    id: 'technical-deployment',
    title: 'Deployment and tooling skills',
    category: 'Technical Quality',
    points: 6,
    validate: (context) => context.skillCoverage.deployment >= 2,
    recommendation: 'Add deployment and tooling skills such as Docker, Kubernetes, or CI/CD',
  },
  {
    id: 'ats-keyword-richness',
    title: 'Keyword richness',
    category: 'ATS Optimization',
    points: 5,
    validate: (context) => context.keywordRichness >= 8,
    recommendation: 'Add more role-relevant keywords throughout the resume',
  },
  {
    id: 'ats-profile-completeness',
    title: 'Profile completeness',
    category: 'ATS Optimization',
    points: 5,
    validate: (context) => context.profileCompletion >= PROFILE_FIELDS.length,
    recommendation: 'Complete every profile field so ATS systems can identify you quickly',
  },
  {
    id: 'ats-technical-coverage',
    title: 'Technical coverage breadth',
    category: 'ATS Optimization',
    points: 11,
    validate: (context) => context.technicalCategories.length >= 3,
    recommendation: 'Broaden technical coverage across frontend, backend, deployment, and modern stack skills',
  },
  {
    id: 'content-quantified-achievements',
    title: 'Quantified achievements present',
    category: 'Resume Content',
    points: 10,
    validate: (context) => countNumericMetricsInExperience(context.experience) >= 1,
    recommendation: 'Add measurable outcomes (numbers, percentages, metrics) to your experience bullets',
  },
  {
    id: 'content-action-verbs',
    title: 'Action-oriented language',
    category: 'Resume Content',
    points: 6,
    validate: (context) => hasActionVerbInExperience(context.experience),
    recommendation: 'Use action verbs (led, developed, improved) to describe impact',
  },
  {
    id: 'content-concise-bullets',
    title: 'Concise bullet-style results',
    category: 'Resume Content',
    points: 5,
    validate: (context) => hasConciseBullets(context.experience),
    recommendation: 'Use short bullet points (1-2 lines) for each achievement or responsibility',
  },
]
