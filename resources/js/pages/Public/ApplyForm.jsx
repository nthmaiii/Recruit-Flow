import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../utils/api';

export default function ApplyForm() {
    const { slug } = useParams();
    const [job, setJob] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        full_name: '', email: '', phone: '', cover_letter: '',
    });
    const [cvFile, setCvFile] = useState(null);

    useEffect(() => {
        api.get(`/jobs/${slug}/public`)
            .then(res => setJob(res.data))
            .catch(() => setJob(null));
    }, [slug]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!cvFile) { toast.error('Vui lòng đính kèm CV'); return; }

        const formData = new FormData();
        Object.entries(form).forEach(([k, v]) => formData.append(k, v));
        formData.append('cv_file', cvFile);

        setLoading(true);
        try {
            await api.post(`/jobs/${slug}/apply`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setSubmitted(true);
        } catch (err) {
            const errors = err.response?.data?.errors;
            if (errors) {
                Object.values(errors).flat().forEach(msg => toast.error(msg));
            } else {
                toast.error(err.response?.data?.message || 'Nộp hồ sơ thất bại');
            }
        } finally {
            setLoading(false);
        }
    };

    if (!job) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <p className="text-gray-500">Tin tuyển dụng không tồn tại hoặc đã đóng.</p>
        </div>
    );

    if (submitted) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="card max-w-md text-center">
                <div className="text-green-500 text-5xl mb-4">&#10003;</div>
                <h2 className="text-xl font-bold">Nộp hồ sơ thành công!</h2>
                <p className="text-gray-500 mt-2">
                    Chúng tôi đã gửi email xác nhận. Kiểm tra hộp thư của bạn để nhận thông tin tài khoản.
                </p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Job info */}
                <div className="card">
                    <h1 className="text-2xl font-bold text-gray-800">{job.title}</h1>
                    <p className="text-gray-500 mt-1">{job.department?.name} · {job.location}</p>
                    {job.salary_range && (
                        <p className="text-sm text-green-700 font-medium mt-2">{job.salary_range}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                        Hạn nộp: {new Date(job.deadline).toLocaleDateString('vi-VN')}
                    </p>
                </div>

                {/* Apply form */}
                <div className="card">
                    <h2 className="text-xl font-semibold text-gray-800 mb-5">Nộp hồ sơ</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="label">Họ và tên *</label>
                            <input
                                type="text" required className="input"
                                value={form.full_name}
                                onChange={e => setForm({ ...form, full_name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="label">Email *</label>
                            <input
                                type="email" required className="input"
                                value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="label">Số điện thoại *</label>
                            <input
                                type="tel" required className="input" placeholder="0901234567"
                                value={form.phone}
                                onChange={e => setForm({ ...form, phone: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="label">CV đính kèm (PDF/DOC, tối đa 5MB) *</label>
                            <input
                                type="file"
                                accept=".pdf,.doc,.docx"
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                onChange={e => setCvFile(e.target.files[0])}
                            />
                        </div>
                        <div>
                            <label className="label">Thư xin việc</label>
                            <textarea
                                rows={4} className="input resize-none"
                                placeholder="Chia sẻ lý do bạn muốn ứng tuyển..."
                                value={form.cover_letter}
                                onChange={e => setForm({ ...form, cover_letter: e.target.value })}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary py-3 disabled:opacity-50"
                        >
                            {loading ? 'Đang nộp...' : 'Nộp hồ sơ'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
