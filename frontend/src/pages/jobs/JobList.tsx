import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { jobsApi } from '@/api/jobs'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import ConfirmDialog from '@/components/common/ConfirmDialog'

const JOB_STATUS_COLORS: Record<string, string> = {
  published: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  closed: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  pending_approval: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
}

type ConfirmState = {
  title: string
  message: string
  confirmLabel: string
  variant: 'danger' | 'warning'
  onConfirm: () => void
} | null

export default function JobList() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [rejectModal, setRejectModal] = useState<{ id: number; title: string } | null>(null)
  const [rejectNote, setRejectNote] = useState('')
  const [confirm, setConfirm] = useState<ConfirmState>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['jobs', { search, status, page }],
    queryFn: () => jobsApi.list({ search, status, page }).then((r) => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: jobsApi.delete,
    onSuccess: () => { toast.success(t('jobs.deleteTitle')); setConfirm(null); queryClient.invalidateQueries({ queryKey: ['jobs'] }) },
    onError: (err: any) => toast.error(err.response?.data?.message || t('jobs.saveFail')),
  })

  const closeMutation = useMutation({
    mutationFn: jobsApi.close,
    onSuccess: () => { toast.success(t('jobs.closeTitle')); setConfirm(null); queryClient.invalidateQueries({ queryKey: ['jobs'] }) },
    onError: (err: any) => toast.error(err.response?.data?.message || t('jobs.saveFail')),
  })

  const copyMutation = useMutation({
    mutationFn: jobsApi.copy,
    onSuccess: () => { toast.success(t('jobs.duplicateTitle')); setConfirm(null); queryClient.invalidateQueries({ queryKey: ['jobs'] }) },
    onError: (err: any) => toast.error(err.response?.data?.message || t('jobs.saveFail')),
  })

  const approveMutation = useMutation({
    mutationFn: jobsApi.approve,
    onSuccess: () => { toast.success(t('jobs.approveTitle')); setConfirm(null); queryClient.invalidateQueries({ queryKey: ['jobs'] }) },
    onError: (err: any) => toast.error(err.response?.data?.message || t('jobs.saveFail')),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, note }: { id: number; note: string }) => jobsApi.rejectApproval(id, note),
    onSuccess: () => {
      toast.success(t('jobs.rejectApprovalTitle'))
      setRejectModal(null)
      setRejectNote('')
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
    onError: (err: any) => toast.error(err.response?.data?.message || t('jobs.saveFail')),
  })

  const canManage = user?.role !== 'hiring_manager'
  const canApprove = user?.role === 'super_admin' || user?.role === 'hr'

  const copyApplyLink = (slug: string) => {
    const link = `${window.location.origin}/jobs/${slug}/apply`
    navigator.clipboard.writeText(link).then(() => toast.success(t('jobs.copiedLink')))
  }

  const isPending = deleteMutation.isPending || closeMutation.isPending || copyMutation.isPending || approveMutation.isPending

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('jobs.title')}</h1>
        <button onClick={() => navigate('/jobs/new')} className="btn-primary">
          + {canManage ? t('jobs.newJob') : t('jobs.recruitmentRequest')}
        </button>
      </div>

      <div className="card">
        <div className="flex gap-4 mb-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('jobs.searchPlaceholder')}
            className="input max-w-xs"
          />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="input max-w-xs">
            <option value="">{t('jobs.allStatuses')}</option>
            <option value="draft">{t('jobStatus.draft')}</option>
            <option value="pending_approval">{t('jobStatus.pending_approval')}</option>
            <option value="published">{t('jobStatus.published')}</option>
            <option value="closed">{t('jobStatus.closed')}</option>
          </select>
        </div>

        {isLoading ? (
          <div className="animate-pulse h-32" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="table-header">{t('jobs.position')}</th>
                  <th className="table-header">{t('jobs.department')}</th>
                  <th className="table-header">{t('common.status')}</th>
                  <th className="table-header">{t('jobs.applications')}</th>
                  <th className="table-header">{t('jobs.deadline')}</th>
                  <th className="table-header">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {data?.data?.map((job: any) => (
                  <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="table-cell">
                      <div className="font-medium">{job.title}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {job.location} · {t(`jobType.${job.type}` as any) ?? job.type}
                      </div>
                      {job.approval_note && (
                        <div className="text-xs text-red-500 mt-0.5">{t('jobs.rejectionReason')} {job.approval_note}</div>
                      )}
                    </td>
                    <td className="table-cell">{job.department?.name}</td>
                    <td className="table-cell">
                      <span className={`badge ${JOB_STATUS_COLORS[job.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {t(`jobStatus.${job.status}` as any) ?? job.status}
                      </span>
                    </td>
                    <td className="table-cell">{job.applications_count ?? 0}</td>
                    <td className="table-cell">{job.deadline ? format(new Date(job.deadline), 'dd/MM/yyyy') : '-'}</td>
                    <td className="table-cell">
                      <div className="flex gap-1.5 flex-wrap">
                        {job.status === 'pending_approval' && canApprove ? (
                          <>
                            <button
                              onClick={() => setConfirm({
                                title: t('jobs.approveTitle'),
                                message: t('jobs.approveMsg', { title: job.title }),
                                confirmLabel: t('jobs.approveBtn'),
                                variant: 'warning',
                                onConfirm: () => approveMutation.mutate(job.id),
                              })}
                              className="btn-action-green"
                            >
                              {t('jobs.approve')}
                            </button>
                            <button
                              onClick={() => { setRejectModal({ id: job.id, title: job.title }); setRejectNote('') }}
                              className="btn-action-red"
                            >
                              {t('jobs.reject')}
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => navigate(`/jobs/${job.id}/edit`)} className="btn-action-blue">
                              {t('common.update')}
                            </button>
                            <button
                              onClick={() => setConfirm({
                                title: t('jobs.duplicateTitle'),
                                message: t('jobs.duplicateMsg', { title: job.title }),
                                confirmLabel: t('jobs.duplicateBtn'),
                                variant: 'warning',
                                onConfirm: () => copyMutation.mutate(job.id),
                              })}
                              className="btn-action-gray"
                            >
                              {t('jobs.duplicate')}
                            </button>
                            {job.status === 'published' && (
                              <>
                                <button
                                  onClick={() => copyApplyLink(job.slug)}
                                  className="btn-action-green"
                                  title={t('jobs.copyLink')}
                                >
                                  {t('jobs.copyLink')}
                                </button>
                                <button
                                  onClick={() => setConfirm({
                                    title: t('jobs.closeTitle'),
                                    message: t('jobs.closeMsg', { title: job.title }),
                                    confirmLabel: t('jobs.closeBtn'),
                                    variant: 'warning',
                                    onConfirm: () => closeMutation.mutate(job.id),
                                  })}
                                  className="btn-action-orange"
                                >
                                  {t('jobs.closeJob')}
                                </button>
                              </>
                            )}
                            {canManage && (
                              <button
                                onClick={() => setConfirm({
                                  title: t('jobs.deleteTitle'),
                                  message: t('jobs.deleteMsg', { title: job.title }),
                                  confirmLabel: t('jobs.deleteBtn'),
                                  variant: 'danger',
                                  onConfirm: () => deleteMutation.mutate(job.id),
                                })}
                                className="btn-action-red"
                              >
                                {t('jobs.deleteBtn')}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {data?.data?.length === 0 && (
                  <tr>
                    <td colSpan={6} className="table-cell text-center text-gray-400 py-8">
                      {t('jobs.noJobs')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {data && data.last_page > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t dark:border-gray-700">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {t('jobs.showing', { from: data.from, to: data.to, total: data.total })}
                </span>
                <div className="flex gap-2">
                  <button disabled={page === 1} onClick={() => setPage(page - 1)} className="btn-outline px-3 py-1 text-xs">{t('common.previous')}</button>
                  <span className="text-sm py-1 dark:text-gray-300">{page} / {data.last_page}</span>
                  <button disabled={page === data.last_page} onClick={() => setPage(page + 1)} className="btn-outline px-3 py-1 text-xs">{t('common.next')}</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reject Approval Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold mb-2 dark:text-white">{t('jobs.rejectApprovalTitle')}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4"><strong>{rejectModal.title}</strong></p>
            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder={t('jobs.rejectPlaceholder')}
              rows={3}
              className="input mb-4"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setRejectModal(null)} className="btn-secondary">{t('common.cancel')}</button>
              <button
                onClick={() => rejectMutation.mutate({ id: rejectModal.id, note: rejectNote })}
                disabled={rejectMutation.isPending}
                className="btn-danger"
              >
                {rejectMutation.isPending ? t('jobs.updating') : t('jobs.confirmReject')}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title ?? ''}
        message={confirm?.message ?? ''}
        confirmLabel={confirm?.confirmLabel}
        variant={confirm?.variant ?? 'danger'}
        isPending={isPending}
        onConfirm={() => confirm?.onConfirm()}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}
