import { SKILL_DICTIONARY, SKILL_SECTION_HEADINGS } from './skillDictionary.js'

export function normalizeSkillText(value) {
  if (typeof value !== 'string') return ''

  return value
    .toLowerCase()
    .replace(/[\r\n]+/g, ' ')
    .replace(/[./_-]+/g, ' ')
    .replace(/[^a-z0-9+#\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const ALIAS_TO_CANONICAL = new Map()
const GLOBAL_ALIAS_TO_CANONICAL = new Map()
const GLOBAL_MATCH_STOPWORDS = new Set(['js', 'ts', 'css', 'c', 'go'])

for (const entry of SKILL_DICTIONARY) {
  const aliases = Array.isArray(entry.aliases) ? entry.aliases : []
  const globalAliases = Array.isArray(entry.globalAliases) ? entry.globalAliases : aliases

  for (const alias of aliases) {
    const normalizedAlias = normalizeSkillText(alias)
    if (normalizedAlias) {
      ALIAS_TO_CANONICAL.set(normalizedAlias, entry.canonical)
    }
  }

  for (const alias of globalAliases) {
    const normalizedAlias = normalizeSkillText(alias)
    if (normalizedAlias) {
      GLOBAL_ALIAS_TO_CANONICAL.set(normalizedAlias, entry.canonical)
    }
  }
}

const normalizeSkillCandidates = (value) => {
  if (typeof value !== 'string') return []

  return value
    .split(/[\n,;|\/]+/)
    .map((part) => normalizeSkillText(part))
    .filter(Boolean)
}

const splitSkillPhrases = (value) => {
  if (typeof value !== 'string') return []

  return value
    .split(/[\n,;|•·▪●/]+/)
    .map((part) => normalizeSkillText(part))
    .filter(Boolean)
}

const resolveSkill = (value, useGlobalLookup = true) => {
  const normalized = normalizeSkillText(value)
  if (!normalized) return ''

  if (ALIAS_TO_CANONICAL.has(normalized)) {
    return ALIAS_TO_CANONICAL.get(normalized)
  }

  if (useGlobalLookup && GLOBAL_ALIAS_TO_CANONICAL.has(normalized)) {
    return GLOBAL_ALIAS_TO_CANONICAL.get(normalized)
  }

  return ''
}

export const normalizeSkills = (input = []) => {
  const source = Array.isArray(input) ? input : typeof input === 'string' ? [input] : []
  const flattened = []

  for (const entry of source) {
    if (Array.isArray(entry)) {
      flattened.push(...entry)
      continue
    }

    if (typeof entry === 'string' && /[,;|\/]/.test(entry)) {
      flattened.push(...normalizeSkillCandidates(entry))
      continue
    }

    flattened.push(entry)
  }

  const normalizedSkills = []
  const seen = new Set()

  for (const entry of flattened) {
    const canonical = resolveSkill(entry, true)
    if (!canonical) continue

    const key = canonical.toLowerCase()
    if (seen.has(key)) continue

    seen.add(key)
    normalizedSkills.push(canonical)
  }

  return normalizedSkills
}

const extractSectionBlock = (lines, headings) => {
  const startIndex = lines.findIndex((line) =>
    headings.some((heading) => matchesHeading(line, heading))
  )

  if (startIndex === -1) return []

  const block = []
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = typeof lines[index] === 'string' ? lines[index].trim() : ''
    if (!line) continue

    if (isHeadingLine(line) && !headings.some((heading) => matchesHeading(line, heading))) {
      break
    }

    block.push(line)
  }

  return block
}

const isHeadingLine = (line) => {
  const normalized = normalizeSkillText(line).replace(/:$/, '')
  return SKILL_SECTION_HEADINGS.some((heading) => normalized === heading || normalized.startsWith(`${heading} `))
}

const matchesHeading = (line, heading) => {
  const normalized = normalizeSkillText(line).replace(/:$/, '')
  return normalized === heading || normalized.startsWith(`${heading} `)
}

const getSkillMatchesFromText = (text, useGlobalLookup) => {
  const normalizedText = normalizeSkillText(text)
  if (!normalizedText) return []

  const matches = []
  const seen = new Set()

  for (const entry of SKILL_DICTIONARY) {
    const aliases = useGlobalLookup
      ? Array.isArray(entry.globalAliases) && entry.globalAliases.length > 0
        ? entry.globalAliases
        : entry.aliases
      : entry.aliases

    for (const alias of aliases) {
      const normalizedAlias = normalizeSkillText(alias)
      if (!normalizedAlias) continue
      if (useGlobalLookup && GLOBAL_MATCH_STOPWORDS.has(normalizedAlias)) continue

      const paddedText = ` ${normalizedText} `
      if (!paddedText.includes(` ${normalizedAlias} `)) continue

      const canonical = resolveSkill(alias, useGlobalLookup)
      if (!canonical) continue

      const key = canonical.toLowerCase()
      if (seen.has(key)) continue

      seen.add(key)
      matches.push(canonical)
      break
    }
  }

  return matches
}

export const extractSkillsFromText = (text, lines = []) => {
  const sourceLines = Array.isArray(lines) ? lines.filter((line) => typeof line === 'string' && line.trim()) : []

  const sectionBlock = sourceLines.length > 0 ? extractSectionBlock(sourceLines, SKILL_SECTION_HEADINGS) : []
  const sectionText = sectionBlock.length > 0 ? sectionBlock.join(' ') : ''

  if (sectionText) {
    const sectionCandidates = sectionBlock.flatMap((line) => splitSkillPhrases(line))
    const sectionMatches = normalizeSkills(sectionCandidates)
    if (sectionMatches.length > 0) return sectionMatches
  }

  const fallbackMatches = getSkillMatchesFromText(typeof text === 'string' ? text : '', true)
  return normalizeSkills(fallbackMatches)
}
