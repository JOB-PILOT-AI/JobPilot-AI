import axios from 'axios'
import * as cheerio from 'cheerio'
import { extractSkillsFromText, normalizeSkills } from '../utils/normalizeSkills.js'
import { analyzeRemoteOKJob } from './RemoteOK.js'
import { cleanText, normalizeEmploymentType, normalizeRemoteType } from '../utils/jobTransforms.js'

const REMOTIVE_API_URL = 'https://remotive.com/api/remote-jobs'
const REMOTIVE_BASE_URL = 'https://remotive.com'
const MAX_REMOTIVE_JOBS = 50
const REQUEST_TIMEOUT_MS = 15000
const REMOTIVE_CATEGORY = 'software-dev'

const uniqueStrings = (items = []) => Array.from(new Set(items.filter((item) => typeof item === 'string' && item.trim())))

const toAbsoluteUrl = (value) => {
	if (typeof value !== 'string' || !value.trim()) return ''

	try {
		return new URL(value, REMOTIVE_BASE_URL).toString().replace(/\/$/, '')
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

const parseSalaryAmount = (value) => {
	const cleaned = cleanText(value).toLowerCase()
	if (!cleaned) return null

	const compact = cleaned.replace(/[,$\s]/g, '')
	const match = compact.match(/(\d+(?:\.\d+)?)(k|m)?/i)
	if (!match) return null

	const amount = Number(match[1])
	if (!Number.isFinite(amount)) return null

	const multiplier = match[2]?.toLowerCase() === 'm' ? 1000000 : match[2]?.toLowerCase() === 'k' ? 1000 : 1
	return Math.round(amount * multiplier)
}

const parseSalaryRange = (salaryText = '') => {
	const cleaned = cleanText(salaryText)
	if (!cleaned) {
		return { min: null, max: null, currency: 'USD' }
	}

	const rangeMatch = cleaned.match(/([$€£])?\s*([\d,.]+)\s*(k|m)?\s*(?:-|–|to)\s*([$€£])?\s*([\d,.]+)\s*(k|m)?/i)

	if (rangeMatch) {
		const min = parseSalaryAmount(`${rangeMatch[2]}${rangeMatch[3] || ''}`)
		const max = parseSalaryAmount(`${rangeMatch[5]}${rangeMatch[6] || ''}`)
		const currencySymbol = rangeMatch[1] || rangeMatch[4]

		return {
			min: typeof min === 'number' ? min : null,
			max: typeof max === 'number' ? max : null,
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

const normalizeRemotiveEmploymentType = (value) => {
	const normalized = cleanText(value).toLowerCase()

	if (normalized.includes('part time')) return 'Part-time'
	if (normalized.includes('contract') || normalized.includes('freelance')) return 'Contract'
	if (normalized.includes('intern')) return 'Internship'
	if (normalized.includes('full time')) return 'Full-time'

	return normalizeEmploymentType(value)
}

const normalizeRemotiveRemoteType = (location, description) => {
	const normalized = cleanText([location, description].filter(Boolean).join(' ')).toLowerCase()

	if (normalized.includes('hybrid')) return 'Hybrid'
	if (normalized.includes('on site') || normalized.includes('onsite') || normalized.includes('in office')) return 'On-site'
	return normalizeRemoteType(normalized || 'Remote')
}

const buildRemotiveJobCandidate = (entry = {}) => {
	const title = cleanText(entry.title)
	const company = cleanText(entry.company_name)
	const location = cleanText(entry.candidate_required_location) || 'Remote'
	const description = stripHtml(entry.description)
	const responsibilities = extractListItems(entry.description)
	const tags = uniqueStrings(Array.isArray(entry.tags) ? entry.tags.map((tag) => cleanText(tag)) : [])
	const sourceUrl = toAbsoluteUrl(entry.url)
	const postedAt = entry.publication_date ? new Date(entry.publication_date) : new Date()
	const normalizedPostedAt = Number.isNaN(postedAt.getTime()) ? new Date() : postedAt

	const combinedText = [title, company, location, cleanText(entry.category), description, ...responsibilities, ...tags]
		.filter(Boolean)
		.join('\n')
	const extractedSkills = normalizeSkills(extractSkillsFromText(combinedText, combinedText.split('\n')))
	const analysis = analyzeRemoteOKJob({
		title,
		company,
		tags,
		description,
		sourceUrl,
	})

	if (!analysis.accepted) {
		return null
	}

	return {
		id: String(entry.id || ''),
		title,
		company,
		location,
		remoteType: normalizeRemotiveRemoteType(location, description),
		employmentType: normalizeRemotiveEmploymentType(entry.job_type),
		description,
		responsibilities,
		requiredSkills: extractedSkills.slice(0, 8),
		preferredSkills: normalizeSkills(tags),
		extractedSkills,
		category: cleanText(entry.category || 'Software Development'),
		source: 'remotive',
		sourceUrl,
		postedAt: normalizedPostedAt,
		createdAt: normalizedPostedAt,
		updatedAt: normalizedPostedAt,
		salaryRange: parseSalaryRange(entry.salary),
		salary: parseSalaryRange(entry.salary),
	}
}

export const scrapeRemotiveJobs = async ({ limit = MAX_REMOTIVE_JOBS } = {}) => {
	const response = await axios.get(REMOTIVE_API_URL, {
		timeout: REQUEST_TIMEOUT_MS,
		params: {
			category: REMOTIVE_CATEGORY,
			limit: MAX_REMOTIVE_JOBS,
		},
		headers: {
			'user-agent': 'Mozilla/5.0 (compatible; JobPilotAI/1.0; +https://remotive.com)',
			accept: 'application/json,text/plain,*/*',
		},
		validateStatus: (status) => status >= 200 && status < 400,
	})

	const jobs = Array.isArray(response.data?.jobs) ? response.data.jobs : []

	return jobs
		.map((entry) => buildRemotiveJobCandidate(entry))
		.filter(Boolean)
		.slice(0, Math.max(1, Math.min(Number(limit) || MAX_REMOTIVE_JOBS, MAX_REMOTIVE_JOBS)))
}

export default {
	scrapeRemotiveJobs,
}
