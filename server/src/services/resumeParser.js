import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'
import { extractSkillsFromText } from '../utils/normalizeSkills.js'

const SECTION_HEADINGS = [
  'summary',
  'professional summary',
  'profile',
  'about me',
  'objective',
  'experience',
  'professional experience',
  'relevant experience',
  'work experience',
  'employment history',
  'work history',
  'internship',
  'internships',
  'training',
  'industrial training',
  'education',
  'academics',
  'skills',
  'technical skills',
  'tech stack',
  'technologies',
  'project',
  'projects',
  'academic projects',
  'personal projects',
  'selected projects',
  'major projects',
  'certifications',
  'certification',
  'certificates',
  'certificate',
  'licenses',
  'licenses and certifications',
  'training and certifications',
  'resume',
  'curriculum vitae',
]

const ROLE_KEYWORDS = [
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
  'scientist',
  'frontend',
  'backend',
  'software',
  'product',
  'data',
  'full stack',
  'devops',
  'staff',
  'principal',
  'senior',
  'sde',
  'intern',
  'trainee',
]

const PROFILE_LABELS = {
  linkedin: ['linkedin', 'linked in'],
  github: ['github', 'git hub'],
}

export const parseResume = async (fileContent, fileType, fileName = '') => {
  const buffer = Buffer.isBuffer(fileContent)
    ? fileContent
    : typeof fileContent === 'string'
      ? fileType === 'text/plain'
        ? Buffer.from(fileContent, 'utf-8')
        : Buffer.from(fileContent, 'base64')
      : Buffer.alloc(0)

  let extractedText = ''
  const normalizedFileName = String(fileName || '').toLowerCase()
  const isPdf = fileType === 'application/pdf' || normalizedFileName.endsWith('.pdf')
  const isDocx = fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || normalizedFileName.endsWith('.docx')

  try {
    if (isPdf) {
      const data = await pdfParse(buffer)
      extractedText = data.text || ''
    } else if (isDocx) {
      const result = await mammoth.extractRawText({ buffer })
      extractedText = result.value || ''
    } else if (fileType === 'text/plain') {
      extractedText = buffer.toString('utf-8')
    } else {
      extractedText = Buffer.isBuffer(fileContent) ? fileContent.toString('utf-8') : fileContent || ''
    }
  } catch {
    extractedText = Buffer.isBuffer(fileContent) ? fileContent.toString('utf-8') : fileContent || ''
  }

  const parsed = parseStructuredData(extractedText)

  return {
    ...parsed,
    contactDetails: parsed.contactDetails,
    extractedText,
  }
}

const parseStructuredData = (text) => {
  const cleanedText = cleanText(text)
  const lines = splitLines(cleanedText)

  const personalInfo = {
    fullName: extractName(lines),
    email: extractEmail(cleanedText),
    phone: extractPhone(cleanedText),
    linkedin: extractLinkedin(cleanedText, lines),
    github: extractGithub(cleanedText, lines),
    location: '',
    summary: extractSummary(lines),
  }

  const resumeData = {
    personalInfo,
    skills: extractSkills(cleanedText, lines),
    education: extractEducation(lines),
    experience: extractExperience(lines),
    projects: extractProjects(lines, cleanedText),
    certifications: extractCertifications(lines),
  }

  return {
    resumeData,
    personalInfo,
    summary: personalInfo.summary,
    skills: resumeData.skills,
    education: resumeData.education,
    experience: resumeData.experience,
    workExperience: resumeData.experience,
    projects: resumeData.projects,
    certifications: resumeData.certifications,
    contactDetails: {
      email: personalInfo.email,
      phone: personalInfo.phone,
      location: personalInfo.location,
      linkedin: personalInfo.linkedin,
      github: personalInfo.github,
    },
  }
}

