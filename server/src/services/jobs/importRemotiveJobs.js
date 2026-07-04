import { scrapeRemotiveJobs } from '../../scraping/Remotive.js'
import { ingestJob } from './ingestJob.js'

const MAX_IMPORT_JOBS = 50

export const importRemotiveJobs = async ({ limit = MAX_IMPORT_JOBS } = {}) => {
  try {
    const jobs = await scrapeRemotiveJobs({ limit: Math.max(1, Math.min(Number(limit) || MAX_IMPORT_JOBS, MAX_IMPORT_JOBS)) })

    let imported = 0
    let skipped = 0

    for (const job of jobs) {
      try {
        const result = await ingestJob(job, { persist: true, source: 'remotive' })

        if (result?.success && result?.created) {
          imported += 1
        } else {
          skipped += 1
        }
      } catch {
        skipped += 1
      }
    }

    return {
      success: true,
      imported,
      skipped,
    }
  } catch (error) {
    console.error('Remotive import failed:', error.message)

    return {
      success: true,
      imported: 0,
      skipped: 0,
    }
  }
}

export default importRemotiveJobs
