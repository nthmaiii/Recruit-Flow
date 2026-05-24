import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, Line } from 'react-chartjs-2';
import {
    Chart as ChartJS, CategoryScale, LinearScale, BarElement,
    LineElement, PointElement, Title, Tooltip, Legend,
} from 'chart.js';
import api from '../../utils/api';
import { ApplicationStatusBadge } from '../../components/Common/StatusBadge';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

export default function HRDashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/dashboard/hr')
            .then(res => setData(res.data))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;

    const statusLabels = Object.keys(data?.by_status || {});
    const statusData = Object.values(data?.by_status || {});

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard label="Tin đang mở" value={data?.open_jobs} color="blue" icon="📋" />
                <StatCard label="Hồ sơ mới (24h)" value={data?.new_applications_24h} color="green" icon="📥" />
                <StatCard label="Tỷ lệ chuyển đổi" value={`${data?.conversion_rate}%`} color="purple" icon="📈" />
                <StatCard label="Thời gian TB tuyển (ngày)" value={data?.avg_time_to_hire} color="orange" icon="⏱️" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Status chart */}
                <div className="card">
                    <h2 className="font-semibold text-gray-700 mb-4">Hồ sơ theo trạng thái</h2>
                    <Bar
                        data={{
                            labels: statusLabels,
                            datasets: [{ label: 'Số hồ sơ', data: statusData, backgroundColor: '#3b82f6' }],
                        }}
                        options={{ responsive: true, plugins: { legend: { display: false } } }}
                    />
                </div>

                {/* Time chart */}
                <div className="card">
                    <h2 className="font-semibold text-gray-700 mb-4">Hồ sơ 30 ngày qua</h2>
                    <Line
                        data={{
                            labels: (data?.last_30_days || []).map(d => d.date),
                            datasets: [{
                                label: 'Hồ sơ',
                                data: (data?.last_30_days || []).map(d => d.count),
                                borderColor: '#3b82f6',
                                tension: 0.4,
                            }],
                        }}
                        options={{ responsive: true, plugins: { legend: { display: false } } }}
                    />
                </div>
            </div>

            {/* Pending applications */}
            <div className="card">
                <h2 className="font-semibold text-gray-700 mb-4">Hồ sơ cần xử lý</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="text-left py-2 text-gray-500 font-medium">Ứng viên</th>
                                <th className="text-left py-2 text-gray-500 font-medium">Vị trí</th>
                                <th className="text-left py-2 text-gray-500 font-medium">Trạng thái</th>
                                <th className="text-left py-2 text-gray-500 font-medium">Ngày nộp</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {(data?.pending_applications || []).map(app => (
                                <tr key={app.id} className="border-b border-gray-50 hover:bg-gray-50">
                                    <td className="py-2.5 font-medium">{app.candidate?.full_name}</td>
                                    <td className="py-2.5 text-gray-600">{app.job?.title}</td>
                                    <td className="py-2.5"><ApplicationStatusBadge status={app.status} /></td>
                                    <td className="py-2.5 text-gray-500">
                                        {new Date(app.applied_at).toLocaleDateString('vi-VN')}
                                    </td>
                                    <td className="py-2.5">
                                        <Link to={`/applications/${app.id}`} className="text-blue-600 hover:underline text-xs">
                                            Xem
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, color, icon }) {
    const colors = {
        blue: 'bg-blue-50 text-blue-700',
        green: 'bg-green-50 text-green-700',
        purple: 'bg-purple-50 text-purple-700',
        orange: 'bg-orange-50 text-orange-700',
    };
    return (
        <div className="card">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${colors[color]} text-xl mb-3`}>
                {icon}
            </div>
            <p className="text-2xl font-bold text-gray-800">{value ?? '-'}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
        </div>
    );
}