const cleanText = (text) => {
  if (typeof text !== 'string') return ''

  return text
    .replace(/\u00a0/g, ' ')
    .replace(/[•·▪●]/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[•·▪●]/g, ' ').replace(/\t/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
}

const splitLines = (text) => text.split('\n').map((line) => line.trim()).filter(Boolean)

const extractName = (lines) => {
  const topSection = lines.slice(0, 10)
  const candidates = []

  for (const rawLine of topSection) {
    const line = normalizeCandidateLine(rawLine)
    if (!line) continue

    if (isSectionHeading(line)) continue

    const candidate = sanitizeNameCandidate(line)
    if (!candidate) continue

    if (!looksLikeHumanName(candidate)) continue

    candidates.push(candidate)
  }

  if (candidates.length === 0) return ''

  candidates.sort((left, right) => scoreNameCandidate(right) - scoreNameCandidate(left))
  return capitalizeName(candidates[0])
}

const extractEmail = (text) => {
  const emailRegex = /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g
  const matches = text.match(emailRegex) || []

  for (const match of matches) {
    const normalized = match.toLowerCase().replace(/[).,;]+$/, '')
    if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(normalized)) {
      return normalized
    }
  }

  return ''
}

const extractPhone = (text) => {
  const matches = text.match(/(?:\+91[\s-]?|91[\s-]?|0)?(?:[6-9]\d{2}[\s-]?\d{3}[\s-]?\d{4})/g) || []

  for (const rawMatch of matches) {
    const digits = rawMatch.replace(/\D/g, '')

    if (/^91[6-9]\d{9}$/.test(digits)) {
      return `+91${digits.slice(2)}`
    }

    if (/^0?[6-9]\d{9}$/.test(digits)) {
      return `+91${digits.replace(/^0/, '')}`
    }
  }

  return ''
}

const extractGithub = (text, lines) => {
  return extractProfileValue(text, lines, 'github')
}

const extractLinkedin = (text, lines) => {
  return extractProfileValue(text, lines, 'linkedin')
}

const extractProfileValue = (text, lines, platform) => {
  const regexByPlatform = {
    linkedin: [
      /(?:https?:\/\/)?(?:[a-z]{2,3}\.)?linkedin\.com\/(?:in|pub)\/([A-Za-z0-9-_%]+)/i,
      /(?:^|\s)(?:linkedin|linked in)\s*[:\-]?\s*(?:https?:\/\/)?(?:[a-z]{2,3}\.)?linkedin\.com\/(?:in|pub)\/([A-Za-z0-9-_%]+)/i,
      /(?:^|\s)(?:linkedin|linked in)\s*[:\-]?\s*([A-Za-z0-9][A-Za-z0-9-_%]{1,100})\b/i,
    ],
    github: [
      /(?:https?:\/\/)?(?:www\.)?github\.com\/([A-Za-z0-9-]{1,39})(?:\/?$|\?[A-Za-z0-9=&%_-]+$)/i,
      /(?:^|\s)(?:github|git hub)\s*[:\-]?\s*([A-Za-z0-9-]{1,39})\b/i,
    ],
  }

  const candidateValues = []
  const platformLabels = PROFILE_LABELS[platform] || [platform]

  for (const line of lines.slice(0, 15)) {
    const cleaned = normalizeCandidateLine(line)
    if (!cleaned) continue

    const lowerLine = cleaned.toLowerCase()
    if (!platformLabels.some((label) => lowerLine.includes(label))) continue

    for (const regex of regexByPlatform[platform]) {
      const match = cleaned.match(regex)
      if (match) candidateValues.push(match[1])
    }
  }

  for (const regex of regexByPlatform[platform]) {
    const match = text.match(regex)
    if (match) candidateValues.push(match[1])
  }

  const seen = new Set()

  for (const candidate of candidateValues) {
    const normalized = normalizeProfileValue(candidate, platform)
    if (!normalized) continue
    if (seen.has(normalized)) continue
    seen.add(normalized)
    return normalized
  }

  return ''
}

