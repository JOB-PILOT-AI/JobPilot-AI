import express from 'express'
import Job from '../models/Job.js'
import Application from '../models/Application.js'
import Resume from '../models/Resume.js'
import { authenticateToken, authenticateOptional } from '../middleware/auth.js'
import { applyJobFilters, normalizeJobFilters } from '../services/jobs/jobFilters.js'
import { calculateJobMatch } from '../services/jobs/jobMatchEngine.js'
import { calculateATSScore } from '../services/atsScoring.js'
import { buildErrorResponse, buildSuccessResponse } from '../utils/apiResponses.js'
import { dedupeJobs } from '../services/jobs/detectDuplicate.js'
import { ingestJob } from '../services/jobs/ingestJob.js'
import { importRemotiveJobs } from '../services/jobs/importRemotiveJobs.js'
import { importRemoteOKJobs } from '../services/jobs/importRemoteOKJobs.js'
import { importHimalayasJobs } from '../services/jobs/importHimalayasJobs.js'
import { importArbeitnowJobs } from '../services/jobs/importArbeitnowJobs.js'
import { toCanonicalJob } from '../utils/jobTransforms.js'

const router = express.Router()

const JOB_MATCH_SELECT = [
  'source',
  'sourceUrl',
  'sourceJobId',
  'originalApplyUrl',
  'sourceJobUrl',
  'companyWebsite',
  'title',
  'company',
  'companyNormalized',
  'location',
  'locationNormalized',
  'remoteType',
  'locationType',
  'employmentType',
  'category',
  'description',
  'requiredSkills',
  'preferredSkills',
  'extractedSkills',
  'responsibilities',
  'salary',
  'salaryRange',
  'experience',
  'experienceLevel',
  'postedAt',
  'createdAt',
  'updatedAt',
  'isActive',
].join(' ')

const buildJobQuery = (filters = {}) => {
  const query = { isActive: true }

  if (filters.remoteType) {
    query.remoteType = filters.remoteType
  }

  if (filters.employmentType) {
    query.employmentType = filters.employmentType
  }

  return query
}

const getLatestResumeForUser = async (userId) => {
  if (!userId) {
    return null
  }

  return Resume.findOne({ userId }).sort({ updatedAt: -1 })
}

const buildSerializedJobs = (jobs, resume = null, atsAnalytics = null) => {
  if (!resume) {
    return jobs.map((job) => serializeJob(job))
  }

  return jobs.map((job) => {
    const matchData = calculateJobMatch(resume, job, { atsAnalytics })
    return serializeJob(job, matchData)
  })
}

const truncateText = (value = '', maxLength = 220) => {
  if (typeof value !== 'string') return ''
  const cleaned = value.replace(/\s+/g, ' ').trim()
  if (cleaned.length <= maxLength) return cleaned
  return `${cleaned.slice(0, maxLength).trim()}...`
}

const serializeJob = (job, matchData = null) => {
  const canonicalJob = toCanonicalJob(job)

  return {
    ...canonicalJob,
    _id: job._id || canonicalJob.id,
    id: canonicalJob.id || String(job._id || ''),
    salary: job.salary || canonicalJob.salaryRange,
    experience: job.experience || canonicalJob.experienceLevel,
    locationType: job.locationType || canonicalJob.remoteType,
    jobCategory: job.jobCategory || canonicalJob.category,
    companyDescription: job.companyDescription || '',
    matchScore: matchData,
    isActive: job.isActive !== undefined ? job.isActive : true,
  }
}

const serializeJobSummary = (job, matchData = null) => {
  const serialized = serializeJob(job, matchData)

  return {
    _id: serialized._id,
    id: serialized.id,
    title: serialized.title,
    company: serialized.company,
    companyLogo: job.companyLogo || null,
    location: serialized.location,
    remoteType: serialized.remoteType,
    locationType: serialized.locationType,
    employmentType: serialized.employmentType,
    category: serialized.category,
    jobCategory: serialized.jobCategory,
    description: truncateText(serialized.description),
    requiredSkills: serialized.requiredSkills.slice(0, 8),
    preferredSkills: serialized.preferredSkills.slice(0, 8),
    tags: serialized.preferredSkills.slice(0, 8),
    salary: serialized.salary,
    salaryRange: serialized.salaryRange,
    source: serialized.source,
    sourceUrl: serialized.sourceUrl,
    postedAt: serialized.postedAt,
    matchScore: matchData,
    isActive: serialized.isActive,
  }
}

