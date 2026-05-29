import mongoose from 'mongoose'

const jobSchema = new mongoose.Schema(
  {
    source: {
      type: String,
      required: true,
      default: 'manual',
    },
    sourceUrl: {
      type: String,
      default: '',
    },
    title: {
      type: String,
      required: true,
    },
    company: {
      type: String,
      required: true,
    },
    companyNormalized: {
      type: String,
      default: '',
      index: true,
    },
    location: String,
    locationNormalized: {
      type: String,
      default: '',
      index: true,
    },
    remoteType: {
      type: String,
      enum: ['Remote', 'On-site', 'Hybrid'],
      default: 'Hybrid',
    },
    locationType: {
      type: String,
      enum: ['Remote', 'On-site', 'Hybrid'],
      default: 'Hybrid',
    },
    employmentType: {
      type: String,
      enum: ['Full-time', 'Contract', 'Part-time', 'Internship'],
      default: 'Full-time',
    },
    category: String,
    responsibilities: [String],
    description: String,
    requiredSkills: [String],
    preferredSkills: [String],
    extractedSkills: {
      type: [String],
      default: [],
    },
    salary: {
      min: Number,
      max: Number,
      currency: { type: String, default: 'USD' },
    },
    salaryRange: {
      min: { type: Number, default: null },
      max: { type: Number, default: null },
      currency: { type: String, default: 'USD' },
    },
    experience: {
      min: Number,
      max: Number,
    },
    experienceLevel: {
      min: { type: Number, default: null },
      max: { type: Number, default: null },
    },
    jobLevel: String,
    jobCategory: String,
    companyDescription: String,
    applicants: [
      {
        userId: mongoose.Schema.Types.ObjectId,
        appliedAt: Date,
        status: {
          type: String,
          enum: ['applied', 'reviewing', 'shortlisted', 'rejected'],
          default: 'applied',
        },
      },
    ],
    postedAt: { type: Date, default: Date.now },
    closingDate: Date,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

jobSchema.index({ sourceUrl: 1 })
jobSchema.index({ companyNormalized: 1, locationNormalized: 1, title: 1 })

export default mongoose.model('Job', jobSchema)
