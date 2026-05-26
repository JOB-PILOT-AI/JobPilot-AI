import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'

const SKILL_DICTIONARY = [
  { canonical: 'JavaScript', aliases: ['javascript', 'java script', 'js'] },
  { canonical: 'TypeScript', aliases: ['typescript', 'type script', 'ts'] },
  { canonical: 'React', aliases: ['react', 'reactjs', 'react js'] },
  { canonical: 'Next.js', aliases: ['next js', 'nextjs', 'next.js'] },
  { canonical: 'Vue.js', aliases: ['vue', 'vuejs', 'vue js', 'vue.js'] },
  { canonical: 'Angular', aliases: ['angular'] },
  { canonical: 'Svelte', aliases: ['svelte'] },
  { canonical: 'Tailwind CSS', aliases: ['tailwind css', 'tailwindcss', 'tailwind'] },
  { canonical: 'Redux', aliases: ['redux', 'redux toolkit'] },
  { canonical: 'HTML', aliases: ['html5', 'html'] },
  { canonical: 'CSS', aliases: ['css3', 'css'] },
  { canonical: 'Vite', aliases: ['vite'] },
  { canonical: 'Webpack', aliases: ['webpack'] },
  { canonical: 'Babel', aliases: ['babel'] },
  { canonical: 'Material UI', aliases: ['material ui', 'mui'] },
  { canonical: 'Chakra UI', aliases: ['chakra ui'] },
  { canonical: 'Bootstrap', aliases: ['bootstrap'] },
  { canonical: 'Sass', aliases: ['sass'] },
  { canonical: 'Less', aliases: ['less'] },
  { canonical: 'Framer Motion', aliases: ['framer motion'] },
  { canonical: 'Node.js', aliases: ['node js', 'nodejs', 'node.js'] },
  { canonical: 'Express.js', aliases: ['express js', 'expressjs', 'express.js'] },
  { canonical: 'NestJS', aliases: ['nestjs', 'nest js'] },
  { canonical: 'Django', aliases: ['django'] },
  { canonical: 'Flask', aliases: ['flask'] },
  { canonical: 'FastAPI', aliases: ['fastapi', 'fast api'] },
  { canonical: 'Spring Boot', aliases: ['spring boot'] },
  { canonical: 'ASP.NET', aliases: ['asp net', 'asp.net', '.net'] },
  { canonical: 'PHP', aliases: ['php'] },
  { canonical: 'Laravel', aliases: ['laravel'] },
  { canonical: 'Ruby on Rails', aliases: ['ruby on rails', 'rails'] },
  { canonical: 'GraphQL', aliases: ['graphql'] },
  { canonical: 'REST API', aliases: ['rest api', 'rest apis', 'restful api', 'restful apis'] },
  { canonical: 'Apollo', aliases: ['apollo', 'apollo client'] },
  { canonical: 'tRPC', aliases: ['trpc'] },
  { canonical: 'Prisma', aliases: ['prisma'] },
  { canonical: 'Mongoose', aliases: ['mongoose'] },
  { canonical: 'Sequelize', aliases: ['sequelize'] },
  { canonical: 'TypeORM', aliases: ['typeorm'] },
  { canonical: 'Drizzle', aliases: ['drizzle', 'drizzle orm'] },
  { canonical: 'Koa', aliases: ['koa'] },
  { canonical: 'Hapi', aliases: ['hapi'] },
  { canonical: 'Socket.IO', aliases: ['socket io', 'socketio'] },
  { canonical: 'gRPC', aliases: ['grpc'] },
  { canonical: 'MongoDB', aliases: ['mongodb', 'mongo'] },
  { canonical: 'PostgreSQL', aliases: ['postgresql', 'postgres sql', 'postgres'] },
  { canonical: 'MySQL', aliases: ['mysql'] },
  { canonical: 'Redis', aliases: ['redis'] },
  { canonical: 'Firebase', aliases: ['firebase'] },
  { canonical: 'SQLite', aliases: ['sqlite'] },
  { canonical: 'Oracle', aliases: ['oracle'] },
  { canonical: 'Cassandra', aliases: ['cassandra'] },
  { canonical: 'Elasticsearch', aliases: ['elasticsearch', 'elastic search'] },
  { canonical: 'Docker', aliases: ['docker'] },
  { canonical: 'Kubernetes', aliases: ['kubernetes', 'k8s'] },
  { canonical: 'AWS', aliases: ['aws', 'amazon web services'] },
  { canonical: 'Azure', aliases: ['azure', 'microsoft azure'] },
  { canonical: 'Google Cloud Platform', aliases: ['google cloud platform', 'gcp', 'google cloud'] },
  { canonical: 'CI/CD', aliases: ['ci cd', 'ci/cd', 'cicd'] },
  { canonical: 'GitHub Actions', aliases: ['github actions'] },
  { canonical: 'Nginx', aliases: ['nginx'] },
  { canonical: 'Terraform', aliases: ['terraform'] },
  { canonical: 'Ansible', aliases: ['ansible'] },
  { canonical: 'Jenkins', aliases: ['jenkins'] },
  { canonical: 'Linux', aliases: ['linux'] },
  { canonical: 'Git', aliases: ['git'] },
  { canonical: 'GitHub', aliases: ['github'] },
  { canonical: 'GitLab', aliases: ['gitlab'] },
  { canonical: 'Vercel', aliases: ['vercel'] },
  { canonical: 'Netlify', aliases: ['netlify'] },
  { canonical: 'Render', aliases: ['render'] },
  { canonical: 'Railway', aliases: ['railway'] },
  { canonical: 'Heroku', aliases: ['heroku'] },
  { canonical: 'Cloudflare', aliases: ['cloudflare'] },
  { canonical: 'Python', aliases: ['python'] },
  { canonical: 'Java', aliases: ['java'] },
  { canonical: 'C++', aliases: ['c++'] },
  { canonical: 'C', aliases: ['c'] },
  { canonical: 'Go', aliases: ['go', 'golang'] },
  { canonical: 'Rust', aliases: ['rust'] },
  { canonical: 'Ruby', aliases: ['ruby'] },
  { canonical: 'C#', aliases: ['c#', 'c sharp'] },
  { canonical: 'SQL', aliases: ['sql'] },
  { canonical: 'Bash', aliases: ['bash', 'shell'] },
  { canonical: 'PowerShell', aliases: ['powershell'] },
  { canonical: 'Scala', aliases: ['scala'] },
  { canonical: 'Swift', aliases: ['swift'] },
  { canonical: 'Kotlin', aliases: ['kotlin'] },
  { canonical: 'Dart', aliases: ['dart'] },
  { canonical: 'Objective-C', aliases: ['objective c', 'objective-c'] },
  { canonical: 'TensorFlow', aliases: ['tensorflow'] },
  { canonical: 'PyTorch', aliases: ['pytorch'] },
  { canonical: 'OpenCV', aliases: ['opencv'] },
  { canonical: 'Pandas', aliases: ['pandas'] },
  { canonical: 'NumPy', aliases: ['numpy'] },
  { canonical: 'Scikit-learn', aliases: ['scikit learn', 'scikit-learn', 'sklearn'] },
  { canonical: 'Matplotlib', aliases: ['matplotlib'] },
  { canonical: 'Seaborn', aliases: ['seaborn'] },
  { canonical: 'Jupyter', aliases: ['jupyter', 'jupyter notebook'] },
  { canonical: 'Apache Spark', aliases: ['apache spark', 'spark'] },
  { canonical: 'Hadoop', aliases: ['hadoop'] },
  { canonical: 'XGBoost', aliases: ['xgboost'] },
  { canonical: 'Keras', aliases: ['keras'] },
  { canonical: 'NLTK', aliases: ['nltk'] },
  { canonical: 'LangChain', aliases: ['langchain'] },
  { canonical: 'Hugging Face', aliases: ['hugging face'] },
  { canonical: 'MLflow', aliases: ['mlflow'] },
  { canonical: 'Airflow', aliases: ['airflow'] },
  { canonical: 'Pydantic', aliases: ['pydantic'] },
  { canonical: 'Postman', aliases: ['postman'] },
  { canonical: 'Insomnia', aliases: ['insomnia'] },
  { canonical: 'Jest', aliases: ['jest'] },
  { canonical: 'Vitest', aliases: ['vitest'] },
  { canonical: 'Cypress', aliases: ['cypress'] },
  { canonical: 'Playwright', aliases: ['playwright'] },
  { canonical: 'Selenium', aliases: ['selenium'] },
  { canonical: 'Mocha', aliases: ['mocha'] },
  { canonical: 'Chai', aliases: ['chai'] },
  { canonical: 'Testing Library', aliases: ['testing library', 'react testing library'] },
  { canonical: 'React Native', aliases: ['react native'] },
  { canonical: 'Flutter', aliases: ['flutter'] },
  { canonical: 'Android', aliases: ['android'] },
  { canonical: 'iOS', aliases: ['ios'] },
  { canonical: 'Figma', aliases: ['figma'] },
  { canonical: 'Jira', aliases: ['jira'] },
  { canonical: 'Confluence', aliases: ['confluence'] },
  { canonical: 'Scrum', aliases: ['scrum'] },
  { canonical: 'Agile', aliases: ['agile'] },
  { canonical: 'Microservices', aliases: ['microservices'] },
  { canonical: 'Serverless', aliases: ['serverless'] },
  { canonical: 'System Design', aliases: ['system design'] },
  { canonical: 'Data Structures', aliases: ['data structures'] },
  { canonical: 'Algorithms', aliases: ['algorithms'] },
]

