import Job from '../models/Job.js'

export const seedJobs = async () => {
  const jobCount = await Job.countDocuments()
  if (jobCount > 0) {
    console.log('Jobs already seeded')
    return
  }

  const dummyJobs = [
    {
      title: 'Senior Staff Engineer, Cloud Platform',
      company: 'QuantumScale Systems',
      location: 'Palo Alto, CA',
      locationType: 'Hybrid',
      description: 'Lead the architecture and development of next-generation cloud infrastructure systems.',
      requiredSkills: ['Distributed Systems', 'Go', 'Kubernetes', 'Cloud Architecture'],
      preferredSkills: ['Rust', 'Service Mesh', 'gRPC'],
      salary: { min: 220000, max: 310000 },
      experience: { min: 8, max: 15 },
      jobLevel: 'Senior',
      jobCategory: 'Engineering',
      companyDescription: 'A Series D unicorn focused on edge computing for AI applications.',
      isActive: true,
    },
    {
      title: 'Principal Engineer, Infrastructure',
      company: 'TechCore Solutions',
      location: 'San Francisco, CA',
      locationType: 'On-site',
      description: 'Define technical strategy for infrastructure modernization.',
      requiredSkills: ['Cloud Architecture', 'Kubernetes', 'DevOps', 'Python'],
      preferredSkills: ['Terraform', 'AWS', 'GCP'],
      salary: { min: 250000, max: 350000 },
      experience: { min: 10, max: 20 },
      jobLevel: 'Principal',
      jobCategory: 'Engineering',
      companyDescription: 'Leading cloud-native platform provider.',
      isActive: true,
    },
    {
      title: 'Staff Software Engineer',
      company: 'CloudInnovate Inc',
      location: 'Seattle, WA',
      locationType: 'Remote',
      description: 'Build high-performance microservices systems.',
      requiredSkills: ['Go', 'Microservices', 'AWS', 'SQL'],
      preferredSkills: ['Kafka', 'gRPC', 'GraphQL'],
      salary: { min: 200000, max: 280000 },
      experience: { min: 7, max: 12 },
      jobLevel: 'Senior',
      jobCategory: 'Engineering',
      companyDescription: 'Innovating cloud infrastructure for the next decade.',
      isActive: true,
    },
    {
      title: 'Engineering Manager',
      company: 'DataDriven Systems',
      location: 'New York, NY',
      locationType: 'Hybrid',
      description: 'Lead a high-performing engineering team.',
      requiredSkills: ['Leadership', 'Python', 'System Design', 'Agile'],
      preferredSkills: ['Mentoring', 'Technical Writing', 'Budgeting'],
      salary: { min: 180000, max: 250000 },
      experience: { min: 5, max: 10 },
      jobLevel: 'Management',
      jobCategory: 'Engineering',
      companyDescription: 'Enterprise data platform leader.',
      isActive: true,
    },
    {
      title: 'Full Stack Engineer',
      company: 'StartupXYZ',
      location: 'Austin, TX',
      locationType: 'Remote',
      description: 'Build full-stack features for our SaaS platform.',
      requiredSkills: ['React', 'Node.js', 'PostgreSQL', 'TypeScript'],
      preferredSkills: ['Next.js', 'GraphQL', 'Docker'],
      salary: { min: 130000, max: 170000 },
      experience: { min: 3, max: 7 },
      jobLevel: 'Mid-Level',
      jobCategory: 'Engineering',
      companyDescription: 'Fast-growing SaaS startup.',
      isActive: true,
    },
  ]

  try {
    await Job.insertMany(dummyJobs)
    console.log('✓ Jobs seeded successfully')
  } catch (err) {
    console.error('Failed to seed jobs:', err)
  }
}
