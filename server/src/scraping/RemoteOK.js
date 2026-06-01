import axios from 'axios'
import * as cheerio from 'cheerio'
import { extractSkillsFromText, normalizeSkills } from '../utils/normalizeSkills.js'

const REMOTEOK_BASE_URL = 'https://remoteok.com'
const MAX_REMOTEOK_JOBS = 50
const REQUEST_TIMEOUT_MS = 15000

const REJECT_KEYWORDS = [
  'sales',
  'marketing',
  'hr',
  'human resources',
  'recruiter',
  'customer support',
  'business development',
  'account manager',
]

const KEEP_KEYWORDS = [
  'software engineer',
  'frontend',
  'front end',
  'backend',
  'back end',
  'full stack',
  'react',
  'node',
  'javascript',
  'typescript',
  'python',
  'devops',
  'cloud',
  'data engineering',
  'machine learning',
  'ml engineer',
  'ai engineer',
  'developer',
  'engineer',
  'software',
]

const TECH_TITLE_KEYWORDS = [
  'software engineer',
  'frontend',
  'front end',
  'backend',
  'back end',
  'full stack',
  'site reliability',
  'sre',
  'devops',
  'developer',
  'engineer',
  'software',
  'solutions architect',
  'data engineer',
  'platform engineer',
  'security engineer',
  'machine learning engineer',
  'ml engineer',
  'ai engineer',
  'mobile engineer',
  'react',
  'node',
  'javascript',
  'typescript',
  'python',
]

const TECH_DESCRIPTION_KEYWORDS = [
  'typescript',
  'javascript',
  'node.js',
  'nodejs',
  'python',
  'react',
  'next.js',
  'nextjs',
  'kubernetes',
  'docker',
  'aws',
  'gcp',
  'azure',
  'sql',
  'api',
  'graphql',
  'microservices',
  'serverless',
  'mcp',
  'mongodb',
  'postgres',
  'redis',
  'devops',
  'sre',
  'engineering',
  'software development',
  'data pipeline',
  'machine learning',
  'ml model',
  'cloud infrastructure',
]

