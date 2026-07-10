import { extractSkillsFromText, normalizeSkillText, normalizeSkills } from './normalizeSkills.js'

const JOB_REMOTE_TYPES = ['Remote', 'On-site', 'Hybrid']
const JOB_EMPLOYMENT_TYPES = ['Full-time', 'Contract', 'Part-time', 'Internship']

const textStopwords = new Set([
  'and',
  'or',
  'the',
  'for',
  'with',
  'to',
  'in',
  'at',
  'on',
  'of',
  'senior',
  'staff',
  'principal',
  'lead',
  'head',
  'manager',
  'engineer',
  'developer',
  'software',
  'full',
  'stack',
  'product',
  'platform',
])

const cleanText = (value) => {
  if (typeof value !== 'string') return ''

  return value
    .replace(/\u00a0/g, ' ')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const normalizeSemanticText = (value) => {
  const cleaned = cleanText(value).toLowerCase()
  if (!cleaned) return ''

  return cleaned
    .replace(/[^a-z0-9+#\s.-]/g, ' ')
    .replace(/[._/-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const uniqueStrings = (items = []) => Array.from(new Set(items.filter((item) => typeof item === 'string' && item.trim())))

const toStringArray = (value) => {
  if (Array.isArray(value)) {
    return uniqueStrings(value.map((item) => cleanText(String(item))))
  }

  if (typeof value === 'string') {
    return uniqueStrings(
      value
        .split(/[\n,;|•·▪●]+/)
        .map((item) => cleanText(item))
    )
  }

  return []
}

const normalizeUrl = (value) => {
  if (typeof value !== 'string') return ''

  const cleaned = cleanText(value)
  if (!cleaned) return ''

  try {
    return new URL(cleaned).toString().replace(/\/$/, '')
  } catch {
    return cleaned
      .replace(/^www\./i, 'https://www.')
      .replace(/\s+/g, '')
      .replace(/\/$/, '')
  }
}

const normalizeRange = (value, fallbackCurrency = 'USD') => {
  if (!value && value !== 0) {
    return { min: null, max: null, currency: fallbackCurrency }
  }

  const base = typeof value === 'object' && !Array.isArray(value) ? value : {}
  const fromString = typeof value === 'string' ? value.match(/(\d[\d,]*)/g) || [] : []

  const rawMin = base.min ?? base.minimum ?? base.low ?? fromString[0] ?? value?.[0]
  const rawMax = base.max ?? base.maximum ?? base.high ?? fromString[1] ?? value?.[1]
  const currency = cleanText(base.currency) || fallbackCurrency

  const min = Number(rawMin)
  const max = Number(rawMax)
  const normalizedMin = Number.isFinite(min) ? min : null
  const normalizedMax = Number.isFinite(max) ? max : null

  if (normalizedMin !== null && normalizedMax !== null && normalizedMin > normalizedMax) {
    return {
      min: normalizedMax,
      max: normalizedMin,
      currency,
    }
  }

  return {
    min: normalizedMin,
    max: normalizedMax,
    currency,
  }
}

const normalizeExperienceRange = (value) => {
  if (!value && value !== 0) {
    return { min: null, max: null }
  }

  const base = typeof value === 'object' && !Array.isArray(value) ? value : {}
  const fromString = typeof value === 'string' ? value.match(/(\d+(?:\.\d+)?)/g) || [] : []

  const rawMin = base.min ?? base.minimum ?? base.low ?? fromString[0] ?? value?.[0]
  const rawMax = base.max ?? base.maximum ?? base.high ?? fromString[1] ?? value?.[1]

  const min = Number(rawMin)
  const max = Number(rawMax)
  const normalizedMin = Number.isFinite(min) ? min : null
  const normalizedMax = Number.isFinite(max) ? max : null

  if (normalizedMin !== null && normalizedMax !== null && normalizedMin > normalizedMax) {
    return {
      min: normalizedMax,
      max: normalizedMin,
    }
  }

  return {
    min: normalizedMin,
    max: normalizedMax,
  }
}

const normalizeRemoteType = (value) => {
  const normalized = normalizeSemanticText(value)
  if (!normalized) return 'Hybrid'

  if (normalized.includes('remote') || normalized.includes('work from home') || normalized.includes('wfh')) {
    return 'Remote'
  }

  if (normalized.includes('onsite') || normalized.includes('on site') || normalized.includes('in office')) {
    return 'On-site'
  }

  if (normalized.includes('hybrid')) {
    return 'Hybrid'
  }

  return JOB_REMOTE_TYPES.includes(cleanText(value)) ? cleanText(value) : 'Hybrid'
}

const normalizeEmploymentType = (value) => {
  const normalized = normalizeSemanticText(value)
  if (!normalized) return 'Full-time'

  if (normalized.includes('contract')) return 'Contract'
  if (normalized.includes('part time') || normalized.includes('part-time')) return 'Part-time'
  if (normalized.includes('intern')) return 'Internship'
  if (normalized.includes('full time') || normalized.includes('full-time')) return 'Full-time'

  const cleaned = cleanText(value)
  return JOB_EMPLOYMENT_TYPES.includes(cleaned) ? cleaned : 'Full-time'
}

const normalizeCompany = (value) => {
  const company = cleanText(value)
  return {
    company,
    companyNormalized: normalizeSemanticText(company),
  }
}

const normalizeLocation = (value) => {
  const location = cleanText(value)
  return {
    location,
    locationNormalized: normalizeSemanticText(location),
  }
}

const collectJobText = (job = {}) => {
  const responsibilities = toStringArray(job.responsibilities)
  const requirements = toStringArray(job.requirements)
  const requiredSkills = toStringArray(job.requiredSkills)
  const preferredSkills = toStringArray(job.preferredSkills)
  const extractedSkills = toStringArray(job.extractedSkills)

  return [
    cleanText(job.title),
    cleanText(job.company),
    cleanText(job.location),
    cleanText(job.description),
    cleanText(job.category || job.jobCategory),
    ...responsibilities,
    ...requirements,
    ...requiredSkills,
    ...preferredSkills,
    ...extractedSkills,
  ]
    .filter(Boolean)
    .join('\n')
}

const normalizeSkillList = (value) => normalizeSkills(toStringArray(value))

const extractJobSkills = (job = {}) => {
  const text = collectJobText(job)
  if (!text) return []

  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean)
  return normalizeSkills(extractSkillsFromText(text, lines))
}

const tokenizeTitle = (value) => {
  const normalized = normalizeSemanticText(value)
  if (!normalized) return []

  return normalized
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !textStopwords.has(token))
}

const getSimilarityScore = (left = [], right = []) => {
  if (left.length === 0 || right.length === 0) return 0

  const leftSet = new Set(left)
  const rightSet = new Set(right)
  const overlap = Array.from(leftSet).filter((token) => rightSet.has(token))
  const denominator = Math.max(leftSet.size, rightSet.size)

  if (!denominator) return 0

  return overlap.length / denominator
}

const prepareDuplicateDetection = (job = {}) => ({
  companyNormalized: normalizeCompany(job.company).companyNormalized,
  titleTokens: tokenizeTitle(job.title),
  locationNormalized: normalizeLocation(job.location).locationNormalized,
  sourceUrl: normalizeUrl(job.sourceUrl),
})

const toCanonicalJob = (job = {}) => {
  const company = normalizeCompany(job.company)
  const location = normalizeLocation(job.location)
  const title = cleanText(job.title)
  const source = cleanText(job.source || job.jobSource) || 'manual'
  const sourceUrl = normalizeUrl(job.sourceUrl)
  const sourceJobUrl = normalizeUrl(job.sourceJobUrl || sourceUrl) || null
  const originalApplyUrl = normalizeUrl(job.originalApplyUrl || job.applyUrl || sourceJobUrl || job.companyWebsite) || null
  const companyWebsite = normalizeUrl(job.companyWebsite) || null
  const requiredSkills = normalizeSkillList(job.requiredSkills)
  const preferredSkills = normalizeSkillList(job.preferredSkills)
  const extractedSkills = normalizeSkillList(job.extractedSkills?.length ? job.extractedSkills : extractJobSkills(job))
  const responsibilities = toStringArray(job.responsibilities)
  const description = cleanText(job.description)
  const category = cleanText(job.category || job.jobCategory)

  return {
    id: String(job.id || job._id || ''),
    title,
    company: company.company,
    companyNormalized: company.companyNormalized,
    location: location.location,
    locationNormalized: location.locationNormalized,
    remoteType: normalizeRemoteType(job.remoteType || job.locationType),
    employmentType: normalizeEmploymentType(job.employmentType),
    experienceLevel: normalizeExperienceRange(job.experienceLevel || job.experience),
    salaryRange: normalizeRange(job.salaryRange || job.salary),
    description,
    responsibilities,
    requiredSkills,
    preferredSkills,
    extractedSkills,
    category,
    source,
    sourceUrl,
    sourceJobId: cleanText(job.sourceJobId || job.id),
    originalApplyUrl,
    sourceJobUrl,
    companyWebsite,
    postedAt: job.postedAt ? new Date(job.postedAt) : job.createdAt ? new Date(job.createdAt) : new Date(),
    createdAt: job.createdAt ? new Date(job.createdAt) : new Date(),
    updatedAt: job.updatedAt ? new Date(job.updatedAt) : job.createdAt ? new Date(job.createdAt) : new Date(),
  }
}

export {
  JOB_EMPLOYMENT_TYPES,
  JOB_REMOTE_TYPES,
  cleanText,
  collectJobText,
  extractJobSkills,
  getSimilarityScore,
  normalizeCompany,
  normalizeEmploymentType,
  normalizeExperienceRange,
  normalizeLocation,
  normalizeRange,
  normalizeRemoteType,
  normalizeSkillList,
  normalizeUrl,
  prepareDuplicateDetection,
  toCanonicalJob,
  tokenizeTitle,
  uniqueStrings,
}
