import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
} from 'chart.js';
import api from '../../utils/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Reports() {
    const [data, setData] = useState(null);
    const [year, setYear] = useState(new Date().getFullYear());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        api.get('/reports/hiring', { params: { year, period: 'month' } })
            .then(res => setData(res.data))
            .finally(() => setLoading(false));
    }, [year]);

    const handleExportExcel = () => {
        window.open(`/api/v1/reports/export/excel?year=${year}`, '_blank');
    };

    const handleExportPdf = () => {
        window.open(`/api/v1/reports/export/pdf?year=${year}`, '_blank');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h1 className="text-2xl font-bold text-gray-800">Báo cáo tuyển dụng</h1>
                <div className="flex gap-3">
                    <select
                        className="input max-w-32"
                        value={year}
                        onChange={e => setYear(+e.target.value)}
                    >
                        {[2023, 2024, 2025, 2026].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                    <button onClick={handleExportExcel} className="btn-secondary text-sm">
                        Export Excel
                    </button>
                    <button onClick={handleExportPdf} className="btn-secondary text-sm">
                        Export PDF
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
                </div>
            ) : (
                <>
                    {/* Summary table */}
                    <div className="card p-0 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="text-left px-4 py-3 font-medium text-gray-500">Kỳ</th>
                                    <th className="text-right px-4 py-3 font-medium text-gray-500">Tổng hồ sơ</th>
                                    <th className="text-right px-4 py-3 font-medium text-gray-500">Đã tuyển</th>
                                    <th className="text-right px-4 py-3 font-medium text-gray-500">Tỷ lệ</th>
                                    <th className="text-right px-4 py-3 font-medium text-gray-500">Thời gian TB (ngày)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(data?.application_stats || []).map(stat => (
                                    <tr key={stat.period} className="border-b border-gray-50 hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium">{stat.period}</td>
                                        <td className="px-4 py-3 text-right">{stat.total_applications}</td>
                                        <td className="px-4 py-3 text-right text-green-600">{stat.hired}</td>
                                        <td className="px-4 py-3 text-right">
                                            {stat.total_applications > 0
                                                ? `${Math.round((stat.hired / stat.total_applications) * 100)}%`
                                                : '0%'
                                            }
                                        </td>
                                        <td className="px-4 py-3 text-right text-gray-500">
                                            {stat.avg_time_to_hire ? Math.round(stat.avg_time_to_hire) : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Chart */}
                    <div className="card">
                        <h2 className="font-semibold text-gray-700 mb-4">Hồ sơ theo tháng</h2>
                        <Bar
                            data={{
                                labels: (data?.application_stats || []).map(s => s.period),
                                datasets: [
                                    {
                                        label: 'Tổng hồ sơ',
                                        data: (data?.application_stats || []).map(s => s.total_applications),
                                        backgroundColor: '#3b82f6',
                                    },
                                    {
                                        label: 'Đã tuyển',
                                        data: (data?.application_stats || []).map(s => s.hired),
                                        backgroundColor: '#22c55e',
                                    },
                                ],
                            }}
                            options={{
                                responsive: true,
                                plugins: { legend: { position: 'top' } },
                                scales: { x: { stacked: false } },
                            }}
                        />
                    </div>
                </>
            )}
        </div>
    );
}
