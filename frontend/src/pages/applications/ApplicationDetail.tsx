import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { applicationsApi } from '@/api/applications'
import { interviewsApi } from '@/api/interviews'
import { onboardingApi, OnboardingTask } from '@/api/onboarding'
import { useAuthStore } from '@/store/authStore'
import StatusBadge from '@/components/common/StatusBadge'
import { Application, ApplicationStatus } from '@/types'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import client from '@/api/client'
import ConfirmDialog from '@/components/common/ConfirmDialog'

// Khớp đúng với backend Application::TRANSITIONS
const TRANSITIONS: Record<string, Record<string, ApplicationStatus[]>> = {
  super_admin: {
    new: ['reviewing', 'rejected'],
    reviewing: ['interview_scheduled', 'rejected'],
    interview_scheduled: ['interviewed'],
    interviewed: ['hired', 'rejected'],
  },
  hr: {
    new: ['reviewing', 'rejected'],
    reviewing: ['interview_scheduled', 'rejected'],
    interviewed: ['hired', 'rejected'],
  },
  hiring_manager: {
    reviewing: ['interview_scheduled', 'rejected'],
    interview_scheduled: ['interviewed'],
    interviewed: ['hired', 'rejected'],
  },
}

const SCORE_FIELDS = ['technical_score', 'communication_score', 'attitude_score', 'overall_score'] as const

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  hr: { label: 'HR', color: 'bg-blue-100 text-blue-700' },
  it: { label: 'IT', color: 'bg-purple-100 text-purple-700' },
  manager: { label: 'Manager', color: 'bg-orange-100 text-orange-700' },
  admin: { label: 'Admin', color: 'bg-gray-100 text-gray-700' },
}

