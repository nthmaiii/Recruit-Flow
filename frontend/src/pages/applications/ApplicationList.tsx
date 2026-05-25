import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { applicationsApi } from '@/api/applications'
import { jobsApi } from '@/api/jobs'
import StatusBadge from '@/components/common/StatusBadge'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function ApplicationList() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [jobId, setJobId] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<number[]>([])
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailTemplateCode, setEmailTemplateCode] = useState('rejection')

  const STATUS_OPTIONS = [
    { value: 'new', label: t('status.new') },
    { value: 'reviewing', label: t('status.reviewing') },
    { value: 'interview_scheduled', label: t('status.interview_scheduled') },
    { value: 'interviewed', label: t('status.interviewed') },
    { value: 'hired', label: t('status.hired') },
    { value: 'rejected', label: t('status.rejected') },
  ]

  const { data: jobsData } = useQuery({
    queryKey: ['jobs-list-all'],
    queryFn: () => jobsApi.list({ page: 1 }).then((r) => r.data.data ?? []),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['applications', { search, status, jobId, page }],
    queryFn: () => applicationsApi.list({ search, status, job_id: jobId || undefined, page }).then((r) => r.data),
  })

  const bulkRejectMutation = useMutation({
    mutationFn: () => applicationsApi.bulkReject(selected, rejectReason),
    onSuccess: () => {
      toast.success(t('applications.rejectTitle', { count: selected.length }))
      setSelected([])
      setShowRejectModal(false)
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
    onError: (err: any) => toast.error(err.response?.data?.message || t('jobs.saveFail')),
  })

  const bulkEmailMutation = useMutation({
    mutationFn: () => applicationsApi.bulkEmail(selected, emailTemplateCode),
    onSuccess: () => {
      toast.success(t('applications.sendEmailTitle', { count: selected.length }))
      setSelected([])
      setShowEmailModal(false)
    },
    onError: (err: any) => toast.error(err.response?.data?.message || t('jobs.saveFail')),
  })

  const handleExport = async () => {
    const res = await applicationsApi.export({ status, search })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'applications.xlsx')
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  const toggleSelect = (id: number) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  const toggleAll = () => {
    const ids = data?.data?.map((a: any) => a.id) ?? []
    setSelected(selected.length === ids.length ? [] : ids)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('applications.title')}</h1>
        <button onClick={handleExport} className="btn-secondary">{t('applications.exportExcel')}</button>
      </div>

      <div className="card">
        <div className="flex gap-4 mb-4 flex-wrap">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('applications.searchPlaceholder')}
            className="input max-w-xs"
          />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="input w-48">
            <option value="">{t('applications.allStatuses')}</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <select value={jobId} onChange={(e) => { setJobId(e.target.value); setPage(1) }} className="input w-56">
            <option value="">Tất cả vị trí</option>
            {(jobsData ?? []).map((j: any) => (
              <option key={j.id} value={j.id}>{j.title}</option>
            ))}
          </select>
          {selected.length > 0 && (
            <>
              <button onClick={() => setShowRejectModal(true)} className="btn-danger">
                {t('applications.rejectSelected', { count: selected.length })}
              </button>
              <button onClick={() => setShowEmailModal(true)} className="btn-secondary">
                {t('applications.sendEmailBtn', { count: selected.length })}
              </button>
            </>
          )}
        </div>

        {isLoading ? (
          <div className="animate-pulse h-32" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="table-header w-10">
                    <input
                      type="checkbox"
                      onChange={toggleAll}
                      checked={selected.length === data?.data?.length && data?.data?.length > 0}
                    />
                  </th>
                  <th className="table-header">{t('applications.candidate')}</th>
                  <th className="table-header">{t('applications.position')}</th>
                  <th className="table-header">{t('common.status')}</th>
                  <th className="table-header">{t('applications.rating')}</th>
                  <th className="table-header">{t('applications.appliedAt')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {data?.data?.map((app: any) => (
                  <tr
                    key={app.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer"
                    onClick={() => navigate(`/applications/${app.id}`)}
                  >
                    <td className="table-cell" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.includes(app.id)}
                        onChange={() => toggleSelect(app.id)}
                      />
                    </td>
                    <td className="table-cell">
                      <div className="font-medium">{app.candidate?.full_name}</div>
                      <div className="text-xs text-gray-500">{app.candidate?.email}</div>
                    </td>
                    <td className="table-cell">
                      <div>{app.job?.title}</div>
                      <div className="text-xs text-gray-500">{app.job?.department?.name}</div>
                    </td>
                    <td className="table-cell"><StatusBadge status={app.status} /></td>
                    <td className="table-cell">
                      {app.rating ? (
                        <span className="font-medium text-yellow-600">{app.rating}/10</span>
                      ) : '-'}
                    </td>
                    <td className="table-cell text-gray-500">
                      {format(new Date(app.created_at), 'dd/MM/yyyy')}
                    </td>
                  </tr>
                ))}
                {data?.data?.length === 0 && (
                  <tr>
                    <td colSpan={6} className="table-cell text-center text-gray-400 py-8">
                      {t('applications.noApplications')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {data && data.last_page > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <span className="text-sm text-gray-500">{t('applications.total', { count: data.total })}</span>
                <div className="flex gap-2">
                  <button disabled={page === 1} onClick={() => setPage(page - 1)} className="btn-outline px-3 py-1 text-xs">
                    {t('common.previous')}
                  </button>
                  <span className="text-sm py-1">{page} / {data.last_page}</span>
                  <button disabled={page === data.last_page} onClick={() => setPage(page + 1)} className="btn-outline px-3 py-1 text-xs">
                    {t('common.next')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Send Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold mb-4 dark:text-white">{t('applications.sendEmailTitle', { count: selected.length })}</h2>
            <div className="mb-4">
              <label className="form-label">{t('applications.selectTemplate')}</label>
              <select
                value={emailTemplateCode}
                onChange={(e) => setEmailTemplateCode(e.target.value)}
                className="input"
              >
                <option value="application_received">{t('applications.template_cv_received')}</option>
                <option value="interview_invitation">{t('applications.template_interview_invitation')}</option>
                <option value="rejection">{t('applications.template_rejection')}</option>
                <option value="offer_letter">{t('applications.template_offer_letter')}</option>
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowEmailModal(false)} className="btn-secondary">{t('common.cancel')}</button>
              <button onClick={() => bulkEmailMutation.mutate()} disabled={bulkEmailMutation.isPending} className="btn-primary">
                {bulkEmailMutation.isPending ? t('applications.queueing') : t('applications.confirmSend')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold mb-4 dark:text-white">{t('applications.rejectTitle', { count: selected.length })}</h2>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={t('applications.rejectPlaceholder')}
              rows={3}
              className="input mb-4"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowRejectModal(false)} className="btn-secondary">{t('common.cancel')}</button>
              <button onClick={() => bulkRejectMutation.mutate()} disabled={bulkRejectMutation.isPending} className="btn-danger">
                {bulkRejectMutation.isPending ? t('jobs.updating') : t('applications.confirmReject')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
