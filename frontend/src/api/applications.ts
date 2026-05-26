import client from './client'
import { Application, ApplicationNote, PaginatedResponse } from '@/types'

export const applicationsApi = {
  list: (params?: Record<string, unknown>) =>
    client.get<PaginatedResponse<Application>>('/applications', { params }),

  get: (id: number) => client.get<Application>(`/applications/${id}`),

  apply: (slug: string, data: FormData) =>
    client.post(`/jobs/${slug}/apply`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  changeStatus: (id: number, status: string, note?: string, rejectionReason?: string) =>
    client.post<Application>(`/applications/${id}/status`, { status, note, rejection_reason: rejectionReason }),

  bulkReject: (applicationIds: number[], reason?: string) =>
    client.post('/applications/bulk-reject', { application_ids: applicationIds, reason }),

  bulkEmail: (applicationIds: number[], templateCode: string, customMessage?: string) =>
    client.post('/applications/bulk-email', { application_ids: applicationIds, template_code: templateCode, custom_message: customMessage }),

  scheduleInterview: (id: number, data: Record<string, unknown>) =>
    client.post(`/applications/${id}/schedule-interview`, data),

  sendEmail: (id: number, templateCode: string, customMessage?: string) =>
    client.post(`/applications/${id}/send-email`, { template_code: templateCode, custom_message: customMessage }),

  export: (params?: Record<string, unknown>) =>
    client.get('/applications/export', { params, responseType: 'blob' }),

  addNote: (id: number, content: string, isPrivate = false) =>
    client.post<ApplicationNote>(`/applications/${id}/notes`, { content, is_private: isPrivate }),

  getNotes: (id: number) => client.get<ApplicationNote[]>(`/applications/${id}/notes`),

  candidateApplications: (email: string) =>
    client.get<Application[]>('/candidate/applications', { params: { email } }),

  evaluate: (id: number) =>
    client.post(`/applications/${id}/evaluate`, undefined, { timeout: 110000 }),
}
