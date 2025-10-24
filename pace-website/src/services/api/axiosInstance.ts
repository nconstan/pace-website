import axios from 'axios'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Handle authentication errors
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    
    // Handle other errors
    if (error.response?.status === 403) {
      console.error('Access denied:', error.response.data)
    }
    
    if (error.response?.status >= 500) {
      console.error('Server error:', error.response.data)
    }
    
    return Promise.reject(error)
  }
)

export default api 