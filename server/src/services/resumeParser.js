import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'

const SKILL_DICTIONARY = [
  { canonical: 'JavaScript', patterns: [/\bjavascript\b/i, /\bjs\b/i] },
  { canonical: 'TypeScript', patterns: [/\btypescript\b/i, /\bts\b/i] },
  { canonical: 'React', patterns: [/\breact(?:\.js|js)?\b/i, /\breact js\b/i] },
  { canonical: 'Next.js', patterns: [/\bnext(?:\.js|js)?\b/i] },
  { canonical: 'Node.js', patterns: [/\bnode(?:\.js|js)?\b/i, /\bnode\b/i] },
  { canonical: 'Express', patterns: [/\bexpress\b/i] },
  { canonical: 'MongoDB', patterns: [/\bmongodb\b/i, /\bmongo\b/i] },
  { canonical: 'PostgreSQL', patterns: [/\bpostgres(?:ql)?\b/i] },
  { canonical: 'MySQL', patterns: [/\bmysql\b/i] },
  { canonical: 'SQL', patterns: [/\bsql\b/i] },
  { canonical: 'HTML', patterns: [/\bhtml\b/i] },
  { canonical: 'CSS', patterns: [/\bcss\b/i] },
  { canonical: 'Tailwind CSS', patterns: [/\btailwind(?: css)?\b/i] },
  { canonical: 'Redux', patterns: [/\bredux\b/i] },
  { canonical: 'Git', patterns: [/\bgit\b/i] },
  { canonical: 'Docker', patterns: [/\bdocker\b/i] },
  { canonical: 'Kubernetes', patterns: [/\bkubernetes\b/i, /\bk8s\b/i] },
  { canonical: 'AWS', patterns: [/\baws\b/i, /amazon web services/i] },
  { canonical: 'GCP', patterns: [/\bgcp\b/i, /google cloud/i] },
  { canonical: 'Azure', patterns: [/\bazure\b/i] },
  { canonical: 'GraphQL', patterns: [/\bgraphql\b/i] },
  { canonical: 'REST APIs', patterns: [/\brest(?:ful)? apis?\b/i, /\bapis?\b/i] },
  { canonical: 'Jest', patterns: [/\bjest\b/i] },
  { canonical: 'Cypress', patterns: [/\bcypress\b/i] },
  { canonical: 'CI/CD', patterns: [/\bci\/?cd\b/i] },
  { canonical: 'Linux', patterns: [/\blinux\b/i] },
  { canonical: 'Java', patterns: [/\bjava\b/i] },
  { canonical: 'Python', patterns: [/\bpython\b/i] },
  { canonical: 'Go', patterns: [/\bgo\b/i, /\bgolang\b/i] },
  { canonical: 'C++', patterns: [/\bc\+\+\b/i] },
  { canonical: 'C#', patterns: [/\bc#\b/i] },
  { canonical: 'Agile', patterns: [/\bagile\b/i] },
  { canonical: 'Leadership', patterns: [/\bleadership\b/i] },
  { canonical: 'Communication', patterns: [/\bcommunication\b/i] },
  { canonical: 'Problem Solving', patterns: [/\bproblem solving\b/i, /\bproblem-solving\b/i] },
  { canonical: 'System Design', patterns: [/\bsystem design\b/i] },
  { canonical: 'Microservices', patterns: [/\bmicroservices\b/i] },
  { canonical: 'Figma', patterns: [/\bfigma\b/i] },
]

const SECTION_HEADINGS = [
  'summary',
  'professional summary',
  'profile',
  'about me',
  'experience',
  'work experience',
  'employment history',
  'education',
  'skills',
  'projects',
  'certifications',
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
  'qa',
  'platform',
  'staff',
  'principal',
  'senior',
]

export const parseResume = async (fileContent, fileType) => {
  const buffer = Buffer.isBuffer(fileContent)
    ? fileContent
    : typeof fileContent === 'string'
      ? fileType === 'text/plain'
        ? Buffer.from(fileContent, 'utf-8')
        : Buffer.from(fileContent, 'base64')
      : Buffer.alloc(0)

  let extractedText = ''

  try {
    if (fileType === 'application/pdf') {
      const data = await pdfParse(buffer)
      extractedText = data.text || ''
    } else if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
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
    linkedin: extractLinkedin(cleanedText),
    github: extractGithub(cleanedText),
    location: extractLocation(lines),
    summary: extractSummary(lines, cleanedText),
  }

  const resumeData = {
    personalInfo,
    skills: extractSkills(cleanedText),
    education: extractEducation(lines),
    experience: extractExperience(lines),
    projects: extractProjects(lines),
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
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[•·▪●]/g, ' ').replace(/\t/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
}

const splitLines = (text) => text.split('\n').map((line) => line.trim()).filter(Boolean)

const extractName = (lines) => {
  const topSection = lines.slice(0, 12)
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
  const emailRegex = /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/
  const match = text.match(emailRegex)
  return match ? match[1].toLowerCase() : ''
}

const extractPhone = (text) => {
  const patterns = [
    /(?:\+91|91|0)?[\s-]*[6-9](?:[\s-]?\d){9}\b/g,
    /(?:\+91|91)[\s-]*0?[6-9](?:[\s-]?\d){9}\b/g,
  ]

  for (const pattern of patterns) {
    const matches = text.match(pattern) || []
    for (const rawMatch of matches) {
      const digits = rawMatch.replace(/\D/g, '')
      const normalizedDigits = digits.startsWith('91') && digits.length === 12
        ? digits.slice(2)
        : digits.startsWith('0') && digits.length === 11
          ? digits.slice(1)
          : digits

      if (/^[6-9]\d{9}$/.test(normalizedDigits)) {
        return `+91${normalizedDigits}`
      }
    }
  }

  return ''
}

const extractGithub = (text) => {
  const githubRegex = /(?:https?:\/\/)?(?:www\.)?github\.com\/([A-Za-z0-9-]{1,39})(?:\/[A-Za-z0-9._-]+)?/i
  const match = text.match(githubRegex)
  return match ? `https://github.com/${match[1]}` : ''
}

const extractLinkedin = (text) => {
  const linkedinRegex = /(?:https?:\/\/)?(?:[a-z]{2,3}\.)?linkedin\.com\/(?:in|pub)\/([A-Za-z0-9-_%]+)/i
  const match = text.match(linkedinRegex)
  return match ? `https://www.linkedin.com/in/${match[1].replace(/\/+$/, '')}` : ''
}

const extractLocation = (lines) => {
  for (const line of lines.slice(0, 15)) {
    const normalized = normalizeCandidateLine(line)
    if (!normalized) continue

    const locationMatch = normalized.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2}|[A-Z][a-z]+)\b/)
    if (locationMatch) {
      return `${locationMatch[1]}, ${locationMatch[2]}`
    }
  }

  return ''
}

