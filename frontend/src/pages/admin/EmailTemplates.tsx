import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import client from '@/api/client'
import toast from 'react-hot-toast'
import { EmailTemplate } from '@/types'

export default function EmailTemplates() {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<EmailTemplate | null>(null)
  const { t } = useTranslation()

  const { data: templates, isLoading } = useQuery({
    queryKey: ['email-templates'],
    queryFn: () => client.get('/email-templates').then((r) => r.data),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => client.put(`/email-templates/${id}`, data),
    onSuccess: () => {
      toast.success(t('admin.emailTemplates.updated'))
      setEditing(null)
      queryClient.invalidateQueries({ queryKey: ['email-templates'] })
    },
    onError: (err: any) => toast.error(err.response?.data?.message || t('admin.emailTemplates.failed')),
  })

  if (isLoading) return <div className="animate-pulse h-32" />

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('admin.emailTemplates.title')}</h1>

      <div className="space-y-4">
        {templates?.map((template: EmailTemplate) => (
          <div key={template.id} className="card">
            {editing?.id === template.id ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  const fd = new FormData(e.target as HTMLFormElement)
                  updateMutation.mutate({ id: template.id, data: Object.fromEntries(fd) })
                }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{template.name}</span>
                  <span className="text-xs text-gray-500 font-mono">{template.code}</span>
                </div>
                <div>
                  <label className="form-label">{t('admin.emailTemplates.subjectField')}</label>
                  <input name="subject" defaultValue={template.subject} className="input" />
                </div>
                <div>
                  <label className="form-label">{t('admin.emailTemplates.bodyField')}</label>
                  <textarea name="body" defaultValue={template.body} rows={6} className="input font-mono text-sm" />
                </div>
                {template.variables && (
                  <div className="text-xs text-gray-500">
                    {t('admin.emailTemplates.variables')}: {template.variables.map((v) => `{${v}}`).join(', ')}
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setEditing(null)} className="btn-secondary">{t('common.cancel')}</button>
                  <button type="submit" disabled={updateMutation.isPending} className="btn-primary">
                    {updateMutation.isPending ? t('admin.emailTemplates.saving') : t('admin.emailTemplates.save')}
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-semibold">{template.name}</span>
                    <span className="ml-2 text-xs text-gray-400 font-mono">({template.code})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`badge ${template.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                      {template.is_active ? t('admin.emailTemplates.active') : t('admin.emailTemplates.inactive')}
                    </span>
                    <button onClick={() => setEditing(template)} className="text-blue-600 text-sm hover:underline">{t('admin.emailTemplates.edit')}</button>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{t('admin.emailTemplates.subjectLabel')}:</span> {template.subject}
                </div>
                {template.variables && (
                  <div className="text-xs text-gray-400 mt-1">
                    {t('admin.emailTemplates.variables')}: {template.variables.map((v) => <code key={v} className="bg-gray-100 dark:bg-gray-700 dark:text-gray-200 px-1 rounded mr-1">{`{${v}}`}</code>)}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
