import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import Modal from '../../components/Common/Modal';
import { ROLES } from '../../utils/constants';

export default function UserManagement() {
    const [users, setUsers] = useState({ data: [] });
    const [departments, setDepartments] = useState([]);
    const [modal, setModal] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', role: 'HR', department_id: '' });

    const fetchUsers = () => {
        api.get('/admin/users').then(res => setUsers(res.data));
    };

    useEffect(() => {
        fetchUsers();
        api.get('/admin/departments').then(res => setDepartments(res.data));
    }, []);

    const handleCreate = async () => {
        try {
            await api.post('/admin/users', form);
            toast.success('Đã tạo user. Mật khẩu tạm đã gửi qua email.');
            setModal(false);
            setForm({ name: '', email: '', role: 'HR', department_id: '' });
            fetchUsers();
        } catch (err) {
            const errors = err.response?.data?.errors;
            if (errors) Object.values(errors).flat().forEach(msg => toast.error(msg));
            else toast.error('Lỗi khi tạo user');
        }
    };

    const handleToggle = async (user) => {
        await api.patch(`/admin/users/${user.id}/toggle-active`);
        toast.success(user.is_active ? 'Đã khóa tài khoản' : 'Đã mở khóa');
        fetchUsers();
    };

    const handleReset = async (user) => {
        if (!confirm(`Reset mật khẩu cho ${user.name}?`)) return;
        await api.post(`/admin/users/${user.id}/reset-password`);
        toast.success('Đã gửi mật khẩu mới qua email');
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">Quản lý người dùng</h1>
                <button onClick={() => setModal(true)} className="btn-primary">+ Thêm user</button>
            </div>

            <div className="card p-0 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="text-left px-4 py-3 font-medium text-gray-500">Tên</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-500">Vai trò</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-500">Bộ phận</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-500">Trạng thái</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.data.map(user => (
                            <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium">{user.name}</td>
                                <td className="px-4 py-3 text-gray-500">{user.email}</td>
                                <td className="px-4 py-3">
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                        {ROLES[user.role]}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-gray-500">{user.department?.name || '-'}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                                        user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                        {user.is_active ? 'Hoạt động' : 'Đã khóa'}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-2 text-xs">
                                        <button onClick={() => handleReset(user)} className="text-gray-500 hover:text-blue-600">
                                            Reset PW
                                        </button>
                                        <button onClick={() => handleToggle(user)} className={user.is_active ? 'text-red-500' : 'text-green-600'}>
                                            {user.is_active ? 'Khóa' : 'Mở khóa'}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal open={modal} onClose={() => setModal(false)} title="Thêm người dùng mới">
                <div className="space-y-4">
                    <div>
                        <label className="label">Họ tên *</label>
                        <input type="text" className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div>
                        <label className="label">Email *</label>
                        <input type="email" className="input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                    </div>
                    <div>
                        <label className="label">Vai trò *</label>
                        <select className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                            <option value="HR">Nhân sự (HR)</option>
                            <option value="HM">Quản lý bộ phận (HM)</option>
                            <option value="SA">Super Admin</option>
                        </select>
                    </div>
                    {form.role === 'HM' && (
                        <div>
                            <label className="label">Bộ phận *</label>
                            <select className="input" value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value })}>
                                <option value="">Chọn bộ phận</option>
                                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                    )}
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setModal(false)} className="btn-secondary">Hủy</button>
                        <button onClick={handleCreate} className="btn-primary">Tạo user</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
