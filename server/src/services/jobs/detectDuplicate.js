import { getSimilarityScore, normalizeLocation, prepareDuplicateDetection, tokenizeTitle } from '../../utils/jobTransforms.js'

export const isDuplicateJob = (existingJob = {}, candidateJob = {}, options = {}) => {
  const threshold = typeof options.titleSimilarityThreshold === 'number' ? options.titleSimilarityThreshold : 0.8

  const existingDetection = prepareDuplicateDetection(existingJob)
  const candidateDetection = prepareDuplicateDetection(candidateJob)

  if (existingDetection.sourceUrl && candidateDetection.sourceUrl && existingDetection.sourceUrl === candidateDetection.sourceUrl) {
    return true
  }

  if (!existingDetection.companyNormalized || !candidateDetection.companyNormalized) {
    return false
  }

  if (existingDetection.companyNormalized !== candidateDetection.companyNormalized) {
    return false
  }

  const titleSimilarity = getSimilarityScore(
    existingDetection.titleTokens.length ? existingDetection.titleTokens : tokenizeTitle(existingJob.title),
    candidateDetection.titleTokens.length ? candidateDetection.titleTokens : tokenizeTitle(candidateJob.title)
  )

  if (titleSimilarity < threshold) {
    return false
  }

  const existingLocation = normalizeLocation(existingJob.location).locationNormalized
  const candidateLocation = normalizeLocation(candidateJob.location).locationNormalized

  if (!existingLocation || !candidateLocation) {
    return true
  }

  return existingLocation === candidateLocation
}

export const dedupeJobs = (jobs = []) => {
  const uniqueJobs = []

  for (const job of jobs) {
    if (uniqueJobs.some((existingJob) => isDuplicateJob(existingJob, job))) {
      continue
    }

    uniqueJobs.push(job)
  }

  return uniqueJobs
}

export const findDuplicateJob = (jobs = [], candidateJob = {}) => {
  return jobs.find((job) => isDuplicateJob(job, candidateJob)) || null
}