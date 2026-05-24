import React from 'react';
import { NavLink } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: '⊞', roles: ['SA', 'HR', 'HM'] },
    { label: 'Tin tuyển dụng', href: '/jobs', icon: '📋', roles: ['SA', 'HR', 'HM'] },
    { label: 'Báo cáo', href: '/reports', icon: '📊', roles: ['SA', 'HR'] },
    { label: 'Quản lý User', href: '/admin/users', icon: '👥', roles: ['SA'] },
    { label: 'Bộ phận', href: '/admin/departments', icon: '🏢', roles: ['SA'] },
    { label: 'Template Email', href: '/admin/email-templates', icon: '✉️', roles: ['SA', 'HR'] },
];

export default function Sidebar() {
    const { user } = useAuth();

    const visible = navItems.filter(item => item.roles.includes(user?.role));

    return (
        <aside className="w-64 bg-gray-900 text-white flex flex-col">
            <div className="p-6 border-b border-gray-700">
                <h1 className="text-xl font-bold text-blue-400">RecruitFlow</h1>
                <p className="text-xs text-gray-400 mt-1">Quản lý tuyển dụng</p>
            </div>
            <nav className="flex-1 p-4 space-y-1">
                {visible.map(item => (
                    <NavLink
                        key={item.href}
                        to={item.href}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                                isActive
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                            }`
                        }
                    >
                        <span>{item.icon}</span>
                        {item.label}
                    </NavLink>
                ))}
            </nav>
            <div className="p-4 border-t border-gray-700 text-xs text-gray-500">
                v1.0.0
            </div>
        </aside>
    );
}
