import { scrapeRemoteOKJobs } from '../src/scraping/RemoteOK.js'

;(async () => {
  try {
    const candidates = await scrapeRemoteOKJobs({ limit: 50 })

    const sample = candidates.slice(0, 10).map((j) => ({
      title: j.title || null,
      company: j.company || null,
      sourceUrl: j.sourceUrl || null,
      tags: j.preferredSkills || [],
    }))

    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      candidates_count: candidates.length,
      sample,
    }, null, 2))
  } catch (error) {
    console.error('SCRAPE FAILED:', error)
    process.exit(1)
  }
})()
