import { copyFileSync, existsSync, mkdirSync } from 'fs'
import { join, resolve } from 'path'

const distDir = resolve('dist')
const indexFile = join(distDir, 'index.html')

const routes = [
  'login',
  'forgot-password',
  'reset-password',
  'auth/google/callback',
  'auth/github/callback',
  'logout',
  'dashboard',
  'jobs',
  'skill-dna',
  'resume-builder',
  'career-autopilot',
  'career-studio',
  'auto-apply-kit',
  'portfolio-builder',
  'applications',
  'branding-toolkit',
  'interview-scheduling',
  'recruiter-access',
  'salary-guidance',
  'interview-prep',
  'mock-interview',
  'practice-test',
  'settings',
  'upgrade',
]

if (!existsSync(indexFile)) {
  throw new Error('dist/index.html was not found. Run this script after vite build.')
}

for (const route of routes) {
  const routeDir = join(distDir, route)
  mkdirSync(routeDir, { recursive: true })
  copyFileSync(indexFile, join(routeDir, 'index.html'))
}

console.log(`Created SPA fallbacks for ${routes.length} routes.`)
