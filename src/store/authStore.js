import { create } from 'zustand'
import axios from 'axios'

const API_URL = '/api'

const getStoredAuth = () => {
  if (typeof window === 'undefined') {
    return { token: null, user: null }
  }

  try {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')

    if (!token || !user) {
      return { token: null, user: null }
    }

    return {
      token,
      user: JSON.parse(user),
    }
  } catch (err) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    return { token: null, user: null }
  }
}

const setAuthHeader = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    return
  }

  delete axios.defaults.headers.common['Authorization']
}

const storedAuth = getStoredAuth()
setAuthHeader(storedAuth.token)

export const useAuthStore = create((set) => ({
  user: storedAuth.user,
  token: storedAuth.token,
  isHydrated: true,
  isLoading: false,
  error: null,

  initializeAuth: () => {
    const { token, user } = getStoredAuth()
    set({ token, user, isHydrated: true })
    setAuthHeader(token)
  },

  signup: async (name, email, password) => {
    set({ isLoading: true, error: null })
    try {
      const res = await axios.post(`${API_URL}/auth/signup`, {
        name,
        email,
        password,
      })
      const { user, token } = res.data
      set({ user, token, isLoading: false, isHydrated: true })
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      setAuthHeader(token)
      return { success: true }
    } catch (err) {
      const message = err.response?.data?.message || 'Signup failed'
      set({ error: message, isLoading: false })
      return { success: false, error: message }
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const res = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      })
      const { user, token } = res.data
      set({ user, token, isLoading: false, isHydrated: true })
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      setAuthHeader(token)
      return { success: true }
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed'
      set({ error: message, isLoading: false })
      return { success: false, error: message }
    }
  },

  githubLogin: async (code) => {
    set({ isLoading: true, error: null })
    try {
      const res = await axios.post(`${API_URL}/auth/github`, { code })
      const { user, token } = res.data
      set({ user, token, isLoading: false, isHydrated: true })
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      setAuthHeader(token)
      return { success: true }
    } catch (err) {
      const message = err.response?.data?.message || 'GitHub login failed'
      set({ error: message, isLoading: false })
      return { success: false, error: message }
    }
  },

  googleLogin: async (code, redirectUri) => {
    set({ isLoading: true, error: null })
    try {
      const res = await axios.post(`${API_URL}/auth/google`, { code, redirectUri })
      const { user, token } = res.data
      set({ user, token, isLoading: false, isHydrated: true })
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      setAuthHeader(token)
      return { success: true }
    } catch (err) {
      const message = err.response?.data?.message || 'Google login failed'
      set({ error: message, isLoading: false })
      return { success: false, error: message }
    }
  },

  forgotPassword: async (email) => {
    set({ isLoading: true, error: null })
    try {
      const res = await axios.post(`${API_URL}/auth/forgot-password`, { email })
      set({ isLoading: false })
      return { success: true, message: res.data.message }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to send reset link'
      set({ error: message, isLoading: false })
      return { success: false, error: message }
    }
  },

  resetPassword: async (token, newPassword) => {
    set({ isLoading: true, error: null })
    try {
      const res = await axios.post(`${API_URL}/auth/reset-password`, { token, newPassword })
      set({ isLoading: false })
      return { success: true, message: res.data.message }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to reset password'
      set({ error: message, isLoading: false })
      return { success: false, error: message }
    }
  },

  upgradeToPro: async () => {
    set({ isLoading: true, error: null })
    try {
      const res = await axios.post(`${API_URL}/auth/upgrade`)
      const updatedUser = { ...useAuthStore.getState().user, plan: 'Pro' }
      set({ user: updatedUser, isLoading: false })
      localStorage.setItem('user', JSON.stringify(updatedUser))
      return { success: true, message: res.data.message }
    } catch (err) {
      const message = err.response?.data?.message || 'Upgrade failed'
      set({ error: message, isLoading: false })
      return { success: false, error: message }
    }
  },

  logout: () => {
    set({ user: null, token: null, isHydrated: true })
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setAuthHeader(null)
  },

  clearError: () => set({ error: null }),
}))
