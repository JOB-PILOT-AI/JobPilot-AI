import { create } from 'zustand'
import {
  createEmptyResumeData,
  createEmptyEducationItem,
  createEmptyExperienceItem,
  createEmptyProjectItem,
  createEmptyCertificationItem,
  normalizeResumeData,
} from '../lib/resumeStructure'

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

export const useResumeBuilderStore = create((set) => ({
  resumeId: null,
  fileName: '',
  resumeData: createEmptyResumeData(),
  isDirty: false,
  hydrateResume: (resume) =>
    set({
      resumeId: resume?._id || null,
      fileName: resume?.fileName || '',
      resumeData: normalizeResumeData(resume),
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
  reset: () =>
    set({
      resumeId: null,
      fileName: '',
      resumeData: createEmptyResumeData(),
      isDirty: false,
    }),
}))
