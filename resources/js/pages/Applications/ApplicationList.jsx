import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { ApplicationStatusBadge } from '../../components/Common/StatusBadge';
import Modal from '../../components/Common/Modal';
import useAuth from '../../hooks/useAuth';
import { REJECTION_REASONS } from '../../utils/constants';

export default function ApplicationList() {
    const { jobId } = useParams();
    const { isHR } = useAuth();
    const [apps, setApps] = useState({ data: [], meta: {} });
    const [filters, setFilters] = useState({ status: '', search: '', page: 1 });
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState([]);
    const [bulkModal, setBulkModal] = useState(false);
    const [bulkForm, setBulkForm] = useState({ rejection_reason: '', note: '' });

    const fetchApps = async () => {
        setLoading(true);
        try {
            const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
            const { data } = await api.get(`/jobs/${jobId}/applications`, { params });
            setApps(data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchApps(); }, [filters]);

    const handleBulkReject = async () => {
        if (selected.length === 0) return;
        try {
            await api.post('/applications/bulk-reject', {
                application_ids: selected,
                ...bulkForm,
            });
            toast.success(`Đã từ chối ${selected.length} hồ sơ`);
            setSelected([]);
            setBulkModal(false);
            fetchApps();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Lỗi khi từ chối hàng loạt');
        }
    };

    const handleExport = () => {
        window.open(`/api/v1/jobs/${jobId}/applications/export`, '_blank');
    };

    const toggleSelect = (id) => {
        setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const toggleAll = () => {
        setSelected(prev =>
            prev.length === apps.data.length ? [] : apps.data.map(a => a.id)
        );
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h1 className="text-2xl font-bold text-gray-800">Hồ sơ ứng tuyển</h1>
                <div className="flex gap-2">
                    {isHR() && selected.length > 0 && (
                        <button onClick={() => setBulkModal(true)} className="btn-danger text-sm">
                            Từ chối {selected.length} hồ sơ
                        </button>
                    )}
                    {isHR() && (
                        <button onClick={handleExport} className="btn-secondary text-sm">
                            Export Excel
                        </button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="card flex flex-wrap gap-3">
                <input
                    type="text" placeholder="Tìm tên, email..." className="input max-w-xs"
                    value={filters.search}
                    onChange={e => setFilters({ ...filters, search: e.target.value, page: 1 })}
                />
                <select
                    className="input max-w-48"
                    value={filters.status}
                    onChange={e => setFilters({ ...filters, status: e.target.value, page: 1 })}
                >
                    <option value="">Tất cả trạng thái</option>
                    {['new','viewed','interview_scheduled','interviewed','offer','hired','rejected'].map(s => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
            </div>

            <div className="card p-0 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            {isHR() && (
                                <th className="px-4 py-3 w-10">
                                    <input
                                        type="checkbox"
                                        checked={selected.length === apps.data.length && apps.data.length > 0}
                                        onChange={toggleAll}
                                    />
                                </th>
                            )}
                            <th className="text-left px-4 py-3 font-medium text-gray-500">Họ tên</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-500">Ngày nộp</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-500">Trạng thái</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-500">Điểm</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} className="text-center py-8 text-gray-400">Đang tải...</td></tr>
                        ) : apps.data.length === 0 ? (
                            <tr><td colSpan={7} className="text-center py-8 text-gray-400">Chưa có hồ sơ</td></tr>
                        ) : apps.data.map(app => (
                            <tr key={app.id} className="border-b border-gray-50 hover:bg-gray-50">
                                {isHR() && (
                                    <td className="px-4 py-3">
                                        <input
                                            type="checkbox"
                                            checked={selected.includes(app.id)}
                                            onChange={() => toggleSelect(app.id)}
                                        />
                                    </td>
                                )}
                                <td className="px-4 py-3 font-medium">{app.candidate?.full_name}</td>
                                <td className="px-4 py-3 text-gray-500">{app.candidate?.user?.email}</td>
                                <td className="px-4 py-3 text-gray-500">
                                    {new Date(app.applied_at).toLocaleDateString('vi-VN')}
                                </td>
                                <td className="px-4 py-3"><ApplicationStatusBadge status={app.status} /></td>
                                <td className="px-4 py-3 text-gray-600">{app.rating_avg ?? '-'}</td>
                                <td className="px-4 py-3">
                                    <Link to={`/applications/${app.id}`} className="text-blue-600 hover:underline text-xs">
                                        Xem chi tiết
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Bulk reject modal */}
            <Modal open={bulkModal} onClose={() => setBulkModal(false)} title={`Từ chối ${selected.length} hồ sơ`}>
                <div className="space-y-4">
                    <div>
                        <label className="label">Lý do từ chối *</label>
                        <select
                            className="input"
                            value={bulkForm.rejection_reason}
                            onChange={e => setBulkForm({ ...bulkForm, rejection_reason: e.target.value })}
                        >
                            <option value="">Chọn lý do</option>
                            {REJECTION_REASONS.map(r => <option key={r}>{r}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label">Ghi chú (tối thiểu 10 ký tự) *</label>
                        <textarea
                            rows={3} className="input resize-none"
                            value={bulkForm.note}
                            onChange={e => setBulkForm({ ...bulkForm, note: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setBulkModal(false)} className="btn-secondary">Hủy</button>
                        <button
                            onClick={handleBulkReject}
                            disabled={!bulkForm.rejection_reason || bulkForm.note.length < 10}
                            className="btn-danger disabled:opacity-50"
                        >
                            Từ chối hàng loạt
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