const normalizeProfileValue = (value, platform) => {
  const cleaned = normalizeCandidateLine(value).replace(/^@/, '').replace(/\/+$/, '').replace(/\?.*$/, '')

  if (!cleaned) return ''

  if (platform === 'linkedin') {
    const profile = cleaned.match(/(?:https?:\/\/)?(?:[a-z]{2,3}\.)?linkedin\.com\/(?:in|pub)\/([A-Za-z0-9-_%]+)$/i)
    if (profile) {
      return `https://www.linkedin.com/in/${profile[1]}`
    }

    if (/^[A-Za-z0-9][A-Za-z0-9-_%]{1,100}$/.test(cleaned)) {
      return `https://www.linkedin.com/in/${cleaned}`
    }

    return ''
  }

  if (platform === 'github') {
    const profile = cleaned.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([A-Za-z0-9-]{1,39})$/i)
    if (profile) {
      return `https://github.com/${profile[1]}`
    }

    if (/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/.test(cleaned)) {
      return `https://github.com/${cleaned}`
    }

    return ''
  }

  return ''
}

const extractSkills = (text, lines) => {
  return extractSkillsFromText(text, lines)
}

const extractSummary = (lines) => {
  const block = extractSectionBlock(lines, ['summary', 'professional summary', 'profile', 'about me', 'objective'])
  const summaryLines = block
    .filter((line) => !isSectionHeading(line))
    .filter((line) => !looksLikeContactLine(line))
    .slice(0, 5)

  return summaryLines.join(' ').replace(/\s+/g, ' ').trim().slice(0, 1200)
}

const extractEducation = (lines) => {
  const block = extractSectionBlock(lines, ['education', 'academics'])
  if (block.length === 0) return []

  const education = []
  const seen = new Set()
  let current = null

  for (const line of block) {
    const cleaned = normalizeCandidateLine(line)
    if (!cleaned || isSectionHeading(cleaned)) continue

    const degreeMatch = cleaned.match(/\b(b\.?tech|b\.?e|b\.?sc|b\.?a|m\.?tech|m\.?e|m\.?sc|m\.?a|mba|ph\.?d|phd|bachelor|master|associate|diploma|engineering|computer science|information technology)\b/i)
    const schoolMatch = cleaned.match(/\b(university|college|institute|school|academy|polytechnic)\b/i)
    const yearMatch = cleaned.match(/(19|20)\d{2}/)
    const fieldMatch = cleaned.match(/\b(computer science|information technology|electronics|mechanical|civil|electrical|data science|software engineering|artificial intelligence|machine learning)\b/i)

    if (!degreeMatch && !schoolMatch && !yearMatch) continue

    const key = cleaned.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)

    const entry = {
      school: schoolMatch ? cleaned : '',
      degree: degreeMatch ? cleaned : '',
      field: fieldMatch ? fieldMatch[0] : '',
      graduationYear: yearMatch ? yearMatch[0] : '',
    }

    if (!current) {
      current = entry
    } else {
      current = {
        school: current.school || entry.school,
        degree: current.degree || entry.degree,
        field: current.field || entry.field,
        graduationYear: current.graduationYear || entry.graduationYear,
      }
    }

    const confidence = [current.school, current.degree, current.field, current.graduationYear].filter(Boolean).length
    if (confidence >= 2) {
      education.push({ ...current })
      current = null
    }
  }

  return education
}

const extractExperience = (lines) => {
  const block = extractSectionBlock(lines, ['experience', 'professional experience', 'relevant experience', 'work experience', 'employment history', 'work history', 'internship', 'internships', 'training', 'industrial training'])
  if (block.length === 0) return extractLooseExperience(lines)

  const entries = []
  let current = null

  const pushCurrent = () => {
    if (!current) return

    const description = current.descriptionParts.join(' ').replace(/\s+/g, ' ').trim()
    const hasUsefulContent = current.company || current.position || description

    if (hasUsefulContent) {
      const fallbackTitle = current.rawHeader || current.descriptionParts[0] || 'Experience'
      entries.push({
        company: current.company,
        position: current.position || fallbackTitle.slice(0, 150),
        startDate: current.startDate,
        endDate: current.endDate,
        description,
        isCurrent: /present|current/i.test(current.endDate),
      })
    }

    current = null
  }

  for (const rawLine of block) {
    const line = cleanSectionLine(rawLine)
    if (!line || isSectionHeading(line)) continue

    const dateRange = extractDateRange(line)
    const isNewRole = looksLikeExperienceHeader(line, dateRange)

    if (isNewRole) {
      pushCurrent()
      current = {
        ...parseExperienceHeader(line, dateRange),
        rawHeader: line,
        descriptionParts: [],
      }
      continue
    }

    if (!current) {
      current = {
        company: '',
        position: '',
        startDate: '',
        endDate: '',
        rawHeader: '',
        descriptionParts: [],
      }
    }

    if (looksLikeDateLine(line) && !current.startDate) {
      const range = extractDateRange(line)
      current.startDate = range.startDate
      current.endDate = range.endDate
      continue
    }

    current.descriptionParts.push(line)
  }

  pushCurrent()
  return entries.slice(0, 8)
}

