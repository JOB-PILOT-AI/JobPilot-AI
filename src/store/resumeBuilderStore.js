import { create } from 'zustand'
import {
  createEmptyResumeData,
  createEmptyEducationItem,
  createEmptyExperienceItem,
  createEmptyProjectItem,
  createEmptyCertificationItem,
  normalizeResumeData,
} from '../lib/resumeStructure'

const RESUME_STORAGE_KEYS = [
  'jobpilot-resume-builder',
  'jobpilot-resume-state',
  'resume-builder',
  'resumeBuilderStore',
  'resume-store',
  'resumeData',
]

const clearStorageBucket = (storage) => {
  if (typeof window === 'undefined' || !storage) {
    return
  }

  const keysToClear = new Set(RESUME_STORAGE_KEYS)

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index)
    if (!key) continue

    if (key.startsWith('jobpilot-resume') || key.startsWith('resumeBuilder') || keysToClear.has(key)) {
      keysToClear.add(key)
    }
  }

  keysToClear.forEach((key) => storage.removeItem(key))
}

export const clearPersistedResumeData = () => {
  clearStorageBucket(localStorage)
  clearStorageBucket(sessionStorage)
}

const createSectionItem = (section) => {
  switch (section) {
    case 'education':
      return createEmptyEducationItem()
    case 'experience':
      return createEmptyExperienceItem()
    case 'projects':
      return createEmptyProjectItem()
    case 'certifications':
      return createEmptyCertificationItem()
    default:
      return null
  }
}

const getInitialResumeState = () => ({
  resumeId: null,
  fileName: '',
  resumeData: createEmptyResumeData(),
  isDirty: false,
  atsAnalytics: {},
})

export const useResumeBuilderStore = create((set) => ({
  ...getInitialResumeState(),
  hydrateResume: (resume) =>
    set({
      resumeId: resume?._id || null,
      fileName: resume?.fileName || '',
      resumeData: normalizeResumeData(resume),
      atsAnalytics: resume?.atsAnalytics || resume?.atsScore || {},
      isDirty: false,
    }),
  setResumeData: (resumeData) =>
    set({
      resumeData: normalizeResumeData(resumeData),
      isDirty: true,
    }),
  updatePersonalInfoField: (field, value) =>
    set((state) => ({
      resumeData: {
        ...state.resumeData,
        personalInfo: {
          ...state.resumeData.personalInfo,
          [field]: value,
        },
      },
      isDirty: true,
    })),
  setSkills: (skills) =>
    set((state) => ({
      resumeData: {
        ...state.resumeData,
        skills: skills,
      },
      isDirty: true,
    })),
  addSkill: (skill) =>
    set((state) => {
      const normalized = typeof skill === 'string' ? skill.trim() : ''
      if (!normalized) {
        return state
      }

      const exists = state.resumeData.skills.some((entry) => entry.toLowerCase() === normalized.toLowerCase())
      if (exists) {
        return state
      }

      return {
        resumeData: {
          ...state.resumeData,
          skills: [...state.resumeData.skills, normalized],
        },
        isDirty: true,
      }
    }),
  removeSkill: (index) =>
    set((state) => ({
      resumeData: {
        ...state.resumeData,
        skills: state.resumeData.skills.filter((_, currentIndex) => currentIndex !== index),
      },
      isDirty: true,
    })),
  updateSkill: (index, value) =>
    set((state) => ({
      resumeData: {
        ...state.resumeData,
        skills: state.resumeData.skills.map((skill, currentIndex) =>
          currentIndex === index ? value : skill
        ),
      },
      isDirty: true,
    })),
  addSectionItem: (section) =>
    set((state) => {
      const item = createSectionItem(section)
      if (!item) {
        return state
      }

      return {
        resumeData: {
          ...state.resumeData,
          [section]: [...state.resumeData[section], item],
        },
        isDirty: true,
      }
    }),
  updateSectionItem: (section, index, field, value) =>
    set((state) => ({
      resumeData: {
        ...state.resumeData,
        [section]: state.resumeData[section].map((item, currentIndex) => {
          if (currentIndex !== index) return item
          if (field === 'technologies') {
            return {
              ...item,
              [field]: Array.isArray(value)
                ? value
                : typeof value === 'string'
                  ? value.split(',').map((entry) => entry.trim()).filter(Boolean)
                  : [],
            }
          }

          if (field === 'isCurrent') {
            return {
              ...item,
              [field]: Boolean(value),
            }
          }

          return {
            ...item,
            [field]: value,
          }
        }),
      },
      isDirty: true,
    })),
  removeSectionItem: (section, index) =>
    set((state) => ({
      resumeData: {
        ...state.resumeData,
        [section]: state.resumeData[section].filter((_, currentIndex) => currentIndex !== index),
      },
      isDirty: true,
    })),
  resetResumeData: () => set(getInitialResumeState()),
  reset: () => set(getInitialResumeState()),
}))
