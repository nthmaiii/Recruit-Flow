import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { ApplicationStatusBadge } from '../../components/Common/StatusBadge';
import Modal from '../../components/Common/Modal';
import useAuth from '../../hooks/useAuth';
import { STATUS_LABELS, REJECTION_REASONS } from '../../utils/constants';
import ScheduleInterviewModal from './ScheduleInterviewModal';

const TABS = ['Thông tin', 'Lịch sử', 'Phỏng vấn'];

export default function ApplicationDetail() {
    const { id } = useParams();
    const { user, isHR, isHM } = useAuth();
    const [app, setApp] = useState(null);
    const [tab, setTab] = useState(0);
    const [statusModal, setStatusModal] = useState(false);
    const [interviewModal, setInterviewModal] = useState(false);
    const [evalModal, setEvalModal] = useState(null); // interview to evaluate
    const [statusForm, setStatusForm] = useState({ status: '', note: '', rejection_reason: '' });

    const fetchApp = () => {
        api.get(`/applications/${id}`).then(res => setApp(res.data));
    };

    useEffect(() => { fetchApp(); }, [id]);

    const handleDownloadCv = async () => {
        try {
            const res = await api.get(`/applications/${id}/cv`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', app.cv_original_name || 'cv.pdf');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch {
            toast.error('Không thể tải CV');
        }
    };

    const handleAiEvaluate = async () => {
        try {
            await api.post(`/applications/${id}/evaluate`);
            toast.success('Đang chạy đánh giá AI, vui lòng làm mới sau vài giây');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Lỗi khi chạy đánh giá AI');
        }
    };

    const handleChangeStatus = async () => {
        try {
            await api.post(`/applications/${id}/status`, statusForm);
            toast.success('Đã cập nhật trạng thái');
            setStatusModal(false);
            fetchApp();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Lỗi khi cập nhật');
        }
    };

    const handleEvaluate = async (interviewId, evalData) => {
        try {
            await api.post(`/interviews/${interviewId}/evaluate`, evalData);
            toast.success('Đã ghi nhận đánh giá');
            setEvalModal(null);
            fetchApp();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Lỗi khi đánh giá');
        }
    };

    if (!app) return <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;

    const candidate = app.candidate;
    const allowedStatuses = isHR()
        ? (app.status !== 'hired' && app.status !== 'rejected' ? Object.keys(STATUS_LABELS) : [])
        : (isHM() && ['interview_scheduled', 'interviewed'].includes(app.status)
            ? ['interviewed', 'offer', 'rejected']
            : []);

    return (
        <div className="max-w-5xl space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">{candidate?.full_name}</h1>
                    <p className="text-gray-500 mt-1">{candidate?.user?.email} · {candidate?.phone}</p>
                    <p className="text-sm text-gray-500 mt-1">
                        Vị trí: <span className="font-medium text-gray-700">{app.job?.title}</span>
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <ApplicationStatusBadge status={app.status} />
                    {app.rating_avg && (
                        <span className="text-sm font-medium text-yellow-600">⭐ {app.rating_avg}</span>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main content */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Tabs */}
                    <div className="flex gap-1 border-b border-gray-200">
                        {TABS.map((t, i) => (
                            <button
                                key={i}
                                onClick={() => setTab(i)}
                                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                                    tab === i ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>

                    {tab === 0 && (
                        <div className="card space-y-4">
                            <div>
                                <label className="text-xs font-medium text-gray-500 uppercase">Thư xin việc</label>
                                <p className="text-sm text-gray-700 mt-1">{app.cover_letter || 'Không có'}</p>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500 uppercase">CV đính kèm</label>
                                <div className="mt-2">
                                    <button
                                        onClick={handleDownloadCv}
                                        className="text-blue-600 text-sm hover:underline"
                                    >
                                        Tải xuống CV
                                    </button>
                                </div>
                            </div>
                            {app.ai_evaluation && (
                                <div className="border border-blue-100 rounded-lg p-4 bg-blue-50 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-medium text-blue-600 uppercase">🤖 Đánh giá AI</label>
                                        <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${
                                            app.ai_score >= 80 ? 'bg-green-100 text-green-700' :
                                            app.ai_score >= 60 ? 'bg-blue-100 text-blue-700' :
                                            app.ai_score >= 40 ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {app.ai_score}/100
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-700">{app.ai_evaluation.summary}</p>
                                    {app.ai_evaluation.strengths?.length > 0 && (
                                        <div>
                                            <p className="text-xs font-medium text-green-600 mb-1">Điểm mạnh:</p>
                                            <ul className="list-disc list-inside space-y-0.5">
                                                {app.ai_evaluation.strengths.map((s, i) => (
                                                    <li key={i} className="text-sm text-gray-600">{s}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {app.ai_evaluation.weaknesses?.length > 0 && (
                                        <div>
                                            <p className="text-xs font-medium text-red-500 mb-1">Cần cải thiện:</p>
                                            <ul className="list-disc list-inside space-y-0.5">
                                                {app.ai_evaluation.weaknesses.map((w, i) => (
                                                    <li key={i} className="text-sm text-gray-600">{w}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    <p className="text-xs text-gray-400">
                                        Đánh giá lúc: {new Date(app.ai_evaluated_at).toLocaleString('vi-VN')}
                                    </p>
                                </div>
                            )}
                            {app.tags?.length > 0 && (
                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase">Tags</label>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {app.tags.map(tag => (
                                            <span key={tag} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {tab === 1 && (
                        <div className="space-y-3">
                            {(app.status_history || []).map(h => (
                                <div key={h.id} className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="w-3 h-3 rounded-full bg-blue-500 mt-1" />
                                        <div className="w-0.5 bg-gray-200 flex-1 mt-1" />
                                    </div>
                                    <div className="card flex-1 mb-0 py-3">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium">
                                                {h.from_status ? `${h.from_status} → ` : ''}{h.to_status}
                                            </p>
                                            <span className="text-xs text-gray-400">
                                                {new Date(h.created_at).toLocaleString('vi-VN')}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Bởi: {h.changed_by?.name}
                                        </p>
                                        <p className="text-sm text-gray-600 mt-1">{h.note}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {tab === 2 && (
                        <div className="space-y-4">
                            {(app.interviews || []).length === 0 ? (
                                <p className="text-sm text-gray-500">Chưa có lịch phỏng vấn.</p>
                            ) : (
                                app.interviews.map(interview => (
                                    <div key={interview.id} className="card">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-medium">Vòng {interview.round}</p>
                                                <p className="text-sm text-gray-500">
                                                    {new Date(interview.scheduled_at).toLocaleString('vi-VN')} · {interview.duration_minutes} phút
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    Người PV: {interview.interviewer?.name}
                                                </p>
                                                {interview.meeting_link && (
                                                    <a href={interview.meeting_link} className="text-xs text-blue-600 hover:underline" target="_blank" rel="noreferrer">
                                                        Link phỏng vấn
                                                    </a>
                                                )}
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                                    interview.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                    {interview.status}
                                                </span>
                                                {!interview.evaluation && interview.interviewer_id === user?.id && (
                                                    <button
                                                        onClick={() => setEvalModal(interview)}
                                                        className="text-xs btn-primary"
                                                    >
                                                        Đánh giá
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        {interview.evaluation && (
                                            <div className="mt-3 pt-3 border-t border-gray-100">
                                                <p className="text-xs font-medium text-gray-500">Kết quả đánh giá</p>
                                                <p className="text-sm mt-1">
                                                    Chuyên môn: {interview.evaluation.technical_score}/5 ·
                                                    Soft skill: {interview.evaluation.soft_score}/5
                                                </p>
                                                <p className="text-sm text-gray-600">{interview.evaluation.comment}</p>
                                                <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
                                                    interview.evaluation.recommendation === 'pass'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {interview.evaluation.recommendation === 'pass' ? 'Đạt' : 'Không đạt'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Action panel */}
                <div className="space-y-4">
                    <div className="card space-y-3">
                        <h3 className="font-semibold text-gray-700">Hành động</h3>
                        {isHR() && (
                            <button
                                onClick={() => setInterviewModal(true)}
                                className="w-full btn-secondary text-sm"
                            >
                                Lên lịch phỏng vấn
                            </button>
                        )}
                        {allowedStatuses.length > 0 && (
                            <button
                                onClick={() => setStatusModal(true)}
                                className="w-full btn-primary text-sm"
                            >
                                Chuyển trạng thái
                            </button>
                        )}
                        <button
                            onClick={handleAiEvaluate}
                            className="w-full btn-secondary text-sm border-blue-300 text-blue-600 hover:bg-blue-50"
                        >
                            🤖 Đánh giá AI
                        </button>
                    </div>

                    <div className="card">
                        <p className="text-xs font-medium text-gray-500 uppercase mb-2">Thông tin nộp</p>
                        <p className="text-sm text-gray-600">
                            {new Date(app.applied_at).toLocaleString('vi-VN')}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">{app.job?.department?.name}</p>
                    </div>
                </div>
            </div>

            {/* Status change modal */}
            <Modal open={statusModal} onClose={() => setStatusModal(false)} title="Chuyển trạng thái">
                <div className="space-y-4">
                    <div>
                        <label className="label">Trạng thái mới</label>
                        <select
                            className="input"
                            value={statusForm.status}
                            onChange={e => setStatusForm({ ...statusForm, status: e.target.value })}
                        >
                            <option value="">Chọn trạng thái</option>
                            {allowedStatuses.map(s => (
                                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                            ))}
                        </select>
                    </div>
                    {statusForm.status === 'rejected' && (
                        <div>
                            <label className="label">Lý do từ chối *</label>
                            <select
                                className="input"
                                value={statusForm.rejection_reason}
                                onChange={e => setStatusForm({ ...statusForm, rejection_reason: e.target.value })}
                            >
                                <option value="">Chọn lý do</option>
                                {REJECTION_REASONS.map(r => <option key={r}>{r}</option>)}
                            </select>
                        </div>
                    )}
                    <div>
                        <label className="label">Ghi chú *</label>
                        <textarea
                            rows={3} className="input resize-none"
                            placeholder="Tối thiểu 10 ký tự..."
                            value={statusForm.note}
                            onChange={e => setStatusForm({ ...statusForm, note: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setStatusModal(false)} className="btn-secondary">Hủy</button>
                        <button
                            onClick={handleChangeStatus}
                            disabled={!statusForm.status || statusForm.note.length < 10}
                            className="btn-primary disabled:opacity-50"
                        >
                            Xác nhận
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Schedule interview modal */}
            <ScheduleInterviewModal
                open={interviewModal}
                onClose={() => setInterviewModal(false)}
                applicationId={id}
                onSuccess={() => { setInterviewModal(false); fetchApp(); }}
            />

            {/* Evaluate modal */}
            {evalModal && (
                <EvaluateModal
                    interview={evalModal}
                    onClose={() => setEvalModal(null)}
                    onSubmit={(data) => handleEvaluate(evalModal.id, data)}
                />
            )}
        </div>
    );
}

function EvaluateModal({ interview, onClose, onSubmit }) {
    const [form, setForm] = useState({ technical_score: 3, soft_score: 3, comment: '', recommendation: 'pass' });

    return (
        <Modal open={true} onClose={onClose} title={`Đánh giá phỏng vấn vòng ${interview.round}`}>
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="label">Kỹ năng chuyên môn (1-5)</label>
                        <input
                            type="number" min="1" max="5" className="input"
                            value={form.technical_score}
                            onChange={e => setForm({ ...form, technical_score: +e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="label">Soft skill (1-5)</label>
                        <input
                            type="number" min="1" max="5" className="input"
                            value={form.soft_score}
                            onChange={e => setForm({ ...form, soft_score: +e.target.value })}
                        />
                    </div>
                </div>
                <div>
                    <label className="label">Nhận xét *</label>
                    <textarea rows={4} className="input resize-none" value={form.comment} onChange={e => setForm({ ...form, comment: e.target.value })} />
                </div>
                <div>
                    <label className="label">Đề xuất</label>
                    <select className="input" value={form.recommendation} onChange={e => setForm({ ...form, recommendation: e.target.value })}>
                        <option value="pass">Đạt - Chuyển lên bước tiếp theo</option>
                        <option value="fail">Không đạt - Từ chối</option>
                    </select>
                </div>
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="btn-secondary">Hủy</button>
                    <button
                        onClick={() => onSubmit(form)}
                        disabled={form.comment.length < 10}
                        className="btn-primary disabled:opacity-50"
                    >
                        Gửi đánh giá
                    </button>
                </div>
            </div>
        </Modal>
    );
}
