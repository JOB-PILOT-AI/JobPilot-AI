import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const jobSchema = new mongoose.Schema({
  title: String,
  company: String,
  location: String,
  jobType: String,
  description: String,
  requirements: [String],
  skills: [String],
  salary: {
    min: Number,
    max: Number,
    currency: String,
  },
  source: String,
  sourceUrl: String,
  postedDate: Date,
  scrapedDate: { type: Date, default: Date.now },
  expiryDate: Date,
  isActive: { type: Boolean, default: true },
});

const Job = mongoose.model('Job', jobSchema);

const sampleJobs = [
  {
    title: 'Senior React Developer',
    company: 'Tech Innovations Inc',
    location: 'San Francisco, CA',
    jobType: 'Full-time',
    description: 'We are looking for an experienced React developer to join our team. You will work on cutting-edge projects using the latest web technologies.',
    requirements: ['5+ years React experience', 'TypeScript knowledge', 'REST API integration', 'Git proficiency'],
    skills: ['React', 'JavaScript', 'TypeScript', 'CSS', 'REST APIs'],
    salary: { min: 120, max: 180, currency: 'USD' },
    source: 'indeed',
    postedDate: new Date(),
    isActive: true,
  },
  {
    title: 'Full Stack JavaScript Developer',
    company: 'Web Solutions Ltd',
    location: 'New York, NY',
    jobType: 'Full-time',
    description: 'Join our team as a Full Stack Developer. Build scalable applications using Node.js and React. Work with modern cloud infrastructure.',
    requirements: ['Node.js expertise', 'React/Vue.js', 'MongoDB/PostgreSQL', 'Docker knowledge'],
    skills: ['JavaScript', 'Node.js', 'React', 'MongoDB', 'Docker'],
    salary: { min: 100, max: 160, currency: 'USD' },
    source: 'linkedin',
    postedDate: new Date(),
    isActive: true,
  },
  {
    title: 'Python Backend Engineer',
    company: 'Data Systems Corp',
    location: 'Remote',
    jobType: 'Full-time',
    description: 'Build robust backend services with Python and Django. Work on microservices architecture and handle large-scale data processing.',
    requirements: ['3+ years Python', 'Django/FastAPI', 'PostgreSQL', 'AWS/GCP', 'REST APIs'],
    skills: ['Python', 'Django', 'PostgreSQL', 'AWS', 'Microservices'],
    salary: { min: 110, max: 170, currency: 'USD' },
    source: 'glassdoor',
    postedDate: new Date(),
    isActive: true,
  },
  {
    title: 'DevOps Engineer',
    company: 'Cloud Tech Solutions',
    location: 'Seattle, WA',
    jobType: 'Full-time',
    description: 'Manage and automate our cloud infrastructure. Work with Kubernetes, Docker, and CI/CD pipelines. Ensure system reliability and security.',
    requirements: ['Docker & Kubernetes', 'CI/CD pipelines', 'AWS/Azure/GCP', 'Terraform', 'Linux'],
    skills: ['Docker', 'Kubernetes', 'AWS', 'Terraform', 'Jenkins'],
    salary: { min: 130, max: 190, currency: 'USD' },
    source: 'indeed',
    postedDate: new Date(),
    isActive: true,
  },
  {
    title: 'Frontend Developer (Vue.js)',
    company: 'Creative Digital Agency',
    location: 'Los Angeles, CA',
    jobType: 'Full-time',
    description: 'Create stunning user interfaces with Vue.js. Collaborate with designers and backend developers. Build responsive and accessible web applications.',
    requirements: ['Vue.js 3+', 'HTML/CSS', 'JavaScript ES6+', 'Figma collaboration', 'Testing frameworks'],
    skills: ['Vue.js', 'CSS', 'JavaScript', 'Webpack', 'Testing'],
    salary: { min: 90, max: 140, currency: 'USD' },
    source: 'linkedin',
    postedDate: new Date(),
    isActive: true,
  },
  {
    title: 'Mobile App Developer (React Native)',
    company: 'App Builders Inc',
    location: 'Austin, TX',
    jobType: 'Full-time',
    description: 'Develop cross-platform mobile applications using React Native. Target iOS and Android platforms. Work with modern development tools.',
    requirements: ['React Native experience', 'JavaScript/TypeScript', 'Mobile app design patterns', 'Firebase', 'Git'],
    skills: ['React Native', 'JavaScript', 'iOS', 'Android', 'Firebase'],
    salary: { min: 105, max: 165, currency: 'USD' },
    source: 'glassdoor',
    postedDate: new Date(),
    isActive: true,
  },
  {
    title: 'UI/UX Designer',
    company: 'Design Studio Pro',
    location: 'Chicago, IL',
    jobType: 'Full-time',
    description: 'Design beautiful and intuitive user experiences. Create wireframes, prototypes, and design systems. Collaborate with product and engineering teams.',
    requirements: ['Figma/Adobe XD', 'UI/UX principles', 'Prototyping', 'User research', 'Design systems'],
    skills: ['Figma', 'Prototyping', 'User Research', 'Design Systems', 'CSS'],
    salary: { min: 80, max: 130, currency: 'USD' },
    source: 'indeed',
    postedDate: new Date(),
    isActive: true,
  },
  {
    title: 'Machine Learning Engineer',
    company: 'AI Innovations Labs',
    location: 'Boston, MA',
    jobType: 'Full-time',
    description: 'Develop machine learning models and deploy them to production. Work with TensorFlow, PyTorch, and cloud ML platforms.',
    requirements: ['Python & ML frameworks', 'TensorFlow/PyTorch', 'Data processing', 'Model deployment', 'SQL'],
    skills: ['Python', 'TensorFlow', 'PyTorch', 'SQL', 'Statistics'],
    salary: { min: 140, max: 210, currency: 'USD' },
    source: 'linkedin',
    postedDate: new Date(),
    isActive: true,
  },
  {
    title: 'QA Automation Engineer',
    company: 'Quality Assurance Pro',
    location: 'Denver, CO',
    jobType: 'Part-time',
    description: 'Write automated tests for web and mobile applications. Build robust test frameworks and CI/CD integration. Ensure product quality.',
    requirements: ['Selenium/Cypress', 'JavaScript/Python', 'Test frameworks', 'CI/CD', 'Git'],
    skills: ['Selenium', 'Cypress', 'JavaScript', 'Testing', 'CI/CD'],
    salary: { min: 70, max: 110, currency: 'USD' },
    source: 'glassdoor',
    postedDate: new Date(),
    isActive: true,
  },
  {
    title: 'Database Administrator',
    company: 'Enterprise Systems Corp',
    location: 'Houston, TX',
    jobType: 'Full-time',
    description: 'Manage and optimize large-scale databases. Ensure data security, backup, and disaster recovery. Monitor performance and capacity.',
    requirements: ['PostgreSQL/MySQL', 'Database optimization', 'Backup strategies', 'Linux', 'Performance tuning'],
    skills: ['PostgreSQL', 'MySQL', 'Linux', 'Performance Tuning', 'Backup'],
    salary: { min: 115, max: 175, currency: 'USD' },
    source: 'indeed',
    postedDate: new Date(),
    isActive: true,
  },
];

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Clear existing jobs
    await Job.deleteMany({});
    console.log('✓ Cleared existing jobs');

    // Insert sample jobs
    const inserted = await Job.insertMany(sampleJobs);
    console.log(`✓ Inserted ${inserted.length} sample jobs`);

    console.log('\n✅ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  }
}

seedDatabase();
