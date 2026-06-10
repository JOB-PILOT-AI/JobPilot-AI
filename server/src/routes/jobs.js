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
import { importRemoteOKJobs } from '../services/jobs/importRemoteOKJobs.js'
import { toCanonicalJob } from '../utils/jobTransforms.js'

const router = express.Router()

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

router.get('/', authenticateOptional, async (req, res) => {
  try {
    const jobs = dedupeJobs(
      await Job.find({ isActive: true })
        .sort({ updatedAt: -1, createdAt: -1 })
        .limit(100)
    )

    const filteredJobs = applyJobFilters(jobs, normalizeJobFilters(req.query))
    const serializedJobs = filteredJobs.map((job) => serializeJob(job))

    res.json(buildSuccessResponse(serializedJobs, { jobs: serializedJobs }))
  } catch (err) {
    res.status(500).json(buildErrorResponse('Failed to fetch jobs', { error: err.message }))
  }
})

router.get('/matches', authenticateToken, async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(Number(req.query.limit) || 3, 10))
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
      await Job.find({ isActive: true })
        .sort({ updatedAt: -1, createdAt: -1 })
        .limit(100)
    )
    const matchMap = new Map()

    const normalizedMatches = jobs.map((job) => {
      const matchData = calculateJobMatch(resume, job, { atsAnalytics })
      matchMap.set(String(job._id), matchData)
      return serializeJob(job, matchData)
    })

    const filteredMatches = applyJobFilters(normalizedMatches, req.query, matchMap)

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

router.post('/:id/apply', authenticateToken, async (req, res) => {
  try {
    const { resumeId } = req.body
    const job = await Job.findById(req.params.id)

    if (!job) {
      return res.status(404).json(buildErrorResponse('Job not found'))
    }

    const resume = resumeId 
      ? await Resume.findById(resumeId) 
      : await Resume.findOne({ userId: req.user.userId }).sort({ updatedAt: -1 })

    if (!resume || resume.userId.toString() !== req.user.userId) {
      return res.status(404).json(buildErrorResponse('Resume not found. Please upload or create a resume first.'))
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
      resumeId: resume._id,
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
    const job = await Job.findById(req.params.id)
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
