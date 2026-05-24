import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import Modal from '../../components/Common/Modal';

export default function ScheduleInterviewModal({ open, onClose, applicationId, onSuccess }) {
    const [interviewers, setInterviewers] = useState([]);
    const [form, setForm] = useState({
        round: 1,
        interviewer_id: '',
        scheduled_at: '',
        duration_minutes: 60,
        location: '',
        meeting_link: '',
    });

    useEffect(() => {
        if (open) {
            // Fetch HM users
            api.get('/admin/users', { params: { role: 'HM' } })
                .then(res => setInterviewers(res.data.data || []));
        }
    }, [open]);

    const handleSubmit = async () => {
        try {
            await api.post(`/applications/${applicationId}/schedule-interview`, form);
            toast.success('Đã lên lịch phỏng vấn và gửi lời mời');
            onSuccess();
        } catch (err) {
            const msg = err.response?.data?.message || 'Lỗi khi lên lịch';
            toast.error(msg);
        }
    };

    const minDateTime = new Date(Date.now() + 3600000).toISOString().slice(0, 16);

    return (
        <Modal open={open} onClose={onClose} title="Lên lịch phỏng vấn" size="lg">
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="label">Vòng phỏng vấn</label>
                        <select className="input" value={form.round} onChange={e => setForm({ ...form, round: +e.target.value })}>
                            <option value={1}>Vòng 1</option>
                            <option value={2}>Vòng 2</option>
                            <option value={3}>Vòng 3</option>
                        </select>
                    </div>
                    <div>
                        <label className="label">Thời lượng</label>
                        <select className="input" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: +e.target.value })}>
                            <option value={30}>30 phút</option>
                            <option value={60}>60 phút</option>
                            <option value={90}>90 phút</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="label">Người phỏng vấn *</label>
                    <select
                        className="input"
                        value={form.interviewer_id}
                        onChange={e => setForm({ ...form, interviewer_id: e.target.value })}
                    >
                        <option value="">Chọn người phỏng vấn</option>
                        {interviewers.map(u => (
                            <option key={u.id} value={u.id}>{u.name} ({u.department?.name})</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="label">Thời gian phỏng vấn *</label>
                    <input
                        type="datetime-local"
                        className="input"
                        min={minDateTime}
                        value={form.scheduled_at}
                        onChange={e => setForm({ ...form, scheduled_at: e.target.value })}
                    />
                </div>

                <div>
                    <label className="label">Link phỏng vấn (nếu online)</label>
                    <input
                        type="url" className="input" placeholder="https://meet.google.com/..."
                        value={form.meeting_link}
                        onChange={e => setForm({ ...form, meeting_link: e.target.value })}
                    />
                </div>

                <div>
                    <label className="label">Địa điểm (nếu offline)</label>
                    <input
                        type="text" className="input" placeholder="Phòng họp A, tầng 3..."
                        value={form.location}
                        onChange={e => setForm({ ...form, location: e.target.value })}
                    />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <button onClick={onClose} className="btn-secondary">Hủy</button>
                    <button
                        onClick={handleSubmit}
                        disabled={!form.interviewer_id || !form.scheduled_at}
                        className="btn-primary disabled:opacity-50"
                    >
                        Gửi lời mời phỏng vấn
                    </button>
                </div>
            </div>
        </Modal>
    );
}
