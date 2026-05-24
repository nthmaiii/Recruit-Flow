import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';
import { JobStatusBadge } from '../../components/Common/StatusBadge';

export default function JobDetail() {
    const { id } = useParams();
    const [job, setJob] = useState(null);

    useEffect(() => {
        api.get(`/jobs/${id}`).then(res => setJob(res.data));
    }, [id]);

    if (!job) return <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;

    return (
        <div className="max-w-3xl space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">{job.title}</h1>
                    <p className="text-gray-500 mt-1">{job.department?.name} · {job.location}</p>
                </div>
                <JobStatusBadge status={job.status} />
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="card text-center">
                    <p className="text-2xl font-bold text-blue-600">{job.quantity}</p>
                    <p className="text-xs text-gray-500 mt-1">Số lượng</p>
                </div>
                <div className="card text-center">
                    <p className="text-sm font-bold text-gray-700">{new Date(job.deadline).toLocaleDateString('vi-VN')}</p>
                    <p className="text-xs text-gray-500 mt-1">Hạn nộp</p>
                </div>
                <div className="card text-center">
                    <p className="text-sm font-bold text-gray-700">{job.salary_range || 'Thỏa thuận'}</p>
                    <p className="text-xs text-gray-500 mt-1">Mức lương</p>
                </div>
            </div>

            <div className="card">
                <h2 className="font-semibold text-gray-700 mb-3">Mô tả công việc</h2>
                <div className="prose text-sm text-gray-600" dangerouslySetInnerHTML={{ __html: job.description }} />
            </div>

            <div className="card">
                <h2 className="font-semibold text-gray-700 mb-3">Yêu cầu</h2>
                <div className="prose text-sm text-gray-600" dangerouslySetInnerHTML={{ __html: job.requirements }} />
            </div>

            <div className="flex gap-3">
                <Link to={`/jobs/${id}/applications`} className="btn-primary">
                    Xem hồ sơ ({job.applications_count})
                </Link>
                <Link to={`/jobs/${id}/edit`} className="btn-secondary">Sửa tin</Link>
            </div>
        </div>
    );
}
