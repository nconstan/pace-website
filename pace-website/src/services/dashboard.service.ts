import api from './api/axiosInstance'

export interface DashboardStats {
  totalPolicies: number
  totalQuotes: number
  recentPolicies: any[]
  recentQuotes: any[]
  monthlyStats: {
    policies: number
    quotes: number
    revenue: number
  }
}

export interface QuickQuote {
  id: string
  policyData: any
  step: number
  dealership: string
  createdAt: string
  updatedAt: string
}

class DashboardService {
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await api.get('/api/v1/dashboard/stats')
    return response.data
  }

  async getQuickQuotes(): Promise<QuickQuote[]> {
    const response = await api.get('/api/v1/policies/quick-quote')
    return response.data
  }

  async getRecentPolicies(limit: number = 5): Promise<any[]> {
    const response = await api.get(`/api/v1/policies?limit=${limit}`)
    return response.data
  }

  async getRecentQuotes(limit: number = 5): Promise<QuickQuote[]> {
    const response = await api.get(`/api/v1/policies/quick-quote?limit=${limit}`)
    return response.data
  }
}

export default new DashboardService() 