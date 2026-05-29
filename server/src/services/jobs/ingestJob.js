import Job from '../../models/Job.js'
import { buildSuccessResponse, buildValidationErrorResponse } from '../../utils/apiResponses.js'
import { toCanonicalJob } from '../../utils/jobTransforms.js'
import { findDuplicateJob } from './detectDuplicate.js'
import { normalizeJob } from './normalizeJob.js'
import { validateJob } from './validateJob.js'

const buildDuplicateQuery = (job) => {
  const query = []

  if (job.sourceUrl) {
    query.push({ sourceUrl: job.sourceUrl })
  }

  if (job.companyNormalized) {
    query.push({ companyNormalized: job.companyNormalized, locationNormalized: job.locationNormalized || '' })
    query.push({ companyNormalized: job.companyNormalized, title: job.title })
  }

  return query.length > 0 ? { $or: query } : {}
}

export const ingestJob = async (rawJob = {}, options = {}) => {
  const normalizedJob = normalizeJob({
    ...rawJob,
    source: rawJob.source || options.source || 'manual',
  })

  const validation = validateJob(normalizedJob)
  if (!validation.valid) {
    return buildValidationErrorResponse(validation.errors)
  }

  if (options.persist === false) {
    return buildSuccessResponse(validation.data, { duplicate: false })
  }

  const duplicateCandidates = await Job.find(buildDuplicateQuery(validation.data)).sort({ updatedAt: -1, createdAt: -1 })
  const duplicateJob = findDuplicateJob(duplicateCandidates, validation.data)

  if (duplicateJob) {
    return buildSuccessResponse(
      toCanonicalJob(typeof duplicateJob.toObject === 'function' ? duplicateJob.toObject() : duplicateJob),
      { duplicate: true, created: false }
    )
  }

  const job = new Job(validation.data)
  await job.save()

  return buildSuccessResponse(toCanonicalJob(job.toObject()), { duplicate: false, created: true })
}

export { buildDuplicateQuery }