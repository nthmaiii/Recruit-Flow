import { ApplicationStatus } from '@/types'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'

const statusColors: Record<string, string> = {
  new: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
  reviewing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  interview_scheduled: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  interviewed: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  offer_sent: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  hired: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

export default function StatusBadge({ status }: { status: ApplicationStatus }) {
  const { t } = useTranslation()
  const color = statusColors[status] ?? 'bg-gray-100 text-gray-700'
  const label = t(`status.${status}`, { defaultValue: status })
  return <span className={clsx('badge', color)}>{label}</span>
}