const extractSummary = (lines, text) => {
  const summarySection = extractSectionBlock(lines, ['summary', 'professional summary', 'profile', 'about me'])
  if (summarySection.length > 0) {
    const summary = summarySection.join(' ').trim()
    if (summary.length >= 40) return summary
  }

  const introCandidate = lines.slice(0, 8).find((line) => {
    const cleaned = normalizeCandidateLine(line)
    return cleaned.length >= 80 && cleaned.length <= 240 && !isSectionHeading(cleaned) && !looksLikeContactLine(cleaned)
  })

  if (introCandidate) {
    return normalizeCandidateLine(introCandidate)
  }

  const textCandidate = text
    .split(/\n\n+/)
    .map((block) => block.replace(/\s+/g, ' ').trim())
    .find((block) => block.length >= 80 && block.length <= 240)

  return textCandidate || ''
}

const extractSkills = (text) => {
  const lowerText = text.toLowerCase()
  const foundSkills = []
  const seen = new Set()

  for (const entry of SKILL_DICTIONARY) {
    const matched = entry.patterns.some((pattern) => pattern.test(lowerText))
    if (matched && !seen.has(entry.canonical)) {
      seen.add(entry.canonical)
      foundSkills.push(entry.canonical)
    }
  }

  return foundSkills
}

const extractEducation = (lines) => {
  const block = extractSectionBlock(lines, ['education', 'academics'])
  const sourceLines = block.length > 0 ? block : lines.slice(0, 30)
  const education = []
  const seen = new Set()

  for (const line of sourceLines) {
    const cleaned = normalizeCandidateLine(line)
    if (!cleaned || isSectionHeading(cleaned)) continue

    const yearMatch = cleaned.match(/(19|20)\d{2}/)
    const degreeMatch = cleaned.match(/\b(b\.?tech|b\.?e|b\.?sc|b\.?a|m\.?tech|m\.?e|m\.?sc|m\.?a|mba|ph\.?d|phd|bachelor|master|associate|diploma)\b/i)
    const schoolMatch = cleaned.match(/\b(university|college|institute|school|academy)\b/i)

    if (!degreeMatch && !schoolMatch && !yearMatch) continue

    const key = cleaned.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)

    education.push({
      school: schoolMatch ? cleaned : '',
      degree: degreeMatch ? cleaned : '',
      field: '',
      graduationYear: yearMatch ? yearMatch[0] : '',
    })
  }

  return education
}

