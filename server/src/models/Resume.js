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
      location: String,
      title: String,
    },
    summary: String,
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

export default mongoose.model('Resume', resumeSchema)
