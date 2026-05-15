import express from 'express'
import multer from 'multer'
import Resume from '../models/Resume.js'
import { authenticateToken } from '../middleware/auth.js'
import { parseResume } from '../services/resumeParser.js'
import { calculateATSScore } from '../services/atsScoring.js'

const router = express.Router()
const isAllowedResumeFile = (file) => {
  const fileName = file.originalname.toLowerCase()

  return (
    file.mimetype === 'application/pdf' ||
    file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    fileName.endsWith('.pdf') ||
    fileName.endsWith('.docx')
  )
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!isAllowedResumeFile(file)) {
      return cb(new Error('Only PDF and DOCX files are supported'))
    }

    cb(null, true)
  },
})

// Get all resumes for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user.userId })
    res.json(resumes)
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch resumes', error: err.message })
  }
})

// Get single resume
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id)
    if (!resume || resume.userId.toString() !== req.user.userId) {
      return res.status(404).json({ message: 'Resume not found' })
    }
    res.json(resume)
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch resume', error: err.message })
  }
})

// Create/Update resume from uploaded file
router.post('/upload', authenticateToken, (req, res) => {
  upload.single('resume')(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ message: 'Resume must be 10MB or smaller' })
      }

      return res.status(400).json({ message: err.message || 'Invalid resume upload' })
    }

    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Resume file is required' })
      }

      const parsedData = await parseResume(req.file.buffer, req.file.mimetype)
      const atsData = calculateATSScore(parsedData)

      const resume = new Resume({
        userId: req.user.userId,
        personalInfo: parsedData.personalInfo,
        summary: parsedData.summary,
        workExperience: parsedData.workExperience,
        education: parsedData.education,
        skills: parsedData.skills,
        atsScore: {
          score: atsData.score,
          feedback: atsData.feedback,
          keywordMatches: atsData.keywords,
          lastCalculated: new Date(),
        },
        extractedContent: {
          text: parsedData.extractedText,
          rawText: parsedData.extractedText,
        },
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
      })

      await resume.save()

      res.status(201).json({
        resume,
        parsedResume: {
          ...parsedData,
          contactDetails: parsedData.contactDetails,
        },
        atsScore: atsData.score,
        feedback: atsData.feedback,
      })
    } catch (error) {
      res.status(500).json({ message: 'Resume upload failed', error: error.message })
    }
  })
})

// Update resume
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id)
    if (!resume || resume.userId.toString() !== req.user.userId) {
      return res.status(404).json({ message: 'Resume not found' })
    }

    Object.assign(resume, req.body)
    
    // Recalculate ATS score if content changed
    if (req.body.personalInfo || req.body.workExperience || req.body.skills) {
      const atsData = calculateATSScore(resume)
      resume.atsScore = {
        score: atsData.score,
        feedback: atsData.feedback,
        keywordMatches: atsData.keywords,
        lastCalculated: new Date(),
      }
    }

    await resume.save()
    res.json(resume)
  } catch (err) {
    res.status(500).json({ message: 'Failed to update resume', error: err.message })
  }
})

// Delete resume
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id)
    if (!resume || resume.userId.toString() !== req.user.userId) {
      return res.status(404).json({ message: 'Resume not found' })
    }

    await resume.deleteOne()
    res.json({ message: 'Resume deleted successfully' })
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete resume', error: err.message })
  }
})

export default router