router.get('/', authenticateOptional, async (req, res) => {
  try {
    const filters = normalizeJobFilters(req.query)
    const jobs = dedupeJobs(
      await Job.find(buildJobQuery(filters))
        .select(JOB_MATCH_SELECT)
        .lean()
        .sort({ updatedAt: -1, createdAt: -1 })
        .limit(100)
    )

    const resume = req.user ? await getLatestResumeForUser(req.user.userId) : null
    const atsAnalytics = resume ? resume.atsAnalytics || calculateATSScore(resume.toObject()) : null
    const matchedJobs = resume
      ? jobs.map((job) => serializeJobSummary(job, calculateJobMatch(resume, job, { atsAnalytics })))
      : jobs.map((job) => serializeJobSummary(job))
    const filteredJobs = applyJobFilters(matchedJobs, filters)

    res.json(buildSuccessResponse(filteredJobs, { jobs: filteredJobs }))
  } catch (err) {
    res.status(500).json(buildErrorResponse('Failed to fetch jobs', { error: err.message }))
  }
})

router.get('/matches', authenticateToken, async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(Number(req.query.limit) || 3, 10))
    const filters = normalizeJobFilters(req.query)
    const resume = await Resume.findOne({ userId: req.user.userId }).sort({ updatedAt: -1 })

    if (!resume) {
      return res.json(
        buildSuccessResponse(
          { resume: null, atsAnalytics: null, bestMatch: null, matches: [] },
          { resumeId: null, atsAnalytics: null, bestMatch: null, matches: [] }
        )
      )
    }

    const atsAnalytics = resume.atsAnalytics || calculateATSScore(resume.toObject())
    const jobs = dedupeJobs(
      await Job.find(buildJobQuery(filters))
        .select(JOB_MATCH_SELECT)
        .lean()
        .sort({ updatedAt: -1, createdAt: -1 })
        .limit(100)
    )
    const matchMap = new Map()

    const normalizedMatches = jobs.map((job) => {
      const matchData = calculateJobMatch(resume, job, { atsAnalytics })
      matchMap.set(String(job._id), matchData)
      return serializeJobSummary(job, matchData)
    })

    const filteredMatches = applyJobFilters(normalizedMatches, filters, matchMap)

    const matches = filteredMatches
      .sort((left, right) => (right.matchScore?.matchPercentage || 0) - (left.matchScore?.matchPercentage || 0))
      .slice(0, limit)

    res.json(
      buildSuccessResponse(
        {
          resumeId: resume._id,
          atsAnalytics,
          bestMatch: matches[0] || null,
          matches,
        },
        {
          resumeId: resume._id,
          atsAnalytics,
          bestMatch: matches[0] || null,
          matches,
        }
      )
    )
  } catch (err) {
    res.status(500).json(buildErrorResponse('Failed to fetch job matches', { error: err.message }))
  }
})

router.post('/', authenticateToken, async (req, res) => {
  try {
    const result = await ingestJob(req.body, { persist: true, source: req.body.source || 'manual' })

    if (!result.success) {
      return res.status(400).json(result)
    }

    res.status(result.created ? 201 : 200).json(
      buildSuccessResponse(result.data, {
        job: result.data,
        duplicate: Boolean(result.duplicate),
        created: Boolean(result.created),
      })
    )
  } catch (err) {
    res.status(500).json(buildErrorResponse('Failed to create job', { error: err.message }))
  }
})

router.get('/import/remoteok', authenticateToken, async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(Number(req.query.limit) || 50, 50))
    const result = await importRemoteOKJobs({ limit })

    res.json(result)
  } catch (err) {
    res.status(200).json({
      success: true,
      imported: 0,
      skipped: 0,
    })
  }
})

router.get('/import/himalayas', authenticateToken, async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(Number(req.query.limit) || 50, 50))
    const result = await importHimalayasJobs({ limit })

    res.json(result)
  } catch (err) {
    res.status(200).json({
      success: true,
      imported: 0,
      skipped: 0,
      failure: err.message,
    })
  }
})

router.get('/import/arbeitnow', authenticateToken, async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(Number(req.query.limit) || 50, 50))
    const result = await importArbeitnowJobs({ limit })

    res.json(result)
  } catch (err) {
    res.status(200).json({
      success: true,
      imported: 0,
      skipped: 0,
      failure: err.message,
    })
  }
})