const extractExperience = (lines) => {
  const block = extractSectionBlock(lines, ['experience', 'work experience', 'employment history'])
  const sourceLines = block.length > 0 ? block : lines
  const experience = []
  let current = null

  for (const line of sourceLines) {
    const cleaned = normalizeCandidateLine(line)
    if (!cleaned) continue

    if (isSectionHeading(cleaned)) {
      if (current) {
        finalizeExperience(current, experience)
        current = null
      }
      continue
    }

    if (looksLikeDateLine(cleaned) || looksLikeRoleLine(cleaned)) {
      if (current) {
        finalizeExperience(current, experience)
      }

      current = {
        company: '',
        position: cleaned,
        startDate: extractStartDate(cleaned),
        endDate: extractEndDate(cleaned),
        description: '',
        isCurrent: /present|current/i.test(cleaned),
      }
      continue
    }

    if (!current) continue

    if (!current.company && cleaned.length <= 60) {
      current.company = cleaned
      continue
    }

    if (cleaned.length > 20) {
      current.description = `${current.description} ${cleaned}`.trim()
    }
  }

  if (current) {
    finalizeExperience(current, experience)
  }

  return experience
}

const extractProjects = (lines) => {
  const block = extractSectionBlock(lines, ['projects', 'selected projects'])
  if (block.length === 0) return []

  const projects = []
  let current = null

  for (const line of block) {
    const cleaned = normalizeCandidateLine(line)
    if (!cleaned) continue

    if (isSectionHeading(cleaned)) continue

    const looksLikeTitle = cleaned.length <= 80 && /^[A-Z][A-Za-z0-9'&().,\-\s/]+$/.test(cleaned)

    if ((looksLikeTitle && !looksLikeDateLine(cleaned)) || (!current && cleaned.length <= 50)) {
      if (current) {
        projects.push(current)
      }

      current = {
        name: cleaned,
        description: '',
        technologies: [],
        link: '',
      }

      continue
    }

    if (!current) continue

    if (!current.description) {
      current.description = cleaned
    } else {
      current.description = `${current.description} ${cleaned}`.trim()
    }

    const technologies = cleaned
      .split(/[,|]/)
      .map((item) => normalizeCandidateLine(item))
      .filter((item) => item.length > 1 && item.length < 30)

    for (const technology of technologies) {
      if (!current.technologies.includes(technology)) {
        current.technologies.push(technology)
      }
    }
  }

  if (current) {
    projects.push(current)
  }

  return projects
}

const extractCertifications = (lines) => {
  const block = extractSectionBlock(lines, ['certifications', 'certificates'])
  if (block.length === 0) return []

  const certifications = []
  const seen = new Set()

  for (const line of block) {
    const cleaned = normalizeCandidateLine(line)
    if (!cleaned || isSectionHeading(cleaned)) continue

    const key = cleaned.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)

    certifications.push({
      name: cleaned,
      issuer: '',
      date: extractYear(cleaned),
    })
  }

  return certifications
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

const isSectionHeading = (line) => {
  const normalized = line.toLowerCase().replace(/:$/, '')
  return SECTION_HEADINGS.some((heading) => normalized === heading || normalized.startsWith(`${heading} `))
}

const matchesHeading = (line, heading) => {
  const normalized = line.toLowerCase().replace(/:$/, '')
  return normalized === heading || normalized.startsWith(`${heading} `)
}

const sanitizeNameCandidate = (line) => {
  if (looksLikeContactLine(line)) return ''

  const cleaned = line
    .replace(/^[•\-\u2022\*]+\s*/g, '')
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

  if (/\b(resume|curriculum vitae|cv|profile|about me|contact|summary)\b/i.test(candidate)) return false

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

const extractStartDate = (line) => {
  const dateMatch = line.match(/(19|20)\d{2}/)
  return dateMatch ? dateMatch[0] : ''
}

const extractEndDate = (line) => {
  if (/present|current/i.test(line)) return 'Present'
  const matches = line.match(/(19|20)\d{2}/g)
  if (!matches || matches.length < 2) return ''
  return matches[matches.length - 1]
}

const extractYear = (text) => {
  const match = text.match(/(19|20)\d{2}/)
  return match ? match[0] : ''
}

const finalizeExperience = (current, collection) => {
  const description = current.description.replace(/\s+/g, ' ').trim()
  const normalized = {
    company: current.company,
    position: current.position,
    startDate: current.startDate,
    endDate: current.endDate,
    description,
    isCurrent: current.isCurrent || /present|current/i.test(current.endDate) || /present|current/i.test(current.position),
  }

  if (normalized.company || normalized.position || normalized.description) {
    collection.push(normalized)
  }
}