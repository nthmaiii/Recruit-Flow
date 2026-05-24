import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../utils/api';

export default function JobForm() {
    const { id } = useParams();
    const isEdit = Boolean(id);
    const navigate = useNavigate();
    const [departments, setDepartments] = useState([]);
    const [hasApplications, setHasApplications] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        title: '', department_id: '', quantity: 1,
        description: '', requirements: '',
        location: 'Van phong HCM', salary_range: '',
        deadline: '', status: 'draft',
    });

    useEffect(() => {
        api.get('/admin/departments').then(res => setDepartments(res.data));

        if (isEdit) {
            api.get(`/jobs/${id}`).then(res => {
                const job = res.data;
                setForm({
                    title: job.title,
                    department_id: job.department_id,
                    quantity: job.quantity,
                    description: job.description,
                    requirements: job.requirements,
                    location: job.location,
                    salary_range: job.salary_range || '',
                    deadline: job.deadline,
                    status: job.status,
                });
                setHasApplications(job.applications_count > 0);
            });
        }
    }, [id]);

    const handleSubmit = async (statusOverride) => {
        setLoading(true);
        const payload = { ...form };
        if (statusOverride) payload.status = statusOverride;

        try {
            if (isEdit) {
                await api.put(`/jobs/${id}`, payload);
                toast.success('Đã cập nhật tin tuyển dụng');
            } else {
                await api.post('/jobs', payload);
                toast.success('Đã tạo tin tuyển dụng');
            }
            navigate('/jobs');
        } catch (err) {
            const errors = err.response?.data?.errors;
            if (errors) {
                Object.values(errors).flat().forEach(msg => toast.error(msg));
            } else {
                toast.error(err.response?.data?.message || 'Lỗi khi lưu');
            }
        } finally {
            setLoading(false);
        }
    };

    const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

    return (
        <div className="max-w-4xl space-y-4">
            <h1 className="text-2xl font-bold text-gray-800">
                {isEdit ? 'Sửa tin tuyển dụng' : 'Tạo tin tuyển dụng mới'}
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main fields */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="card space-y-4">
                        <div>
                            <label className="label">Tiêu đề *</label>
                            <input
                                type="text" className="input" required
                                value={form.title}
                                onChange={e => set('title', e.target.value)}
                                disabled={isEdit && hasApplications}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">Bộ phận *</label>
                                <select
                                    className="input" required
                                    value={form.department_id}
                                    onChange={e => set('department_id', e.target.value)}
                                    disabled={isEdit && hasApplications}
                                >
                                    <option value="">Chọn bộ phận</option>
                                    {departments.map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="label">Số lượng *</label>
                                <input
                                    type="number" min="1" className="input"
                                    value={form.quantity}
                                    onChange={e => set('quantity', e.target.value)}
                                    disabled={isEdit && hasApplications}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="label">Mô tả công việc *</label>
                            <textarea
                                rows={6} className="input resize-none"
                                value={form.description}
                                onChange={e => set('description', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="label">Yêu cầu *</label>
                            <textarea
                                rows={5} className="input resize-none"
                                value={form.requirements}
                                onChange={e => set('requirements', e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Side panel */}
                <div className="space-y-4">
                    <div className="card space-y-4">
                        <div>
                            <label className="label">Trạng thái</label>
                            <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                                <option value="draft">Nháp</option>
                                <option value="published">Đăng ngay</option>
                            </select>
                        </div>
                        <div>
                            <label className="label">Hạn nộp hồ sơ *</label>
                            <input
                                type="date" className="input"
                                min={new Date().toISOString().split('T')[0]}
                                value={form.deadline}
                                onChange={e => set('deadline', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="label">Địa điểm</label>
                            <input type="text" className="input" value={form.location} onChange={e => set('location', e.target.value)} />
                        </div>
                        <div>
                            <label className="label">Mức lương</label>
                            <input type="text" className="input" placeholder="VD: 15-20 triệu" value={form.salary_range} onChange={e => set('salary_range', e.target.value)} />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <button
                            onClick={() => handleSubmit('draft')}
                            disabled={loading}
                            className="btn-secondary w-full"
                        >
                            Lưu nháp
                        </button>
                        <button
                            onClick={() => handleSubmit('published')}
                            disabled={loading}
                            className="btn-primary w-full"
                        >
                            Đăng tin
                        </button>
                    </div>

                    {isEdit && hasApplications && (
                        <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg">
                            Tin đã có hồ sơ ứng tuyển. Một số trường không thể sửa.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
