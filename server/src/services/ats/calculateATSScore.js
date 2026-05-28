import { atsRules, buildATSContext } from './atsRules.js'
import { generateRecommendations } from './generateRecommendations.js'

const formatRuleResult = (rule, passed, details = '') => ({
  id: rule.id,
  title: rule.title,
  category: rule.category,
  points: rule.points,
  recommendation: rule.recommendation,
  passed,
  details,
})

const getStrengths = (passedRules) => passedRules.map((rule) => rule.title)
const getWeaknesses = (failedRules) => failedRules.map((rule) => rule.title)

const getHealthLabel = (score) => {
  if (score >= 90) return 'Excellent'
  if (score >= 75) return 'Strong'
  if (score >= 60) return 'Developing'
  if (score >= 40) return 'Needs improvement'
  return 'Weak'
}

const getCategoryScores = (evaluations) => {
  const categoryTotals = new Map()

  for (const evaluation of evaluations) {
    const current = categoryTotals.get(evaluation.category) || { earned: 0, total: 0 }
    current.total += evaluation.points
    if (evaluation.passed) {
      current.earned += evaluation.points
    }
    categoryTotals.set(evaluation.category, current)
  }

  return Array.from(categoryTotals.entries()).reduce((result, [category, value]) => {
    result[category] = {
      earned: value.earned,
      total: value.total,
      score: value.total > 0 ? Math.round((value.earned / value.total) * 100) : 0,
    }
    return result
  }, {})
}

const getTopSkills = (skills = []) => skills.slice(0, 8)

const getMissingAreas = (failedRules = []) => {
  const priorities = []
  const seen = new Set()

  for (const rule of failedRules) {
    const label = rule.category
    if (!label || seen.has(label)) continue
    seen.add(label)
    priorities.push(label)
  }

  return priorities
}

export const calculateATSScore = (resume = {}) => {
  const context = buildATSContext(resume)
  const evaluations = atsRules.map((rule) => {
    const outcome = rule.validate(context)
    const passed = typeof outcome === 'object' ? Boolean(outcome?.passed) : Boolean(outcome)
    const details = typeof outcome === 'object' && typeof outcome.details === 'string' ? outcome.details : ''

    return formatRuleResult(rule, passed, details)
  })

  const passedRules = evaluations.filter((rule) => rule.passed)
  const failedRules = evaluations.filter((rule) => !rule.passed)
  const totalPoints = evaluations.reduce((sum, rule) => sum + rule.points, 0)
  const earnedPoints = passedRules.reduce((sum, rule) => sum + rule.points, 0)
  const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0
  const recommendations = generateRecommendations(failedRules)

  return {
    score,
    passedRules,
    failedRules,
    strengths: getStrengths(passedRules),
    weaknesses: getWeaknesses(failedRules),
    recommendations,
    categoryScores: getCategoryScores(evaluations),
    normalizedSkills: context.normalizedSkills,
    topSkills: getTopSkills(context.normalizedSkills),
    missingAreas: getMissingAreas(failedRules),
    keywordMatches: context.normalizedSkills,
    profileCompletion: context.profileCompletion,
    technicalCoverage: context.technicalCategories,
    healthLabel: getHealthLabel(score),
    analyzedAt: new Date().toISOString(),
    feedback: recommendations,
  }
}
