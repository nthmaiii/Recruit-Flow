import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import useAuthStore from '../stores/authStore';

export default function useNotifications() {
    const { user } = useAuthStore();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchUnreadCount = useCallback(async () => {
        if (!user) return;
        const { data } = await api.get('/notifications/unread-count');
        setUnreadCount(data.count);
    }, [user]);

    const fetchNotifications = useCallback(async () => {
        if (!user) return;
        const { data } = await api.get('/notifications');
        setNotifications(data.data);
    }, [user]);

    const markRead = async (id) => {
        await api.patch(`/notifications/${id}/read`);
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const markAllRead = async () => {
        await api.post('/notifications/mark-all-read');
        setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
        setUnreadCount(0);
    };

    useEffect(() => {
        fetchUnreadCount();

        if (window.Echo && user && !user.isCandidate) {
            window.Echo.channel('hr-notifications')
                .listen('.new-application', () => {
                    setUnreadCount(prev => prev + 1);
                    fetchNotifications();
                });

            return () => window.Echo.leave('hr-notifications');
        }
    }, [user, fetchUnreadCount]);

    return { notifications, unreadCount, fetchNotifications, markRead, markAllRead };
}
