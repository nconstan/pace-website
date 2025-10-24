import api from './api/axiosInstance'

export interface ReportsFilters {
  dateFrom?: string
  dateTo?: string
  selectedDealerGroups?: number[]
  selectedDealerships?: number[]
  selectedSellers?: number[]
  status?: string
}

class ReportsService {
  async getPolicies(filters: ReportsFilters): Promise<any[]> {
    const params = new URLSearchParams()
    
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
    if (filters.dateTo) params.append('dateTo', filters.dateTo)
    if (filters.status) params.append('status', filters.status)
    if (filters.selectedDealerGroups?.length) {
      filters.selectedDealerGroups.forEach(id => params.append('dealerGroups', id.toString()))
    }
    if (filters.selectedDealerships?.length) {
      filters.selectedDealerships.forEach(id => params.append('dealerships', id.toString()))
    }
    if (filters.selectedSellers?.length) {
      filters.selectedSellers.forEach(id => params.append('sellers', id.toString()))
    }

    const response = await api.get(`/api/v1/reports/policies?${params.toString()}`)
    return response.data
  }

  async getDealerGroups(): Promise<any[]> {
    const response = await api.get('/api/v1/reports/dealer-groups')
    return response.data
  }

  async getDealerships(filters: ReportsFilters): Promise<any[]> {
    const params = new URLSearchParams()
    
    if (filters.selectedDealerGroups?.length) {
      filters.selectedDealerGroups.forEach(id => params.append('dealerGroups', id.toString()))
    }

    const response = await api.get(`/api/v1/reports/dealerships?${params.toString()}`)
    return response.data
  }

  async getSellers(filters: ReportsFilters): Promise<any[]> {
    const params = new URLSearchParams()
    
    if (filters.selectedDealerships?.length) {
      filters.selectedDealerships.forEach(id => params.append('dealerships', id.toString()))
    }

    const response = await api.get(`/api/v1/reports/sellers?${params.toString()}`)
    return response.data
  }

  async exportData(filters: ReportsFilters, format: 'csv' | 'excel' = 'csv'): Promise<Blob> {
    const params = new URLSearchParams()
    
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
    if (filters.dateTo) params.append('dateTo', filters.dateTo)
    if (filters.status) params.append('status', filters.status)
    if (filters.selectedDealerGroups?.length) {
      filters.selectedDealerGroups.forEach(id => params.append('dealerGroups', id.toString()))
    }
    if (filters.selectedDealerships?.length) {
      filters.selectedDealerships.forEach(id => params.append('dealerships', id.toString()))
    }
    if (filters.selectedSellers?.length) {
      filters.selectedSellers.forEach(id => params.append('sellers', id.toString()))
    }
    params.append('format', format)

    const response = await api.get(`/api/v1/reports/export?${params.toString()}`, {
      responseType: 'blob'
    })
    return response.data
  }
}

export default new ReportsService() 