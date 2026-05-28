import { normalizeSkillText, normalizeSkills } from '../../utils/normalizeSkills.js'

const normalizeRange = (value) => {
  if (!value) return null

  const numbers = String(value)
    .split('-')
    .map((entry) => Number(entry))
    .filter((entry) => Number.isFinite(entry))

  if (numbers.length === 0) return null

  if (numbers.length === 1) {
    return { min: numbers[0], max: numbers[0] }
  }

  return { min: Math.min(numbers[0], numbers[1]), max: Math.max(numbers[0], numbers[1]) }
}

const getJobText = (job) => {
  const values = [
    job.title,
    job.company,
    job.location,
    job.remoteType,
    job.locationType,
    job.description,
    job.category,
    job.jobCategory,
    job.employmentType,
    ...(Array.isArray(job.requiredSkills) ? job.requiredSkills : []),
    ...(Array.isArray(job.preferredSkills) ? job.preferredSkills : []),
    ...(Array.isArray(job.responsibilities) ? job.responsibilities : []),
  ]

  return values.filter(Boolean).join(' ').toLowerCase()
}

const matchesSkillKeywords = (job, searchSkills) => {
  if (searchSkills.length === 0) return true

  const jobSkills = normalizeSkills([
    ...(Array.isArray(job.requiredSkills) ? job.requiredSkills : []),
    ...(Array.isArray(job.preferredSkills) ? job.preferredSkills : []),
  ]).map((skill) => skill.toLowerCase())

  return searchSkills.every((skill) => jobSkills.includes(skill.toLowerCase()))
}

const matchesSalary = (job, salaryRange) => {
  if (!salaryRange) return true

  const jobMin = Number(job.salary?.min || job.salaryRange?.min || 0)
  const jobMax = Number(job.salary?.max || job.salaryRange?.max || 0)

  if (salaryRange.min && jobMax < salaryRange.min) return false
  if (salaryRange.max && jobMin > salaryRange.max) return false

  return true
}

const matchesExperience = (job, experienceRange) => {
  if (!experienceRange) return true

  const jobMin = Number(job.experience?.min || job.experienceLevel?.min || 0)
  const jobMax = Number(job.experience?.max || job.experienceLevel?.max || jobMin)

  if (experienceRange.min && jobMax < experienceRange.min) return false
  if (experienceRange.max && jobMin > experienceRange.max) return false

  return true
}

const matchesRemoteType = (job, remoteType) => {
  if (!remoteType) return true

  const jobRemote = normalizeSkillText(job.remoteType || job.locationType || '').replace(/[^a-z\s]/g, '')
  return jobRemote.includes(normalizeSkillText(remoteType))
}

const matchesCategory = (job, category) => {
  if (!category) return true

  const jobCategory = normalizeSkillText(job.category || job.jobCategory || '')
  return jobCategory.includes(normalizeSkillText(category))
}

const matchesSearch = (job, search) => {
  if (!search) return true

  const normalizedSearch = normalizeSkillText(search)
  if (!normalizedSearch) return true

  const jobText = getJobText(job)
  return jobText.includes(normalizedSearch)
}

const matchesLocation = (job, location) => {
  if (!location) return true

  const jobLocation = normalizeSkillText(job.location || '')
  return jobLocation.includes(normalizeSkillText(location))
}

export const normalizeJobFilters = (query = {}) => ({
  search: typeof query.search === 'string' ? query.search.trim() : '',
  location: typeof query.location === 'string' ? query.location.trim() : '',
  remoteType: typeof query.remoteType === 'string' ? query.remoteType.trim() : '',
  category: typeof query.category === 'string' ? query.category.trim() : '',
  employmentType: typeof query.employmentType === 'string' ? query.employmentType.trim() : '',
  skills: normalizeSkills(
    typeof query.skills === 'string'
      ? query.skills.split(',')
      : Array.isArray(query.skills)
        ? query.skills
        : []
  ),
  salaryRange: normalizeRange(query.salaryRange || query.salary),
  experienceRange: normalizeRange(query.experienceRange || query.experience),
  skillMatchThreshold: Number(query.skillMatchThreshold || 0) || 0,
})

export const applyJobFilters = (jobs = [], filters = {}, matchMap = new Map()) => {
  const normalizedFilters = normalizeJobFilters(filters)

  return jobs.filter((job) => {
    const matchData = matchMap.get(String(job._id)) || null

    if (!matchesSearch(job, normalizedFilters.search)) return false
    if (!matchesLocation(job, normalizedFilters.location)) return false
    if (!matchesRemoteType(job, normalizedFilters.remoteType)) return false
    if (!matchesCategory(job, normalizedFilters.category)) return false
    if (normalizedFilters.employmentType && !normalizeSkillText(job.employmentType || '').includes(normalizeSkillText(normalizedFilters.employmentType))) return false
    if (!matchesSkills(job, normalizedFilters.skills)) return false
    if (!matchesSalary(job, normalizedFilters.salaryRange)) return false
    if (!matchesExperience(job, normalizedFilters.experienceRange)) return false
    if (normalizedFilters.skillMatchThreshold > 0) {
      const matchPercentage = Number(matchData?.matchPercentage || matchData?.overall || job.matchScore?.matchPercentage || job.matchScore?.overall || 0)
      if (matchPercentage < normalizedFilters.skillMatchThreshold) return false
    }

    return true
  })
}

const matchesSkills = (job, skills) => {
  if (skills.length === 0) return true

  const jobSkills = normalizeSkills([
    ...(Array.isArray(job.requiredSkills) ? job.requiredSkills : []),
    ...(Array.isArray(job.preferredSkills) ? job.preferredSkills : []),
  ]).map((skill) => skill.toLowerCase())

  return skills.every((skill) => jobSkills.includes(skill.toLowerCase()))
}
