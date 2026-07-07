export const createEmptyPersonalInfo = () => ({
  fullName: '',
  email: '',
  phone: '',
  linkedin: '',
  github: '',
  location: '',
  summary: '',
})

export const createEmptyEducationItem = () => ({
  school: '',
  degree: '',
  field: '',
  graduationYear: '',
})

export const createEmptyExperienceItem = () => ({
  company: '',
  position: '',
  startDate: '',
  endDate: '',
  description: '',
  isCurrent: false,
})

export const createEmptyProjectItem = () => ({
  name: '',
  description: '',
  technologies: [],
  link: '',
})

export const createEmptyCertificationItem = () => ({
  name: '',
  issuer: '',
  date: '',
})

export const createEmptyResumeData = () => ({
  personalInfo: createEmptyPersonalInfo(),
  skills: [],
  education: [createEmptyEducationItem()],
  experience: [createEmptyExperienceItem()],
  projects: [createEmptyProjectItem()],
  certifications: [],
})

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '')

const normalizeStringArray = (value) => {
  if (!Array.isArray(value)) return []

  const seen = new Set()
  const items = []

  for (const entry of value) {
    const normalized = normalizeText(entry)
    if (!normalized) continue

    const key = normalized.toLowerCase()
    if (seen.has(key)) continue

    seen.add(key)
    items.push(normalized)
  }

  return items
}

const normalizeEducationItem = (item = {}) => ({
  school: normalizeText(item.school),
  degree: normalizeText(item.degree),
  field: normalizeText(item.field),
  graduationYear: normalizeText(item.graduationYear),
})

const normalizeExperienceItem = (item = {}) => ({
  company: normalizeText(item.company),
  position: normalizeText(item.position),
  startDate: normalizeText(item.startDate),
  endDate: normalizeText(item.endDate),
  description: normalizeText(item.description),
  isCurrent: Boolean(item.isCurrent),
})

const normalizeProjectItem = (item = {}) => ({
  name: normalizeText(item.name || item.title),
  description: normalizeText(item.description),
  technologies: normalizeStringArray(
    Array.isArray(item.technologies)
      ? item.technologies
      : typeof item.technologies === 'string'
        ? item.technologies.split(',')
        : []
  ),
  link: normalizeText(item.link),
})

const normalizeCertificationItem = (item = {}) => ({
  name: normalizeText(item.name),
  issuer: normalizeText(item.issuer),
  date: normalizeText(item.date),
})

export const normalizeResumeData = (source = {}) => {
  const resumeSource = source.resumeData || source
  const personalInfoSource = resumeSource.personalInfo || source.personalInfo || {}
  const experienceSource = resumeSource.experience || source.experience || source.workExperience || []

  return {
    personalInfo: {
      ...createEmptyPersonalInfo(),
      fullName: normalizeText(personalInfoSource.fullName || source.fullName),
      email: normalizeText(personalInfoSource.email || source.email),
      phone: normalizeText(personalInfoSource.phone || source.phone),
      linkedin: normalizeText(personalInfoSource.linkedin || source.linkedin),
      github: normalizeText(personalInfoSource.github || source.github),
      location: normalizeText(personalInfoSource.location || source.location),
      summary: normalizeText(personalInfoSource.summary || source.summary),
    },
    skills: normalizeStringArray(resumeSource.skills || source.skills),
    education: Array.isArray(resumeSource.education || source.education)
      ? (resumeSource.education || source.education).map(normalizeEducationItem)
      : [],
    experience: Array.isArray(experienceSource) ? experienceSource.map(normalizeExperienceItem) : [],
    projects: Array.isArray(resumeSource.projects || source.projects)
      ? (resumeSource.projects || source.projects).map(normalizeProjectItem)
      : [],
    certifications: Array.isArray(resumeSource.certifications || source.certifications)
      ? (resumeSource.certifications || source.certifications).map(normalizeCertificationItem)
      : [],
  }
}

export const toLegacyResumePayload = (resumeData) => ({
  personalInfo: resumeData.personalInfo,
  summary: resumeData.personalInfo.summary,
  workExperience: resumeData.experience,
  experience: resumeData.experience,
  education: resumeData.education,
  skills: resumeData.skills,
  projects: resumeData.projects,
  certifications: resumeData.certifications,
})
