import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import client from '@/api/client'
import { format } from 'date-fns'

export default function HMDashboard() {
  const { t } = useTranslation()

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-hm'],
    queryFn: () => client.get('/reports/dashboard').then((r) => r.data),
  })

  if (isLoading) return <div className="animate-pulse">{t('common.loading')}</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.title')}</h1>

      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <div className="text-2xl font-bold text-blue-600">{data?.total_applications}</div>
          <div className="text-sm text-gray-500 mt-1">{t('dashboard.deptApplications')}</div>
        </div>
        <div className="card">
          <div className="text-2xl font-bold text-green-600">
            {data?.upcoming_interviews?.length ?? 0}
          </div>
          <div className="text-sm text-gray-500 mt-1">{t('dashboard.upcomingInterviews7')}</div>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">{t('dashboard.upcomingInterviews')}</h2>
        {!data?.upcoming_interviews?.length ? (
          <p className="text-gray-500 text-sm">{t('dashboard.noUpcomingInterviews')}</p>
        ) : (
          <div className="space-y-3">
            {data.upcoming_interviews.map((interview: any) => (
              <div key={interview.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-sm">{interview.application?.candidate?.full_name}</div>
                  <div className="text-xs text-gray-500">{interview.application?.job?.title}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {format(new Date(interview.scheduled_at), 'dd/MM/yyyy HH:mm')}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    interview.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {t(`interviewStatus.${interview.status}`, { defaultValue: interview.status })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
