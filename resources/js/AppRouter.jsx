import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import useAuth from './hooks/useAuth';
import api from './utils/api';

import Login from './pages/Login';
import AppLayout from './components/Layout/AppLayout';
import HRDashboard from './pages/Dashboard/HRDashboard';
import HMDashboard from './pages/Dashboard/HMDashboard';
import JobList from './pages/Jobs/JobList';
import JobForm from './pages/Jobs/JobForm';
import JobDetail from './pages/Jobs/JobDetail';
import ApplicationList from './pages/Applications/ApplicationList';
import ApplicationDetail from './pages/Applications/ApplicationDetail';
import ApplyForm from './pages/Public/ApplyForm';
import CandidatePortal from './pages/Candidate/CandidatePortal';
import UserManagement from './pages/Admin/UserManagement';
import DepartmentManagement from './pages/Admin/DepartmentManagement';
import EmailTemplates from './pages/Admin/EmailTemplates';
import ActivityLogs from './pages/Admin/ActivityLogs';
import Reports from './pages/Reports/Reports';

function PrivateRoute({ children, roles }) {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" replace />;
    if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
    return children;
}

function InterviewConfirm() {
    const { token } = useParams();
    const [status, setStatus] = useState('loading');

    useEffect(() => {
        api.get(`/interviews/confirm/${token}`)
            .then(() => setStatus('success'))
            .catch(() => setStatus('error'));
    }, [token]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="card max-w-md text-center p-8">
                {status === 'loading' && <p className="text-gray-500">Đang xử lý...</p>}
                {status === 'success' && (
                    <>
                        <div className="text-green-500 text-6xl mb-4">&#10003;</div>
                        <h2 className="text-xl font-bold">Xác nhận thành công!</h2>
                        <p className="text-gray-500 mt-2">Bạn đã xác nhận tham gia phỏng vấn.</p>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <div className="text-red-500 text-6xl mb-4">&#10007;</div>
                        <h2 className="text-xl font-bold">Link không hợp lệ</h2>
                        <p className="text-gray-500 mt-2">Link đã hết hạn hoặc đã được sử dụng.</p>
                    </>
                )}
            </div>
        </div>
    );
}

export default function AppRouter() {
    const { user } = useAuth();

    return (
        <Routes>
            <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
            <Route path="/jobs/:slug/apply" element={<ApplyForm />} />
            <Route path="/interviews/confirm/:token" element={<InterviewConfirm />} />

            <Route path="/candidate/*" element={
                <PrivateRoute roles={['CANDIDATE']}>
                    <CandidatePortal />
                </PrivateRoute>
            } />

            <Route path="/" element={
                <PrivateRoute roles={['SA', 'HR', 'HM']}>
                    <AppLayout />
                </PrivateRoute>
            }>
                <Route index element={<Navigate to="/dashboard" />} />
                <Route path="dashboard" element={
                    user?.role === 'HM' ? <HMDashboard /> : <HRDashboard />
                } />
                <Route path="jobs" element={<JobList />} />
                <Route path="jobs/create" element={
                    <PrivateRoute roles={['SA', 'HR']}><JobForm /></PrivateRoute>
                } />
                <Route path="jobs/:id/edit" element={
                    <PrivateRoute roles={['SA', 'HR']}><JobForm /></PrivateRoute>
                } />
                <Route path="jobs/:id" element={<JobDetail />} />
                <Route path="jobs/:jobId/applications" element={<ApplicationList />} />
                <Route path="applications/:id" element={<ApplicationDetail />} />
                <Route path="reports" element={
                    <PrivateRoute roles={['SA', 'HR']}><Reports /></PrivateRoute>
                } />
                <Route path="admin/users" element={
                    <PrivateRoute roles={['SA']}><UserManagement /></PrivateRoute>
                } />
                <Route path="admin/departments" element={
                    <PrivateRoute roles={['SA']}><DepartmentManagement /></PrivateRoute>
                } />
                <Route path="admin/email-templates" element={
                    <PrivateRoute roles={['SA', 'HR']}><EmailTemplates /></PrivateRoute>
                } />
                <Route path="admin/activity-logs" element={
                    <PrivateRoute roles={['SA']}><ActivityLogs /></PrivateRoute>
                } />
            </Route>

            <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} />} />
        </Routes>
    );
}