router.get('/import/all', authenticateToken, async (req, res) => {
  const limit = Math.max(1, Math.min(Number(req.query.limit) || 50, 50))
  const sources = {
    remoteok: importRemoteOKJobs,
    remotive: importRemotiveJobs,
    himalayas: importHimalayasJobs,
    arbeitnow: importArbeitnowJobs,
  }
  const results = {}

  for (const [source, importer] of Object.entries(sources)) {
    try {
      results[source] = await importer({ limit })
    } catch (err) {
      console.error(`${source} import failed:`, err.message)
      results[source] = {
        success: true,
        imported: 0,
        skipped: 0,
        counts: {
          fetched: 0,
          normalized: 0,
          accepted: 0,
          rejected: 0,
          duplicates: 0,
          inserted: 0,
        },
        rejectedReasons: {},
        failure: err.message,
      }
    }
  }

  const groupedRejectionReasons = Object.values(results).reduce((acc, result) => {
    for (const [reason, count] of Object.entries(result.rejectedReasons || {})) {
      acc[reason] = (acc[reason] || 0) + count
    }
    return acc
  }, {})
  const totalDbJobCount = await Job.countDocuments({ isActive: true })

  res.json({
    success: true,
    sources: results,
    totalDbJobCount,
    groupedRejectionReasons,
  })
})

router.get('/import/remotive', authenticateToken, async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(Number(req.query.limit) || 50, 50))
    const result = await importRemotiveJobs({ limit })

    res.json(result)
  } catch (err) {
    res.status(200).json({
      success: true,
      imported: 0,
      skipped: 0,
    })
  }
})

router.post('/:id/apply', authenticateToken, async (req, res) => {
  try {
    const { resumeId } = req.body
    const job = await Job.findById(req.params.id)

    if (!job) {
      return res.status(404).json(buildErrorResponse('Job not found'))
    }

    const resume = await Resume.findById(resumeId)
    if (!resume || resume.userId.toString() !== req.user.userId) {
      return res.status(404).json(buildErrorResponse('Resume not found'))
    }

    const existingApplication = await Application.findOne({
      userId: req.user.userId,
      jobId: req.params.id,
    })

    if (existingApplication) {
      return res.status(400).json(buildErrorResponse('Already applied to this job'))
    }

    const atsAnalytics = resume.atsAnalytics || calculateATSScore(resume.toObject())
    const matchData = calculateJobMatch(resume, job, { atsAnalytics })

    const application = new Application({
      userId: req.user.userId,
      jobId: req.params.id,
      resumeId,
      matchScore: {
        overall: matchData.matchPercentage,
        skillMatch: matchData.requiredSkillMatch,
        experienceMatch: matchData.resumeCompleteness,
        educationMatch: matchData.technicalAlignment,
        details: {
          matchedSkills: matchData.matchedSkills,
          missingSkills: matchData.missingSkills,
          feedback: matchData.explanation.join(' '),
        },
      },
    })

    await application.save()
    res.status(201).json(buildSuccessResponse(application, { application }))
  } catch (err) {
    res.status(500).json(buildErrorResponse('Failed to apply for job', { error: err.message }))
  }
})

router.get('/user/applications', authenticateToken, async (req, res) => {
  try {
    const applications = await Application.find({ userId: req.user.userId })
      .populate('jobId')
      .populate('resumeId')

    res.json(buildSuccessResponse(applications, { applications }))
  } catch (err) {
    res.status(500).json(buildErrorResponse('Failed to fetch applications', { error: err.message }))
  }
})

router.get('/:id', authenticateOptional, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).lean()
    if (!job) {
      return res.status(404).json(buildErrorResponse('Job not found'))
    }

    let matchData = null
    if (req.user) {
      const resume = await Resume.findOne({ userId: req.user.userId })
      if (resume) {
        const atsAnalytics = resume.atsAnalytics || calculateATSScore(resume.toObject())
        matchData = calculateJobMatch(resume, job, { atsAnalytics })
      }
    }

    const serializedJob = serializeJob(job, matchData)
    res.json(buildSuccessResponse({ job: serializedJob, matchData }, { job: serializedJob, matchData }))
  } catch (err) {
    res.status(500).json(buildErrorResponse('Failed to fetch job', { error: err.message }))
  }
})

export default router
