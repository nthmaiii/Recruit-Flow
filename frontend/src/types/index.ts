export interface User {
  id: number
  name: string
  email: string
  role: 'super_admin' | 'hr' | 'hiring_manager' | 'candidate'
  department_id: number | null
  department?: Department
  phone: string | null
  avatar: string | null
  is_active: boolean
  must_change_password: boolean
  created_at: string
}

export interface Department {
  id: number
  name: string
  description: string | null
  manager_id: number | null
  manager?: User
  users_count?: number
}

export interface Job {
  id: number
  title: string
  slug: string
  department_id: number
  department?: Department
  created_by: number
  creator?: User
  description: string
  requirements: string
  benefits: string | null
  location: string
  type: 'full_time' | 'part_time' | 'contract' | 'internship'
  level: 'intern' | 'junior' | 'mid' | 'senior' | 'lead' | 'manager'
  salary_min: number | null
  salary_max: number | null
  status: 'draft' | 'published' | 'closed'
  deadline: string | null
  vacancies: number
  applications_count?: number
  created_at: string
  updated_at: string
}

export interface Candidate {
  id: number
  full_name: string
  email: string
  phone: string | null
  dob: string | null
  address: string | null
  linkedin_url: string | null
  portfolio_url: string | null
  summary: string | null
}

export type ApplicationStatus =
  | 'new'
  | 'reviewing'
  | 'interview_scheduled'
  | 'interviewed'
  | 'offer_sent'
  | 'hired'
  | 'rejected'

export interface Application {
  id: number
  job_id: number
  job?: Job
  candidate_id: number
  candidate?: Candidate
  status: ApplicationStatus
  cv_path: string
  cv_original_name: string
  cover_letter: string | null
  rating: number | null
  assigned_to: number | null
  assignedTo?: User
  rejection_reason: string | null
  interviews_count?: number
  status_history?: StatusHistory[]
  interviews?: Interview[]
  notes?: ApplicationNote[]
  ai_score: number | null
  ai_evaluation: {
    score: number
    recommendation: 'strong_yes' | 'yes' | 'maybe' | 'no'
    summary: string
    strengths: string[]
    weaknesses: string[]
  } | null
  ai_evaluated_at: string | null
  created_at: string
  updated_at: string
}

export interface StatusHistory {
  id: number
  application_id: number
  from_status: string | null
  to_status: string
  changed_by: number
  changedBy?: User
  note: string | null
  created_at: string
}

export interface Interview {
  id: number
  application_id: number
  application?: Application
  interviewer_id: number
  interviewer?: User
  scheduled_at: string
  duration_minutes: number
  type: 'online' | 'offline'
  location: string | null
  meeting_link: string | null
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  confirmation_token: string | null
  confirmed_at: string | null
  notes: string | null
  round: number
  evaluations?: InterviewEvaluation[]
  created_at: string
}

export interface InterviewEvaluation {
  id: number
  interview_id: number
  evaluator_id: number
  evaluator?: User
  technical_score: number | null
  communication_score: number | null
  attitude_score: number | null
  overall_score: number | null
  strengths: string | null
  weaknesses: string | null
  recommendation: string | null
  result: 'pass' | 'fail' | 'consider' | null
  created_at: string
}

export interface ApplicationNote {
  id: number
  application_id: number
  user_id: number
  user?: User
  content: string
  is_private: boolean
  created_at: string
}

export interface EmailTemplate {
  id: number
  name: string
  code: string
  subject: string
  body: string
  variables: string[] | null
  is_active: boolean
}

export interface Notification {
  id: number
  user_id: number
  type: string
  title: string
  message: string
  data: Record<string, unknown> | null
  is_read: boolean
  read_at: string | null
  created_at: string
}

export interface PaginatedResponse<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number
  to: number
}
