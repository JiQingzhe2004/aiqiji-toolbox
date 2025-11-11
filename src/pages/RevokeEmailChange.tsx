import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Loader2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiPost } from '../lib/api';

type RevokeStatus = 'loading' | 'confirming' | 'success' | 'error' | 'expired';

export default function RevokeEmailChange() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<RevokeStatus>('loading');
  const [message, setMessage] = useState('');
  const [oldEmail, setOldEmail] = useState('');
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('撤销链接无效，缺少必要的令牌参数');
      return;
    }

    // 验证令牌有效性（可选，这里直接显示确认界面）
    setStatus('confirming');
  }, [token]);

  const handleRevoke = async () => {
    if (!token) {
      toast.error('撤销令牌无效');
      return;
    }

    setStatus('loading');
    try {
      const response = await apiPost('/auth/revoke-email-change', { token });
      
      if (response.success) {
        setStatus('success');
        setOldEmail(response.data.old_email);
        setMessage('邮箱变更已成功撤销');
        toast.success('邮箱变更已成功撤销');
      } else {
        setStatus('error');
        setMessage(response.message || '撤销失败');
        toast.error(response.message || '撤销失败');
      }
    } catch (error: any) {
      const errorMsg = error?.message || '撤销失败，请稍后重试';
      
      if (errorMsg.includes('撤销期限已过')) {
        setStatus('expired');
      } else {
        setStatus('error');
      }
      
      setMessage(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">正在处理...</p>
          </div>
        );

      case 'confirming':
        return (
          <div className="space-y-6">
            <div className="flex items-start gap-4 p-4 border rounded-lg">
              <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 mb-2">确认撤销邮箱变更</h3>
              </div>
            </div>

            <div className="space-y-3 text-sm text-muted-foreground">
              <p>撤销后：</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>您的账号邮箱将恢复为原邮箱地址</li>
                <li>新邮箱地址将不再与您的账号关联</li>
                <li>此操作无法撤销</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleRevoke}
                variant="destructive"
                className="flex-1"
              >
                确认撤销
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                className="flex-1"
              >
                取消
              </Button>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-green-900 mb-2">撤销成功</h3>
              <p className="text-muted-foreground">{message}</p>
              {oldEmail && (
                <p className="text-sm text-muted-foreground mt-2">
                  您的邮箱已恢复为：<strong className="text-foreground">{oldEmail}</strong>
                </p>
              )}
            </div>
            <Button onClick={() => navigate('/login')} className="mt-4">
              返回登录
            </Button>
          </div>
        );

      case 'expired':
        return (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-10 h-10 text-orange-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-orange-900 mb-2">撤销期限已过</h3>
              <p className="text-muted-foreground">{message}</p>
              <p className="text-sm text-muted-foreground mt-2">
                邮箱变更已生效，如需帮助请联系客服
              </p>
            </div>
            <Button onClick={() => navigate('/')} className="mt-4">
              返回首页
            </Button>
          </div>
        );

      case 'error':
        return (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-red-900 mb-2">撤销失败</h3>
              <p className="text-muted-foreground">{message}</p>
            </div>
            <Button onClick={() => navigate('/')} variant="outline" className="mt-4">
              返回首页
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}
