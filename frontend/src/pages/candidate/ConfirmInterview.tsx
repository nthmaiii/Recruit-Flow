import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { interviewsApi } from '@/api/interviews'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const TYPE_LABELS: Record<string, string> = {
  online: 'Online',
  offline: 'Trực tiếp',
}

export default function ConfirmInterview() {
  const { token } = useParams()
  const [responded, setResponded] = useState(false)
  const [action, setAction] = useState<'confirm' | 'decline' | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['interview-confirm', token],
    queryFn: () => interviewsApi.getByToken(token!).then((r) => r.data),
  })

  const mutation = useMutation({
    mutationFn: (act: 'confirm' | 'decline') => interviewsApi.confirmByToken(token!, act),
    onSuccess: (_, act) => {
      setAction(act)
      setResponded(true)
    },
    onError: () => toast.error('Có lỗi xảy ra, vui lòng thử lại'),
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Đang tải...</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="card max-w-md text-center">
          <div className="text-4xl mb-4">🔗</div>
          <h2 className="text-xl font-bold text-red-600 mb-2">Link không hợp lệ</h2>
          <p className="text-gray-500">Link xác nhận này không hợp lệ hoặc đã được sử dụng.</p>
        </div>
      </div>
    )
  }

  if (responded) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="card max-w-md text-center">
          <div className={`text-5xl mb-4 ${action === 'confirm' ? 'text-green-600' : 'text-red-500'}`}>
            {action === 'confirm' ? '✓' : '✗'}
          </div>
          <h2 className="text-xl font-bold mb-2">
            {action === 'confirm' ? 'Đã xác nhận tham dự!' : 'Đã từ chối lịch phỏng vấn'}
          </h2>
          <p className="text-gray-500">
            {action === 'confirm'
              ? 'Cảm ơn bạn! Chúng tôi rất mong được gặp bạn trong buổi phỏng vấn.'
              : 'Chúng tôi đã ghi nhận phản hồi của bạn và sẽ liên hệ lại để sắp xếp thời gian phù hợp.'}
          </p>
        </div>
      </div>
    )
  }

  const interview = data.interview

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12">
      <div className="max-w-md w-full px-4">
        <div className="card">
          <div className="text-center mb-6">
            <div className="text-3xl mb-2">📅</div>
            <h1 className="text-2xl font-bold text-gray-900">Thư mời phỏng vấn</h1>
            <p className="text-gray-500 mt-1">Vui lòng xác nhận tham dự hoặc từ chối buổi phỏng vấn bên dưới.</p>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-2 mb-6 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Vị trí:</span>
              <span className="font-medium text-right">{interview.application?.job?.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Ứng viên:</span>
              <span className="font-medium">{interview.application?.candidate?.full_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Người phỏng vấn:</span>
              <span className="font-medium">{interview.interviewer?.name}</span>
            </div>
            <div className="border-t border-blue-100 my-1" />
            <div className="flex justify-between">
              <span className="text-gray-500">Thời gian:</span>
              <span className="font-semibold text-blue-700">
                {format(new Date(interview.scheduled_at), 'HH:mm, dd/MM/yyyy')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Thời lượng:</span>
              <span>{interview.duration_minutes} phút</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Hình thức:</span>
              <span>{TYPE_LABELS[interview.type] ?? interview.type}</span>
            </div>
            {interview.location && (
              <div className="flex justify-between">
                <span className="text-gray-500">Địa điểm:</span>
                <span className="text-right">{interview.location}</span>
              </div>
            )}
            {interview.meeting_link && (
              <div className="flex justify-between items-start">
                <span className="text-gray-500 flex-shrink-0">Link họp:</span>
                <a
                  href={interview.meeting_link}
                  className="text-blue-600 break-all text-right ml-2"
                  target="_blank"
                  rel="noreferrer"
                >
                  {interview.meeting_link}
                </a>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => mutation.mutate('confirm')}
              disabled={mutation.isPending}
              className="btn-primary flex-1"
            >
              {mutation.isPending ? 'Đang xử lý...' : '✓ Xác nhận tham dự'}
            </button>
            <button
              onClick={() => mutation.mutate('decline')}
              disabled={mutation.isPending}
              className="btn-danger flex-1"
            >
              ✗ Từ chối
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
