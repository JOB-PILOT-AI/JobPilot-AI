import mongoose from 'mongoose'

const careerAssetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['tailored-resume', 'cover-letter', 'networking-message', 'screening-answers', 'interview-feedback'],
      required: true,
    },
    title: { type: String, required: true },
    content: { type: String, required: true },
    metadata: {
      company: String,
      role: String,
      jobDescription: String,
      tone: String,
    },
  },
  { timestamps: true }
)

export default mongoose.model('CareerAsset', careerAssetSchema)
