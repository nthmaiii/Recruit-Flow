import client from './client'
import { User } from '@/types'

export const authApi = {
  login: (email: string, password: string) =>
    client.post<{ token: string; user: User; must_change_password: boolean }>('/login', { email, password }),

  logout: () => client.post('/logout'),

  me: () => client.get<User>('/me'),

  updateProfile: (data: Partial<User>) => client.put<User>('/me', data),

  changePassword: (data: { current_password: string; password: string; password_confirmation: string }) =>
    client.post('/change-password', data),

  forgotPassword: (email: string) => client.post('/forgot-password', { email }),

  resetPassword: (data: { token: string; email: string; password: string; password_confirmation: string }) =>
    client.post('/reset-password', data),
}
