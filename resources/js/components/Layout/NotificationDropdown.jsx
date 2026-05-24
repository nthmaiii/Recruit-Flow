import React, { useEffect, useRef } from 'react';

export default function NotificationDropdown({ notifications, onMarkRead, onMarkAllRead, onClose }) {
    const ref = useRef();

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) onClose();
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [onClose]);

    return (
        <div ref={ref} className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-sm">Thông báo</h3>
                <button onClick={onMarkAllRead} className="text-xs text-blue-600 hover:underline">
                    Đánh dấu tất cả đã đọc
                </button>
            </div>
            <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                    <p className="p-4 text-sm text-gray-500 text-center">Không có thông báo</p>
                ) : (
                    notifications.map(n => (
                        <div
                            key={n.id}
                            onClick={() => !n.read_at && onMarkRead(n.id)}
                            className={`px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 ${
                                !n.read_at ? 'bg-blue-50' : ''
                            }`}
                        >
                            <p className="text-sm font-medium text-gray-800">
                                {n.type === 'new_application' && `Hồ sơ mới: ${n.data?.candidate_name}`}
                                {n.type === 'interview_scheduled' && `Lịch PV: ${n.data?.candidate_name}`}
                                {n.type === 'interview_confirmed' && `Đã xác nhận PV: ${n.data?.candidate_name}`}
                                {n.type === 'application_status_changed' && `Trạng thái: ${n.data?.job_title}`}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">{n.data?.job_title}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
