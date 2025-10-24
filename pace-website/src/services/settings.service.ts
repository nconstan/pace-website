import api from './api/axiosInstance'

export interface UserSettings {
  id: string
  username: string
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  preferences: {
    notifications: boolean
    emailUpdates: boolean
    theme: 'light' | 'dark' | 'auto'
  }
  createdAt: string
  updatedAt: string
}

export interface UpdateSettingsData {
  firstName?: string
  lastName?: string
  phone?: string
  preferences?: {
    notifications?: boolean
    emailUpdates?: boolean
    theme?: 'light' | 'dark' | 'auto'
  }
}

class SettingsService {
  async getUserSettings(): Promise<UserSettings> {
    const response = await api.get('/api/v1/settings/user')
    return response.data
  }

  async updateUserSettings(data: UpdateSettingsData): Promise<UserSettings> {
    const response = await api.put('/api/v1/settings/user', data)
    return response.data
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<any> {
    const response = await api.post('/api/v1/settings/change-password', {
      currentPassword,
      newPassword
    })
    return response.data
  }

  async updateProfile(data: Partial<UserSettings>): Promise<UserSettings> {
    const response = await api.put('/api/v1/settings/profile', data)
    return response.data
  }
}

export default new SettingsService() 