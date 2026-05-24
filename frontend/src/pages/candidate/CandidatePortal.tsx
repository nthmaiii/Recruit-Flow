import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { applicationsApi } from '@/api/applications'
import StatusBadge from '@/components/common/StatusBadge'
import { format } from 'date-fns'
import { Application } from '@/types'

export default function CandidatePortal() {
  const [searchParams] = useSearchParams()
  const emailFromUrl = searchParams.get('email') ?? ''

  const [email, setEmail] = useState(emailFromUrl)
  const [submittedEmail, setSubmittedEmail] = useState(emailFromUrl)

  const { data: applications, isLoading } = useQuery({
    queryKey: ['candidate-applications', submittedEmail],
    queryFn: () => applicationsApi.candidateApplications(submittedEmail).then((r) => r.data),
    enabled: Boolean(submittedEmail),
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittedEmail(email)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tra cứu hồ sơ</h1>
          <p className="text-gray-500 mt-2">Nhập email để xem trạng thái hồ sơ ứng tuyển</p>
        </div>

        <div className="card mb-6">
          <form onSubmit={handleSearch} className="flex gap-3">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="email@cua.ban.com"
              className="input flex-1"
              required
            />
            <button type="submit" className="btn-primary">Tra cứu</button>
          </form>
        </div>

        {isLoading && <div className="animate-pulse text-center text-gray-400">Đang tải...</div>}

        {applications && (
          <div className="space-y-4">
            {applications.length === 0 ? (
              <div className="card text-center text-gray-500">Không tìm thấy hồ sơ nào cho email này.</div>
            ) : (
              applications.map((app: Application) => (
                <div key={app.id} className="card">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{app.job?.title}</h3>
                      <div className="text-sm text-gray-500 mt-1">
                        {app.job?.department?.name} · Nộp ngày {format(new Date(app.created_at), 'dd/MM/yyyy')}
                      </div>
                    </div>
                    <StatusBadge status={app.status} />
                  </div>

                  {app.interviews && app.interviews.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-xs font-medium text-gray-500 mb-2">LỊCH PHỎNG VẤN</div>
                      {app.interviews
                        .filter((i) => i.status !== 'cancelled')
                        .slice(0, 2)
                        .map((interview) => (
                          <div key={interview.id} className="text-sm text-gray-700">
                            Vòng {interview.round}: {format(new Date(interview.scheduled_at), 'dd/MM/yyyy HH:mm')}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
