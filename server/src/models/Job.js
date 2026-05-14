import mongoose from 'mongoose'

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    company: {
      type: String,
      required: true,
    },
    location: String,
    locationType: {
      type: String,
      enum: ['Remote', 'On-site', 'Hybrid'],
      default: 'Hybrid',
    },
    description: String,
    requiredSkills: [String],
    preferredSkills: [String],
    salary: {
      min: Number,
      max: Number,
      currency: { type: String, default: 'USD' },
    },
    experience: {
      min: Number,
      max: Number,
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

export default mongoose.model('Job', jobSchema)