const extractProjects = (lines, text = '') => {
  const block = extractSectionBlock(lines, ['project', 'projects', 'academic projects', 'personal projects', 'selected projects', 'major projects'])
  if (block.length === 0) return extractLooseProjects(lines, text)

  const skills = extractSkills(text, lines)
  const entries = []
  let current = null

  const pushCurrent = () => {
    if (!current) return
    const description = current.descriptionParts.join(' ').replace(/\s+/g, ' ').trim()
    if (current.name || description || current.link) {
      entries.push({
        name: current.name || 'Project',
        description,
        technologies: extractTechnologiesFromText(`${current.name} ${description}`, skills),
        link: current.link,
      })
    }
    current = null
  }

  for (const rawLine of block) {
    const line = cleanSectionLine(rawLine)
    if (!line || isSectionHeading(line)) continue

    const link = extractUrl(line)
    const isHeader = looksLikeProjectHeader(line)

    if (isHeader && (!current || (line.length <= 90 && !/[.!?]$/.test(line)))) {
      pushCurrent()
      current = {
        name: stripTrailingDateAndUrl(line).slice(0, 120),
        descriptionParts: [],
        link,
      }
      continue
    }

    if (!current) {
      current = {
        name: '',
        descriptionParts: [],
        link: '',
      }
    }

    if (link && !current.link) current.link = link
    current.descriptionParts.push(line.replace(link, '').trim())
  }

  pushCurrent()
  return entries.slice(0, 8)
}

const extractCertifications = (lines) => {
  const block = extractSectionBlock(lines, ['certification', 'certifications', 'certificate', 'certificates', 'licenses', 'licenses and certifications', 'training and certifications'])
  if (block.length === 0) return extractLooseCertifications(lines)

  const certifications = []
  const seen = new Set()

  for (const rawLine of block) {
    const line = cleanSectionLine(rawLine)
    if (!line || isSectionHeading(line)) continue

    const date = extractYear(line)
    const parts = line
      .replace(/\s*[|•·-]\s*/g, ' | ')
      .split('|')
      .map((part) => part.trim())
      .filter(Boolean)

    const name = (parts[0] || line.replace(date, '').trim()).replace(/\s+/g, ' ')
    const issuer = (parts[1] || '').replace(date, '').trim()
    const key = `${name}-${issuer}-${date}`.toLowerCase()

    if (!name || seen.has(key)) continue
    seen.add(key)

    certifications.push({
      name: name.slice(0, 180),
      issuer: issuer.slice(0, 120),
      date,
    })
  }

  return certifications.slice(0, 10)
}

const extractLooseExperience = (lines) => {
  const entries = []

  for (let index = 0; index < lines.length; index += 1) {
    const line = cleanSectionLine(lines[index])
    if (!line || isSectionHeading(line) || !looksLikeRoleLine(line)) continue

    const dateRange = extractDateRange(line)
    const descriptionParts = []

    for (let offset = index + 1; offset < Math.min(lines.length, index + 5); offset += 1) {
      const nextLine = cleanSectionLine(lines[offset])
      if (!nextLine || isSectionHeading(nextLine) || looksLikeRoleLine(nextLine)) break
      if (looksLikeContactLine(nextLine)) continue
      descriptionParts.push(nextLine)
    }

    const parsed = parseExperienceHeader(line, dateRange)
    entries.push({
      company: parsed.company,
      position: parsed.position || line.slice(0, 150),
      startDate: parsed.startDate,
      endDate: parsed.endDate,
      description: descriptionParts.join(' ').replace(/\s+/g, ' ').trim(),
      isCurrent: /present|current/i.test(parsed.endDate),
    })
  }

  return dedupeByText(entries, (item) => `${item.position} ${item.company}`).slice(0, 6)
}

