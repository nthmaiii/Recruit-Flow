import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { jobsApi } from '@/api/jobs'
import { applicationsApi } from '@/api/applications'
import toast from 'react-hot-toast'

const JOB_TYPE_LABEL: Record<string, string> = {
  full_time: 'Toàn thời gian',
  part_time: 'Bán thời gian',
  contract: 'Hợp đồng',
  internship: 'Thực tập',
  remote: 'Làm từ xa',
}

export default function ApplyForm() {
  const { slug } = useParams()
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')

  const { data: job, isLoading } = useQuery({
    queryKey: ['job-public', slug],
    queryFn: () => jobsApi.publicDetail(slug!).then((r) => r.data),
  })

  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data: any) => {
    if (!data.cv?.[0]) { toast.error('Vui lòng tải lên CV của bạn'); return }

    setLoading(true)
    const formData = new FormData()
    formData.append('full_name', data.full_name)
    formData.append('email', data.email)
    formData.append('phone', data.phone || '')
    formData.append('cover_letter', data.cover_letter || '')
    formData.append('cv', data.cv[0])

    try {
      await applicationsApi.apply(slug!, formData)
      setSubmittedEmail(data.email)
      setSubmitted(true)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Nộp hồ sơ thất bại, vui lòng thử lại')
    } finally {
      setLoading(false)
    }
  }

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">Đang tải...</div>
  )
  if (!job) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">Không tìm thấy tin tuyển dụng</div>
  )

  if (submitted) {
    const trackingUrl = `${window.location.origin}/candidate?email=${encodeURIComponent(submittedEmail)}`
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="card max-w-lg w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Nộp hồ sơ thành công!</h2>
          <p className="text-gray-500 mb-6">
            Cảm ơn bạn đã ứng tuyển vị trí <strong>{job.title}</strong>. Chúng tôi sẽ xem xét hồ sơ và liên hệ sớm nhất.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left mb-4">
            <p className="text-sm font-semibold text-blue-800 mb-2">Lưu link để theo dõi trạng thái hồ sơ:</p>
            <div className="flex gap-2">
              <input
                readOnly
                value={trackingUrl}
                className="input text-xs flex-1 bg-white"
                onFocus={(e) => e.target.select()}
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(trackingUrl)
                  toast.success('Đã copy link!')
                }}
                className="btn-primary text-sm px-3 whitespace-nowrap"
              >
                Copy
              </button>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              Lưu link này để theo dõi trạng thái hồ sơ bất cứ lúc nào.
            </p>
          </div>

          <a href={trackingUrl} className="text-blue-600 hover:underline text-sm">
            Xem trạng thái hồ sơ ngay →
          </a>
        </div>
      </div>
    )
  }

  const isExpired = job.is_expired

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Job Info */}
        <div className="card mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
              <div className="flex gap-3 mt-2 text-sm text-gray-500 flex-wrap">
                {job.location && <span>{job.location}</span>}
                {job.type && <><span>·</span><span>{JOB_TYPE_LABEL[job.type] ?? job.type}</span></>}
                {job.department?.name && <><span>·</span><span>{job.department.name}</span></>}
              </div>
            </div>
            {isExpired && (
              <span className="badge bg-red-100 text-red-700 whitespace-nowrap flex-shrink-0">Đã hết hạn</span>
            )}
          </div>

          {job.deadline && (
            <p className={`text-sm mt-3 ${isExpired ? 'text-red-500' : 'text-gray-500'}`}>
              {isExpired ? '⚠ Hạn nộp hồ sơ đã kết thúc ngày' : 'Hạn nộp:'}{' '}
              <strong>{new Date(job.deadline).toLocaleDateString('vi-VN')}</strong>
            </p>
          )}

          <div className="mt-4 text-sm text-gray-700 whitespace-pre-wrap">{job.description}</div>
        </div>

        {/* Expired Banner or Apply Form */}
        {isExpired ? (
          <div className="card border-2 border-red-200 bg-red-50 text-center py-10">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-red-700 mb-2">Tin tuyển dụng đã đóng</h2>
            <p className="text-sm text-red-600">
              Vị trí này đã hết hạn nộp hồ sơ và không còn nhận đơn ứng tuyển.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Vui lòng theo dõi các vị trí khác tại trang tuyển dụng của chúng tôi.
            </p>
          </div>
        ) : (
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Nộp hồ sơ ứng tuyển</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Họ và tên *</label>
                  <input
                    {...register('full_name', {
                      required: 'Vui lòng nhập họ và tên',
                      minLength: { value: 2, message: 'Họ tên phải có ít nhất 2 ký tự' },
                    })}
                    className="input"
                    placeholder="Nguyễn Văn A"
                  />
                  {errors.full_name && <p className="form-error">{String(errors.full_name.message)}</p>}
                </div>
                <div>
                  <label className="form-label">Email *</label>
                  <input
                    {...register('email', {
                      required: 'Vui lòng nhập email',
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Email không hợp lệ',
                      },
                    })}
                    type="email"
                    className="input"
                    placeholder="email@example.com"
                  />
                  {errors.email && <p className="form-error">{String(errors.email.message)}</p>}
                </div>
              </div>

              <div>
                <label className="form-label">Số điện thoại</label>
                <input
                  {...register('phone', {
                    pattern: {
                      value: /^0[0-9]{9}$/,
                      message: 'Số điện thoại phải có đúng 10 chữ số và bắt đầu bằng số 0',
                    },
                  })}
                  type="tel"
                  className="input"
                  placeholder="0912345678"
                  maxLength={10}
                />
                {errors.phone && <p className="form-error">{String(errors.phone.message)}</p>}
                <p className="text-xs text-gray-400 mt-1">Ví dụ: 0912345678 (10 số, bắt đầu bằng 0)</p>
              </div>

              <div>
                <label className="form-label">CV / Hồ sơ * <span className="text-gray-400 font-normal">(PDF, DOC, DOCX – tối đa 5MB)</span></label>
                <input
                  {...register('cv', { required: 'Vui lòng tải lên CV của bạn' })}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="input"
                />
                {errors.cv && <p className="form-error">{String(errors.cv.message)}</p>}
              </div>

              <div>
                <label className="form-label">Thư xin việc <span className="text-gray-400 font-normal">(không bắt buộc)</span></label>
                <textarea
                  {...register('cover_letter', {
                    maxLength: { value: 5000, message: 'Thư xin việc không được vượt quá 5000 ký tự' },
                  })}
                  rows={4}
                  className="input"
                  placeholder="Chia sẻ lý do bạn phù hợp với vị trí này..."
                />
                {errors.cover_letter && <p className="form-error">{String(errors.cover_letter.message)}</p>}
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Đang gửi...' : 'Nộp hồ sơ'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
