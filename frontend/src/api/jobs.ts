import client from './client'
import { Job, PaginatedResponse } from '@/types'

export const jobsApi = {
  list: (params?: Record<string, unknown>) =>
    client.get<PaginatedResponse<Job>>('/jobs', { params }),

  get: (id: number) => client.get<Job>(`/jobs/${id}`),

  create: (data: Partial<Job>) => client.post<Job>('/jobs', data),

  update: (id: number, data: Partial<Job>) => client.put<Job>(`/jobs/${id}`, data),

  delete: (id: number) => client.delete(`/jobs/${id}`),

  copy: (id: number) => client.post<Job>(`/jobs/${id}/copy`),

  close: (id: number) => client.post<Job>(`/jobs/${id}/close`),

  approve: (id: number) => client.post<Job>(`/jobs/${id}/approve`),

  rejectApproval: (id: number, note?: string) =>
    client.post<Job>(`/jobs/${id}/reject-approval`, { note }),

  publicList: (params?: Record<string, unknown>) =>
    client.get<PaginatedResponse<Job>>('/jobs/public', { params }),

  publicDetail: (slug: string) => client.get<Job>(`/jobs/${slug}/apply`),
}
