import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import Modal from '../../components/Common/Modal';

export default function DepartmentManagement() {
    const [departments, setDepartments] = useState([]);
    const [modal, setModal] = useState(false);
    const [form, setForm] = useState({ name: '', description: '', manager_id: '' });
    const [hmUsers, setHmUsers] = useState([]);

    const fetchDepts = () => api.get('/admin/departments').then(res => setDepartments(res.data));

    useEffect(() => {
        fetchDepts();
        api.get('/admin/users', { params: { role: 'HM' } }).then(res => setHmUsers(res.data.data || []));
    }, []);

    const handleCreate = async () => {
        try {
            await api.post('/admin/departments', form);
            toast.success('Đã tạo bộ phận');
            setModal(false);
            setForm({ name: '', description: '', manager_id: '' });
            fetchDepts();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Lỗi khi tạo bộ phận');
        }
    };

    const handleDelete = async (dept) => {
        if (!confirm(`Xóa bộ phận "${dept.name}"?`)) return;
        try {
            await api.delete(`/admin/departments/${dept.id}`);
            toast.success('Đã xóa bộ phận');
            fetchDepts();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Không thể xóa');
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">Quản lý bộ phận</h1>
                <button onClick={() => setModal(true)} className="btn-primary">+ Thêm bộ phận</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {departments.map(dept => (
                    <div key={dept.id} className="card">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="font-semibold text-gray-800">{dept.name}</h3>
                                <p className="text-xs text-gray-500 mt-1">{dept.description}</p>
                                <p className="text-xs text-gray-400 mt-2">
                                    Trưởng BP: {dept.manager?.name || 'Chưa có'}
                                </p>
                                <p className="text-xs text-gray-400">
                                    {dept.users_count} nhân sự · {dept.jobs_count} tin
                                </p>
                            </div>
                            <button onClick={() => handleDelete(dept)} className="text-red-500 hover:text-red-700 text-xs">
                                Xóa
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <Modal open={modal} onClose={() => setModal(false)} title="Thêm bộ phận mới">
                <div className="space-y-4">
                    <div>
                        <label className="label">Tên bộ phận *</label>
                        <input type="text" className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div>
                        <label className="label">Mô tả</label>
                        <textarea rows={3} className="input resize-none" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                    </div>
                    <div>
                        <label className="label">Trưởng bộ phận</label>
                        <select className="input" value={form.manager_id} onChange={e => setForm({ ...form, manager_id: e.target.value })}>
                            <option value="">Chọn trưởng BP</option>
                            {hmUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setModal(false)} className="btn-secondary">Hủy</button>
                        <button onClick={handleCreate} className="btn-primary">Tạo bộ phận</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
