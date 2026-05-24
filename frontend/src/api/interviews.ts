import client from './client'
import { Interview, InterviewEvaluation, PaginatedResponse } from '@/types'

export const interviewsApi = {
  list: (params?: Record<string, unknown>) =>
    client.get<PaginatedResponse<Interview>>('/interviews', { params }),

  get: (id: number) => client.get<Interview>(`/interviews/${id}`),

  update: (id: number, data: Partial<Interview>) => client.put<Interview>(`/interviews/${id}`, data),

  evaluate: (id: number, data: Partial<InterviewEvaluation>) =>
    client.post<InterviewEvaluation>(`/interviews/${id}/evaluate`, data),

  getByToken: (token: string) => client.get(`/confirm-interview/${token}`),

  confirmByToken: (token: string, action: 'confirm' | 'decline') =>
    client.post(`/confirm-interview/${token}`, { action }),
}