const SKILL_SECTION_HEADINGS = ['skills', 'technical skills', 'tech stack', 'technologies', 'core competencies']

const SECTION_HEADINGS = [
  'summary',
  'professional summary',
  'profile',
  'about me',
  'objective',
  'experience',
  'work experience',
  'employment history',
  'work history',
  'education',
  'academics',
  'skills',
  'technical skills',
  'tech stack',
  'technologies',
  'projects',
  'selected projects',
  'certifications',
  'certificates',
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
]

const PROFILE_LABELS = {
  linkedin: ['linkedin', 'linked in'],
  github: ['github', 'git hub'],
}

const SKILL_INDEX = SKILL_DICTIONARY.map((entry) => ({
  canonical: entry.canonical,
  aliases: entry.aliases.map((alias) => normalizeSkillTokens(alias)).filter((tokens) => tokens.length > 0),
}))

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
    linkedin: extractLinkedin(cleanedText, lines),
    github: extractGithub(cleanedText, lines),
    location: '',
    summary: '',
  }

  const resumeData = {
    personalInfo,
    skills: extractSkills(cleanedText, lines),
    education: extractEducation(lines),
    experience: [],
    projects: [],
    certifications: [],
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
  const sectionBlock = extractSectionBlock(lines, SKILL_SECTION_HEADINGS)
  const sourceText = sectionBlock.length > 0 ? sectionBlock.join(' ') : text
  return extractSkillsFromText(sourceText)
}

const extractSkillsFromText = (text) => {
  const tokens = normalizeSkillTokens(text)
  const foundSkills = []
  const seen = new Set()

  for (const entry of SKILL_INDEX) {
    const matched = entry.aliases.some((aliasTokens) => matchesTokenSequence(tokens, aliasTokens))
    if (matched && !seen.has(entry.canonical)) {
      seen.add(entry.canonical)
      foundSkills.push(entry.canonical)
    }
  }

  return foundSkills
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

const extractExperience = () => []

const extractProjects = () => []

const extractCertifications = () => []

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