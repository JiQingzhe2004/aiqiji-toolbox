/**
 * 404页面组件
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 p-8">
        {/* 404图标 */}
        <div className="flex justify-center mb-8">
          <img 
            src="/404.svg" 
            alt="404 - 页面未找到"
            className="w-64 h-64 sm:w-80 sm:h-80 object-contain filter dark:brightness-90 dark:contrast-110"
          />
        </div>

        {/* 标题和描述 */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-6xl font-bold text-primary">404</h1>
          <h2 className="text-2xl sm:text-3xl font-semibold text-foreground">页面未找到</h2>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            抱歉，您访问的页面不存在或已被移动。请检查URL是否正确，或返回首页。
          </p>
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
          <Button
            onClick={() => navigate('/')}
            className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            <Home className="w-4 h-4 mr-2" />
            返回首页
          </Button>
          
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="border-black text-black hover:bg-black hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回上页
          </Button>
        </div>

        {/* 帮助信息 */}
        <div className="pt-8 text-sm text-muted-foreground">
          <p>如果您认为这是一个错误，请</p>
          <button
            onClick={() => {
              window.open('mailto:jqz1215@qq.com?subject=AiQiji工具箱-404错误报告&body=页面URL: ' + encodeURIComponent(window.location.href), '_blank');
            }}
            className="text-primary hover:underline"
          >
            联系我们
          </button>
        </div>
      </div>
    </div>
  );
}
