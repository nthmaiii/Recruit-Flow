import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { ApplicationStatusBadge } from '../../components/Common/StatusBadge';
import useAuth from '../../hooks/useAuth';

export default function CandidatePortal() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pwForm, setPwForm] = useState({ current_password: '', password: '', password_confirmation: '' });
    const [showPwForm, setShowPwForm] = useState(user?.must_change_password);

    useEffect(() => {
        api.get('/candidate/applications')
            .then(res => setApplications(res.data))
            .finally(() => setLoading(false));
    }, []);

    const handleChangePassword = async (e) => {
        e.preventDefault();
        try {
            await api.post('/auth/change-password', pwForm);
            toast.success('Đổi mật khẩu thành công');
            setShowPwForm(false);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Lỗi khi đổi mật khẩu');
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h1 className="text-xl font-bold text-blue-700">RecruitFlow</h1>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">{user?.name}</span>
                    <button
                        onClick={() => setShowPwForm(!showPwForm)}
                        className="text-sm text-gray-500 hover:text-gray-700"
                    >
                        Đổi mật khẩu
                    </button>
                    <button onClick={handleLogout} className="text-sm text-red-600 hover:text-red-700">
                        Đăng xuất
                    </button>
                </div>
            </header>

            <main className="max-w-3xl mx-auto py-8 px-4 space-y-6">
                {/* Force password change */}
                {(showPwForm || user?.must_change_password) && (
                    <div className="card border-l-4 border-amber-400">
                        <h2 className="font-semibold text-gray-800 mb-4">
                            {user?.must_change_password ? 'Vui lòng đổi mật khẩu trước khi tiếp tục' : 'Đổi mật khẩu'}
                        </h2>
                        <form onSubmit={handleChangePassword} className="space-y-3">
                            <div>
                                <label className="label">Mật khẩu hiện tại</label>
                                <input type="password" className="input" value={pwForm.current_password}
                                    onChange={e => setPwForm({ ...pwForm, current_password: e.target.value })} />
                            </div>
                            <div>
                                <label className="label">Mật khẩu mới</label>
                                <input type="password" className="input" value={pwForm.password}
                                    onChange={e => setPwForm({ ...pwForm, password: e.target.value })} />
                            </div>
                            <div>
                                <label className="label">Xác nhận mật khẩu</label>
                                <input type="password" className="input" value={pwForm.password_confirmation}
                                    onChange={e => setPwForm({ ...pwForm, password_confirmation: e.target.value })} />
                            </div>
                            <button type="submit" className="btn-primary">Xác nhận đổi mật khẩu</button>
                        </form>
                    </div>
                )}

                {!user?.must_change_password && (
                    <>
                        <h2 className="text-2xl font-bold text-gray-800">Hồ sơ của tôi</h2>

                        {loading ? (
                            <p className="text-gray-400">Đang tải...</p>
                        ) : applications.length === 0 ? (
                            <div className="card text-center text-gray-500">
                                Bạn chưa có hồ sơ ứng tuyển nào.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {applications.map(app => (
                                    <div key={app.id} className="card">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-semibold text-gray-800">{app.job?.title}</h3>
                                                <p className="text-sm text-gray-500 mt-0.5">
                                                    {app.job?.department?.name} · {app.job?.location}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    Nộp lúc: {new Date(app.applied_at).toLocaleString('vi-VN')}
                                                </p>
                                            </div>
                                            <ApplicationStatusBadge status={app.status} />
                                        </div>

                                        {(app.interviews || []).length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-gray-100">
                                                <p className="text-xs font-medium text-gray-500 mb-2">Lịch phỏng vấn</p>
                                                {app.interviews.map(iv => (
                                                    <div key={iv.id} className="flex items-center justify-between text-sm bg-blue-50 p-2 rounded-lg">
                                                        <span>Vòng {iv.round}: {new Date(iv.scheduled_at).toLocaleString('vi-VN')}</span>
                                                        {!iv.confirmed_at && (
                                                            <span className="text-amber-600 text-xs">Chờ xác nhận</span>
                                                        )}
                                                        {iv.confirmed_at && (
                                                            <span className="text-green-600 text-xs">Đã xác nhận</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
