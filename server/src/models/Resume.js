import mongoose from 'mongoose'

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    personalInfo: {
      fullName: String,
      email: String,
      phone: String,
      linkedin: String,
      github: String,
      location: String,
      summary: String,
      title: String,
    },
    summary: String,
    experience: [
      {
        company: String,
        position: String,
        startDate: String,
        endDate: String,
        description: String,
        isCurrent: Boolean,
      },
    ],
    workExperience: [
      {
        company: String,
        position: String,
        startDate: String,
        endDate: String,
        description: String,
        isCurrent: Boolean,
      },
    ],
    education: [
      {
        school: String,
        degree: String,
        field: String,
        graduationYear: String,
      },
    ],
    skills: [String],
    certifications: [
      {
        name: String,
        issuer: String,
        date: String,
      },
    ],
    projects: [
      {
        name: String,
        description: String,
        technologies: [String],
        link: String,
      },
    ],
    atsScore: {
      score: { type: Number, default: 0 },
      feedback: [String],
      keywordMatches: [String],
      lastCalculated: Date,
    },
    atsAnalytics: {
      score: Number,
      passedRules: [
        {
          id: String,
          title: String,
          category: String,
          points: Number,
          recommendation: String,
          passed: Boolean,
          details: String,
        },
      ],
      failedRules: [
        {
          id: String,
          title: String,
          category: String,
          points: Number,
          recommendation: String,
          passed: Boolean,
          details: String,
        },
      ],
      strengths: [String],
      weaknesses: [String],
      recommendations: [String],
      categoryScores: mongoose.Schema.Types.Mixed,
      normalizedSkills: [String],
      topSkills: [String],
      missingAreas: [String],
      keywordMatches: [String],
      profileCompletion: Number,
      technicalCoverage: [String],
      healthLabel: String,
      analyzedAt: String,
      lastCalculated: Date,
    },
    extractedContent: {
      text: String,
      rawText: String,
    },
    fileUrl: String,
    fileName: String,
    fileType: String,
  },
  { timestamps: true }
)

resumeSchema.index({ userId: 1, updatedAt: -1 })

export default mongoose.model('Resume', resumeSchema)
