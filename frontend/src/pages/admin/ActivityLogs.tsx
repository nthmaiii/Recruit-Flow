import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import client from '@/api/client'
import { format } from 'date-fns'

const ACTION_LABELS: Record<string, string> = {
  'user.login': 'Đăng nhập',
  'user.logout': 'Đăng xuất',
  'user.change_password': 'Đổi mật khẩu',
  'user.create': 'Tạo người dùng',
  'user.update': 'Cập nhật người dùng',
  'user.delete': 'Xóa người dùng',
  'user.reset_password': 'Reset mật khẩu',
  'job.create': 'Tạo tin tuyển dụng',
  'job.update': 'Cập nhật tin tuyển dụng',
  'job.delete': 'Xóa tin tuyển dụng',
  'job.approve': 'Duyệt tin tuyển dụng',
  'job.reject_approval': 'Từ chối duyệt tin',
  'job.copy': 'Sao chép tin tuyển dụng',
  'job.close': 'Đóng tin tuyển dụng',
  'application.status_changed': 'Đổi trạng thái hồ sơ',
  'application.bulk_reject': 'Từ chối hàng loạt',
  'application.send_email': 'Gửi email ứng viên',
  'interview.schedule': 'Lên lịch phỏng vấn',
  'interview.update': 'Cập nhật lịch phỏng vấn',
  'interview.evaluate': 'Đánh giá phỏng vấn',
}

const ACTION_COLORS: Record<string, string> = {
  'user.login': 'bg-green-100 text-green-700',
  'user.logout': 'bg-gray-100 text-gray-500',
  'user.change_password': 'bg-yellow-100 text-yellow-700',
  'user.create': 'bg-blue-100 text-blue-700',
  'user.update': 'bg-blue-100 text-blue-600',
  'user.delete': 'bg-red-100 text-red-700',
  'user.reset_password': 'bg-orange-100 text-orange-700',
  'job.create': 'bg-indigo-100 text-indigo-700',
  'job.update': 'bg-indigo-100 text-indigo-600',
  'job.delete': 'bg-red-100 text-red-700',
  'job.approve': 'bg-green-100 text-green-700',
  'job.reject_approval': 'bg-orange-100 text-orange-700',
  'job.copy': 'bg-indigo-100 text-indigo-500',
  'job.close': 'bg-gray-100 text-gray-600',
  'application.status_changed': 'bg-purple-100 text-purple-700',
  'application.bulk_reject': 'bg-red-100 text-red-700',
  'application.send_email': 'bg-teal-100 text-teal-700',
  'interview.schedule': 'bg-cyan-100 text-cyan-700',
  'interview.update': 'bg-cyan-100 text-cyan-600',
  'interview.evaluate': 'bg-teal-100 text-teal-700',
}

const ACTION_GROUPS: Record<string, string[]> = {
  'Người dùng': ['user.login', 'user.logout', 'user.change_password', 'user.create', 'user.update', 'user.delete', 'user.reset_password'],
  'Tin tuyển dụng': ['job.create', 'job.update', 'job.delete', 'job.approve', 'job.reject_approval', 'job.copy', 'job.close'],
  'Hồ sơ ứng viên': ['application.status_changed', 'application.bulk_reject', 'application.send_email'],
  'Phỏng vấn': ['interview.schedule', 'interview.update', 'interview.evaluate'],
}

