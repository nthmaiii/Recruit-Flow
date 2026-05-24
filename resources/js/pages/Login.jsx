import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuth from '../hooks/useAuth';

export default function Login() {
    const [form, setForm] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const user = await login(form.email, form.password);
            if (user.role === 'CANDIDATE') {
                navigate('/candidate');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Đăng nhập thất bại';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-blue-700">RecruitFlow</h1>
                    <p className="text-gray-500 mt-2">Hệ thống quản lý tuyển dụng</p>
                </div>

                <div className="card">
                    <h2 className="text-xl font-semibold text-gray-800 mb-6">Đăng nhập</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="label">Email</label>
                            <input
                                type="email"
                                required
                                className="input"
                                placeholder="email@example.com"
                                value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="label">Mật khẩu</label>
                            <input
                                type="password"
                                required
                                className="input"
                                placeholder="••••••••"
                                value={form.password}
                                onChange={e => setForm({ ...form, password: e.target.value })}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary py-2.5 mt-2 disabled:opacity-50"
                        >
                            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
