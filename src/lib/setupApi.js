import axios from 'axios'

const DEFAULT_TIMEOUT = 30000

// Use the configured API origin when present; otherwise fall back to the
// local Vite proxy so development traffic stays on a single source of truth.
const apiUrl = import.meta.env.VITE_API_URL || '/api'

axios.defaults.timeout = DEFAULT_TIMEOUT
if (apiUrl) {
  axios.defaults.baseURL = apiUrl
}

// Simple response interceptor to handle auth expiry globally
axios.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status
    if (status === 401 || status === 403) {
      try {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        sessionStorage.removeItem('token')
        sessionStorage.removeItem('user')
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
