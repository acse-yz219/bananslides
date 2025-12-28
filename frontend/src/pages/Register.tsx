import React, { useState } from 'react';
import { Card, Input, Button, useToast } from '@/components/shared';
import { useAuthStore } from '@/store/useAuthStore';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  const { register, loading } = useAuthStore();
  const { show } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const redirect = new URLSearchParams(location.search).get('redirect') || '/';

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(undefined);
    if (password !== confirm) {
      show({ message: '两次输入的密码不一致', type: 'error' });
      return;
    }
    try {
      await register(email, password);
      show({ message: '注册成功', type: 'success' });
      navigate(redirect || '/');
    } catch (e: any) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.error?.message || e.message || '注册失败';
      if (status === 409) {
        setEmailError('该用户名已被注册');
        try { document.getElementById('register-email')?.focus(); } catch {}
      }
      show({ message: msg, type: 'error' });
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-purple-200/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-10 w-96 h-96 bg-indigo-200/40 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative z-10 p-6 sm:p-8">
        <div className="flex items-center mb-6 gap-3">
          <img src="/logo.png" alt="Magic AiPPT" className="w-8 h-8 md:w-10 md:h-10 object-contain" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">创建你的账号</h1>
            <p className="text-sm text-gray-500">已有账号？<Link to={`/login${redirect && redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} className="text-purple-600 hover:text-purple-700 font-medium">去登录</Link></p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="邮箱"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            required
            id="register-email"
            error={emailError}
          />
          <Input
            label="密码"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="至少 6 位"
            required
          />
          <Input
            label="确认密码"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="再次输入密码"
            required
          />
          <Button type="submit" size="lg" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-none shadow-lg shadow-purple-500/20" disabled={loading}>
            {loading ? '注册中...' : '注册'}
          </Button>
        </form>
      </Card>
    </div>
  );
};
