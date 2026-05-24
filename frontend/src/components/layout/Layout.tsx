import { Outlet, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout() {
  const { user } = useAuthStore()

  if (user?.must_change_password) {
    return <Navigate to="/change-password" replace />
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
