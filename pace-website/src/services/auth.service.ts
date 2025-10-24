import api from './api/axiosInstance'

export interface LoginCredentials {
  username: string
  password: string
}

export interface User {
  id: string
  username: string
  roles: number[]
  dealerships: string[]
  dealerGroupId: string
  email: string
  first_name: string
  last_name: string
}

export interface LoginResponse {
  user: User
  token: string
}

export interface CreateSellerData {
  username: string
  email: string
  role: string
  dealerships: string[]
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await api.post('/api/v1/auth/login', credentials)
    console.log("response", response.data)
    return response.data
  }

  async validateToken(): Promise<User> {
    const response = await api.get('/api/v1/auth/validate-token')
    return response.data.user
  }

  async setupPassword(token: string, password: string): Promise<any> {
    const response = await api.post('/api/v1/auth/setup-password', { token, password })
    return response.data
  }
}

export default new AuthService() 