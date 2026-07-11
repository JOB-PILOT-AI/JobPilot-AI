import Job from '../models/Job.js'

const sampleJobs = [
  {
    source: 'manual',
    title: 'Senior React Developer',
    company: 'Tech Innovations Inc',
    location: 'San Francisco, CA',
    employmentType: 'Full-time',
    description:
      'Build modern web experiences with React, TypeScript, and scalable APIs.',
    requiredSkills: ['React', 'TypeScript', 'REST APIs', 'CSS'],
    preferredSkills: ['Node.js', 'Testing'],
    salary: { min: 120000, max: 180000, currency: 'USD' },
    isActive: true,
  },
  {
    source: 'manual',
    title: 'Full Stack JavaScript Developer',
    company: 'Web Solutions Ltd',
    location: 'New York, NY',
    employmentType: 'Full-time',
    description:
      'Join a fast-moving team building customer-facing products end to end.',
    requiredSkills: ['JavaScript', 'Node.js', 'React', 'MongoDB'],
    preferredSkills: ['Docker', 'AWS'],
    salary: { min: 100000, max: 160000, currency: 'USD' },
    isActive: true,
  },
  {
    source: 'manual',
    title: 'Python Backend Engineer',
    company: 'Data Systems Corp',
    location: 'Remote',
    employmentType: 'Full-time',
    description:
      'Design backend services and data pipelines for large-scale applications.',
    requiredSkills: ['Python', 'Django', 'PostgreSQL', 'REST APIs'],
    preferredSkills: ['FastAPI', 'AWS'],
    salary: { min: 110000, max: 170000, currency: 'USD' },
    isActive: true,
  },
]

export async function seedJobs() {
  const existingCount = await Job.countDocuments()
  if (existingCount > 0) {
    return existingCount
  }

  const inserted = await Job.insertMany(sampleJobs)
  return inserted.length
}
