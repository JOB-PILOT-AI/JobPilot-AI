export const generateRecommendations = (failedRules = []) => {
  const recommendations = []
  const seen = new Set()

  for (const rule of failedRules) {
    const recommendation = typeof rule?.recommendation === 'string' ? rule.recommendation.trim() : ''
    if (!recommendation) continue

    const key = recommendation.toLowerCase()
    if (seen.has(key)) continue

    seen.add(key)
    recommendations.push(recommendation)
  }

  return recommendations
}
