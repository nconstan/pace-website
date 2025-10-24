import api from './api/axiosInstance'

export interface Claim {
  id: string
  created_at: string
  completed_at?: string
  from_customer: string
  from_policy: string
  active: boolean
  documents?: any
  policies?: any
  applicants?: any
}

export interface CreateClaimData {
  from_customer: string
  from_policy: string
  documents?: any
}

export interface UpdateClaimData {
  from_customer?: string
  from_policy?: string
  documents?: any
  active?: boolean
  completed_at?: string
}

class ClaimsService {
  async getClaims(): Promise<Claim[]> {
    const response = await api.get('/api/v1/claims')
    return response.data
  }

  async getClaim(id: string): Promise<Claim> {
    const response = await api.get(`/api/v1/claims/${id}`)
    return response.data
  }

  async getClaimsByEmail(email: string): Promise<Claim[]> {
    const response = await api.get(`/api/v1/claims/email/${email}`)
    return response.data
  }

  async getClaimsByCustomerNumber(customerNumber: string): Promise<Claim[]> {
    const response = await api.get(`/api/v1/claims/customer/${customerNumber}`)
    return response.data
  }

  async getPoliciesByCustomerNumber(customerNumber: string): Promise<any[]> {
    const response = await api.get(`/api/v1/policies/customer/${customerNumber}`)
    return response.data
  }

  async createClaim(data: CreateClaimData): Promise<Claim> {
    const response = await api.post('/api/v1/claims', data)
    return response.data
  }

  async updateClaim(id: string, data: UpdateClaimData): Promise<Claim> {
    const response = await api.put(`/api/v1/claims/${id}`, data)
    return response.data
  }

  async deleteClaim(id: string): Promise<any> {
    const response = await api.delete(`/api/v1/claims/${id}`)
    return response.data
  }

  async uploadDocument(claimId: string, documentName: string, file: File): Promise<Claim> {
    const formData = new FormData()
    formData.append('document', file)
    formData.append('documentName', documentName)
    
    const response = await api.post(`/api/v1/claims/${claimId}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  }

  async downloadDocument(claimId: string, documentName: string): Promise<Blob> {
    const response = await api.get(`/api/v1/claims/${claimId}/documents/download`, {
      params: { documentName },
      responseType: 'blob'
    })
    return response.data
  }

  async deleteDocument(claimId: string, documentName: string): Promise<Claim> {
    const response = await api.delete(`/api/v1/claims/${claimId}/documents`, {
      data: { documentName }
    })
    return response.data
  }
}

export default new ClaimsService() 