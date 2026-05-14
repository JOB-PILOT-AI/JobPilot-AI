export const calculateJobMatch = (resume, job) => {
  const resumeText = JSON.stringify(resume).toLowerCase()
  const jobRequiredSkills = (job.requiredSkills || []).map((s) => s.toLowerCase())
  const jobPreferredSkills = (job.preferredSkills || []).map((s) => s.toLowerCase())
  const resumeSkills = (resume.skills || []).map((s) => s.toLowerCase())

  // Calculate skill match
  let matchedSkills = []
  let missingSkills = []

  for (const skill of jobRequiredSkills) {
    const isMatched = resumeSkills.some((s) => s.includes(skill) || skill.includes(s))
    if (isMatched) {
      matchedSkills.push(skill)
    } else {
      missingSkills.push(skill)
    }
  }

  const skillMatch = jobRequiredSkills.length > 0 
    ? Math.round((matchedSkills.length / jobRequiredSkills.length) * 100)
    : 100

  // Calculate experience match
  const yearsInResume = extractYearsOfExperience(resume)
  const requiredExp = job.experience?.min || 0
  const experienceMatch = Math.min(Math.round((yearsInResume / Math.max(requiredExp, 1)) * 100), 100)

  // Calculate education match
  const educationMatch = hasRelevantEducation(resume, job) ? 100 : 70

  // Calculate overall match
  const overall = Math.round(
    (skillMatch * 0.5 + experienceMatch * 0.25 + educationMatch * 0.25)
  )

  const feedback = generateMatchFeedback(
    skillMatch,
    experienceMatch,
    educationMatch,
    matchedSkills,
    missingSkills
  )

  return {
    overall,
    skillMatch,
    experienceMatch,
    educationMatch,
    matchedSkills,
    missingSkills,
    feedback,
  }
}

const extractYearsOfExperience = (resume) => {
  if (!resume.workExperience || resume.workExperience.length === 0) {
    return 0
  }

  let totalYears = 0
  for (const exp of resume.workExperience) {
    const startYear = parseInt(exp.startDate?.substring(0, 4) || new Date().getFullYear())
    const endYear = exp.isCurrent
      ? new Date().getFullYear()
      : parseInt(exp.endDate?.substring(0, 4) || new Date().getFullYear())

    totalYears += Math.max(0, endYear - startYear)
  }

  return totalYears
}

const hasRelevantEducation = (resume, job) => {
  if (!resume.education || resume.education.length === 0) {
    return false
  }

  const technicalDegrees = [
    'bachelor',
    'master',
    'degree',
    'diploma',
    'certification',
    'computer science',
    'engineering',
    'it',
    'science',
  ]

  for (const edu of resume.education) {
    const eduText = JSON.stringify(edu).toLowerCase()
    if (technicalDegrees.some((deg) => eduText.includes(deg))) {
      return true
    }
  }

  return false
}

const generateMatchFeedback = (skillMatch, expMatch, eduMatch, matched, missing) => {
  const feedbacks = []

  if (skillMatch === 100) {
    feedbacks.push('Perfect skill match! You have all required skills.')
  } else if (skillMatch >= 80) {
    feedbacks.push('Strong skill match with minor gaps.')
  } else if (skillMatch >= 50) {
    feedbacks.push('Moderate skill match. Consider developing missing skills.')
  } else {
    feedbacks.push('Limited skill overlap. This may be a stretch role.')
  }

  if (expMatch === 100) {
    feedbacks.push('Your experience level exceeds the requirement.')
  } else if (expMatch >= 80) {
    feedbacks.push('You meet the experience requirement.')
  } else if (expMatch >= 50) {
    feedbacks.push('You have some relevant experience.')
  } else {
    feedbacks.push('You may lack the required experience.')
  }

  if (missing.length > 0) {
    feedbacks.push(`Missing skills: ${missing.slice(0, 3).join(', ')}`)
  }

  return feedbacks.join(' ')
}

// Dummy job matching for dashboard
export const generateDummyJobMatches = (userId) => {
  const dummyJobs = [
    {
      _id: '1',
      title: 'Lead Systems Engineer',
      company: 'QuantumScale Systems',
      location: 'Palo Alto, CA',
      locationType: 'Hybrid',
      salary: { min: 220000, max: 310000 },
      matchScore: {
        overall: 94,
        skillMatch: 95,
        experienceMatch: 92,
        educationMatch: 98,
        details: {
          matchedSkills: ['Distributed Systems', 'Go', 'Kubernetes', 'gRPC'],
          missingSkills: ['Rust (Internal Tooling)'],
          feedback: 'High-confidence alignment for this role',
        },
      },
    },
    {
      _id: '2',
      title: 'Principal Engineer, Infrastructure',
      company: 'TechCore Solutions',
      location: 'San Francisco, CA',
      locationType: 'On-site',
      salary: { min: 250000, max: 350000 },
      matchScore: {
        overall: 88,
        skillMatch: 90,
        experienceMatch: 85,
        educationMatch: 88,
        details: {
          matchedSkills: ['Cloud Architecture', 'Kubernetes', 'DevOps'],
          missingSkills: [],
          feedback: 'Strong match - you exceed experience requirements',
        },
      },
    },
    {
      _id: '3',
      title: 'Staff Software Engineer',
      company: 'CloudInnovate Inc',
      location: 'Seattle, WA',
      locationType: 'Remote',
      salary: { min: 200000, max: 280000 },
      matchScore: {
        overall: 82,
        skillMatch: 85,
        experienceMatch: 80,
        educationMatch: 78,
        details: {
          matchedSkills: ['Go', 'Microservices', 'AWS'],
          missingSkills: ['Service Mesh (Istio)'],
          feedback: 'Solid match with room to learn',
        },
      },
    },
  ]

  return dummyJobs
}
