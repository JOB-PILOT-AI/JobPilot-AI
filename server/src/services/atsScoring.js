import { normalizeSkills } from '../utils/normalizeSkills.js'

export const calculateATSScore = (resume) => {
  let score = 0
  const feedback = []
  const keywords = []

  // Check personal information (10 points)
  if (resume.personalInfo?.email) {
    score += 5
  } else {
    feedback.push('Add a professional email address')
  }

  if (resume.personalInfo?.phone) {
    score += 5
  } else {
    feedback.push('Add a phone number')
  }

  // Check work experience (25 points)
  const experienceItems = resume.experience || resume.workExperience || []

  if (experienceItems.length > 0) {
    score += 15
    feedback.push(`Includes ${experienceItems.length} work experience(s)`)
    
    // Check for clear descriptions
    const withDescriptions = experienceItems.filter((exp) => exp.description?.length > 20)
    if (withDescriptions.length === experienceItems.length) {
      score += 10
      feedback.push('All positions have clear descriptions')
    }
  } else {
    feedback.push('Add work experience details')
  }

  // Check education (15 points)
  if (resume.education && resume.education.length > 0) {
    score += 15
    feedback.push(`Includes ${resume.education.length} education(s)`)
  }

  // Check skills (25 points)
  const normalizedSkills = normalizeSkills(resume.skills || [])

  if (normalizedSkills.length > 0) {
    score += 20
    feedback.push(`Includes ${normalizedSkills.length} skills`)
    keywords.push(...normalizedSkills)
    
    if (normalizedSkills.length >= 10) {
      score += 5
      feedback.push('Comprehensive skill set')
    }
  } else {
    feedback.push('Add technical and soft skills')
  }

  // Check for additional sections (15 points)
  if (resume.certifications && resume.certifications.length > 0) {
    score += 10
    feedback.push('Includes certifications')
  }

  if (resume.projects && resume.projects.length > 0) {
    score += 5
    feedback.push('Includes project portfolio')
  }

  // Check for keywords (10 points)
  const technicalKeywords = [
    'agile',
    'leadership',
    'communication',
    'problem-solving',
    'analytical',
  ]
  const resumeText = JSON.stringify(resume).toLowerCase()
  
  for (const keyword of technicalKeywords) {
    if (resumeText.includes(keyword.toLowerCase())) {
      score += 2
      keywords.push(keyword)
      if (keywords.length >= 5) break
    }
  }

  // Normalize score to 100
  score = Math.min(score, 100)

  return {
    score,
    feedback,
    keywords: Array.from(new Set(keywords)),
  }
}

export const getATSFeedback = (score) => {
  if (score >= 80) {
    return 'Excellent! Your resume is well-optimized for ATS systems.'
  } else if (score >= 60) {
    return 'Good! Your resume is mostly optimized. Consider the suggestions above.'
  } else if (score >= 40) {
    return 'Fair. Implement the suggestions to improve ATS compatibility.'
  } else {
    return 'Your resume needs significant improvements for ATS optimization.'
  }
}