export default function ApplicationDetail() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'info' | 'history' | 'interviews' | 'notes' | 'onboarding'>('info')
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showInterviewModal, setShowInterviewModal] = useState(false)
  const [showEvalModal, setShowEvalModal] = useState<number | null>(null)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [newStatus, setNewStatus] = useState<ApplicationStatus | ''>('')
  const [statusNote, setStatusNote] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [notePrivate, setNotePrivate] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskCategory, setNewTaskCategory] = useState<'hr' | 'it' | 'manager' | 'admin'>('hr')
  const [confirmDelTask, setConfirmDelTask] = useState<{ id: number; title: string } | null>(null)

  const STATUS_LABELS: Record<string, string> = {
    new: t('status.new'),
    reviewing: t('status.reviewing'),
    interview_scheduled: t('status.interview_scheduled'),
    interviewed: t('status.interviewed'),
    offer_sent: t('status.offer_sent'),
    hired: t('status.hired'),
    rejected: t('status.rejected'),
  }

  const SCORE_LABELS: Record<string, string> = {
    technical_score: t('applications.technical'),
    communication_score: t('applications.communication'),
    attitude_score: t('applications.attitude'),
    overall_score: t('applications.overallScore'),
  }

  const TAB_LABELS: Record<string, string> = {
    info: t('applications.tabInfo'),
    history: t('applications.tabHistory'),
    interviews: t('applications.tabInterviews'),
    notes: t('applications.tabNotes'),
  }

  const INTERVIEW_STATUS_LABELS: Record<string, string> = {
    pending: t('interviewStatus.pending'),
    confirmed: t('interviewStatus.confirmed'),
    completed: t('interviewStatus.completed'),
    cancelled: t('interviewStatus.cancelled'),
  }

  const { data: app, isLoading } = useQuery({
    queryKey: ['application', id],
    queryFn: () => applicationsApi.get(Number(id)).then((r) => r.data as Application),
  })

  const isHR = user?.role === 'hr' || user?.role === 'super_admin'
  const isHMRole = user?.role === 'hiring_manager'

  const { data: emailTemplates } = useQuery({
    queryKey: ['email-templates'],
    queryFn: () => client.get('/email-templates').then((r) => r.data),
    enabled: isHR,
    retry: false,
  })

  const { data: users } = useQuery({
    queryKey: ['users', { role: 'hiring_manager' }],
    queryFn: () => client.get('/users', { params: { role: 'hiring_manager' } }).then((r) => r.data.data),
    enabled: isHR,
    retry: false,
  })

  const { data: onboardingTasks } = useQuery({
    queryKey: ['onboarding', id],
    queryFn: () => onboardingApi.list(Number(id)).then((r) => r.data),
    enabled: app?.status === 'hired',
  })

  const changeStatusMutation = useMutation({
    mutationFn: () => applicationsApi.changeStatus(Number(id), newStatus, statusNote, rejectionReason),
    onSuccess: () => {
      toast.success(t('applications.statusUpdated'))
      setShowStatusModal(false)
      setNewStatus('')
      setStatusNote('')
      setRejectionReason('')
      queryClient.invalidateQueries({ queryKey: ['application', id] })
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Cập nhật thất bại'),
  })

  const scheduleInterviewMutation = useMutation({
    mutationFn: (data: any) => applicationsApi.scheduleInterview(Number(id), data),
    onSuccess: () => {
      toast.success(t('applications.interviewScheduled'))
      setShowInterviewModal(false)
      queryClient.invalidateQueries({ queryKey: ['application', id] })
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Lên lịch thất bại'),
  })

  const addNoteMutation = useMutation({
    mutationFn: () => applicationsApi.addNote(Number(id), noteContent, notePrivate),
    onSuccess: () => {
      toast.success(t('applications.noteAdded'))
      setNoteContent('')
      queryClient.invalidateQueries({ queryKey: ['application', id] })
    },
  })

  const evalMutation = useMutation({
    mutationFn: ({ interviewId, data }: any) => interviewsApi.evaluate(interviewId, data),
    onSuccess: () => {
      toast.success(t('applications.evalSaved'))
      setShowEvalModal(null)
      queryClient.invalidateQueries({ queryKey: ['application', id] })
    },
  })

  const addTaskMutation = useMutation({
    mutationFn: () => onboardingApi.create(Number(id), { title: newTaskTitle, category: newTaskCategory }),
    onSuccess: () => {
      toast.success(t('applications.taskAdded'))
      setNewTaskTitle('')
      queryClient.invalidateQueries({ queryKey: ['onboarding', id] })
    },
  })

  const completeTaskMutation = useMutation({
    mutationFn: (taskId: number) => onboardingApi.complete(Number(id), taskId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['onboarding', id] }),
  })

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: number) => onboardingApi.delete(Number(id), taskId),
    onSuccess: () => {
      toast.success(t('applications.taskDeleted'))
      queryClient.invalidateQueries({ queryKey: ['onboarding', id] })
    },
  })

  const evaluateAiMutation = useMutation({
    mutationFn: () => applicationsApi.evaluate(Number(id)),
    onSuccess: (res) => {
      toast.success('Đánh giá AI hoàn tất!')
      queryClient.setQueryData(['application', id], (old: any) => ({
        ...old,
        ai_score: res.data.ai_score,
        ai_evaluation: res.data.ai_evaluation,
        ai_evaluated_at: res.data.ai_evaluated_at,
      }))
      setActiveTab('info')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Không thể chạy đánh giá AI lúc này.'),
  })

  if (isLoading || !app) return <div className="animate-pulse p-8 text-gray-400">{t('common.loading')}</div>

  // Tính các trạng thái hợp lệ dựa trên role VÀ trạng thái hiện tại
  const availableTransitions = TRANSITIONS[user?.role ?? '']?.[app.status] ?? []
  const tabs = ['info', 'history', 'interviews', 'notes', ...(app.status === 'hired' ? ['onboarding'] : [])] as const

  const completedCount = onboardingTasks?.filter((t: OnboardingTask) => t.is_completed).length ?? 0
  const totalCount = onboardingTasks?.length ?? 0

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/applications')} className="text-sm text-blue-600 hover:underline">
          {t('applications.backToList')}
        </button>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setActiveTab('info')
              if (app?.ai_score == null && !evaluateAiMutation.isPending) {
                evaluateAiMutation.mutate()
              }
            }}
            className="btn-secondary flex items-center gap-1.5"
            disabled={evaluateAiMutation.isPending}
          >
            {evaluateAiMutation.isPending ? (
              <>
                <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Đang phân tích...</span>
              </>
            ) : (
              <>
                <span>🤖</span>
                <span>Đánh giá AI</span>
                {app?.ai_score != null && (
                  <span className={`px-1.5 py-0.5 text-xs font-bold rounded ${
                    app.ai_score >= 80 ? 'bg-green-100 text-green-700' :
                    app.ai_score >= 60 ? 'bg-blue-100 text-blue-700' :
                    app.ai_score >= 40 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>{app.ai_score}</span>
                )}
              </>
            )}
          </button>
          {isHR && (
            <button onClick={() => setShowEmailModal(true)} className="btn-secondary">{t('applications.sendEmail')}</button>
          )}
          {isHR && (
            <button onClick={() => setShowInterviewModal(true)} className="btn-secondary">{t('applications.scheduleInterview')}</button>
          )}
          <button
            onClick={() => { setShowStatusModal(true); setNewStatus('') }}
            className="btn-primary"
            disabled={availableTransitions.length === 0}
            title={availableTransitions.length === 0 ? t('applications.noNextStatus') : ''}
          >
            {t('applications.updateStatus')}
          </button>
        </div>
      </div>

      {/* Candidate Info Card */}
      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{app.candidate?.full_name}</h1>
            <div className="text-gray-500 dark:text-gray-400">{app.candidate?.email} · {app.candidate?.phone}</div>
          </div>
          <StatusBadge status={app.status} />
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm dark:text-gray-200">
          <div><span className="text-gray-500">{t('applications.applied')}:</span> <span className="font-medium">{app.job?.title}</span></div>
          <div><span className="text-gray-500">{t('applications.dept')}:</span> {app.job?.department?.name}</div>
          <div><span className="text-gray-500">{t('applications.applied')}:</span> {format(new Date(app.created_at), 'dd/MM/yyyy')}</div>
          <div>
            <span className="text-gray-500">{t('applications.cv')}:</span>{' '}
            <button
              className="text-blue-600 hover:underline text-sm"
              onClick={() => {
                const token = localStorage.getItem('auth_token') || ''
                fetch(`/api/v1/applications/${app.id}/cv`, {
                  headers: { Authorization: `Bearer ${token}` },
                })
                  .then(r => r.blob())
                  .then(blob => {
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = app.cv_original_name || 'cv.pdf'
                    a.click()
                    URL.revokeObjectURL(url)
                    if (app.status === 'new') {
                      applicationsApi.changeStatus(Number(id), 'reviewing', 'Đã xem CV')
                        .then(() => queryClient.invalidateQueries({ queryKey: ['application', id] }))
                    }
                  })
              }}
            >
              {app.cv_original_name}
            </button>
          </div>
          <div><span className="text-gray-500">{t('applications.evalScore')}:</span> {app.rating ? `${app.rating}/10` : t('applications.notRated')}</div>
          {app.status === 'hired' && totalCount > 0 && (
            <div>
              <span className="text-gray-500">{t('applications.onboardingProgress')}:</span>{' '}
              <span className={`font-medium ${completedCount === totalCount ? 'text-green-600' : 'text-orange-500'}`}>
                {t('applications.onboarding', { done: completedCount, total: totalCount })}
              </span>
            </div>
          )}
        </div>
        {app.cover_letter && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-200">
            <div className="font-medium mb-1">{t('applications.coverLetter')}</div>
            {app.cover_letter}
          </div>
        )}
        {app.rejection_reason && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <span className="font-medium">{t('applications.rejectionReason')}</span> {app.rejection_reason}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 text-sm font-medium border-b-2 mr-4 -mb-px transition-colors ${
              activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'onboarding'
              ? t('applications.onboarding', { done: completedCount, total: totalCount })
              : TAB_LABELS[tab] ?? tab}
          </button>
        ))}
      </div>

      {/* Tab: Info - AI Evaluation */}
      {activeTab === 'info' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">🤖 Đánh giá AI</h3>
            {app.ai_score != null && (
              <button
                onClick={() => evaluateAiMutation.mutate()}
                disabled={evaluateAiMutation.isPending}
                className="btn-secondary text-sm"
              >
                {evaluateAiMutation.isPending ? 'Đang phân tích...' : '🔄 Chạy lại'}
              </button>
            )}
          </div>

          {evaluateAiMutation.isPending ? (
            <div className="text-center py-10">
              <svg className="animate-spin h-10 w-10 text-blue-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="font-medium text-gray-700 dark:text-gray-200">AI đang phân tích hồ sơ...</p>
              <p className="text-xs text-gray-400 mt-1">Thường mất 20–60 giây</p>
            </div>
          ) : app.ai_score == null ? (
            <div className="text-center py-10">
              <div className="text-5xl mb-4">📄</div>
              <p className="text-gray-500 mb-4">Chưa có đánh giá AI cho hồ sơ này.</p>
              <button onClick={() => evaluateAiMutation.mutate()} className="btn-primary">
                ▶ Chạy đánh giá ngay
              </button>
            </div>
          ) : (() => {
            const ev = app.ai_evaluation as any
            const score = app.ai_score
            const radius = 42
            const circ = 2 * Math.PI * radius
            const offset = circ - (score / 100) * circ
            const scoreColor = score >= 80 ? '#16a34a' : score >= 60 ? '#2563eb' : score >= 40 ? '#d97706' : '#dc2626'
            const recMap: Record<string, { label: string; color: string }> = {
              strong_yes: { label: 'Rất phù hợp',     color: 'bg-green-100 text-green-700' },
              yes:        { label: 'Phù hợp',          color: 'bg-blue-100 text-blue-700' },
              maybe:      { label: 'Có thể xem xét',   color: 'bg-yellow-100 text-yellow-700' },
              no:         { label: 'Không phù hợp',    color: 'bg-red-100 text-red-700' },
            }
            const rec = recMap[ev?.recommendation] ?? { label: ev?.recommendation, color: 'bg-gray-100 text-gray-700' }
            return (
              <div className="space-y-5">
                {/* Score + Recommendation */}
                <div className="flex items-center gap-8">
                  <div className="relative flex-shrink-0">
                    <svg width="110" height="110" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="10" />
                      <circle
                        cx="50" cy="50" r={radius} fill="none"
                        stroke={scoreColor} strokeWidth="10"
                        strokeDasharray={circ} strokeDashoffset={offset}
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                      />
                      <text x="50" y="54" textAnchor="middle" fontSize="22" fontWeight="700" fill={scoreColor}>{score}</text>
                      <text x="50" y="68" textAnchor="middle" fontSize="10" fill="#9ca3af">/100</text>
                    </svg>
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Khuyến nghị</div>
                    <span className={`inline-block px-3 py-1.5 rounded-full text-sm font-semibold ${rec.color}`}>{rec.label}</span>
                    {app.ai_evaluated_at && (
                      <div className="text-xs text-gray-400">
                        Đánh giá lúc {format(new Date(app.ai_evaluated_at), 'dd/MM/yyyy HH:mm')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Summary */}
                {ev?.summary && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
                    {ev.summary}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {/* Strengths */}
                  {ev?.strengths?.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">✅ Điểm mạnh</div>
                      <ul className="space-y-1.5">
                        {ev.strengths.map((s: string, i: number) => (
                          <li key={i} className="text-sm text-gray-600 dark:text-gray-300 flex items-start gap-2">
                            <span className="text-green-500 flex-shrink-0 mt-0.5">•</span> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Weaknesses */}
                  {ev?.weaknesses?.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">⚠️ Cần lưu ý</div>
                      <ul className="space-y-1.5">
                        {ev.weaknesses.map((w: string, i: number) => (
                          <li key={i} className="text-sm text-gray-600 dark:text-gray-300 flex items-start gap-2">
                            <span className="text-orange-400 flex-shrink-0 mt-0.5">•</span> {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* Tab: History */}
      {activeTab === 'history' && (
        <div className="card space-y-3">
          {(!app.status_history || app.status_history.length === 0) && (
            <p className="text-sm text-gray-500">{t('applications.noHistory')}</p>
          )}
          {app.status_history?.map((h) => (
            <div key={h.id} className="flex items-start gap-3">
              <div className="w-2 h-2 mt-2 bg-blue-400 rounded-full flex-shrink-0" />
              <div>
                <div className="text-sm">
                  <span className="font-medium">{h.changedBy?.name}</span> {t('applications.changedFrom')}{' '}
                  <span className="font-medium">{STATUS_LABELS[h.from_status] ?? h.from_status ?? t('applications.initial')}</span> {t('applications.to')}{' '}
                  <span className="font-medium text-blue-600">{STATUS_LABELS[h.to_status] ?? h.to_status}</span>
                </div>
                {h.note && <div className="text-xs text-gray-500 mt-0.5">{h.note}</div>}
                <div className="text-xs text-gray-400">{format(new Date(h.created_at), 'dd/MM/yyyy HH:mm')}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Interviews */}
      {activeTab === 'interviews' && (
        <div className="card space-y-4">
          {(!app.interviews || app.interviews.length === 0) && (
            <p className="text-gray-500 text-sm">{t('applications.noInterviews')}</p>
          )}
          {app.interviews?.map((interview) => (
            <div key={interview.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">{t('applications.round')} {interview.round}</div>
                <span className={`badge ${
                  interview.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                  interview.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                  interview.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {INTERVIEW_STATUS_LABELS[interview.status] ?? interview.status}
                </span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <div>{t('applications.interviewer')}: <span className="font-medium">{interview.interviewer?.name}</span></div>
                <div>{t('applications.time')}: {format(new Date(interview.scheduled_at), 'dd/MM/yyyy HH:mm')} ({interview.duration_minutes} {t('applications.durationLabel')})</div>
                <div>{t('applications.formatLabel')}: {interview.type === 'online' ? t('applications.online') : t('applications.offline')}</div>
                {interview.meeting_link && (
                  <div>{t('applications.link')}: <a href={interview.meeting_link} className="text-blue-600" target="_blank" rel="noreferrer">{interview.meeting_link}</a></div>
                )}
              </div>
              {interview.evaluations && interview.evaluations.length > 0 && (
                <div className="mt-3 pt-3 border-t space-y-1">
                  {interview.evaluations.map((ev) => (
                    <div key={ev.id} className="text-sm">
                      <span className="font-medium">{ev.evaluator?.name}:</span>{' '}
                      {t('applications.evalScore')} {ev.overall_score}/10 · {t('applications.evalResult')}{' '}
                      <span className={`font-medium ${ev.result === 'pass' ? 'text-green-600' : ev.result === 'fail' ? 'text-red-600' : 'text-yellow-600'}`}>
                        {ev.result === 'pass' ? t('applications.pass') : ev.result === 'fail' ? t('applications.fail') : t('applications.consider')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => setShowEvalModal(interview.id)} className="btn-outline mt-3 text-xs px-3 py-1">
                {t('applications.addEval')}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Notes */}
      {activeTab === 'notes' && (
        <div className="card space-y-4">
          <div className="space-y-2">
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder={t('applications.notePlaceholder')}
              rows={3}
              className="input"
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" checked={notePrivate} onChange={(e) => setNotePrivate(e.target.checked)} />
                {t('applications.privateNote')}
              </label>
              <button onClick={() => addNoteMutation.mutate()} disabled={!noteContent || addNoteMutation.isPending} className="btn-primary">
                {t('applications.addNote')}
              </button>
            </div>
          </div>
          {(!app.notes || app.notes.length === 0) && (
            <p className="text-sm text-gray-500">{t('applications.noNotes')}</p>
          )}
          {app.notes?.map((note) => (
            <div key={note.id} className={`p-3 rounded-lg text-sm dark:text-gray-200 ${note.is_private ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800' : 'bg-gray-50 dark:bg-gray-700'}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">{note.user?.name}</span>
                {note.is_private && <span className="badge bg-yellow-100 text-yellow-700 text-xs">{t('applications.internal')}</span>}
                <span className="text-gray-400 text-xs ml-auto">{format(new Date(note.created_at), 'dd/MM/yyyy HH:mm')}</span>
              </div>
              {note.content}
            </div>
          ))}
        </div>
      )}

      {/* Tab: Onboarding */}
      {activeTab === 'onboarding' && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{t('applications.onboardingProgress')}</span>
              <span className="text-sm font-bold text-gray-900">{completedCount}/{totalCount}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: totalCount ? `${(completedCount / totalCount) * 100}%` : '0%' }}
              />
            </div>
            {completedCount === totalCount && totalCount > 0 && (
              <p className="text-sm text-green-600 font-medium mt-2">{t('applications.onboardingDone')}</p>
            )}
          </div>

          {(['hr', 'it', 'manager', 'admin'] as const).map((cat) => {
            const catTasks = onboardingTasks?.filter((t: OnboardingTask) => t.category === cat) ?? []
            if (catTasks.length === 0) return null
            const { label, color } = CATEGORY_LABELS[cat]
            return (
              <div key={cat} className="card">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`badge ${color} text-xs`}>{label}</span>
                  <span className="text-sm text-gray-500">
                    {catTasks.filter((t: OnboardingTask) => t.is_completed).length}/{catTasks.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {catTasks.map((task: OnboardingTask) => (
                    <div key={task.id} className={`flex items-center gap-3 p-2 rounded-lg ${task.is_completed ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-700'}`}>
                      <input
                        type="checkbox"
                        checked={task.is_completed}
                        onChange={() => completeTaskMutation.mutate(task.id)}
                        className="h-4 w-4 rounded border-gray-300 text-green-600"
                      />
                      <span className={`flex-1 text-sm ${task.is_completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                        {task.title}
                      </span>
                      {task.is_completed && task.completed_by && (
                        <span className="text-xs text-gray-400">{task.completed_by.name}</span>
                      )}
                      <button
                        onClick={() => setConfirmDelTask({ id: task.id, title: task.title })}
                        className="text-red-400 hover:text-red-600 text-xs"
                      >✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          <div className="card">
            <h3 className="text-sm font-medium text-gray-700 mb-3">{t('applications.addTask')}</h3>
            <div className="flex gap-2">
              <input
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder={t('applications.taskPlaceholder')}
                className="input flex-1"
                onKeyDown={(e) => e.key === 'Enter' && newTaskTitle && addTaskMutation.mutate()}
              />
              <select value={newTaskCategory} onChange={(e) => setNewTaskCategory(e.target.value as any)} className="input w-32">
                <option value="hr">HR</option>
                <option value="it">IT</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
              <button
                onClick={() => newTaskTitle && addTaskMutation.mutate()}
                disabled={!newTaskTitle || addTaskMutation.isPending}
                className="btn-primary px-4"
              >
                {t('applications.addTaskBtn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Update Status */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold mb-4 dark:text-white">{t('applications.statusModalTitle')}</h2>
            {availableTransitions.length === 0 ? (
              <p className="text-sm text-gray-500 mb-4">
                {t('applications.noTransition', { status: STATUS_LABELS[app.status] ?? app.status })}
              </p>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="form-label">{t('applications.newStatus')}</label>
                  <select value={newStatus} onChange={(e) => setNewStatus(e.target.value as ApplicationStatus)} className="input">
                    <option value="">{t('applications.selectStatus')}</option>
                    {availableTransitions.map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>
                    ))}
                  </select>
                </div>
                {newStatus === 'rejected' && (
                  <div>
                    <label className="form-label">{t('applications.rejectionReasonLabel')}</label>
                    <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} rows={2} className="input" />
                  </div>
                )}
                <div>
                  <label className="form-label">{t('applications.noteLabel')}</label>
                  <textarea value={statusNote} onChange={(e) => setStatusNote(e.target.value)} rows={2} className="input" />
                </div>
              </div>
            )}
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowStatusModal(false)} className="btn-secondary">{t('common.cancel')}</button>
              {availableTransitions.length > 0 && (
                <button
                  onClick={() => changeStatusMutation.mutate()}
                  disabled={!newStatus || changeStatusMutation.isPending}
                  className="btn-primary"
                >
                  {changeStatusMutation.isPending ? 'Đang xử lý...' : t('applications.updateBtn')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Schedule Interview */}
      {showInterviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold mb-4 dark:text-white">{t('applications.interviewModalTitle')}</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const fd = new FormData(e.target as HTMLFormElement)
                scheduleInterviewMutation.mutate(Object.fromEntries(fd))
              }}
              className="space-y-3"
            >
              <div>
                <label className="form-label">{t('applications.interviewerLabel')}</label>
                <select name="interviewer_id" className="input" required>
                  <option value="">{t('applications.select')}</option>
                  {users?.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">{t('applications.dateTime')}</label>
                  <input name="scheduled_at" type="datetime-local" className="input" required />
                </div>
                <div>
                  <label className="form-label">{t('applications.durationLabel')}</label>
                  <input name="duration_minutes" type="number" defaultValue="60" min="15" className="input" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">{t('applications.formatLabel')}</label>
                  <select name="type" className="input">
                    <option value="online">{t('applications.online')}</option>
                    <option value="offline">{t('applications.offline')}</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">{t('applications.roundLabel')}</label>
                  <input name="round" type="number" defaultValue="1" min="1" className="input" />
                </div>
              </div>
              <div>
                <label className="form-label">{t('applications.meetingLink')}</label>
                <input name="meeting_link" type="url" className="input" placeholder="https://..." />
              </div>
              <div className="flex justify-end gap-3 mt-2">
                <button type="button" onClick={() => setShowInterviewModal(false)} className="btn-secondary">{t('common.cancel')}</button>
                <button type="submit" disabled={scheduleInterviewMutation.isPending} className="btn-primary">
                  {scheduleInterviewMutation.isPending ? 'Đang xử lý...' : t('common.update')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Interview Evaluation */}
      {showEvalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold mb-4 dark:text-white">{t('applications.evalModalTitle')}</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const fd = new FormData(e.target as HTMLFormElement)
                evalMutation.mutate({ interviewId: showEvalModal, data: Object.fromEntries(fd) })
              }}
              className="space-y-3"
            >
              {SCORE_FIELDS.map((field) => (
                <div key={field}>
                  <label className="form-label">{SCORE_LABELS[field]} (0-10)</label>
                  <input name={field} type="number" min="0" max="10" step="0.5" className="input" />
                </div>
              ))}
              <div>
                <label className="form-label">{t('applications.resultLabel')}</label>
                <select name="result" required className="input">
                  <option value="">{t('applications.selectResult')}</option>
                  <option value="pass">{t('applications.pass')}</option>
                  <option value="fail">{t('applications.fail')}</option>
                  <option value="consider">{t('applications.consider')}</option>
                </select>
              </div>
              <div>
                <label className="form-label">{t('applications.strengths')}</label>
                <textarea name="strengths" rows={2} className="input" />
              </div>
              <div>
                <label className="form-label">{t('applications.weaknesses')}</label>
                <textarea name="weaknesses" rows={2} className="input" />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowEvalModal(null)} className="btn-secondary">{t('common.cancel')}</button>
                <button type="submit" disabled={evalMutation.isPending} className="btn-primary">
                  {evalMutation.isPending ? t('applications.savingEval') : t('applications.saveEval')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm: Delete onboarding task */}
      <ConfirmDialog
        open={!!confirmDelTask}
        title={t('applications.deleteTaskTitle')}
        message={t('applications.deleteTaskMsg', { title: confirmDelTask?.title })}
        confirmLabel="Xóa"
        variant="danger"
        isPending={deleteTaskMutation.isPending}
        onConfirm={() => { deleteTaskMutation.mutate(confirmDelTask!.id); setConfirmDelTask(null) }}
        onCancel={() => setConfirmDelTask(null)}
      />

      {/* Modal: Send Email */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold mb-4 dark:text-white">{t('applications.emailModalTitle')}</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const fd = new FormData(e.target as HTMLFormElement)
                const templateCode = fd.get('template_code') as string
                const customMessage = fd.get('custom_message') as string
                applicationsApi.sendEmail(Number(id), templateCode, customMessage).then(() => {
                  toast.success(t('applications.emailQueued'))
                  setShowEmailModal(false)
                }).catch((err: any) => toast.error(err.response?.data?.message || 'Gửi email thất bại'))
              }}
              className="space-y-3"
            >
              <div>
                <label className="form-label">{t('applications.emailTemplateLabel')}</label>
                <select name="template_code" required className="input">
                  <option value="">{t('applications.selectEmailTemplate')}</option>
                  {emailTemplates?.map((t: any) => (
                    <option key={t.code} value={t.code}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">{t('applications.customMessage')}</label>
                <textarea name="custom_message" rows={3} className="input" placeholder={t('applications.customMessagePlaceholder')} />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowEmailModal(false)} className="btn-secondary">{t('common.cancel')}</button>
                <button type="submit" className="btn-primary">{t('applications.send')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