export default function ActivityLogs() {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ user_id: '', action: '', search: '', from_date: '', to_date: '' })
  const { t } = useTranslation()

  const { data, isLoading } = useQuery({
    queryKey: ['activity-logs', page, filters],
    queryFn: () => {
      const params: Record<string, any> = { page }
      if (filters.user_id) params.user_id = filters.user_id
      if (filters.action) params.action = filters.action
      if (filters.search) params.search = filters.search
      if (filters.from_date) params.from_date = filters.from_date
      if (filters.to_date) params.to_date = filters.to_date
      return client.get('/activity-logs', { params }).then((r) => r.data)
    },
  })

  const { data: userList } = useQuery({
    queryKey: ['activity-log-users'],
    queryFn: () => client.get('/activity-logs/users').then((r) => r.data),
    staleTime: 60_000,
  })

  const hasFilters = filters.user_id || filters.action || filters.search || filters.from_date || filters.to_date

  const handleFilter = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters((f) => ({ ...f, [e.target.name]: e.target.value }))
    setPage(1)
  }

  const handleReset = () => {
    setFilters({ user_id: '', action: '', search: '', from_date: '', to_date: '' })
    setPage(1)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.activityLogs.title')}</h1>
        {data && <span className="text-sm text-gray-500">Tổng: <strong>{data.total}</strong> bản ghi</span>}
      </div>

      {/* Bộ lọc */}
      <div className="card p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Tìm kiếm tên/email */}
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-gray-600 mb-1">Tìm kiếm người dùng</label>
            <input
              type="text"
              name="search"
              className="input w-full"
              placeholder="Nhập tên hoặc email..."
              value={filters.search}
              onChange={handleFilter}
            />
          </div>
          {/* Lọc theo user cụ thể */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Người dùng</label>
            <select name="user_id" className="input w-full" value={filters.user_id} onChange={handleFilter}>
              <option value="">Tất cả người dùng</option>
              {(userList ?? []).map((u: any) => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))}
            </select>
          </div>
          {/* Lọc theo hành động */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Hành động</label>
            <select name="action" className="input w-full" value={filters.action} onChange={handleFilter}>
              <option value="">Tất cả hành động</option>
              {Object.entries(ACTION_GROUPS).map(([group, actions]) => (
                <optgroup key={group} label={group}>
                  {actions.map((a) => (
                    <option key={a} value={a}>{ACTION_LABELS[a] ?? a}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Từ ngày</label>
            <input type="date" name="from_date" className="input w-full" value={filters.from_date} onChange={handleFilter} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Đến ngày</label>
            <input type="date" name="to_date" className="input w-full" value={filters.to_date} onChange={handleFilter} />
          </div>
          {hasFilters && (
            <div className="md:col-start-4 flex justify-end">
              <button onClick={handleReset} className="btn-outline text-sm px-4 py-2 w-full">
                Xóa bộ lọc
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bảng log */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="table-header w-40">Thời gian</th>
                <th className="table-header">Người dùng</th>
                <th className="table-header">Hành động</th>
                <th className="table-header">Đối tượng</th>
                <th className="table-header">Chi tiết</th>
                <th className="table-header w-32">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="table-cell text-center py-10">
                    <div className="animate-pulse text-gray-400">Đang tải...</div>
                  </td>
                </tr>
              ) : data?.data?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="table-cell text-center text-gray-400 py-10">
                    {hasFilters ? 'Không tìm thấy bản ghi phù hợp' : t('admin.activityLogs.noLogs')}
                  </td>
                </tr>
              ) : data?.data?.map((log: any) => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="table-cell text-xs text-gray-500 whitespace-nowrap">
                    {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss')}
                  </td>
                  <td className="table-cell">
                    {log.user ? (
                      <>
                        <div className="font-medium text-sm">{log.user.name}</div>
                        <div className="text-xs text-gray-400">{log.user.email}</div>
                      </>
                    ) : (
                      <span className="text-gray-400 text-sm">{t('admin.activityLogs.system')}</span>
                    )}
                  </td>
                  <td className="table-cell">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_COLORS[log.action] ?? 'bg-gray-100 text-gray-600'}`}>
                      {ACTION_LABELS[log.action] ?? log.action}
                    </span>
                  </td>
                  <td className="table-cell text-sm text-gray-500">
                    {log.model_type ? `${log.model_type} #${log.model_id}` : '-'}
                  </td>
                  <td className="table-cell text-xs text-gray-500 max-w-xs">
                    <LogDetail log={log} />
                  </td>
                  <td className="table-cell text-xs text-gray-400 font-mono">
                    {log.ip_address ?? '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t dark:border-gray-700">
            <span className="text-sm text-gray-500">{t('admin.activityLogs.total', { count: data.total })}</span>
            <div className="flex gap-2 items-center">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="btn-outline px-3 py-1 text-xs disabled:opacity-40"
              >
                {t('common.previous')}
              </button>
              <span className="text-sm text-gray-600">{page} / {data.last_page}</span>
              <button
                disabled={page === data.last_page}
                onClick={() => setPage(page + 1)}
                className="btn-outline px-3 py-1 text-xs disabled:opacity-40"
              >
                {t('common.next')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function LogDetail({ log }: { log: any }) {
  const details: string[] = []

  if (log.old_values && log.new_values?.status) {
    details.push(`${log.old_values.status} → ${log.new_values.status}`)
  } else if (log.new_values?.title) {
    details.push(log.new_values.title)
  } else if (log.new_values?.count != null) {
    details.push(`${log.new_values.count} hồ sơ`)
  } else if (log.new_values?.template_code) {
    details.push(`Template: ${log.new_values.template_code}`)
  } else if (log.new_values?.result) {
    details.push(`Kết quả: ${log.new_values.result}`)
  } else if (log.new_values?.scheduled_at) {
    details.push(format(new Date(log.new_values.scheduled_at), 'dd/MM/yyyy HH:mm'))
  } else if (log.old_values?.source_title) {
    details.push(`Sao chép từ: ${log.old_values.source_title}`)
  }

  return <span>{details.join(' | ') || '-'}</span>
}
