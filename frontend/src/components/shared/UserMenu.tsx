import React, { useState, useRef, useEffect } from 'react';
import { Button } from './Button';
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigate, useLocation } from 'react-router-dom';

export const UserMenu: React.FC = () => {
  const { currentUser, logout, fetchMe } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const prefix = currentUser?.email ? currentUser.email.split('@')[0] : '用户';
  const isPro = currentUser?.is_pro;
  const proExpire = currentUser?.pro_expire_date ? new Date(currentUser.pro_expire_date).toLocaleDateString() : '';

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, []);

  useEffect(() => {
    if (!currentUser) {
      fetchMe().finally(() => setAuthChecked(true));
    } else {
      setAuthChecked(true);
    }
  }, [currentUser, fetchMe]);

  const onLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!currentUser && authChecked) {
    const redirect = location.pathname;
    return (
      <Button
        variant="primary"
        size="sm"
        onClick={() => navigate(`/login?redirect=${encodeURIComponent(redirect)}`)}
        className="px-4"
      >
        登录/注册
      </Button>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="sm"
        className="rounded-full px-3 py-2 flex items-center gap-2"
        onClick={() => setOpen((v) => !v)}
      >
        <span>{prefix}</span>
        {isPro && (
          <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-0.5 rounded dark:bg-yellow-200 dark:text-yellow-900">
            PRO
          </span>
        )}
      </Button>
      {open && (
        <div className="absolute right-0 mt-2 min-w-[160px] bg-white dark:bg-gray-800 rounded-lg shadow-xl ring-1 ring-black/5 dark:ring-white/10 border border-gray-100 dark:border-gray-700 z-[1000]">
          <div role="menu" className="py-1">
            {isPro ? (
               <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100 dark:border-gray-700">
                  Pro 到期时间: {proExpire}
               </div>
            ) : (
               <div 
                 role="menuitem"
                 className="px-4 py-2.5 cursor-pointer text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 whitespace-nowrap"
                 onMouseDown={() => navigate('/pricing')}
               >
                 升级 Pro 会员
               </div>
            )}
            <div
              role="menuitem"
              tabIndex={0}
              className="px-4 py-2.5 cursor-pointer text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              onMouseDown={() => navigate('/settings')}
            >
              设置
            </div>
            <div
              role="menuitem"
              tabIndex={0}
              className="px-4 py-2.5 cursor-pointer text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              onMouseDown={onLogout}
            >
              退出
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
