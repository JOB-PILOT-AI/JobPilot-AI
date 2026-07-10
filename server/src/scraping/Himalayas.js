import axios from 'axios'
import * as cheerio from 'cheerio'
import { extractSkillsFromText, normalizeSkills } from '../utils/normalizeSkills.js'
import { cleanText, normalizeEmploymentType, normalizeRemoteType, uniqueStrings } from '../utils/jobTransforms.js'
import { analyzeRemoteOKJob } from './RemoteOK.js'

const HIMALAYAS_API_URL = 'https://himalayas.app/jobs/api/search'
const HIMALAYAS_BASE_URL = 'https://himalayas.app'
const MAX_HIMALAYAS_JOBS = 50
const REQUEST_TIMEOUT_MS = 15000

const toAbsoluteUrl = (value) => {
  if (typeof value !== 'string' || !value.trim()) return ''

  try {
    return new URL(value, HIMALAYAS_BASE_URL).toString().replace(/\/$/, '')
  } catch {
    return ''
  }
}

const stripHtml = (value) => {
  if (typeof value !== 'string' || !value.trim()) return ''

  return cheerio.load(`<div>${value}</div>`).text().replace(/\s+/g, ' ').trim()
}

const extractListItems = (value) => {
  if (typeof value !== 'string' || !value.trim()) return []

  const $ = cheerio.load(`<div>${value}</div>`)
  return uniqueStrings(
    $('li')
      .toArray()
      .map((element) => cleanText($(element).text()))
  )
}

const parsePostedAt = (value) => {
  const timestamp = Number(value)
  const postedAt = Number.isFinite(timestamp) ? new Date(timestamp * 1000) : new Date(value)
  return Number.isNaN(postedAt.getTime()) ? new Date() : postedAt
}

const parseSalaryRange = (entry = {}) => {
  const min = Number(entry.minSalary)
  const max = Number(entry.maxSalary)

  return {
    min: Number.isFinite(min) && min > 0 ? min : null,
    max: Number.isFinite(max) && max > 0 ? max : null,
    currency: cleanText(entry.currency) || 'USD',
  }
}

const normalizeHimalayasEmploymentType = (value) => {
  const normalized = cleanText(value).toLowerCase()

  if (normalized.includes('part')) return 'Part-time'
  if (normalized.includes('contract') || normalized.includes('freelance')) return 'Contract'
  if (normalized.includes('intern')) return 'Internship'
  if (normalized.includes('full')) return 'Full-time'

  return normalizeEmploymentType(value)
}

const buildHimalayasJobCandidate = (entry = {}) => {
  const title = cleanText(entry.title)
  const company = cleanText(entry.companyName)
  const location = Array.isArray(entry.locationRestrictions) && entry.locationRestrictions.length
    ? uniqueStrings(entry.locationRestrictions.map((item) => cleanText(item))).join(', ')
    : 'Remote'
  const description = stripHtml(entry.description)
  const responsibilities = extractListItems(entry.description)
  const tags = uniqueStrings([
    ...(Array.isArray(entry.categories) ? entry.categories : []),
    ...(Array.isArray(entry.parentCategories) ? entry.parentCategories : []),
    ...(Array.isArray(entry.seniority) ? entry.seniority : []),
  ].map((tag) => cleanText(String(tag).replace(/-/g, ' '))))
  const sourceUrl = toAbsoluteUrl(entry.applicationLink || entry.guid)
  const postedAt = parsePostedAt(entry.pubDate)

  const analysis = analyzeRemoteOKJob({
    title,
    company,
    tags,
    description,
    sourceUrl,
  })

  if (!analysis.accepted) {
    return { job: null, reason: analysis.reason || 'rejected' }
  }

  const combinedText = [title, company, location, description, ...responsibilities, ...tags].filter(Boolean).join('\n')
  const extractedSkills = normalizeSkills(extractSkillsFromText(combinedText, combinedText.split('\n')))
  const salaryRange = parseSalaryRange(entry)

  return {
    job: {
      title,
      company,
      location,
      remoteType: normalizeRemoteType([location, description, tags.join(' ')].join(' ')),
      employmentType: normalizeHimalayasEmploymentType(entry.employmentType),
      description,
      responsibilities,
      requiredSkills: extractedSkills.slice(0, 8),
      preferredSkills: normalizeSkills(tags),
      extractedSkills,
      category: tags[0] || 'technology',
      source: 'himalayas',
      sourceJobId: cleanText(entry.guid || entry.applicationLink || entry.companySlug),
      sourceUrl,
      originalApplyUrl: sourceUrl || null,
      sourceJobUrl: sourceUrl || null,
      companyWebsite: null,
      postedAt,
      createdAt: postedAt,
      updatedAt: postedAt,
      salaryRange,
      salary: salaryRange,
    },
    reason: null,
  }
}

export const scrapeHimalayasJobs = async ({ limit = MAX_HIMALAYAS_JOBS } = {}) => {
  const response = await axios.get(HIMALAYAS_API_URL, {
    timeout: REQUEST_TIMEOUT_MS,
    params: {
      worldwide: true,
      limit: MAX_HIMALAYAS_JOBS,
    },
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; JobPilotAI/1.0; +https://himalayas.app)',
      accept: 'application/json,text/plain,*/*',
    },
    validateStatus: (status) => status >= 200 && status < 400,
  })

  const jobs = Array.isArray(response.data?.jobs) ? response.data.jobs : []
  const stats = {
    fetched: jobs.length,
    normalized: 0,
    accepted: 0,
    rejected: 0,
    rejectedReasons: {},
  }

  const candidates = jobs
    .map((entry) => {
      const result = buildHimalayasJobCandidate(entry)
      stats.normalized += 1

      if (!result.job) {
        stats.rejected += 1
        stats.rejectedReasons[result.reason] = (stats.rejectedReasons[result.reason] || 0) + 1
        return null
      }

      stats.accepted += 1
      return result.job
    })
    .filter(Boolean)
    .slice(0, Math.max(1, Math.min(Number(limit) || MAX_HIMALAYAS_JOBS, MAX_HIMALAYAS_JOBS)))

  candidates.stats = stats
  return candidates
}

export default {
  scrapeHimalayasJobs,
}
