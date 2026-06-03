import axios from 'axios'
import { buildFeedJobCandidate, analyzeRemoteOKJob } from '../src/scraping/RemoteOK.js'

const REMOTEOK_BASE_URL = 'https://remoteok.com'

const TARGET_TITLES = [
  'backend engineer',
  'frontend engineer',
  'full stack engineer',
  'full stack developer',
  'software engineer',
  'platform engineer',
  'devops engineer',
  'cloud engineer',
]

const normalize = (v = '') => (v || '').toLowerCase()

;(async () => {
  try {
    const resp = await axios.get(`${REMOTEOK_BASE_URL}/remote-jobs.json`, { timeout: 15000 })
    const items = Array.isArray(resp.data) ? resp.data : []

    const matches = items.filter((entry) => {
      const title = normalize(entry.position)
      return TARGET_TITLES.some((t) => title.includes(t))
    })

    if (!matches.length) {
      console.log('No feed entries matched target titles; showing similar titles (case-insensitive contains)')
    }

    const results = matches.map((entry) => {
      const job = buildFeedJobCandidate(entry)
      const analysis = analyzeRemoteOKJob({ title: job.title, company: job.company, tags: job.preferredSkills, description: job.description, sourceUrl: job.sourceUrl })
      return {
        title: job.title,
        company: job.company,
        sourceUrl: job.sourceUrl,
        reason: analysis.reason,
        accepted: analysis.accepted,
        technicalSignalCount: analysis.technicalSignalCount,
        tagSignals: analysis.tagSignals,
        technicalTitleMatched: analysis.technicalTitleMatched,
        ambiguousTitleMatched: analysis.ambiguousTitleMatched,
        engineeringAmbiguousMatched: analysis.engineeringAmbiguousMatched,
        tags: job.preferredSkills,
      }
    })

    console.log(JSON.stringify({ timestamp: new Date().toISOString(), total_feed: items.length, matches_count: matches.length, results }, null, 2))
  } catch (e) {
    console.error('AUDIT FAILED', e)
    process.exit(1)
  }
})()
