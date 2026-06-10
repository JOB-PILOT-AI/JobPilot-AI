import express from 'express'
import multer from 'multer'
import Resume from '../models/Resume.js'
import User from '../models/User.js'
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

const buildResumeResponse = (resume) => {
  const plainResume = typeof resume?.toObject === 'function' ? resume.toObject() : resume
  const atsAnalytics = plainResume?.atsAnalytics || calculateATSScore(plainResume || {})

  return {
    ...plainResume,
    atsAnalytics,
  }
}

router.get('/', authenticateToken, async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user.userId }).sort({ createdAt: -1 })
    res.json(resumes.map((resume) => buildResumeResponse(resume)))
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch resumes', error: err.message })
  }
})

router.delete('/', authenticateToken, async (req, res) => {
  try {
    const [deleteResult] = await Promise.all([
      Resume.deleteMany({ userId: req.user.userId }),
      User.updateOne({ _id: req.user.userId }, { $unset: { resumeId: '' } }),
    ])

    res.json({
      message: 'Resume data cleared successfully',
      deletedCount: deleteResult.deletedCount || 0,
    })
  } catch (err) {
    res.status(500).json({ message: 'Failed to clear resume data', error: err.message })
  }
})

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id)
    if (!resume || resume.userId.toString() !== req.user.userId) {
      return res.status(404).json({ message: 'Resume not found' })
    }
    res.json(buildResumeResponse(resume))
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch resume', error: err.message })
  }
})

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
      const resumeData = parsedData.resumeData || parsedData
      const atsData = calculateATSScore({
        ...resumeData,
        workExperience: resumeData.experience || parsedData.workExperience || [],
      })

      const resume = new Resume({
        userId: req.user.userId,
        personalInfo: resumeData.personalInfo,
        summary: resumeData.personalInfo?.summary || '',
        workExperience: resumeData.experience || [],
        experience: resumeData.experience || [],
        education: resumeData.education || [],
        skills: resumeData.skills || [],
        projects: resumeData.projects || [],
        certifications: resumeData.certifications || [],
        atsScore: {
          score: atsData.score,
          feedback: atsData.recommendations,
          keywordMatches: atsData.keywordMatches,
          lastCalculated: new Date(),
        },
        atsAnalytics: {
          ...atsData,
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
        resume: buildResumeResponse(resume),
        parsedResume: resumeData,
        resumeData,
        atsScore: atsData.score,
        feedback: atsData.recommendations,
        atsAnalytics: atsData,
      })
    } catch (error) {
      res.status(500).json({ message: 'Resume upload failed', error: error.message })
    }
  })
})

router.post('/', authenticateToken, async (req, res) => {
  try {
    const payload = req.body.resumeData || req.body

    // Generate ATS score automatically upon creation
    const atsData = calculateATSScore({
      ...payload,
      workExperience: payload.experience || payload.workExperience || [],
    })

    const resume = new Resume({
      userId: req.user.userId,
      personalInfo: payload.personalInfo || {},
      summary: payload.summary || '',
      workExperience: payload.experience || payload.workExperience || [],
      experience: payload.experience || payload.workExperience || [],
      education: payload.education || [],
      skills: payload.skills || [],
      projects: payload.projects || [],
      certifications: payload.certifications || [],
      atsScore: {
        score: atsData.score,
        feedback: atsData.recommendations,
        keywordMatches: atsData.keywordMatches,
        lastCalculated: new Date(),
      },
      atsAnalytics: {
        ...atsData,
        lastCalculated: new Date(),
      },
      extractedContent: {
        text: '',
        rawText: '',
      },
      fileName: 'Manual Resume',
      fileType: 'manual',
    })

    await resume.save()
    res.status(201).json(buildResumeResponse(resume))
  } catch (err) {
    res.status(500).json({ message: 'Failed to create resume manually', error: err.message })
  }
})

router.post('/generate-summary', authenticateToken, async (req, res) => {
  try {
    const { skills, experience } = req.body;
    
    let role = 'Software Engineer';
    let expText = 'a proven track record of';
    
    if (experience && experience.length > 0) {
      role = experience[0].position || role;
      const yearsCount = experience.length * 2; // rough heuristic
      if (yearsCount > 0) {
        expText = `over ${yearsCount} years of experience`;
      }
    }

    const topSkills = (skills && skills.length > 0) 
      ? skills.slice(0, 3).join(', ') 
      : 'modern frameworks and scalable architecture';

    const templates = [
      `Results-driven ${role} with ${expText} building and optimizing high-performance applications. Expertise in ${topSkills}. Passionate about solving complex engineering challenges, improving system reliability, and collaborating with cross-functional teams to deliver impactful products.`,
      `Innovative ${role} specializing in ${topSkills}. Recognized for ${expText} designing scalable solutions and leading technical initiatives. Adept at bridging the gap between product requirements and technical execution while maintaining high standards for code quality.`,
      `Dedicated ${role} with a strong foundation in ${topSkills}. Brings ${expText} delivering robust software solutions. Focused on continuous learning, performance optimization, and driving business value through clean, maintainable code.`
    ];

    const summary = templates[Math.floor(Math.random() * templates.length)];

    setTimeout(() => {
      res.json({ summary });
    }, 800); // Small delay to simulate AI processing time
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate summary', error: err.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id)
    if (!resume || resume.userId.toString() !== req.user.userId) {
      return res.status(404).json({ message: 'Resume not found' })
    }

    const payload = req.body.resumeData || req.body

    if (payload.personalInfo) {
      resume.personalInfo = {
        ...resume.personalInfo?.toObject?.(),
        ...payload.personalInfo,
      }
    }

    if (payload.summary !== undefined) {
      resume.summary = payload.summary
    }

    if (payload.experience || payload.workExperience) {
      resume.workExperience = payload.experience || payload.workExperience
      resume.experience = payload.experience || payload.workExperience
    }

    if (payload.education) {
      resume.education = payload.education
    }

    if (payload.skills) {
      resume.skills = payload.skills
    }

    if (payload.projects) {
      resume.projects = payload.projects
    }

    if (payload.certifications) {
      resume.certifications = payload.certifications
    }

    if (payload.personalInfo || payload.experience || payload.workExperience || payload.skills || payload.education || payload.projects || payload.certifications) {
      const atsData = calculateATSScore({
        ...resume.toObject(),
        workExperience: resume.workExperience || resume.experience || [],
      })
      resume.atsScore = {
        score: atsData.score,
        feedback: atsData.recommendations,
        keywordMatches: atsData.keywordMatches,
        lastCalculated: new Date(),
      }
      resume.atsAnalytics = {
        ...atsData,
        lastCalculated: new Date(),
      }
    }

    await resume.save()
    res.json(buildResumeResponse(resume))
  } catch (err) {
    res.status(500).json({ message: 'Failed to update resume', error: err.message })
  }
})

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
