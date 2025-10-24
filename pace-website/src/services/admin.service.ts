import api from './api/axiosInstance'

export interface Dealership {
  id: string
  name: string
  address: string
  phone: string
  email: string
  manager: string
  createdAt: string
  updatedAt: string
  province: string
  dealer_group: DealerGroup
}

export interface CreateDealershipData {
  name: string
  address: string
  phone: string
  email: string
  manager: string
  province: string
}

export interface Account {
  id: string
  username: string
  email: string
  roles: number[]
  dealerships: string[]
  createdAt: string
  updatedAt: string
  active: boolean
  dealer_group_id: string
  contact: Contact
  dealer_group: DealerGroup
}

export interface CreateAccountData {
  username: string
  password: string
  email: string
  role: string
  dealerships: string[]
}

export interface DealerGroup {
  id: string
  name: string
  nickname: string,
  dealer_margin: number
  dealer_group_split: number
  referral_fee_rate: number
  dealerships: Dealership[]
}

export interface CreateDealerGroupData {
  name: string
  dealer_margin: number
  dealer_group_split: number
  referral_fee_rate: number
}

export interface Contact {
  id: string
  first_name: string
  last_name: string
  nickname?: string
  primary_email: string
  secondary_email?: string
  primary_phone_number: string
  secondary_phone_number?: string
  address_1: string
  address_2?: string
  city: string
  province: string
  postal_code: string
  birthday?: string
  created_at: string
  updated_at: string
}

export interface CreateContactData {
  first_name: string
  last_name: string
  nickname?: string
  primary_email: string
  secondary_email?: string
  primary_phone_number: string
  secondary_phone_number?: string
  address_1: string
  address_2?: string
  city: string
  province: string
  postal_code: string
  birthday?: Date
}

class AdminService {
  // Dealer Group Management
  async getDealerGroups(): Promise<DealerGroup[]> {
    const response = await api.get('/api/v1/admin/dealer-groups')
    return response.data
  }

  async createDealerGroup(data: CreateDealerGroupData): Promise<DealerGroup> {
    const response = await api.post('/api/v1/admin/dealer-groups/create', data)
    return response.data
  }

  async updateDealerGroup(id: string, data: Partial<CreateDealerGroupData>): Promise<DealerGroup> {
    const response = await api.put(`/api/v1/admin/dealer-groups/${id}`, data)
    return response.data
  }

  async deleteDealerGroup(id: string): Promise<any> {
    const response = await api.delete(`/api/v1/admin/dealer-groups/${id}`)
    return response.data
  }

  // Dealership Management
  async getDealerships(): Promise<Dealership[]> {
    const response = await api.get('/api/v1/admin/dealerships')
    return response.data
  }

  async createDealership(data: CreateDealershipData): Promise<Dealership> {
    const response = await api.post('/api/v1/admin/dealerships/create', data)
    return response.data
  }

  async updateDealership(id: string, data: Partial<CreateDealershipData>): Promise<Dealership> {
    const response = await api.put(`/api/v1/admin/dealerships/${id}`, data)
    return response.data
  }

  async deleteDealership(id: string): Promise<any> {
    const response = await api.delete(`/api/v1/admin/dealerships/${id}`)
    return response.data
  }

  // Account Management
  async getAccounts(): Promise<Account[]> {
    const response = await api.get('/api/v1/admin/accounts')
    return response.data
  }

  async createAccount(data: CreateAccountData): Promise<Account> {
    const response = await api.post('/api/v1/admin/accounts/create', data)
    return response.data
  }

  async updateAccount(id: string, data: Partial<CreateAccountData>): Promise<Account> {
    const response = await api.put(`/api/v1/admin/accounts/${id}`, data)
    return response.data
  }

  // Contact Management
  async getContacts(searchTerm?: string, dealerGroupId?: string): Promise<Contact[]> {
    const params = new URLSearchParams()
    if (searchTerm) {
      params.append('search', searchTerm)
    }
    if (dealerGroupId) {
      params.append('dealerGroupId', dealerGroupId)
    }
    const response = await api.get(`/api/v1/admin/contacts?${params}`)
    return response.data
  }

  async createContact(data: CreateContactData): Promise<Contact> {
    const response = await api.post('/api/v1/admin/contacts/create', data)
    return response.data.data // Return the contact data from the response
  }

  async searchContacts(searchTerm: string, dealerGroupId?: string): Promise<Contact[]> {
    return this.getContacts(searchTerm, dealerGroupId)
  }

  // Applicant lookup by customer number
  async getApplicantByCustomerNumber(customerNumber: string): Promise<any> {
    const response = await api.get(`/api/v1/admin/applicants/customer/${customerNumber}`)
    return response.data
  }
}

export default new AdminService() 