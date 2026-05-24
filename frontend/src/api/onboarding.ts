import client from './client'

export interface OnboardingTask {
  id: number
  application_id: number
  title: string
  description?: string
  category: 'hr' | 'it' | 'manager' | 'admin'
  is_completed: boolean
  completed_at?: string
  completed_by?: { id: number; name: string }
  assigned_to?: { id: number; name: string }
  due_date?: string
  sort_order: number
}

export const onboardingApi = {
  list: (applicationId: number) =>
    client.get<OnboardingTask[]>(`/applications/${applicationId}/onboarding`),

  create: (applicationId: number, data: Partial<OnboardingTask>) =>
    client.post<OnboardingTask>(`/applications/${applicationId}/onboarding`, data),

  complete: (applicationId: number, taskId: number) =>
    client.post<OnboardingTask>(`/applications/${applicationId}/onboarding/${taskId}/complete`),

  delete: (applicationId: number, taskId: number) =>
    client.delete(`/applications/${applicationId}/onboarding/${taskId}`),
}
