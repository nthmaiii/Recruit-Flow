import client from './client'
import { Notification, PaginatedResponse } from '@/types'

export const notificationsApi = {
  list: (params?: Record<string, unknown>) =>
    client.get<PaginatedResponse<Notification>>('/notifications', { params }),

  markRead: (id: number) => client.post(`/notifications/${id}/read`),

  markAllRead: () => client.post('/notifications/read-all'),
}
