import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'

export const parseResume = async (fileContent, fileType) => {
  let extractedText = ''
  const buffer = Buffer.isBuffer(fileContent)
    ? fileContent
    : typeof fileContent === 'string'
      ? fileType === 'text/plain'
        ? Buffer.from(fileContent, 'utf-8')
        : Buffer.from(fileContent, 'base64')
      : Buffer.alloc(0)

  try {
    if (fileType === 'application/pdf') {
      const data = await pdfParse(buffer)
      extractedText = data.text
    } else if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const result = await mammoth.extractRawText({ buffer })
      extractedText = result.value
    } else if (fileType === 'text/plain') {
      extractedText = buffer.toString('utf-8')
    } else {
      extractedText = Buffer.isBuffer(fileContent) ? fileContent.toString('utf-8') : fileContent
    }
  } catch (err) {
    console.log('Error parsing file:', err)
    extractedText = Buffer.isBuffer(fileContent) ? fileContent.toString('utf-8') : fileContent
  }

  // Parse extracted text for structured data
  const parsed = parseStructuredData(extractedText)

  return {
    ...parsed,
    contactDetails: parsed.contactDetails,
    extractedText,
  }
}

const parseStructuredData = (text) => {
  // Simple parsing logic - in production, use ML/NLP
  const lines = text.split('\n').filter((line) => line.trim())

  const personalInfo = {
    fullName: extractName(lines),
    email: extractEmail(text),
    phone: extractPhoneNumber(text),
    location: extractLocation(lines),
    title: extractTitle(lines),
  }

  const contactDetails = {
    email: personalInfo.email,
    phone: personalInfo.phone,
    location: personalInfo.location,
  }

  const workExperience = extractWorkExperience(text)
  const education = extractEducation(text)
  const skills = extractSkills(text)
  const summary = extractSummary(lines)

  return {
    personalInfo,
    contactDetails,
    summary,
    workExperience,
    education,
    skills,
  }
}

const extractName = (lines) => {
  const topSection = lines.slice(0, 12)
  const sectionKeywords = [
    'summary',
    'profile',
    'about me',
    'experience',
    'education',
    'skills',
    'projects',
    'certifications',
    'resume',
    'curriculum vitae',
  ]
  const titleKeywords = [
    'engineer',
    'developer',
    'manager',
    'analyst',
    'architect',
    'designer',
    'consultant',
    'specialist',
    'lead',
    'director',
    'profile',
    'summary',
  ]

  const candidates = []

  for (const rawLine of topSection) {
    const line = normalizeTextLine(rawLine)
    if (!line) continue

    if (isHeadingLike(line, sectionKeywords)) continue

    const candidate = sanitizeNameCandidate(line)
    if (!candidate) continue

    if (!looksLikeHumanName(candidate, titleKeywords)) continue

    candidates.push(candidate)
  }

  if (candidates.length > 0) {
    candidates.sort((left, right) => scoreNameCandidate(right) - scoreNameCandidate(left))
    return capitalizeName(candidates[0])
  }

  return 'John Doe'
}

const extractEmail = (text) => {
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/
  const match = text.match(emailRegex)
  return match ? match[1] : 'email@example.com'
}

const extractPhoneNumber = (text) => {
  const normalizedText = text.replace(/\u00a0/g, ' ')
  const patterns = [
    /(?:\+91|91)[\s-]*([6-9]\d{4})[\s-]*([6-9]\d{4})\b/g,
    /\b(?:0)?([6-9]\d{9})\b/g,
    /\b(?:\+91|91)\s*0?([6-9]\d{9})\b/g,
  ]

  for (const pattern of patterns) {
    const matches = normalizedText.matchAll(pattern)
    for (const match of matches) {
      const digits = match[1] && match[2] ? `${match[1]}${match[2]}` : match[1]
      if (isValidIndianMobile(digits)) {
        return `+91${digits}`
      }
    }
  }

  return '+91 0000000000'
}

const normalizeTextLine = (line) => line.replace(/\s+/g, ' ').trim()

const isHeadingLike = (line, sectionKeywords) => {
  const lowerLine = line.toLowerCase()
  return sectionKeywords.some((keyword) => lowerLine === keyword || lowerLine.startsWith(`${keyword}:`))
}

