import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import client from '@/api/client'
import { format } from 'date-fns'

export default function ActivityLogs() {
  const [page, setPage] = useState(1)
  const { t } = useTranslation()

  const { data, isLoading } = useQuery({
    queryKey: ['activity-logs', page],
    queryFn: () => client.get('/activity-logs', { params: { page } }).then((r) => r.data),
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('admin.activityLogs.title')}</h1>

      <div className="card">
        {isLoading ? (
          <div className="animate-pulse h-32" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="table-header">{t('admin.activityLogs.user')}</th>
                  <th className="table-header">{t('admin.activityLogs.action')}</th>
                  <th className="table-header">{t('admin.activityLogs.object')}</th>
                  <th className="table-header">{t('admin.activityLogs.time')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {data?.data?.map((log: any) => (
                  <tr key={log.id}>
                    <td className="table-cell">
                      <div className="font-medium">{log.user?.name ?? t('admin.activityLogs.system')}</div>
                      <div className="text-xs text-gray-500">{log.ip_address}</div>
                    </td>
                    <td className="table-cell font-mono text-sm">{log.action}</td>
                    <td className="table-cell text-sm text-gray-500">
                      {log.model_type ? `${log.model_type} #${log.model_id}` : '-'}
                    </td>
                    <td className="table-cell text-gray-500 text-sm">
                      {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm')}
                    </td>
                  </tr>
                ))}
                {data?.data?.length === 0 && (
                  <tr>
                    <td colSpan={4} className="table-cell text-center text-gray-400 py-8">{t('admin.activityLogs.noLogs')}</td>
                  </tr>
                )}
              </tbody>
            </table>

            {data && data.last_page > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t dark:border-gray-700">
                <span className="text-sm text-gray-500">{t('admin.activityLogs.total', { count: data.total })}</span>
                <div className="flex gap-2">
                  <button disabled={page === 1} onClick={() => setPage(page - 1)} className="btn-outline px-3 py-1 text-xs">{t('common.previous')}</button>
                  <span className="text-sm py-1">{page} / {data.last_page}</span>
                  <button disabled={page === data.last_page} onClick={() => setPage(page + 1)} className="btn-outline px-3 py-1 text-xs">{t('common.next')}</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
