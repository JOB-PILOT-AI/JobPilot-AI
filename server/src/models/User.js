import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    authProvider: {
      type: String,
      enum: ['email', 'google', 'github'],
      default: 'email',
    },
    providerId: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    location: String,
    currentRole: String,
    yearsExperience: Number,
    skills: [String],
    resumeId: mongoose.Schema.Types.ObjectId,
    isPro: {
      type: Boolean,
      default: false,
    },
    subscription: {
      provider: { type: String, enum: ['razorpay'], default: undefined },
      subscriptionId: String,
      planId: String,
      status: { type: String, default: 'inactive' },
      currentStart: Date,
      currentEnd: Date,
      lastPaymentId: String,
      activatedAt: Date,
      cancelledAt: Date,
    },
    atsScore: {
      type: Number,
      default: 0,
    },
    jobMatches: [
      {
        jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
        matchScore: Number,
        savedAt: Date,
        notes: String,
        nextAction: String,
        nextActionAt: Date,
      },
    ],
    notificationPreferences: {
      emailNotifications: { type: Boolean, default: true },
      jobAlerts: { type: Boolean, default: true },
      applicationUpdates: { type: Boolean, default: true },
    },
    privacyPreferences: {
      allowCaddieContext: { type: Boolean, default: true },
      allowResumeAnalysis: { type: Boolean, default: true },
      allowJobPersonalization: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
)

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()

  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (err) {
    next(err)
  }
})

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

export default mongoose.model('User', userSchema)
