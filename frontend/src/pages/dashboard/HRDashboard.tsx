import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { useTranslation } from 'react-i18next'
import client from '@/api/client'
import StatusBadge from '@/components/common/StatusBadge'
import { format, subDays } from 'date-fns'

export default function HRDashboard() {
  const { t } = useTranslation()

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => client.get('/reports/dashboard').then((r) => r.data),
  })

  if (isLoading) return <div className="animate-pulse">{t('common.loading')}</div>

  const statusData = Object.entries(data?.status_counts ?? {}).map(([status, count]) => ({
    status: t(`status.${status}`, { defaultValue: status }),
    count,
  }))

  const trendData = (() => {
    const apiMap = new Map((data?.trend ?? []).map((d: any) => [d.date, d.count]))
    return Array.from({ length: 30 }, (_, i) => {
      const date = format(subDays(new Date(), 29 - i), 'yyyy-MM-dd')
      return { date: format(subDays(new Date(), 29 - i), 'dd/MM'), count: apiMap.get(date) ?? 0 }
    })
  })()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.title')}</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="text-2xl font-bold text-blue-600">{data?.total_applications}</div>
          <div className="text-sm text-gray-500 mt-1">{t('dashboard.totalApplications')}</div>
        </div>
        <div className="card">
          <div className="text-2xl font-bold text-green-600">{data?.total_jobs}</div>
          <div className="text-sm text-gray-500 mt-1">{t('dashboard.activeJobs')}</div>
        </div>
        <div className="card">
          <div className="text-2xl font-bold text-purple-600">{data?.hired_this_month}</div>
          <div className="text-sm text-gray-500 mt-1">{t('dashboard.hiredThisMonth')}</div>
        </div>
        <div className="card">
          <div className="text-2xl font-bold text-orange-600">
            {data?.status_counts?.new ?? 0}
          </div>
          <div className="text-sm text-gray-500 mt-1">{t('dashboard.newApplications')}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">{t('dashboard.applicationsByStatus')}</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">{t('dashboard.trend30Days')}</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">{t('dashboard.needsAction')}</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="table-header">{t('applications.candidate')}</th>
                <th className="table-header">{t('applications.position')}</th>
                <th className="table-header">{t('common.status')}</th>
                <th className="table-header">{t('applications.appliedAt')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.needs_action?.map((app: any) => (
                <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="table-cell font-medium">{app.candidate?.full_name}</td>
                  <td className="table-cell">{app.job?.title}</td>
                  <td className="table-cell"><StatusBadge status={app.status} /></td>
                  <td className="table-cell text-gray-500">
                    {format(new Date(app.created_at), 'dd/MM/yyyy')}
                  </td>
                </tr>
              ))}
              {!data?.needs_action?.length && (
                <tr>
                  <td colSpan={4} className="table-cell text-center text-gray-400 py-6">{t('dashboard.noNeedsAction')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
