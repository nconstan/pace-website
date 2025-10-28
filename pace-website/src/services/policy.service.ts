import api from './api/axiosInstance'

export interface PolicyData {
  applicant: any
  vehicle: any
  debtInfo: any
  selectedProducts: any
  paymentInfo: any
}

export interface QuickQuoteData {
  policy: any
  currentStep: number
}

export interface Policy {
  id: string
  created_at: string
  seller_id?: string
  dealership_id?: string
  dealer_group_id?: string
  created_by_id: string
  applicant_id: string
  price_calculation_data?: string
  pricing_details?: string
  product_pricing_details: string[]
  cancelation_details?: string
  claims_details?: string
  policy_status: number
  products: string[]
  policy_term: string
  effective_date: string
  date_terminated?: string
  province: string
  jwt_token?: string
  credit_card_token?: string
  policy_payment_method: number
  total_price: number
  transfered_from?: string
  transfered_to?: string
  primary_insurer_id?: string
  primary_insurer_policy_number?: string
  vehicle_details?: string
  applicants?: any
  dealerships?: any
  vehicle_details_policies_vehicle_detailsTovehicle_details?: any
}

export interface QuickQuote {
  id: string
  policyData: any
  step: number
  dealership: string
  createdAt: string
  updatedAt: string
}

class PolicyService {
  async createPolicy(data: PolicyData): Promise<Policy> {
    const response = await api.post('/api/v1/policies/create', data)
    return response.data
  }

  async getPolicies(filters: any): Promise<Policy[]> {
    const response = await api.post('/api/v1/policies/getPolicies', { filters })
    return response.data
  }

  async getPolicy(id: string): Promise<Policy> {
    const response = await api.get(`/api/v1/policies/${id}`)
    return response.data
  }

  async updatePolicy(id: string, data: Partial<PolicyData>): Promise<Policy> {
    const response = await api.put(`/api/v1/policies/${id}`, data)
    return response.data
  }

  async deletePolicy(id: string): Promise<any> {
    const response = await api.delete(`/api/v1/policies/${id}`)
    return response.data
  }

  async saveQuickQuote(data: QuickQuoteData): Promise<QuickQuote> {
    const response = await api.post('/api/v1/policies/quick-quote/save', data)
    return response.data
  }

  async getQuickQuotes(): Promise<QuickQuote[]> {
    const response = await api.get('/api/v1/policies/quick-quote')
    return response.data
  }

  async getQuickQuote(id: string): Promise<QuickQuote> {
    const response = await api.get(`/api/v1/policies/quick-quote/${id}`)
    return response.data
  }

  async updateQuickQuote(id: string, data: Partial<QuickQuoteData>): Promise<QuickQuote> {
    const response = await api.put(`/api/v1/policies/quick-quote/${id}`, data)
    return response.data
  }

  async deleteQuickQuote(id: string): Promise<any> {
    const response = await api.delete(`/api/v1/policies/quick-quote/${id}`)
    return response.data
  }

  async getAllPricing(data: any, products: string[]): Promise<any> {
    const response = await api.post('/api/v1/policies/getAllPricing', {data, products})
    return response.data
  }

  async confirmPolicy(token: string): Promise<any> {
    const response = await api.post('/api/v1/policies/confirm', { token })
    return response.data
  }

  async getVinData(vin: string): Promise<any> {
    const response = await api.get(`/api/v1/policies/getVinData/${vin}`)
    return response.data
  }

  async calculateRefund(policyId: string): Promise<any> {
    const response = await api.get(`/api/v1/policies/${policyId}/refund`)
    return response.data
  }

  async searchPoliciesByEmail(email: string): Promise<any[]> {
    const response = await api.get(`/api/v1/policies/search/email/${encodeURIComponent(email)}`)
    return response.data
  }

  async startPolicyCancelation(policyId: string): Promise<any> {
    const response = await api.post(`/api/v1/policies/${policyId}/start-cancellation`)
    return response.data
  }

  async cancelPolicy(token: string): Promise<any> {
    const response = await api.post('/api/v1/policies/cancel', { token })
    return response.data
  }

  async getPoliciesByCustomerNumber(customerNumber: string, filters: any = {}): Promise<Policy[]> {
    const response = await api.get(`/api/v1/policies/customer/${customerNumber}`, { params: filters })
    return response.data
  }

}

export default new PolicyService() 