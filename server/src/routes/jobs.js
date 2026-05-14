import express from 'express'
import Job from '../models/Job.js'
import Application from '../models/Application.js'
import Resume from '../models/Resume.js'
import { authenticateToken, authenticateOptional } from '../middleware/auth.js'
import { calculateJobMatch } from '../services/jobMatcher.js'

const router = express.Router()

// Get all jobs with optional filtering
router.get('/', authenticateOptional, async (req, res) => {
  try {
    const { search, location, salary, skills } = req.query
    let filter = { isActive: true }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ]
    }

    if (location) {
      filter.location = { $regex: location, $options: 'i' }
    }

    if (salary) {
      const [minSalary, maxSalary] = salary.split('-').map(Number)
      filter['salary.min'] = { $gte: minSalary }
      filter['salary.max'] = { $lte: maxSalary }
    }

    const jobs = await Job.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)

    res.json(jobs)
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch jobs', error: err.message })
  }
})

// Get single job with match analysis
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
        matchData = calculateJobMatch(resume, job)
      }
    }

    res.json({ job, matchData })
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch job', error: err.message })
  }
})

// Create job (admin only in production, but for demo anyone can create)
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

// Apply for job
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

    // Check if already applied
    const existingApplication = await Application.findOne({
      userId: req.user.userId,
      jobId: req.params.id,
    })

    if (existingApplication) {
      return res.status(400).json({ message: 'Already applied to this job' })
    }

    // Calculate match score
    const matchData = calculateJobMatch(resume, job)

    const application = new Application({
      userId: req.user.userId,
      jobId: req.params.id,
      resumeId,
      matchScore: {
        overall: matchData.overall,
        skillMatch: matchData.skillMatch,
        experienceMatch: matchData.experienceMatch,
        educationMatch: matchData.educationMatch,
        details: {
          matchedSkills: matchData.matchedSkills,
          missingSkills: matchData.missingSkills,
          feedback: matchData.feedback,
        },
      },
    })

    await application.save()
    res.status(201).json(application)
  } catch (err) {
    res.status(500).json({ message: 'Failed to apply for job', error: err.message })
  }
})

// Get user applications
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

export default router
