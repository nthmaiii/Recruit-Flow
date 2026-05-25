import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/authStore'
import clsx from 'clsx'

const allNavItems = [
  { key: 'nav.dashboard', path: '/dashboard', roles: ['super_admin', 'hr', 'hiring_manager'] },
  { key: 'nav.jobs', path: '/jobs', roles: ['super_admin', 'hr', 'hiring_manager'] },
  { key: 'nav.applications', path: '/applications', roles: ['super_admin', 'hr', 'hiring_manager'] },
  { key: 'nav.interviews', path: '/interviews', roles: ['super_admin', 'hr', 'hiring_manager'] },
  { key: 'nav.users', path: '/users', roles: ['super_admin'] },
  { key: 'nav.departments', path: '/departments', roles: ['super_admin'] },
  { key: 'nav.emailTemplates', path: '/email-templates', roles: ['super_admin'] },
  { key: 'nav.activityLogs', path: '/activity-logs', roles: ['super_admin'] },
]

export default function Sidebar() {
  const { user } = useAuthStore()
  const { t } = useTranslation()

  const navItems = allNavItems.filter(
    (item) => user && item.roles.includes(user.role)
  )

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-xl font-bold text-white">RecruitFlow</h1>
        <p className="text-xs text-gray-400 mt-1">{user?.role?.replace('_', ' ')}</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              clsx(
                'flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )
            }
          >
            {t(item.key)}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <div className="text-sm text-gray-400">{user?.name}</div>
        <div className="text-xs text-gray-500">{user?.email}</div>
      </div>
    </aside>
  )
}
