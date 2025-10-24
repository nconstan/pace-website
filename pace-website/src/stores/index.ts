// Export all stores for easy importing
export { useAuthStore } from './auth'
export { useDashboardStore } from './dashboard'
export { useManagementStore } from './management'



// Re-export types for convenience
export type { User, LoginCredentials, LoginResponse } from '../services/auth.service'
export type { DashboardStats, QuickQuote } from '../services/dashboard.service'
export type { Dealership, CreateDealershipData } from '../services/admin.service'
export type { Policy, PolicyData, QuickQuoteData } from '../services/policy.service' 