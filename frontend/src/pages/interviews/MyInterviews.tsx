import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import client from '@/api/client'
import { useAuthStore } from '@/store/authStore'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
}

const TYPE_LABELS: Record<string, string> = {
  online: 'Trực tuyến',
  offline: 'Trực tiếp',
}

export default function MyInterviews() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['my-interviews', { status, fromDate, toDate, page }],
    queryFn: () => {
      const params: Record<string, any> = { page }
      if (status) params.status = status
      if (fromDate) params.from_date = fromDate
      if (toDate) params.to_date = toDate
      return client.get('/interviews', { params }).then((r) => r.data)
    },
  })

  const confirmMutation = useMutation({
    mutationFn: (id: number) => client.put(`/interviews/${id}`, { status: 'confirmed' }),
    onSuccess: () => {
      toast.success('Đã xác nhận tham dự phỏng vấn')
      queryClient.invalidateQueries({ queryKey: ['my-interviews'] })
    },
    onError: () => toast.error('Xác nhận thất bại, vui lòng thử lại'),
  })

  const isHM = user?.role === 'hiring_manager'
  const hasFilters = status || fromDate || toDate

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isHM ? 'Lịch phỏng vấn của tôi' : 'Tất cả lịch phỏng vấn'}
        </h1>
        {data && (
          <span className="text-sm text-gray-500">
            Tổng: <strong>{data.total}</strong> lịch
          </span>
        )}
      </div>

      {/* Bộ lọc */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Trạng thái</label>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1) }}
              className="input w-full"
            >
              <option value="">Tất cả</option>
              <option value="pending">Chờ xác nhận</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="completed">Hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Từ ngày</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setPage(1) }}
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Đến ngày</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setPage(1) }}
              className="input w-full"
            />
          </div>
          {hasFilters && (
            <div>
              <button
                onClick={() => { setStatus(''); setFromDate(''); setToDate(''); setPage(1) }}
                className="btn-outline text-sm px-4 py-2 w-full"
              >
                Xóa bộ lọc
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Danh sách lịch phỏng vấn */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="table-header">Thời gian</th>
                <th className="table-header">Ứng viên</th>
                <th className="table-header">Vị trí</th>
                <th className="table-header">Hình thức</th>
                <th className="table-header">Địa điểm / Link</th>
                <th className="table-header">Trạng thái</th>
                <th className="table-header">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="table-cell text-center py-10">
                    <div className="animate-pulse text-gray-400">Đang tải...</div>
                  </td>
                </tr>
              ) : data?.data?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="table-cell text-center text-gray-400 py-10">
                    Không có lịch phỏng vấn nào
                  </td>
                </tr>
              ) : (
                data?.data?.map((interview: any) => (
                  <tr
                    key={interview.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="table-cell text-sm whitespace-nowrap">
                      <div className="font-medium">
                        {format(new Date(interview.scheduled_at), 'dd/MM/yyyy')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(interview.scheduled_at), 'HH:mm')} · {interview.duration_minutes} phút
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="font-medium text-sm">
                        {interview.application?.candidate?.full_name ?? '-'}
                      </div>
                      <div className="text-xs text-gray-400">
                        {interview.application?.candidate?.email}
                      </div>
                    </td>
                    <td className="table-cell text-sm">
                      {interview.application?.job?.title ?? '-'}
                    </td>
                    <td className="table-cell text-sm">
                      {TYPE_LABELS[interview.type] ?? interview.type}
                    </td>
                    <td className="table-cell text-sm text-gray-500 max-w-xs truncate">
                      {interview.meeting_link ? (
                        <a
                          href={interview.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {interview.meeting_link}
                        </a>
                      ) : (
                        interview.location ?? '-'
                      )}
                    </td>
                    <td className="table-cell">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[interview.status] ?? 'bg-gray-100 text-gray-600'}`}
                      >
                        {STATUS_LABELS[interview.status] ?? interview.status}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex gap-1.5 flex-wrap">
                        {interview.status === 'pending' && isHM && (
                          <button
                            onClick={() => confirmMutation.mutate(interview.id)}
                            disabled={confirmMutation.isPending}
                            className="btn-action-green"
                          >
                            Xác nhận
                          </button>
                        )}
                        <button
                          onClick={() =>
                            navigate(`/applications/${interview.application_id}`)
                          }
                          className="btn-action-blue"
                        >
                          Xem hồ sơ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data && data.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t dark:border-gray-700">
            <span className="text-sm text-gray-500">
              Tổng {data.total} lịch phỏng vấn
            </span>
            <div className="flex gap-2 items-center">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="btn-outline px-3 py-1 text-xs disabled:opacity-40"
              >
                Trước
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {page} / {data.last_page}
              </span>
              <button
                disabled={page === data.last_page}
                onClick={() => setPage(page + 1)}
                className="btn-outline px-3 py-1 text-xs disabled:opacity-40"
              >
                Tiếp
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
