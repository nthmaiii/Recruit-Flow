import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useNotifications from '../../hooks/useNotifications';
import NotificationDropdown from './NotificationDropdown';

export default function Header() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { unreadCount, notifications, fetchNotifications, markRead, markAllRead } = useNotifications();
    const [showNotif, setShowNotif] = useState(false);
    const [showProfile, setShowProfile] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
            <div className="text-sm text-gray-500">
                Xin chào, <span className="font-semibold text-gray-800">{user?.name}</span>
            </div>

            <div className="flex items-center gap-4">
                {/* Notification bell */}
                <div className="relative">
                    <button
                        onClick={() => {
                            setShowNotif(!showNotif);
                            if (!showNotif) fetchNotifications();
                        }}
                        className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                    >
                        <span className="text-lg">🔔</span>
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>
                    {showNotif && (
                        <NotificationDropdown
                            notifications={notifications}
                            onMarkRead={markRead}
                            onMarkAllRead={markAllRead}
                            onClose={() => setShowNotif(false)}
                        />
                    )}
                </div>

                {/* Profile dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setShowProfile(!showProfile)}
                        className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
                    >
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="hidden md:block">{user?.role}</span>
                    </button>
                    {showProfile && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-50">
                            <div className="p-3 border-b border-gray-100">
                                <p className="font-medium text-sm">{user?.name}</p>
                                <p className="text-xs text-gray-500">{user?.email}</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                                Đăng xuất
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
