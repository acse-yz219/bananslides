import { create } from 'zustand';
import * as api from '@/api/endpoints';

interface AuthState {
  token: string | null;
  currentUser: api.User | null;
  error: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  fetchMe: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  currentUser: null,
  error: null,
  loading: false,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await api.login(email, password);
      const user = res.data?.user || null;
      set({ token: null, currentUser: user || null });
    } catch (e: any) {
      set({ error: e?.response?.data?.error?.message || e.message || '登录失败' });
      throw e;
    } finally {
      set({ loading: false });
    }
  },

  register: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await api.register(email, password);
      const user = res.data?.user || null;
      set({ token: null, currentUser: user || null });
    } catch (e: any) {
      set({ error: e?.response?.data?.error?.message || e.message || '注册失败' });
      throw e;
    } finally {
      set({ loading: false });
    }
  },

  fetchMe: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.getMe();
      const user = res.data?.user || null;
      set({ currentUser: user || null });
    } catch (e: any) {
      set({ error: e?.response?.data?.error?.message || e.message || '获取用户信息失败' });
    } finally {
      set({ loading: false });
    }
  },

  logout: () => {
    try {
      api.logout().catch(() => {});
    } catch {}
    set({ token: null, currentUser: null });
  },
}));
