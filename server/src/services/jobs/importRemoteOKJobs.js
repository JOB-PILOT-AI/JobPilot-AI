import { scrapeRemoteOKJobs } from '../../scraping/RemoteOK.js'
import { ingestJob } from './ingestJob.js'

const MAX_IMPORT_JOBS = 50

export const importRemoteOKJobs = async ({ limit = MAX_IMPORT_JOBS } = {}) => {
  try {
    const jobs = await scrapeRemoteOKJobs({ limit: Math.max(1, Math.min(Number(limit) || MAX_IMPORT_JOBS, MAX_IMPORT_JOBS)) })

    let imported = 0
    let skipped = 0
    let duplicates = 0

    for (const job of jobs) {
      try {
        const result = await ingestJob(job, { persist: true, source: 'remoteok' })

        if (result?.success && result?.created) {
          imported += 1
        } else if (result?.duplicate) {
          duplicates += 1
          skipped += 1
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
      counts: {
        fetched: jobs.stats?.fetched ?? jobs.length,
        normalized: jobs.stats?.normalized ?? jobs.length,
        accepted: jobs.stats?.accepted ?? jobs.length,
        rejected: jobs.stats?.rejected ?? 0,
        duplicates,
        inserted: imported,
      },
      rejectedReasons: jobs.stats?.rejectedReasons || {},
      failure: null,
    }
  } catch (error) {
    console.error('RemoteOK import failed:', error.message)

    return {
      success: true,
      imported: 0,
      skipped: 0,
      counts: {
        fetched: 0,
        normalized: 0,
        accepted: 0,
        rejected: 0,
        duplicates: 0,
        inserted: 0,
      },
      rejectedReasons: {},
      failure: error.message,
    }
  }
}

export default importRemoteOKJobs