const extractLooseProjects = (lines, text = '') => {
  const skills = extractSkills(text, lines)
  const entries = []

  for (let index = 0; index < lines.length; index += 1) {
    const line = cleanSectionLine(lines[index])
    if (!line || isSectionHeading(line) || !looksLikeLooseProjectLine(line)) continue

    const descriptionParts = []
    const link = extractUrl(line)

    for (let offset = index + 1; offset < Math.min(lines.length, index + 4); offset += 1) {
      const nextLine = cleanSectionLine(lines[offset])
      if (!nextLine || isSectionHeading(nextLine) || looksLikeLooseProjectLine(nextLine)) break
      if (looksLikeContactLine(nextLine) && !extractUrl(nextLine)) continue
      descriptionParts.push(nextLine)
    }

    const description = descriptionParts.join(' ').replace(/\s+/g, ' ').trim()
    entries.push({
      name: stripTrailingDateAndUrl(line).slice(0, 120) || 'Project',
      description,
      technologies: extractTechnologiesFromText(`${line} ${description}`, skills),
      link,
    })
  }

  return dedupeByText(entries, (item) => `${item.name} ${item.description}`).slice(0, 6)
}

const extractLooseCertifications = (lines) => {
  const certificationPattern = /\b(certification|certificate|certified|course|training|license|licence|aws|azure|google cloud|oracle|microsoft|coursera|udemy|nptel|infosys|hackerrank)\b/i
  const candidates = lines
    .map(cleanSectionLine)
    .filter((line) => line && !isSectionHeading(line) && certificationPattern.test(line))

  return dedupeByText(candidates.map((line) => ({
    name: line.replace(/\s+/g, ' ').slice(0, 180),
    issuer: '',
    date: extractYear(line),
  })), (item) => item.name).slice(0, 8)
}

const dedupeByText = (items, getText) => {
  const seen = new Set()
  const result = []

  for (const item of items) {
    const key = String(getText(item) || '').toLowerCase().replace(/\s+/g, ' ').trim()
    if (!key || seen.has(key)) continue
    seen.add(key)
    result.push(item)
  }

  return result
}

const cleanSectionLine = (line) =>
  normalizeCandidateLine(line)
    .replace(/^[•·▪●\-\*]+\s*/u, '')
    .replace(/\s+/g, ' ')
    .trim()

const extractDateRange = (line) => {
  const datePattern = '(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\\s+\\d{4}|present|current|\\d{4}'
  const rangeRegex = new RegExp(`(${datePattern})\\s*(?:-|–|—|to)\\s*(${datePattern})`, 'i')
  const range = line.match(rangeRegex)

  if (range) {
    return {
      startDate: normalizeDateText(range[1]),
      endDate: normalizeDateText(range[2]),
    }
  }

  const years = line.match(/(19|20)\d{2}/g) || []
  return {
    startDate: years[0] || '',
    endDate: years[1] || (/present|current/i.test(line) ? 'Present' : ''),
  }
}

const normalizeDateText = (value) => {
  const cleaned = normalizeCandidateLine(value)
  return /present|current/i.test(cleaned) ? 'Present' : cleaned
}

const looksLikeExperienceHeader = (line, dateRange) => {
  if (/@|https?:\/\/|www\./i.test(line)) return false
  if (line.length > 180) return false
  if (looksLikeRoleLine(line)) return true
  if ((dateRange.startDate || dateRange.endDate) && /[|,@]/.test(line)) return true
  return false
}

