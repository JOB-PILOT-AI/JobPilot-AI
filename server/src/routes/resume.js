import express from 'express'
import Resume from '../models/Resume.js'
import { authenticateToken } from '../middleware/auth.js'
import { parseResume } from '../services/resumeParser.js'
import { calculateATSScore } from '../services/atsScoring.js'

const router = express.Router()

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
router.post('/upload', authenticateToken, async (req, res) => {
  try {
    const { fileContent, fileName, fileType } = req.body

    if (!fileContent || !fileName) {
      return res.status(400).json({ message: 'File content and name required' })
    }

    // Parse the file
    const parsedData = await parseResume(fileContent, fileType)

    // Calculate ATS score
    const atsData = calculateATSScore(parsedData)

    // Save resume
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
        rawText: fileContent,
      },
      fileName,
      fileType,
    })

    await resume.save()

    res.status(201).json({
      resume,
      atsScore: atsData.score,
      feedback: atsData.feedback,
    })
  } catch (err) {
    res.status(500).json({ message: 'Resume upload failed', error: err.message })
  }
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
