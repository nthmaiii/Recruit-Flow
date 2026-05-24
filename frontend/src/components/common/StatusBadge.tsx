import { ApplicationStatus } from '@/types'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'

const statusColors: Record<string, string> = {
  new: 'bg-gray-100 text-gray-700',
  reviewing: 'bg-blue-100 text-blue-700',
  interview_scheduled: 'bg-purple-100 text-purple-700',
  interviewed: 'bg-yellow-100 text-yellow-700',
  offer_sent: 'bg-orange-100 text-orange-700',
  hired: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

export default function StatusBadge({ status }: { status: ApplicationStatus }) {
  const { t } = useTranslation()
  const color = statusColors[status] ?? 'bg-gray-100 text-gray-700'
  const label = t(`status.${status}`, { defaultValue: status })
  return <span className={clsx('badge', color)}>{label}</span>
}
