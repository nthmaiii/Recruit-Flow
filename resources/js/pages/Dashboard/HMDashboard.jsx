import React, { useEffect, useState } from 'react';
import api from '../../utils/api';

export default function HMDashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/dashboard/hm')
            .then(res => setData(res.data))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Dashboard - Quản lý bộ phận</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card">
                    <p className="text-3xl font-bold text-orange-600">{data?.awaiting_interview}</p>
                    <p className="text-sm text-gray-500 mt-1">Hồ sơ chờ phỏng vấn</p>
                </div>
                <div className="card">
                    <p className="text-3xl font-bold text-purple-600">{data?.needs_evaluation}</p>
                    <p className="text-sm text-gray-500 mt-1">Hồ sơ cần đánh giá</p>
                </div>
            </div>

            <div className="card">
                <h2 className="font-semibold text-gray-700 mb-4">Lịch phỏng vấn sắp tới (7 ngày)</h2>
                {(data?.upcoming_interviews || []).length === 0 ? (
                    <p className="text-sm text-gray-500">Không có lịch phỏng vấn sắp tới.</p>
                ) : (
                    <div className="space-y-3">
                        {data.upcoming_interviews.map(interview => (
                            <div key={interview.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                                <div className="text-center min-w-14">
                                    <p className="text-lg font-bold text-blue-600">
                                        {new Date(interview.scheduled_at).getDate()}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {new Date(interview.scheduled_at).toLocaleString('vi-VN', { month: 'short' })}
                                    </p>
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-sm">
                                        {interview.application?.candidate?.full_name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {interview.application?.job?.title} · Vòng {interview.round}
                                    </p>
                                </div>
                                <div className="text-right text-xs text-gray-500">
                                    {new Date(interview.scheduled_at).toLocaleTimeString('vi-VN', {
                                        hour: '2-digit', minute: '2-digit',
                                    })}
                                    <br />
                                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full ${
                                        interview.status === 'confirmed'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                        {interview.status === 'confirmed' ? 'Đã xác nhận' : 'Chờ xác nhận'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
