import { normalizeSkillList, toCanonicalJob } from '../../utils/jobTransforms.js'

export const normalizeJob = (rawJob = {}) => {
  const canonicalJob = toCanonicalJob(rawJob)

  return {
    ...canonicalJob,
    requiredSkills: normalizeSkillList(canonicalJob.requiredSkills),
    preferredSkills: normalizeSkillList(canonicalJob.preferredSkills),
    extractedSkills: normalizeSkillList(canonicalJob.extractedSkills),
    responsibilities: Array.isArray(canonicalJob.responsibilities) ? canonicalJob.responsibilities : [],
  }
}