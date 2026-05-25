import React, { useEffect, useState, useCallback } from 'react';
import api from '../../utils/api';

const ACTION_LABELS = {
    login: 'Đăng nhập',
    logout: 'Đăng xuất',
    change_password: 'Đổi mật khẩu',
    create_user: 'Tạo người dùng',
    update_user: 'Cập nhật người dùng',
    reset_password: 'Reset mật khẩu',
    activate_user: 'Kích hoạt tài khoản',
    deactivate_user: 'Khóa tài khoản',
    change_application_status: 'Cập nhật trạng thái hồ sơ',
    send_email: 'Gửi email',
    bulk_reject: 'Từ chối hàng loạt',
    schedule_interview: 'Lên lịch phỏng vấn',
    evaluate_interview: 'Đánh giá phỏng vấn',
};

const ACTION_COLORS = {
    login: 'bg-green-100 text-green-700',
    logout: 'bg-gray-100 text-gray-600',
    change_password: 'bg-yellow-100 text-yellow-700',
    create_user: 'bg-blue-100 text-blue-700',
    update_user: 'bg-blue-100 text-blue-700',
    reset_password: 'bg-orange-100 text-orange-700',
    activate_user: 'bg-green-100 text-green-700',
    deactivate_user: 'bg-red-100 text-red-700',
    change_application_status: 'bg-purple-100 text-purple-700',
    send_email: 'bg-indigo-100 text-indigo-700',
    bulk_reject: 'bg-red-100 text-red-700',
    schedule_interview: 'bg-teal-100 text-teal-700',
    evaluate_interview: 'bg-teal-100 text-teal-700',
};

function formatDateTime(dt) {
    if (!dt) return '-';
    const d = new Date(dt);
    return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function ActivityLogs() {
    const [logs, setLogs] = useState({ data: [], current_page: 1, last_page: 1, total: 0 });
    const [users, setUsers] = useState([]);
    const [filters, setFilters] = useState({ user_id: '', action: '', from_date: '', to_date: '' });
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);

    const fetchLogs = useCallback(() => {
        setLoading(true);
        const params = { page, ...filters };
        Object.keys(params).forEach(k => !params[k] && delete params[k]);
        api.get('/admin/activity-logs', { params })
            .then(res => setLogs(res.data))
            .finally(() => setLoading(false));
    }, [page, filters]);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    useEffect(() => {
        api.get('/admin/users', { params: { per_page: 100 } }).then(res => setUsers(res.data.data ?? []));
    }, []);

    const handleFilter = (e) => {
        setFilters(f => ({ ...f, [e.target.name]: e.target.value }));
        setPage(1);
    };

    const handleReset = () => {
        setFilters({ user_id: '', action: '', from_date: '', to_date: '' });
        setPage(1);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">Nhật ký hoạt động</h1>
                <span className="text-sm text-gray-500">Tổng: {logs.total} bản ghi</span>
            </div>

            {/* Filters */}
            <div className="card p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                        <label className="label">Người dùng</label>
                        <select name="user_id" className="input" value={filters.user_id} onChange={handleFilter}>
                            <option value="">Tất cả</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="label">Hành động</label>
                        <select name="action" className="input" value={filters.action} onChange={handleFilter}>
                            <option value="">Tất cả</option>
                            {Object.entries(ACTION_LABELS).map(([k, v]) => (
                                <option key={k} value={k}>{v}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="label">Từ ngày</label>
                        <input type="date" name="from_date" className="input" value={filters.from_date} onChange={handleFilter} />
                    </div>
                    <div>
                        <label className="label">Đến ngày</label>
                        <input type="date" name="to_date" className="input" value={filters.to_date} onChange={handleFilter} />
                    </div>
                </div>
                <div className="mt-3 flex justify-end">
                    <button onClick={handleReset} className="btn-secondary text-sm">Xóa bộ lọc</button>
                </div>
            </div>

            {/* Table */}
            <div className="card p-0 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="text-left px-4 py-3 font-medium text-gray-500">Thời gian</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-500">Người dùng</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-500">Hành động</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-500">Chi tiết</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-500">IP</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} className="text-center py-10 text-gray-400">Đang tải...</td></tr>
                        ) : logs.data.length === 0 ? (
                            <tr><td colSpan={5} className="text-center py-10 text-gray-400">Chưa có dữ liệu nhật ký</td></tr>
                        ) : logs.data.map(log => (
                            <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50">
                                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDateTime(log.created_at)}</td>
                                <td className="px-4 py-3">
                                    {log.user ? (
                                        <div>
                                            <div className="font-medium">{log.user.name}</div>
                                            <div className="text-xs text-gray-400">{log.user.email}</div>
                                        </div>
                                    ) : <span className="text-gray-400">-</span>}
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_COLORS[log.action] ?? 'bg-gray-100 text-gray-600'}`}>
                                        {ACTION_LABELS[log.action] ?? log.action}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{log.details || '-'}</td>
                                <td className="px-4 py-3 text-gray-400 text-xs">{log.ip_address || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {logs.last_page > 1 && (
                <div className="flex justify-center gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="btn-secondary text-sm disabled:opacity-40"
                    >
                        &laquo; Trước
                    </button>
                    <span className="flex items-center text-sm text-gray-600">
                        Trang {page} / {logs.last_page}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(logs.last_page, p + 1))}
                        disabled={page === logs.last_page}
                        className="btn-secondary text-sm disabled:opacity-40"
                    >
                        Sau &raquo;
                    </button>
                </div>
            )}
        </div>
    );
}
