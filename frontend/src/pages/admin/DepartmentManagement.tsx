import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '@/api/client'
import toast from 'react-hot-toast'
import ConfirmDialog from '@/components/common/ConfirmDialog'

export default function DepartmentManagement() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [confirmDel, setConfirmDel] = useState<{ id: number; name: string } | null>(null)

  const { data: departments, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => client.get('/departments').then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => client.post('/departments', data),
    onSuccess: () => {
      toast.success(t('admin.departments.addTitle'))
      setShowModal(false)
      queryClient.invalidateQueries({ queryKey: ['departments'] })
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Thao tác thất bại'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => client.delete(`/departments/${id}`),
    onSuccess: () => {
      toast.success('Đã xóa bộ phận')
      setConfirmDel(null)
      queryClient.invalidateQueries({ queryKey: ['departments'] })
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Không thể xóa bộ phận này'),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('admin.departments.title')}</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary">{t('admin.departments.newDept')}</button>
      </div>

      {isLoading ? <div className="animate-pulse h-32" /> : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {departments?.map((dept: any) => (
            <div key={dept.id} className="card">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">{dept.name}</h3>
                <button
                  onClick={() => setConfirmDel({ id: dept.id, name: dept.name })}
                  className="btn-action-red"
                >
                  Xóa
                </button>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{dept.description || t('admin.departments.noDescription')}</p>
              <div className="text-xs text-gray-400">
                {t('admin.departments.manager')} {dept.manager?.name ?? t('admin.departments.noManager')} · {dept.users_count ?? 0} {t('admin.departments.members')}
              </div>
            </div>
          ))}
          {departments?.length === 0 && (
            <p className="text-sm text-gray-400 col-span-3">{t('admin.departments.noDepts')}</p>
          )}
        </div>
      )}

      {/* Modal: Add Department */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold mb-4 dark:text-white">{t('admin.departments.addTitle')}</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const fd = new FormData(e.target as HTMLFormElement)
                createMutation.mutate(Object.fromEntries(fd))
              }}
              className="space-y-3"
            >
              <div>
                <label className="form-label">{t('admin.departments.nameLabel')}</label>
                <input name="name" required className="input" />
              </div>
              <div>
                <label className="form-label">{t('admin.departments.descLabel')}</label>
                <textarea name="description" rows={3} className="input" />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">{t('common.cancel')}</button>
                <button type="submit" disabled={createMutation.isPending} className="btn-primary">
                  {createMutation.isPending ? t('admin.departments.creating') : t('common.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDel}
        title={t('admin.departments.deleteTitle')}
        message={t('admin.departments.deleteMsg', { name: confirmDel?.name })}
        confirmLabel={t('admin.departments.deleteBtn')}
        variant="danger"
        isPending={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(confirmDel!.id)}
        onCancel={() => setConfirmDel(null)}
      />
    </div>
  )
}
