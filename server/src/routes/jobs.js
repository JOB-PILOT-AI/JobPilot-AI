import express from 'express'
import Job from '../models/Job.js'
import Application from '../models/Application.js'
import Resume from '../models/Resume.js'
import { authenticateToken, authenticateOptional } from '../middleware/auth.js'
import { applyJobFilters, normalizeJobFilters } from '../services/jobs/jobFilters.js'
import { calculateJobMatch } from '../services/jobs/jobMatchEngine.js'
import { calculateATSScore } from '../services/atsScoring.js'

const router = express.Router()

const serializeJob = (job, matchData = null) => ({
  id: job._id,
  _id: job._id,
  title: job.title,
  company: job.company,
  location: job.location,
  remoteType: job.remoteType || job.locationType || 'Hybrid',
  locationType: job.locationType || job.remoteType || 'Hybrid',
  salaryRange: job.salaryRange || job.salary || { min: 0, max: 0, currency: 'USD' },
  salary: job.salary || job.salaryRange || { min: 0, max: 0, currency: 'USD' },
  experienceLevel: job.experienceLevel || job.experience || { min: 0, max: 0 },
  experience: job.experience || job.experienceLevel || { min: 0, max: 0 },
  employmentType: job.employmentType || 'Full-time',
  category: job.category || job.jobCategory || 'Engineering',
  jobCategory: job.jobCategory || job.category || 'Engineering',
  responsibilities: Array.isArray(job.responsibilities) ? job.responsibilities : [],
  description: job.description,
  requiredSkills: Array.isArray(job.requiredSkills) ? job.requiredSkills : [],
  preferredSkills: Array.isArray(job.preferredSkills) ? job.preferredSkills : [],
  postedAt: job.postedAt || job.createdAt,
  companyDescription: job.companyDescription || '',
  matchScore: matchData,
})

router.get('/', authenticateOptional, async (req, res) => {
  try {
    const jobs = await Job.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(50)

    const filteredJobs = applyJobFilters(jobs, normalizeJobFilters(req.query))
    res.json(filteredJobs.map((job) => serializeJob(job)))
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch jobs', error: err.message })
  }
})

router.get('/matches', authenticateToken, async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(Number(req.query.limit) || 3, 10))
    const resume = await Resume.findOne({ userId: req.user.userId }).sort({ updatedAt: -1 })

    if (!resume) {
      return res.json({ resume: null, atsAnalytics: null, bestMatch: null, matches: [] })
    }

    const atsAnalytics = resume.atsAnalytics || calculateATSScore(resume.toObject())
    const jobs = await Job.find({ isActive: true }).sort({ createdAt: -1 }).limit(50)
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

    res.json({
      resumeId: resume._id,
      atsAnalytics,
      bestMatch: matches[0] || null,
      matches,
    })
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch job matches', error: err.message })
  }
})

router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      company,
      location,
      description,
      requiredSkills,
      salary,
      experience,
    } = req.body

    const job = new Job({
      title,
      company,
      location,
      description,
      requiredSkills,
      salary,
      experience,
    })

    await job.save()
    res.status(201).json(job)
  } catch (err) {
    res.status(500).json({ message: 'Failed to create job', error: err.message })
  }
})

router.post('/:id/apply', authenticateToken, async (req, res) => {
  try {
    const { resumeId } = req.body
    const job = await Job.findById(req.params.id)

    if (!job) {
      return res.status(404).json({ message: 'Job not found' })
    }

    const resume = await Resume.findById(resumeId)
    if (!resume || resume.userId.toString() !== req.user.userId) {
      return res.status(404).json({ message: 'Resume not found' })
    }

    const existingApplication = await Application.findOne({
      userId: req.user.userId,
      jobId: req.params.id,
    })

    if (existingApplication) {
      return res.status(400).json({ message: 'Already applied to this job' })
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
    res.status(201).json(application)
  } catch (err) {
    res.status(500).json({ message: 'Failed to apply for job', error: err.message })
  }
})

router.get('/user/applications', authenticateToken, async (req, res) => {
  try {
    const applications = await Application.find({ userId: req.user.userId })
      .populate('jobId')
      .populate('resumeId')

    res.json(applications)
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch applications', error: err.message })
  }
})

router.get('/:id', authenticateOptional, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
    if (!job) {
      return res.status(404).json({ message: 'Job not found' })
    }

    let matchData = null
    if (req.user) {
      const resume = await Resume.findOne({ userId: req.user.userId })
      if (resume) {
        const atsAnalytics = resume.atsAnalytics || calculateATSScore(resume.toObject())
        matchData = calculateJobMatch(resume, job, { atsAnalytics })
      }
    }

    res.json({ job: serializeJob(job), matchData })
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch job', error: err.message })
  }
})

export default router
