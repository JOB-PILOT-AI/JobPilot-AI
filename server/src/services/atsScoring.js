export { calculateATSScore } from './ats/calculateATSScore.js'

export const getATSFeedback = (score) => {
  if (score >= 80) {
    return 'Excellent! Your resume is well-optimized for ATS systems.'
  } else if (score >= 60) {
    return 'Good! Your resume is mostly optimized. Consider the suggestions above.'
  } else if (score >= 40) {
    return 'Fair. Implement the suggestions to improve ATS compatibility.'
  } else {
    return 'Your resume needs significant improvements for ATS optimization.'
  }
}