const cleanText = (value) => {
  if (typeof value !== 'string') return ''

  return value
    .replace(/\u00a0/g, ' ')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const normalizeSemanticText = (value) => cleanText(value).toLowerCase()

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const matchesKeyword = (text, keyword) => {
  const normalizedText = normalizeSemanticText(text)
  const normalizedKeyword = normalizeSemanticText(keyword)

  if (!normalizedText || !normalizedKeyword) return false

  if (normalizedKeyword.includes(' ')) {
    return normalizedText.includes(normalizedKeyword)
  }

  return new RegExp(`\\b${escapeRegExp(normalizedKeyword)}\\b`).test(normalizedText)
}

const uniqueStrings = (items = []) => Array.from(new Set(items.filter((item) => typeof item === 'string' && item.trim())))

const toAbsoluteUrl = (value) => {
  if (typeof value !== 'string' || !value.trim()) return ''

  try {
    return new URL(value, REMOTEOK_BASE_URL).toString().replace(/\/$/, '')
  } catch {
    return ''
  }
}

const parseSalaryAmount = (value) => {
  const cleaned = cleanText(value).toLowerCase()
  if (!cleaned || cleaned.includes('upgrade to premium')) return null

  const compact = cleaned.replace(/[,\s]/g, '')
  const numericMatch = compact.match(/(\d+(?:\.\d+)?)(k|m)?/i)
  if (!numericMatch) return null

  const amount = Number(numericMatch[1])
  if (!Number.isFinite(amount)) return null

  const multiplier = numericMatch[2]?.toLowerCase() === 'm' ? 1000000 : numericMatch[2]?.toLowerCase() === 'k' ? 1000 : 1
  return Math.round(amount * multiplier)
}

const parseSalaryRange = (salaryText = '', salaryJson = null) => {
  if (salaryJson?.value) {
    const min = Number(salaryJson.value.minValue)
    const max = Number(salaryJson.value.maxValue)

    return {
      min: Number.isFinite(min) ? min : null,
      max: Number.isFinite(max) ? max : null,
      currency: cleanText(salaryJson.currency) || 'USD',
    }
  }

  const cleaned = cleanText(salaryText)
  if (!cleaned) {
    return { min: null, max: null, currency: 'USD' }
  }

  const rangeMatch = cleaned.match(/([$€£])?\s*([\d,.]+)\s*(k|m)?\s*(?:-|–|to)\s*([$€£])?\s*([\d,.]+)\s*(k|m)?/i)
  if (rangeMatch) {
    const left = parseSalaryAmount(`${rangeMatch[2]}${rangeMatch[3] || ''}`)
    const right = parseSalaryAmount(`${rangeMatch[5]}${rangeMatch[6] || ''}`)
    const currencySymbol = rangeMatch[1] || rangeMatch[4]

    return {
      min: typeof left === 'number' ? left : null,
      max: typeof right === 'number' ? right : null,
      currency: currencySymbol === '€' ? 'EUR' : currencySymbol === '£' ? 'GBP' : 'USD',
    }
  }

  const value = parseSalaryAmount(cleaned)
  return {
    min: typeof value === 'number' ? value : null,
    max: typeof value === 'number' ? value : null,
    currency: cleaned.includes('€') ? 'EUR' : cleaned.includes('£') ? 'GBP' : 'USD',
  }
}

const normalizeEmploymentType = (value = '') => {
  const normalized = normalizeSemanticText(value)
  if (normalized.includes('part time')) return 'Part-time'
  if (normalized.includes('contract')) return 'Contract'
  if (normalized.includes('intern')) return 'Internship'
  if (normalized.includes('full time')) return 'Full-time'
  return 'Full-time'
}

const normalizeRemoteType = (value = '') => {
  const normalized = normalizeSemanticText(value)

  if (normalized.includes('hybrid')) return 'Hybrid'
  if (normalized.includes('on site') || normalized.includes('onsite') || normalized.includes('in office')) return 'On-site'
  return 'Remote'
}

const parseJobMetadata = ($row) => {
  const scriptText = cleanText($row.find('script[type="application/ld+json"]').first().text())
  if (!scriptText) return null

  try {
    const parsed = JSON.parse(scriptText)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

const parseVisibleRowData = ($, $row) => {
  const title = cleanText($row.find('td.company h2[itemprop="title"]').first().text())
  const company = cleanText($row.attr('data-company') || $row.find('td.company h3[itemprop="name"]').first().text())
  const locationEntries = $row.find('td.company .location').toArray().map((element) => cleanText($(element).text()))
  const salaryText = cleanText($row.find('td.company .salary').first().text())
  const tags = uniqueStrings(
    $row
      .find('td.tags a[aria-label], td.tags h3')
      .toArray()
      .map((element) => cleanText($(element).attr('aria-label') || $(element).text()))
      .map((label) => label.replace(/^Remote\s+/i, '').replace(/\s+Jobs?$/i, '').trim())
  )

  const visibleLocation = locationEntries.find((entry) => !/^(⏰|💰)/.test(entry)) || ''
  const employmentHint = locationEntries.find((entry) => /part time|full time|contract|intern/i.test(entry)) || ''
  const remoteHint = [visibleLocation, ...locationEntries, tags.join(' ')].join(' ')

  return {
    title,
    company,
    visibleLocation,
    salaryText,
    tags,
    remoteType: normalizeRemoteType(remoteHint),
    employmentType: normalizeEmploymentType(employmentHint),
  }
}

const parseDescription = (metadata) => {
  if (!metadata?.description) return ''

  return cheerio.load(`<div>${metadata.description}</div>`).text().replace(/\s+/g, ' ').trim()
}

const stripHtml = (value) => {
  if (typeof value !== 'string' || !value.trim()) return ''

  return cheerio.load(`<div>${value}</div>`).text().replace(/\s+/g, ' ').trim()
}

const parseJobLocation = (metadata) => {
  const locations = Array.isArray(metadata?.jobLocation) ? metadata.jobLocation : []
  const values = locations
    .map((entry) => entry?.address?.addressRegion || entry?.address?.addressLocality || entry?.address?.addressCountry || '')
    .map((value) => cleanText(value))
    .filter(Boolean)

  return uniqueStrings(values)
}

const parsePostedAt = ($row, metadata) => {
  const datetime = cleanText($row.find('time[datetime]').first().attr('datetime')) || cleanText(metadata?.datePosted)
  if (!datetime) {
    return new Date()
  }

  const parsed = new Date(datetime)
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

const buildJobText = ({ title, company, location, tags, description }) => [title, company, location, ...(tags || []), description].filter(Boolean).join('\n')

const isRejectedJob = (text) => {
  return REJECT_KEYWORDS.some((keyword) => matchesKeyword(text, keyword))
}

const isDeveloperFocusedJob = ({ title, tags, description }) => {
  const text = [title, ...(tags || []), description].filter(Boolean).join(' ')

  if (!normalizeSemanticText(text)) return false
  if (isRejectedJob([title, ...(tags || [])].filter(Boolean).join(' '))) return false

  const titleText = [title, ...(Array.isArray(tags) ? tags : [])].filter(Boolean).join(' ')
  const descriptionMatches = TECH_DESCRIPTION_KEYWORDS.filter((keyword) => matchesKeyword(description, keyword)).length

  return TECH_TITLE_KEYWORDS.some((keyword) => matchesKeyword(titleText, keyword)) || descriptionMatches >= 2
}

const buildFeedJobCandidate = (entry) => {
  const title = cleanText(entry.position)
  const company = cleanText(entry.company)
  const location = cleanText(entry.location) || 'Remote'
  const tags = uniqueStrings(Array.isArray(entry.tags) ? entry.tags.map((tag) => cleanText(tag)) : [])
  const description = stripHtml(entry.description)
  const sourceUrl = toAbsoluteUrl(entry.url || entry.apply_url || (entry.slug ? `${REMOTEOK_BASE_URL}/remote-jobs/${entry.slug}` : ''))
  const applyUrl = toAbsoluteUrl(entry.apply_url || entry.url)
  const salaryMin = Number(entry.salary_min)
  const salaryMax = Number(entry.salary_max)
  const salaryRange = {
    min: Number.isFinite(salaryMin) && salaryMin > 0 ? salaryMin : null,
    max: Number.isFinite(salaryMax) && salaryMax > 0 ? salaryMax : null,
    currency: 'USD',
  }
  const publishedAt = entry.date ? new Date(entry.date) : entry.epoch ? new Date(Number(entry.epoch) * 1000) : new Date()
  const postedAt = Number.isNaN(publishedAt.getTime()) ? new Date() : publishedAt
  const combinedText = buildJobText({ title, company, location, tags, description })
  const canonicalSkills = normalizeSkills(extractSkillsFromText(combinedText, combinedText.split('\n')))

  return {
    title,
    company,
    location,
    remoteType: normalizeRemoteType([location, description, tags.join(' ')].join(' ')),
    employmentType: normalizeEmploymentType([entry.tags, entry.position].flat().join(' ')),
    description,
    responsibilities: [],
    requiredSkills: canonicalSkills.slice(0, 8),
    preferredSkills: normalizeSkills(tags),
    extractedSkills: canonicalSkills,
    category: tags[0] || 'technology',
    source: 'remoteok',
    sourceUrl,
    applyUrl,
    postedAt,
    createdAt: postedAt,
    updatedAt: postedAt,
    salaryRange,
    salary: salaryRange,
  }
}

const buildJobCandidate = ($, $row) => {
  const metadata = parseJobMetadata($row)
  const visible = parseVisibleRowData($, $row)
  const jobId = cleanText($row.attr('data-id')) || cleanText($row.attr('id')).replace(/^job-/, '')
  const sourceUrl = toAbsoluteUrl($row.attr('data-href') || $row.attr('data-url'))
  const applyUrl = toAbsoluteUrl($row.find('td.source a[href^="/l/"]').first().attr('href') || (jobId ? `/l/${jobId}` : ''))
  const locationHints = uniqueStrings([
    visible.visibleLocation,
    ...parseJobLocation(metadata),
    ...(Array.isArray(metadata?.applicantLocationRequirements) ? metadata.applicantLocationRequirements.map((entry) => cleanText(entry?.name || '')) : []),
  ])
  const location = locationHints[0] || visible.visibleLocation || 'Remote'
  const salaryRange = parseSalaryRange(visible.salaryText, metadata?.baseSalary)
  const description = parseDescription(metadata)
  const tags = uniqueStrings(visible.tags)
  const combinedText = buildJobText({ title: visible.title, company: visible.company, location, tags, description })
  const canonicalSkills = normalizeSkills(extractSkillsFromText(combinedText, combinedText.split('\n')))
  const requiredSkills = canonicalSkills.slice(0, 8)
  const preferredSkills = normalizeSkills(tags)
  const postedAt = parsePostedAt($row, metadata)

  return {
    title: visible.title,
    company: visible.company,
    location,
    remoteType: visible.remoteType,
    employmentType: visible.employmentType,
    description,
    responsibilities: [],
    requiredSkills,
    preferredSkills,
    extractedSkills: canonicalSkills,
    category: tags[0] || '',
    source: 'remoteok',
    sourceUrl,
    applyUrl,
    postedAt,
    createdAt: postedAt,
    updatedAt: postedAt,
    salaryRange,
    salary: salaryRange,
  }
}

export const scrapeRemoteOKJobs = async ({ limit = MAX_REMOTEOK_JOBS } = {}) => {
  await axios.get(REMOTEOK_BASE_URL, {
    timeout: REQUEST_TIMEOUT_MS,
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; JobPilotAI/1.0; +https://remoteok.com)',
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    validateStatus: (status) => status >= 200 && status < 400,
  })

  const feedResponse = await axios.get(`${REMOTEOK_BASE_URL}/remote-jobs.json`, {
    timeout: REQUEST_TIMEOUT_MS,
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; JobPilotAI/1.0; +https://remoteok.com)',
      accept: 'application/json,text/plain,*/*',
    },
    validateStatus: (status) => status >= 200 && status < 400,
  })

  const feedItems = Array.isArray(feedResponse.data) ? feedResponse.data : []
  const candidates = feedItems
    .filter((entry) => entry && typeof entry === 'object' && entry.slug && entry.position && entry.company)
    .filter((entry) => isDeveloperFocusedJob({ title: entry.position, tags: entry.tags, description: stripHtml(entry.description) }))
    .map((entry) => buildFeedJobCandidate(entry))
    .filter((job) => job.title && job.company && job.sourceUrl)
    .filter((job) => isDeveloperFocusedJob({ title: job.title, description: job.description }))
    .slice(0, Math.max(1, Math.min(Number(limit) || MAX_REMOTEOK_JOBS, MAX_REMOTEOK_JOBS)))

  return candidates
}

export default {
  scrapeRemoteOKJobs,
}