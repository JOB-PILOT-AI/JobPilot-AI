import { create } from 'zustand'
import axios from 'axios'

const API_URL = '/api'

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,

  initializeAuth: () => {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    if (token && user) {
      set({ token, user: JSON.parse(user) })
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
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
      set({ user, token, isLoading: false })
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
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
      set({ user, token, isLoading: false })
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      return { success: true }
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed'
      set({ error: message, isLoading: false })
      return { success: false, error: message }
    }
  },

  logout: () => {
    set({ user: null, token: null })
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    delete axios.defaults.headers.common['Authorization']
  },

  clearError: () => set({ error: null }),
}))
