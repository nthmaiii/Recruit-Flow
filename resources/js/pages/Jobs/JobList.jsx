import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { JobStatusBadge } from '../../components/Common/StatusBadge';
import useAuth from '../../hooks/useAuth';

export default function JobList() {
    const [jobs, setJobs] = useState({ data: [], meta: {} });
    const [filters, setFilters] = useState({ status: '', search: '', page: 1 });
    const [loading, setLoading] = useState(true);
    const { isHR } = useAuth();
    const navigate = useNavigate();

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
            const { data } = await api.get('/jobs', { params });
            setJobs(data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchJobs(); }, [filters]);

    const handleClose = async (job) => {
        if (!confirm(`Đóng tin "${job.title}"?`)) return;
        try {
            await api.post(`/jobs/${job.id}/close`);
            toast.success('Đã đóng tin tuyển dụng');
            fetchJobs();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Lỗi khi đóng tin');
        }
    };

    const handleDuplicate = async (job) => {
        try {
            await api.post(`/jobs/${job.id}/duplicate`);
            toast.success('Đã tạo bản sao');
            fetchJobs();
        } catch {
            toast.error('Lỗi khi sao chép');
        }
    };

    const handleDelete = async (job) => {
        if (!confirm(`Xóa tin "${job.title}"?`)) return;
        try {
            await api.delete(`/jobs/${job.id}`);
            toast.success('Đã xóa tin tuyển dụng');
            fetchJobs();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Lỗi khi xóa');
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">Tin tuyển dụng</h1>
                {isHR() && (
                    <Link to="/jobs/create" className="btn-primary">
                        + Tạo tin mới
                    </Link>
                )}
            </div>

            {/* Filters */}
            <div className="card flex flex-wrap gap-3">
                <input
                    type="text"
                    placeholder="Tìm kiếm tiêu đề..."
                    className="input max-w-xs"
                    value={filters.search}
                    onChange={e => setFilters({ ...filters, search: e.target.value, page: 1 })}
                />
                <select
                    className="input max-w-48"
                    value={filters.status}
                    onChange={e => setFilters({ ...filters, status: e.target.value, page: 1 })}
                >
                    <option value="">Tất cả trạng thái</option>
                    <option value="draft">Nháp</option>
                    <option value="published">Đang đăng</option>
                    <option value="closed">Đã đóng</option>
                </select>
            </div>

            {/* Table */}
            <div className="card p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="text-left px-4 py-3 font-medium text-gray-500">Tiêu đề</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500">Bộ phận</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500">SL</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500">Hạn nộp</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500">Hồ sơ</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500">Trạng thái</th>
                                {isHR() && <th className="px-4 py-3"></th>}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} className="text-center py-8 text-gray-400">Đang tải...</td></tr>
                            ) : jobs.data.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-8 text-gray-400">Không có tin tuyển dụng</td></tr>
                            ) : jobs.data.map(job => (
                                <tr key={job.id} className="border-b border-gray-50 hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <Link to={`/jobs/${job.id}`} className="font-medium text-blue-700 hover:underline">
                                            {job.title}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">{job.department?.name}</td>
                                    <td className="px-4 py-3 text-gray-600">{job.quantity}</td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {new Date(job.deadline).toLocaleDateString('vi-VN')}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Link to={`/jobs/${job.id}/applications`} className="text-blue-600 hover:underline">
                                            {job.applications_count} hồ sơ
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3"><JobStatusBadge status={job.status} /></td>
                                    {isHR() && (
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <Link to={`/jobs/${job.id}/edit`} className="text-xs text-gray-600 hover:text-blue-600">
                                                    Sửa
                                                </Link>
                                                <button onClick={() => handleDuplicate(job)} className="text-xs text-gray-600 hover:text-blue-600">
                                                    Sao chép
                                                </button>
                                                {job.status === 'published' && (
                                                    <button onClick={() => handleClose(job)} className="text-xs text-orange-600 hover:text-orange-700">
                                                        Đóng
                                                    </button>
                                                )}
                                                <button onClick={() => handleDelete(job)} className="text-xs text-red-600 hover:text-red-700">
                                                    Xóa
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {jobs.meta?.last_page > 1 && (
                    <div className="flex justify-center gap-2 p-4 border-t border-gray-100">
                        {Array.from({ length: jobs.meta.last_page }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => setFilters({ ...filters, page })}
                                className={`px-3 py-1 rounded text-sm ${
                                    page === filters.page
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {page}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