const parseExperienceHeader = (line, dateRange) => {
  const withoutDates = getExperienceHeaderText(line, dateRange)
  const separators = withoutDates
    .split(/\s+\|\s+|\s+-\s+|\s+–\s+|\s+—\s+|,\s+/)
    .map((part) => part.trim())
    .filter(Boolean)

  const roleIndex = separators.findIndex(looksLikeRoleLine)
  let position = roleIndex >= 0 ? separators[roleIndex] : separators[0] || ''
  let company = roleIndex >= 0
    ? separators.find((part, index) => index !== roleIndex && !looksLikeRoleLine(part)) || ''
    : separators[1] || ''

  if (!position && !company) {
    const fallbackHeader = normalizeCandidateLine(line)
      .replace(dateRange.startDate || '', '')
      .replace(dateRange.endDate || '', '')
      .replace(/\s*(?:-|–|—|to|\|)\s*$/i, '')
      .replace(/\s+/g, ' ')
      .trim()
    position = fallbackHeader.slice(0, 150)
  }

  return {
    company: company.slice(0, 150),
    position: position.slice(0, 150),
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  }
}

const getExperienceHeaderText = (line, dateRange = {}) => {
  let header = normalizeCandidateLine(line)

  if (dateRange.startDate) {
    header = header.split(dateRange.startDate)[0] || header
  }

  if (dateRange.endDate && header.includes(dateRange.endDate)) {
    header = header.split(dateRange.endDate)[0] || header
  }

  header = stripTrailingDateAndUrl(header)
    .replace(/\s*(?:-|–|—|to|\|)\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim()

  return header || normalizeCandidateLine(line)
}

const removeDateText = (line, dateRange = {}) =>
  stripTrailingDateAndUrl(line)
    .replace(dateRange.startDate || '', '')
    .replace(dateRange.endDate || '', '')
    .replace(/\s*(?:-|–|—|to|\|)\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim()

const looksLikeProjectHeader = (line) => {
  if (line.length > 150) return false
  if (looksLikeContactLine(line) && !extractUrl(line)) return false
  if (/github\.com|live|demo|project|app|system|platform|website|dashboard|portal/i.test(line)) return true
  if (!/[.!?]$/.test(line) && line.split(/\s+/).length <= 8) return true
  return false
}

const looksLikeLooseProjectLine = (line) => {
  if (line.length > 160) return false
  return /github\.com|live demo|demo|project|app|system|platform|website|dashboard|portal|clone|management|prediction|tracker/i.test(line)
}

const extractUrl = (line) => {
  const match = line.match(/https?:\/\/[^\s)]+|(?:www\.)[^\s)]+|github\.com\/[^\s)]+/i)
  if (!match) return ''
  return match[0].startsWith('http') ? match[0] : `https://${match[0]}`
}

const stripTrailingDateAndUrl = (line) =>
  line
    .replace(/https?:\/\/[^\s)]+|(?:www\.)[^\s)]+|github\.com\/[^\s)]+/ig, '')
    .replace(/\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|present|current|\d{4})(?:\s*(?:-|–|—|to)\s*(?:present|current|\d{4}))?\b/ig, '')
    .replace(/\s*[|,;-]\s*$/g, '')
    .trim()

const extractTechnologiesFromText = (text, skills = []) => {
  const lowerText = String(text || '').toLowerCase()
  return skills
    .filter((skill) => skill && lowerText.includes(String(skill).toLowerCase()))
    .slice(0, 10)
}

const extractSectionBlock = (lines, headings) => {
  const startIndex = lines.findIndex((line) =>
    headings.some((heading) => matchesHeading(line, heading))
  )

  if (startIndex === -1) return []

  const block = []
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = normalizeCandidateLine(lines[index])
    if (!line) continue
    if (isSectionHeading(line) && !headings.some((heading) => matchesHeading(line, heading))) {
      break
    }
    block.push(line)
  }

  return block
}

const normalizeCandidateLine = (line) => (typeof line === 'string' ? line.replace(/\s+/g, ' ').trim() : '')

