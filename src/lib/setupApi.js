import axios from 'axios'

const DEFAULT_TIMEOUT = 30000

// Respect Vite env when pointing at a remote API during development
// If `VITE_API_URL` is not set and we're running locally, default to the
// backend server used by `server/src/index.js` during development.
const envApiUrl = import.meta.env.VITE_API_URL || ''
const defaultLocalApi = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) ? 'http://localhost:3001' : ''
const apiUrl = envApiUrl || defaultLocalApi

axios.defaults.timeout = DEFAULT_TIMEOUT
if (apiUrl) {
  axios.defaults.baseURL = apiUrl
}

// Simple response interceptor to handle auth expiry globally
axios.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status
    if (status === 401) {
      try {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      } catch (e) {
        // ignore
      }
      // redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }

    return Promise.reject(err)
  }
)

export default axios
