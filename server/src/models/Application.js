import mongoose from 'mongoose'

const applicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      required: true,
    },
    status: {
      type: String,
      enum: ['applied', 'reviewing', 'shortlisted', 'screening', 'interview', 'offer', 'rejected', 'accepted', 'withdrawn'],
      default: 'applied',
    },
    matchScore: {
      overall: Number,
      skillMatch: Number,
      experienceMatch: Number,
      educationMatch: Number,
      details: {
        matchedSkills: [String],
        missingSkills: [String],
        feedback: String,
      },
    },
    appliedAt: { type: Date, default: Date.now },
    statusUpdatedAt: Date,
    notes: String,
    nextAction: String,
    nextActionAt: Date,
  },
  { timestamps: true }
)

applicationSchema.index({ userId: 1, jobId: 1 })
applicationSchema.index({ userId: 1, appliedAt: -1 })

export default mongoose.model('Application', applicationSchema)