const sanitizeNameCandidate = (line) => {
  if (/@/.test(line) || /https?:\/\//i.test(line) || /www\./i.test(line)) {
    return ''
  }

  if (/\d/.test(line)) {
    return ''
  }

  const cleaned = line
    .replace(/^[•\-\u2022\*]+\s*/g, '')
    .replace(/\s*\|\s*/g, ' ')
    .replace(/[(),:/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return /^[A-Za-z][A-Za-z'`\- ]*[A-Za-z]$/.test(cleaned) ? cleaned : ''
}

const looksLikeHumanName = (candidate, titleKeywords) => {
  const words = candidate.split(' ')

  if (words.length < 2 || words.length > 4) {
    return false
  }

  if (candidate.length < 4 || candidate.length > 40) {
    return false
  }

  const lowerCandidate = candidate.toLowerCase()
  if (titleKeywords.some((keyword) => lowerCandidate.includes(keyword))) {
    return false
  }

  if (/\b(resume|curriculum vitae|cv|profile|about me|contact|summary)\b/i.test(candidate)) {
    return false
  }

  return words.every((word) => /^[A-Za-z][A-Za-z'`\-]*$/.test(word))
}

const scoreNameCandidate = (candidate) => {
  const words = candidate.split(' ')
  const hasTitleCase = words.every((word) => /^[A-Z][a-z]+(?:['`-][A-Z]?[a-z]+)?$/.test(word))
  const hasUppercase = words.every((word) => /^[A-Z]+(?:['`-][A-Z]+)?$/.test(word))

  let score = 0

  if (words.length === 2) score += 6
  if (words.length === 3) score += 8
  if (words.length === 4) score += 5
  if (hasTitleCase) score += 8
  if (hasUppercase) score += 6
  if (candidate.length >= 10 && candidate.length <= 30) score += 4

  return score
}

const capitalizeName = (name) =>
  name
    .split(' ')
    .map((word) => {
      const lowerWord = word.toLowerCase()
      return lowerWord
        .split('-')
        .map((segment) =>
          segment
            .split("'")
            .map((piece) => piece.charAt(0).toUpperCase() + piece.slice(1))
            .join("'")
        )
        .join('-')
    })
    .join(' ')

const isValidIndianMobile = (digits) => /^[6-9]\d{9}$/.test(digits)

const extractLocation = (lines) => {
  // Look for city, state pattern
  const locationRegex = /([A-Z][a-z]+),\s*([A-Z]{2})/
  for (const line of lines) {
    const match = line.match(locationRegex)
    if (match) return `${match[1]}, ${match[2]}`
  }
  return 'City, State'
}

const extractTitle = (lines) => {
  // Look for job title keywords
  const titleKeywords = [
    'engineer',
    'manager',
    'developer',
    'analyst',
    'architect',
    'designer',
    'director',
  ]
  for (const line of lines) {
    if (titleKeywords.some((kw) => line.toLowerCase().includes(kw))) {
      return line.trim().substring(0, 50)
    }
  }
  return 'Professional'
}

const extractWorkExperience = (text) => {
  // Look for company names and job descriptions
  const experience = []
  
  // Simple heuristic: look for lines with company-like patterns
  const lines = text.split('\n')
  let currentRole = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Look for date patterns (YYYY-YYYY or Month Year - Month Year)
    if (/\d{4}/.test(line) || /Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/.test(line)) {
      if (currentRole) {
        experience.push(currentRole)
      }
      
      currentRole = {
        company: '',
        position: line,
        startDate: '',
        endDate: '',
        description: '',
        isCurrent: false,
      }
    } else if (currentRole && line.length > 0) {
      if (!currentRole.company && line.length < 50) {
        currentRole.company = line
      } else if (line.length > 20) {
        currentRole.description += line + ' '
      }
    }
  }

  if (currentRole) {
    experience.push(currentRole)
  }

  return experience.length > 0
    ? experience
    : [
        {
          company: 'TechNova Global',
          position: 'Senior Product Manager',
          startDate: '2021',
          endDate: 'Present',
          description: 'Led cross-functional teams to launch SaaS products.',
          isCurrent: true,
        },
      ]
}

const extractEducation = (text) => {
  const education = []
  const degreeKeywords = ['B.S.', 'B.A.', 'M.S.', 'M.A.', 'MBA', 'Ph.D.', 'Bachelor', 'Master']
  
  const lines = text.split('\n')
  for (const line of lines) {
    if (degreeKeywords.some((kw) => line.includes(kw))) {
      education.push({
        school: 'University',
        degree: line.substring(0, 50),
        field: 'Computer Science',
        graduationYear: '2020',
      })
    }
  }

  return education.length > 0
    ? education
    : [
        {
          school: 'Tech University',
          degree: 'B.S.',
          field: 'Computer Science',
          graduationYear: '2018',
        },
      ]
}

const extractSkills = (text) => {
  const commonSkills = [
    'javascript',
    'python',
    'react',
    'nodejs',
    'mongodb',
    'sql',
    'aws',
    'docker',
    'kubernetes',
    'git',
    'agile',
    'leadership',
    'communication',
  ]

  const foundSkills = new Set()
  const lowerText = text.toLowerCase()

  for (const skill of commonSkills) {
    if (lowerText.includes(skill)) {
      foundSkills.add(skill)
    }
  }

  return Array.from(foundSkills).length > 0
    ? Array.from(foundSkills)
    : [
        'Product Strategy',
        'Data Analysis',
        'Agile Methodology',
        'Leadership',
      ]
}

const extractSummary = (lines) => {
  // Look for introductory paragraph
  let summary = ''
  for (const line of lines) {
    if (line.length > 50 && line.length < 200) {
      summary = line.trim()
      break
    }
  }

  return (
    summary ||
    'Experienced professional with a proven track record of driving business impact through strategic initiatives and technical excellence.'
  )
}
