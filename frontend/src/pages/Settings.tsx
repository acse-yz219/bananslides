import React from 'react';
import { Card, Button } from '@/components/shared';
import { useThemeStore } from '@/store/useThemeStore';
import { Moon, Sun, Monitor, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Settings: React.FC = () => {
  const { theme, setTheme } = useThemeStore();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
           <Button variant="ghost" onClick={() => navigate(-1)} icon={<ArrowLeft size={20} />}>
             返回
           </Button>
           <h1 className="text-2xl font-bold text-gray-900 dark:text-white">设置</h1>
        </div>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">外观</h2>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">主题模式</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">选择你喜欢的界面风格</p>
              </div>
              
              <div className="flex items-center p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <button
                  onClick={() => setTheme('light')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    theme === 'light'
                      ? 'bg-white dark:bg-gray-600 text-purple-600 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <Sun size={16} />
                  浅色
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    theme === 'dark'
                      ? 'bg-white dark:bg-gray-600 text-purple-600 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <Moon size={16} />
                  深色
                </button>
                <button
                  onClick={() => setTheme('system')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    theme === 'system'
                      ? 'bg-white dark:bg-gray-600 text-purple-600 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <Monitor size={16} />
                  跟随系统
                </button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
