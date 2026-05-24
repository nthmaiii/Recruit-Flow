import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '@/api/client'
import toast from 'react-hot-toast'
import ConfirmDialog from '@/components/common/ConfirmDialog'

export default function UserManagement() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [tempPassword, setTempPassword] = useState('')
  const [search, setSearch] = useState('')
  const [confirmToggle, setConfirmToggle] = useState<{ id: number; name: string; is_active: boolean } | null>(null)

  const ROLE_LABELS: Record<string, string> = {
    super_admin: t('admin.users.superAdmin'),
    hr: t('admin.users.hr'),
    hiring_manager: t('admin.users.hiringManager'),
  }

  const { data, isLoading } = useQuery({
    queryKey: ['users', { search }],
    queryFn: () => client.get('/users', { params: { search } }).then((r) => r.data),
  })

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => client.get('/departments').then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (formData: any) => client.post('/users', formData),
    onSuccess: (res) => {
      setTempPassword(res.data.temp_password)
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Thao tác thất bại'),
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: any) => client.put(`/users/${id}`, { is_active }),
    onSuccess: () => {
      setConfirmToggle(null)
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Thao tác thất bại'),
  })

  const resetPwMutation = useMutation({
    mutationFn: (id: number) => client.post(`/users/${id}/reset-password`),
    onSuccess: (res) => toast.success(`Mật khẩu tạm: ${res.data.temp_password}`),
    onError: (err: any) => toast.error(err.response?.data?.message || 'Reset thất bại'),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('admin.users.title')}</h1>
        <button onClick={() => { setShowModal(true); setTempPassword('') }} className="btn-primary">{t('admin.users.newUser')}</button>
      </div>

      <div className="card">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('admin.users.searchPlaceholder')}
          className="input max-w-xs mb-4"
        />

        {isLoading ? <div className="animate-pulse h-32" /> : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="table-header">{t('admin.users.name')}</th>
                <th className="table-header">{t('admin.users.role')}</th>
                <th className="table-header">{t('admin.users.department')}</th>
                <th className="table-header">{t('common.status')}</th>
                <th className="table-header">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {data?.data?.map((user: any) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="table-cell">
                    <div className="font-medium">{user.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
                  </td>
                  <td className="table-cell">
                    <span className="badge bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                      {ROLE_LABELS[user.role] ?? user.role}
                    </span>
                  </td>
                  <td className="table-cell">{user.department?.name ?? '-'}</td>
                  <td className="table-cell">
                    <span className={`badge ${user.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'}`}>
                      {user.is_active ? t('admin.users.active') : t('admin.users.inactive')}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => setConfirmToggle({ id: user.id, name: user.name, is_active: user.is_active })}
                        className={user.is_active ? 'btn-action-red' : 'btn-action-green'}
                      >
                        {user.is_active ? t('admin.users.lock') : t('admin.users.activate')}
                      </button>
                      <button
                        onClick={() => resetPwMutation.mutate(user.id)}
                        disabled={resetPwMutation.isPending}
                        className="btn-action-orange"
                      >
                        {t('admin.users.resetPassword')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal: Create Account */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl">
            {tempPassword ? (
              <div className="text-center">
                <div className="text-green-600 text-2xl mb-3">✓</div>
                <h2 className="text-lg font-semibold mb-2 dark:text-white">{t('admin.users.createdTitle')}</h2>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 mb-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400">{t('admin.users.tempPassword')}</div>
                  <div className="text-xl font-mono font-bold dark:text-white">{tempPassword}</div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {t('admin.users.sharePassword')}
                </p>
                <button onClick={() => setShowModal(false)} className="btn-primary w-full">{t('admin.users.done')}</button>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-semibold mb-4 dark:text-white">{t('admin.users.createTitle')}</h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    const fd = new FormData(e.target as HTMLFormElement)
                    createMutation.mutate(Object.fromEntries(fd))
                  }}
                  className="space-y-3"
                >
                  <div>
                    <label className="form-label">{t('admin.users.nameLabel')}</label>
                    <input name="name" required className="input" />
                  </div>
                  <div>
                    <label className="form-label">{t('admin.users.emailLabel')}</label>
                    <input name="email" type="email" required className="input" />
                  </div>
                  <div>
                    <label className="form-label">{t('admin.users.roleLabel')}</label>
                    <select name="role" required className="input">
                      <option value="hr">{t('admin.users.hr')}</option>
                      <option value="hiring_manager">{t('admin.users.hiringManager')}</option>
                      <option value="super_admin">{t('admin.users.superAdmin')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">{t('admin.users.deptLabel')}</label>
                    <select name="department_id" className="input">
                      <option value="">{t('admin.users.noDept')}</option>
                      {departments?.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="flex justify-end gap-3 mt-2">
                    <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">{t('common.cancel')}</button>
                    <button type="submit" disabled={createMutation.isPending} className="btn-primary">
                      {createMutation.isPending ? t('admin.users.creating') : t('common.create')}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmToggle}
        title={confirmToggle?.is_active ? t('admin.users.lockTitle') : t('admin.users.activateTitle')}
        message={
          confirmToggle?.is_active
            ? t('admin.users.lockMsg', { name: confirmToggle?.name })
            : t('admin.users.activateMsg', { name: confirmToggle?.name })
        }
        confirmLabel={confirmToggle?.is_active ? t('admin.users.lockBtn') : t('admin.users.activateBtn')}
        variant={confirmToggle?.is_active ? 'danger' : 'warning'}
        isPending={toggleActiveMutation.isPending}
        onConfirm={() => toggleActiveMutation.mutate({ id: confirmToggle!.id, is_active: !confirmToggle!.is_active })}
        onCancel={() => setConfirmToggle(null)}
      />
    </div>
  )
}
