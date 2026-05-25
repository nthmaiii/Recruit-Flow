import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/api/auth'
import Layout from '@/components/layout/Layout'
import Login from '@/pages/auth/Login'
import ChangePassword from '@/pages/auth/ChangePassword'
import HRDashboard from '@/pages/dashboard/HRDashboard'
import HMDashboard from '@/pages/dashboard/HMDashboard'
import JobList from '@/pages/jobs/JobList'
import JobForm from '@/pages/jobs/JobForm'
import ApplicationList from '@/pages/applications/ApplicationList'
import ApplicationDetail from '@/pages/applications/ApplicationDetail'
import UserManagement from '@/pages/admin/UserManagement'
import DepartmentManagement from '@/pages/admin/DepartmentManagement'
import EmailTemplates from '@/pages/admin/EmailTemplates'
import ActivityLogs from '@/pages/admin/ActivityLogs'
import MyInterviews from '@/pages/interviews/MyInterviews'
import ApplyForm from '@/pages/candidate/ApplyForm'
import CandidatePortal from '@/pages/candidate/CandidatePortal'
import ConfirmInterview from '@/pages/candidate/ConfirmInterview'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, staleTime: 30000 } },
})

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, token } = useAuthStore()

  if (!token) return <Navigate to="/login" replace />
  if (!user) return null
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />

  return <>{children}</>
}

function DashboardRedirect() {
  const { user } = useAuthStore()
  if (!user) return null
  if (user.role === 'hiring_manager') return <HMDashboard />
  return <HRDashboard />
}

function AppInit({ children }: { children: React.ReactNode }) {
  const { token, user, setAuth, clearAuth } = useAuthStore()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (token && !user) {
      authApi.me()
        .then(res => setAuth(res.data, token))
        .catch(() => clearAuth())
        .finally(() => setReady(true))
    } else {
      setReady(true)
    }
  }, [])

  if (!ready) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent" />
    </div>
  )
  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster position="top-right" />
        <AppInit>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/jobs/:slug/apply" element={<ApplyForm />} />
          <Route path="/confirm-interview/:token" element={<ConfirmInterview />} />
          <Route path="/my-applications" element={<CandidatePortal />} />
          <Route path="/candidate" element={<CandidatePortal />} />

          {/* Staff routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardRedirect />} />
            <Route path="change-password" element={<ChangePassword />} />

            {/* Jobs */}
            <Route path="jobs" element={<JobList />} />
            <Route path="jobs/new" element={<JobForm />} />
            <Route path="jobs/:id/edit" element={<JobForm />} />

            {/* Applications */}
            <Route path="applications" element={<ApplicationList />} />
            <Route path="applications/:id" element={<ApplicationDetail />} />

            {/* Interviews */}
            <Route path="interviews" element={<MyInterviews />} />

            {/* Admin only */}
            <Route
              path="users"
              element={
                <ProtectedRoute roles={['super_admin']}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="departments"
              element={
                <ProtectedRoute roles={['super_admin']}>
                  <DepartmentManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="email-templates"
              element={
                <ProtectedRoute roles={['super_admin']}>
                  <EmailTemplates />
                </ProtectedRoute>
              }
            />
            <Route
              path="activity-logs"
              element={
                <ProtectedRoute roles={['super_admin']}>
                  <ActivityLogs />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        </AppInit>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
