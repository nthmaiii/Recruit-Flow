import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const TYPE_LABELS = {
    cv_received: 'Xác nhận nhận hồ sơ',
    interview_invitation: 'Mời phỏng vấn',
    rejection: 'Từ chối',
    offer_letter: 'Thư offer',
};

const VARS = ['{{candidate_name}}', '{{job_title}}', '{{interview_date}}', '{{interview_link}}', '{{company_name}}', '{{confirmation_link}}'];

export default function EmailTemplates() {
    const [templates, setTemplates] = useState([]);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ subject: '', body_html: '' });

    useEffect(() => {
        api.get('/email-templates').then(res => setTemplates(res.data));
    }, []);

    const handleEdit = (t) => {
        setEditing(t);
        setForm({ subject: t.subject, body_html: t.body_html });
    };

    const handleSave = async () => {
        try {
            await api.put(`/email-templates/${editing.id}`, form);
            toast.success('Đã lưu template');
            setEditing(null);
            api.get('/email-templates').then(res => setTemplates(res.data));
        } catch {
            toast.error('Lỗi khi lưu');
        }
    };

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold text-gray-800">Template Email</h1>

            {!editing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templates.map(t => (
                        <div key={t.id} className="card">
                            <h3 className="font-semibold text-gray-700">{TYPE_LABELS[t.type] || t.type}</h3>
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{t.subject}</p>
                            <button
                                onClick={() => handleEdit(t)}
                                className="mt-3 text-sm text-blue-600 hover:underline"
                            >
                                Chỉnh sửa
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card space-y-4 max-w-3xl">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold">{TYPE_LABELS[editing.type]}</h2>
                        <button onClick={() => setEditing(null)} className="text-sm text-gray-500">Hủy</button>
                    </div>

                    <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                        Biến có thể dùng: {VARS.join(' · ')}
                    </div>

                    <div>
                        <label className="label">Tiêu đề email</label>
                        <input
                            type="text" className="input"
                            value={form.subject}
                            onChange={e => setForm({ ...form, subject: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="label">Nội dung (HTML)</label>
                        <textarea
                            rows={12} className="input resize-none font-mono text-xs"
                            value={form.body_html}
                            onChange={e => setForm({ ...form, body_html: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setEditing(null)} className="btn-secondary">Hủy</button>
                        <button onClick={handleSave} className="btn-primary">Lưu template</button>
                    </div>
                </div>
            )}
        </div>
    );
}
