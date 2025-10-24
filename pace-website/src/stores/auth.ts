import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import authService, { type LoginCredentials, type User } from '../services/auth.service'
import { useManagementStore } from './management'
import { useDashboardStore } from './dashboard'

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('auth_token'))
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const isInitialized = ref(false)
  const isInitializing = ref(false)

  const isAuthenticated = computed(() => !!user.value && !!token.value)

  // Initialize user data if token exists but user is null
  const initializeUser = async () => {
    if (token.value && !user.value && !isInitialized.value && !isInitializing.value) {
      isInitializing.value = true
      try {
        await validateStoredToken()
        useManagementStore().getInitialData()
      } finally {
        isInitializing.value = false
      }
    }
  }

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await authService.login(credentials)
      user.value = response.user
      token.value = response.token
      localStorage.setItem('auth_token', response.token)
      isInitialized.value = true
      useManagementStore().getInitialData()
      return true
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Login failed'
      return false
    } finally {
      isLoading.value = false
    }
  }

  const logout = () => {
    user.value = null
    token.value = null
    localStorage.removeItem('auth_token')
    isInitialized.value = false
    
    // Clear all other stores
    clearAllStores()
    
    router.push('/login')
  }

  const clearStore = () => {
    user.value = null
    token.value = null
    error.value = null
    isLoading.value = false
    isInitialized.value = false
    isInitializing.value = false
  }

  const clearAllStores = () => {
    // Clear auth store
    clearStore()
    
    // Clear other stores
    const managementStore = useManagementStore()
    const dashboardStore = useDashboardStore()
    
    // Clear management store
    managementStore.clearStore()
    
    // Clear dashboard store
    dashboardStore.clearStore()
  }

  const validateStoredToken = async (): Promise<boolean> => {
    const storedToken = localStorage.getItem('auth_token')
    if (!storedToken) {
      return false
    }

    try {
      token.value = storedToken
      const userData = await authService.validateToken()
      user.value = userData
      console.log("user.value in store", user.value)
      isInitialized.value = true
      return true
    } catch (err) {
      localStorage.removeItem('auth_token')
      clearAllStores()
      router.push('/login')
      return false
    }
  }

  const checkAuth = async (): Promise<boolean> => {
    if (!isInitialized.value) {
      return await validateStoredToken()
    }
    return isAuthenticated.value
  }

  const hasRole = async (validRoles: number[]): Promise<boolean> => {
    await initializeUser()
    if (!user.value?.roles) return false
    if (user.value?.roles.includes(12)) return true
    return validRoles.some(role => user.value?.roles?.includes(role) || false)
  }

  return {
    user,
    token,
    isLoading,
    error,
    isAuthenticated,
    isInitialized,
    isInitializing,
    login,
    logout,
    checkAuth,
    validateStoredToken,
    hasRole,
    clearAllStores,
    clearStore,
    initializeUser
  }
})



