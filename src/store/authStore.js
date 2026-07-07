import { create } from 'zustand'
import axios from 'axios'

const API_URL = '/api'

const getStoredAuth = () => {
  if (typeof window === 'undefined') {
    return { token: null, user: null }
  }

  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    const user = localStorage.getItem('user') || sessionStorage.getItem('user')

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
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    return { token: null, user: null }
  }
}

const clearStoredAuth = () => {
  if (typeof window === 'undefined') return
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  sessionStorage.removeItem('token')
  sessionStorage.removeItem('user')
}

const persistAuth = (token, user, rememberMe) => {
  if (typeof window === 'undefined') return
  clearStoredAuth()
  const storage = rememberMe ? localStorage : sessionStorage
  storage.setItem('token', token)
  storage.setItem('user', JSON.stringify(user))
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

export const useAuthStore = create((set, get) => ({
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

  signup: async (name, email, password, rememberMe = true) => {
    set({ isLoading: true, error: null })
    try {
      const res = await axios.post(`${API_URL}/auth/signup`, {
        name,
        email,
        password,
      })
      const { user, token } = res.data
      set({ user, token, isLoading: false, isHydrated: true })
      persistAuth(token, user, rememberMe)
      setAuthHeader(token)
      return { success: true }
    } catch (err) {
      const message = err.response?.data?.message || 'Signup failed'
      set({ error: message, isLoading: false })
      return { success: false, error: message }
    }
  },

  login: async (email, password, rememberMe = true) => {
    set({ isLoading: true, error: null })
    try {
      const res = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      })
      const { user, token } = res.data
      set({ user, token, isLoading: false, isHydrated: true })
      persistAuth(token, user, rememberMe)
      setAuthHeader(token)
      return { success: true }
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed'
      set({ error: message, isLoading: false })
      return { success: false, error: message }
    }
  },

  updateProfile: async (profileData) => {
    set({ isLoading: true, error: null })
    try {
      const res = await axios.put(`${API_URL}/auth/me`, profileData)
      const updatedUser = res.data
      set({ user: updatedUser, isLoading: false, isHydrated: true })
      persistAuth(getStoredAuth().token, updatedUser, true)
      return { success: true, user: updatedUser }
    } catch (err) {
      const message = err.response?.data?.message || 'Update profile failed'
      set({ error: message, isLoading: false })
      return { success: false, error: message }
    }
  },

  changePassword: async ({ currentPassword, newPassword }) => {
    set({ isLoading: true, error: null })
    try {
      const res = await axios.put(`${API_URL}/auth/me/password`, { currentPassword, newPassword })
      set({ isLoading: false })
      return { success: true, message: res.data.message }
    } catch (err) {
      const message = err.response?.data?.message || 'Change password failed'
      set({ error: message, isLoading: false })
      return { success: false, error: message }
    }
  },

  socialLogin: async (provider, rememberMe = true) => {
    set({ isLoading: true, error: null })
    try {
      const fallbackEmail = `${provider}.user@jobpilot.local`
      const res = await axios.post(`${API_URL}/auth/social`, {
        provider,
        email: fallbackEmail,
        name: provider === 'github' ? 'GitHub User' : 'Google User',
        providerId: fallbackEmail,
      })
      const { user, token } = res.data
      set({ user, token, isLoading: false, isHydrated: true })
      persistAuth(token, user, rememberMe)
      setAuthHeader(token)
      return { success: true }
    } catch (err) {
      const message = err.response?.data?.message || 'Social login failed'
      set({ error: message, isLoading: false })
      return { success: false, error: message }
    }
  },

  forgotPassword: async (email) => {
    set({ isLoading: true, error: null })
    try {
      const res = await axios.post(`${API_URL}/auth/forgot-password`, { email })
      set({ isLoading: false })
      return { success: true, data: res.data }
    } catch (err) {
      const message = err.response?.data?.message || 'Password reset request failed'
      set({ error: message, isLoading: false })
      return { success: false, error: message }
    }
  },

  resetPassword: async (token, password) => {
    set({ isLoading: true, error: null })
    try {
      const res = await axios.post(`${API_URL}/auth/reset-password/${token}`, { password })
      set({ isLoading: false })
      return { success: true, data: res.data }
    } catch (err) {
      const message = err.response?.data?.message || 'Password reset failed'
      set({ error: message, isLoading: false })
      return { success: false, error: message }
    }
  },

  // Fetch latest user profile from backend and update store
  refreshUser: async () => {
    set({ isLoading: true, error: null })
    try {
      const state = get()
      const authToken = state.token || getStoredAuth().token
      if (!authToken) {
        set({ isLoading: false })
        return { success: false, error: 'Not authenticated' }
      }

      const res = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })

      const updatedUser = res.data
      set({ user: updatedUser, isLoading: false, isHydrated: true })
      persistAuth(authToken, updatedUser, true)
      setAuthHeader(authToken)
      return { success: true, user: updatedUser }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to refresh user'
      set({ error: message, isLoading: false })
      return { success: false, error: message }
    }
  },

  logout: () => {
    set({ user: null, token: null, isHydrated: true })
    clearStoredAuth()
    setAuthHeader(null)
  },

  clearError: () => set({ error: null }),
}))
