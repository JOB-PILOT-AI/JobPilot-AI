import { z } from 'zod'

const numberOrNull = z.number().finite().nullable()

const salaryRangeSchema = z.object({
  min: numberOrNull,
  max: numberOrNull,
  currency: z.string().trim().min(1),
})

const experienceRangeSchema = z.object({
  min: numberOrNull,
  max: numberOrNull,
})

const canonicalJobSchema = z.object({
  id: z.string().optional().default(''),
  title: z.string().trim().min(1, 'title is required'),
  company: z.string().trim().min(1, 'company is required'),
  companyNormalized: z.string().trim().min(1),
  location: z.string().trim().default(''),
  locationNormalized: z.string().trim().default(''),
  remoteType: z.string().trim().min(1),
  employmentType: z.string().trim().min(1),
  experienceLevel: experienceRangeSchema,
  salaryRange: salaryRangeSchema,
  description: z.string().trim().default(''),
  responsibilities: z.array(z.string().trim().min(1)).default([]),
  requiredSkills: z.array(z.string().trim().min(1)).default([]),
  preferredSkills: z.array(z.string().trim().min(1)).default([]),
  extractedSkills: z.array(z.string().trim().min(1)).default([]),
  category: z.string().trim().default(''),
  source: z.string().trim().min(1, 'source is required'),
  sourceUrl: z.union([z.string().trim().url(), z.literal('')]).default(''),
  sourceJobId: z.string().trim().default(''),
  originalApplyUrl: z.union([z.string().trim().url(), z.null()]).default(null),
  sourceJobUrl: z.union([z.string().trim().url(), z.null()]).default(null),
  companyWebsite: z.union([z.string().trim().url(), z.null()]).default(null),
  postedAt: z.coerce.date(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export const validateJob = (job) => {
  const result = canonicalJobSchema.safeParse(job)

  if (result.success) {
    return {
      valid: true,
      errors: [],
      data: result.data,
    }
  }

  return {
    valid: false,
    errors: result.error.issues.map((issue) => ({
      field: issue.path.join('.') || 'job',
      message: issue.message,
    })),
    data: null,
  }
}

export { canonicalJobSchema }
