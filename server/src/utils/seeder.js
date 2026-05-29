import Job from '../models/Job.js'
import { ingestJob } from '../services/jobs/ingestJob.js'

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
      remoteType: 'Hybrid',
      locationType: 'Hybrid',
      employmentType: 'Full-time',
      category: 'Platform Engineering',
      description: 'Lead the architecture and development of cloud infrastructure systems with a focus on reliability, deployment velocity, and service scalability.',
      responsibilities: [
        'Lead architecture for distributed platform services',
        'Improve service reliability and deployment automation',
        'Partner with product and infrastructure teams on technical direction',
      ],
      requiredSkills: ['Distributed Systems', 'Go', 'Kubernetes', 'Cloud Architecture'],
      preferredSkills: ['Rust', 'Service Mesh', 'gRPC'],
      salary: { min: 220000, max: 310000 },
      salaryRange: { min: 220000, max: 310000 },
      experience: { min: 8, max: 15 },
      experienceLevel: { min: 8, max: 15 },
      jobLevel: 'Senior',
      jobCategory: 'Engineering',
      companyDescription: 'A Series D unicorn focused on edge computing for AI applications.',
      isActive: true,
    },
    {
      title: 'Principal Engineer, Infrastructure',
      company: 'TechCore Solutions',
      location: 'San Francisco, CA',
      remoteType: 'On-site',
      locationType: 'On-site',
      employmentType: 'Full-time',
      category: 'Infrastructure Engineering',
      description: 'Define technical strategy for infrastructure modernization, platform hardening, and internal tooling used by engineering teams.',
      responsibilities: [
        'Modernize infrastructure across cloud environments',
        'Improve platform tooling for internal engineering teams',
        'Partner on architecture reviews and migration plans',
      ],
      requiredSkills: ['Cloud Architecture', 'Kubernetes', 'DevOps', 'Python'],
      preferredSkills: ['Terraform', 'AWS', 'GCP'],
      salary: { min: 250000, max: 350000 },
      salaryRange: { min: 250000, max: 350000 },
      experience: { min: 10, max: 20 },
      experienceLevel: { min: 10, max: 20 },
      jobLevel: 'Principal',
      jobCategory: 'Engineering',
      companyDescription: 'Leading cloud-native platform provider.',
      isActive: true,
    },
    {
      title: 'Staff Software Engineer',
      company: 'CloudInnovate Inc',
      location: 'Seattle, WA',
      remoteType: 'Remote',
      locationType: 'Remote',
      employmentType: 'Full-time',
      category: 'Backend Engineering',
      description: 'Build high-performance microservices and API systems that support data-heavy product workflows.',
      responsibilities: [
        'Develop scalable backend services and APIs',
        'Improve platform observability and service performance',
        'Collaborate on API design and system boundaries',
      ],
      requiredSkills: ['Go', 'Microservices', 'AWS', 'SQL'],
      preferredSkills: ['Kafka', 'gRPC', 'GraphQL'],
      salary: { min: 200000, max: 280000 },
      salaryRange: { min: 200000, max: 280000 },
      experience: { min: 7, max: 12 },
      experienceLevel: { min: 7, max: 12 },
      jobLevel: 'Senior',
      jobCategory: 'Engineering',
      companyDescription: 'Innovating cloud infrastructure for the next decade.',
      isActive: true,
    },
    {
      title: 'Engineering Manager',
      company: 'DataDriven Systems',
      location: 'New York, NY',
      remoteType: 'Hybrid',
      locationType: 'Hybrid',
      employmentType: 'Full-time',
      category: 'Engineering Leadership',
      description: 'Lead a high-performing engineering team with responsibility for execution, delivery quality, and career growth.',
      responsibilities: [
        'Guide team execution and technical planning',
        'Coach engineers through feedback and development',
        'Partner with product on delivery tradeoffs and scope',
      ],
      requiredSkills: ['Leadership', 'Python', 'System Design', 'Agile'],
      preferredSkills: ['Mentoring', 'Technical Writing', 'Budgeting'],
      salary: { min: 180000, max: 250000 },
      salaryRange: { min: 180000, max: 250000 },
      experience: { min: 5, max: 10 },
      experienceLevel: { min: 5, max: 10 },
      jobLevel: 'Management',
      jobCategory: 'Engineering',
      companyDescription: 'Enterprise data platform leader.',
      isActive: true,
    },
    {
      title: 'Full Stack Engineer',
      company: 'StartupXYZ',
      location: 'Austin, TX',
      remoteType: 'Remote',
      locationType: 'Remote',
      employmentType: 'Full-time',
      category: 'Product Engineering',
      description: 'Build full-stack product features for a SaaS platform with a focus on speed, reliability, and maintainability.',
      responsibilities: [
        'Ship product features across the stack',
        'Work with design and product on polished user experiences',
        'Maintain backend services and data models',
      ],
      requiredSkills: ['React', 'Node.js', 'PostgreSQL', 'TypeScript'],
      preferredSkills: ['Next.js', 'GraphQL', 'Docker'],
      salary: { min: 130000, max: 170000 },
      salaryRange: { min: 130000, max: 170000 },
      experience: { min: 3, max: 7 },
      experienceLevel: { min: 3, max: 7 },
      jobLevel: 'Mid-Level',
      jobCategory: 'Engineering',
      companyDescription: 'Fast-growing SaaS startup.',
      isActive: true,
    },
  ]

  try {
    for (const job of dummyJobs) {
      await ingestJob({ ...job, source: 'seed' }, { persist: true, source: 'seed' })
    }
    console.log('✓ Jobs seeded successfully')
  } catch (err) {
    console.error('Failed to seed jobs:', err)
  }
}