const normalizeHeadingLine = (line) =>
  normalizeCandidateLine(line)
    .toLowerCase()
    .replace(/^[\s:|/\\\-–—]+|[\s:|/\\\-–—]+$/g, '')
    .replace(/[&]+/g, ' and ')
    .replace(/\s+/g, ' ')
    .trim()

const isSectionHeading = (line) => {
  const normalized = normalizeHeadingLine(line)
  return SECTION_HEADINGS.some((heading) => normalized === heading || normalized.startsWith(`${heading} `))
}

const matchesHeading = (line, heading) => {
  const normalized = normalizeHeadingLine(line)
  const normalizedHeading = normalizeHeadingLine(heading)
  return normalized === normalizedHeading || normalized.startsWith(`${normalizedHeading} `)
}

const sanitizeNameCandidate = (line) => {
  if (looksLikeContactLine(line)) return ''

  const cleaned = line
    .replace(/^[•\-\u2022\*]+\s*/g, '')
    .replace(/^(name|full name|candidate)\s*[:\-]?\s*/i, '')
    .replace(/[|(),:/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return /^[A-Za-z][A-Za-z'`\- ]*[A-Za-z]$/.test(cleaned) ? cleaned : ''
}

const looksLikeContactLine = (line) =>
  /@/.test(line) || /https?:\/\//i.test(line) || /www\./i.test(line) || /\d/.test(line)

const looksLikeHumanName = (candidate) => {
  const words = candidate.split(' ')

  if (words.length < 2 || words.length > 4) return false
  if (candidate.length < 4 || candidate.length > 40) return false

  const lowerCandidate = candidate.toLowerCase()
  if (ROLE_KEYWORDS.some((keyword) => lowerCandidate.includes(keyword))) return false

  if (/\b(resume|curriculum vitae|cv|profile|about me|contact|summary|experience|skills|education|projects|certifications|objective|name)\b/i.test(candidate)) return false

  return words.every((word) => /^[A-Za-z][A-Za-z'`\-]*$/.test(word))
}

const scoreNameCandidate = (candidate) => {
  const words = candidate.split(' ')
  const titleCase = words.every((word) => /^[A-Z][a-z]+(?:['`-][A-Z]?[a-z]+)?$/.test(word))
  const uppercase = words.every((word) => /^[A-Z]+(?:['`-][A-Z]+)?$/.test(word))

  let score = 0
  if (words.length === 2) score += 8
  if (words.length === 3) score += 10
  if (words.length === 4) score += 6
  if (titleCase) score += 10
  if (uppercase) score += 7
  if (candidate.length >= 8 && candidate.length <= 30) score += 3

  return score
}

const capitalizeName = (name) =>
  name
    .split(' ')
    .map((word) =>
      word
        .toLowerCase()
        .split('-')
        .map((segment) =>
          segment
            .split("'")
            .map((piece) => piece.charAt(0).toUpperCase() + piece.slice(1))
            .join("'")
        )
        .join('-')
    )
    .join(' ')

const looksLikeDateLine = (line) =>
  /(19|20)\d{2}/.test(line) || /present|current/i.test(line) || /jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i.test(line)

const looksLikeRoleLine = (line) => {
  const lower = line.toLowerCase()
  return ROLE_KEYWORDS.some((keyword) => lower.includes(keyword)) && line.length <= 120
}

const extractYear = (text) => {
  const match = text.match(/(19|20)\d{2}/)
  return match ? match[0] : ''
}

function normalizeSkillTokens(value) {
  if (typeof value !== 'string') return []

  return value
    .toLowerCase()
    .replace(/[^a-z0-9+#]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
}

const matchesTokenSequence = (tokens, candidateTokens) => {
  if (candidateTokens.length === 0 || tokens.length < candidateTokens.length) return false

  for (let index = 0; index <= tokens.length - candidateTokens.length; index += 1) {
    let matched = true

    for (let offset = 0; offset < candidateTokens.length; offset += 1) {
      if (tokens[index + offset] !== candidateTokens[offset]) {
        matched = false
        break
      }
    }

    if (matched) return true
  }

  return false
}
