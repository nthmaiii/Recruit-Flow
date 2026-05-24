import { create } from 'zustand';
import api from '../utils/api';

const getStoredUser = () => {
    try {
        return JSON.parse(localStorage.getItem('auth_user'));
    } catch {
        return null;
    }
};

const useAuthStore = create((set, get) => ({
    user: getStoredUser(),
    token: localStorage.getItem('auth_token'),
    loading: false,

    login: async (email, password) => {
        set({ loading: true });
        try {
            const { data } = await api.post('/auth/login', { email, password });
            localStorage.setItem('auth_token', data.token);
            localStorage.setItem('auth_user', JSON.stringify(data.user));
            set({ user: data.user, token: data.token, loading: false });
            return data.user;
        } catch (err) {
            set({ loading: false });
            throw err;
        }
    },

    logout: async () => {
        try {
            await api.post('/auth/logout');
        } finally {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            set({ user: null, token: null });
        }
    },

    isHR: () => ['SA', 'HR'].includes(get().user?.role),
    isHM: () => get().user?.role === 'HM',
    isAdmin: () => get().user?.role === 'SA',
    isCandidate: () => get().user?.role === 'CANDIDATE',
}));

export default useAuthStore;
