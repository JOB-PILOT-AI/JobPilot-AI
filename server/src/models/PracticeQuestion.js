import mongoose from 'mongoose'

const practiceQuestionSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['aptitude', 'logical', 'technical', 'verbal']
  },
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  answer: { type: Number, required: true }, // Index of the correct option
})

export default mongoose.model('PracticeQuestion', practiceQuestionSchema)