import axios from 'axios'
import * as cheerio from 'cheerio'
import { extractSkillsFromText, normalizeSkills } from '../utils/normalizeSkills.js'
import { cleanText, normalizeEmploymentType, normalizeRemoteType, uniqueStrings } from '../utils/jobTransforms.js'
import { analyzeRemoteOKJob } from './RemoteOK.js'

const ARBEITNOW_API_URL = 'https://arbeitnow.com/api/job-board-api'
const ARBEITNOW_BASE_URL = 'https://www.arbeitnow.com'
const MAX_ARBEITNOW_JOBS = 50
const REQUEST_TIMEOUT_MS = 15000

const toAbsoluteUrl = (value) => {
  if (typeof value !== 'string' || !value.trim()) return ''

  try {
    return new URL(value, ARBEITNOW_BASE_URL).toString().replace(/\/$/, '')
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

const normalizeArbeitnowEmploymentType = (values = []) => {
  const combined = Array.isArray(values) ? values.join(' ') : String(values || '')
  return normalizeEmploymentType(combined)
}

const buildArbeitnowJobCandidate = (entry = {}) => {
  const title = cleanText(entry.title)
  const company = cleanText(entry.company_name)
  const location = cleanText(entry.location) || (entry.remote ? 'Remote' : '')
  const description = stripHtml(entry.description)
  const responsibilities = extractListItems(entry.description)
  const tags = uniqueStrings([
    ...(Array.isArray(entry.tags) ? entry.tags : []),
    ...(Array.isArray(entry.job_types) ? entry.job_types : []),
  ].map((tag) => cleanText(tag)))
  const sourceUrl = toAbsoluteUrl(entry.url)
  const postedAt = parsePostedAt(entry.created_at)

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
  const salaryRange = { min: null, max: null, currency: 'USD' }

  return {
    job: {
      title,
      company,
      location,
      remoteType: entry.remote ? 'Remote' : normalizeRemoteType([location, description].join(' ')),
      employmentType: normalizeArbeitnowEmploymentType(entry.job_types),
      description,
      responsibilities,
      requiredSkills: extractedSkills.slice(0, 8),
      preferredSkills: normalizeSkills(tags),
      extractedSkills,
      category: tags[0] || 'technology',
      source: 'arbeitnow',
      sourceJobId: cleanText(entry.slug || entry.url),
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

export const scrapeArbeitnowJobs = async ({ limit = MAX_ARBEITNOW_JOBS } = {}) => {
  const response = await axios.get(ARBEITNOW_API_URL, {
    timeout: REQUEST_TIMEOUT_MS,
    params: {
      page: 1,
    },
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; JobPilotAI/1.0; +https://arbeitnow.com)',
      accept: 'application/json,text/plain,*/*',
    },
    validateStatus: (status) => status >= 200 && status < 400,
  })

  const jobs = Array.isArray(response.data?.data) ? response.data.data : []
  const stats = {
    fetched: jobs.length,
    normalized: 0,
    accepted: 0,
    rejected: 0,
    rejectedReasons: {},
  }

  const candidates = jobs
    .map((entry) => {
      const result = buildArbeitnowJobCandidate(entry)
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
    .slice(0, Math.max(1, Math.min(Number(limit) || MAX_ARBEITNOW_JOBS, MAX_ARBEITNOW_JOBS)))

  candidates.stats = stats
  return candidates
}

export default {
  scrapeArbeitnowJobs,
}
