import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface AIStreamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject?: string;
  text: string;
  mode?: 'html' | 'text';
  onComplete?: (html: string) => void;
}

export function AIStreamDialog({ open, onOpenChange, subject, text, mode = 'html', onComplete }: AIStreamDialogProps) {
  const [status, setStatus] = useState<'connecting' | 'thinking' | 'generating' | 'streaming' | 'done' | 'error'>('connecting');
  const [content, setContent] = useState('');
  const [thinkingContent, setThinkingContent] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [content]);

  // 开始流式请求
  useEffect(() => {
    if (!open) {
      // 关闭对话框时清理
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setStatus('connecting');
      setContent('');
      setErrorMessage('');
      setCopied(false);
      return;
    }

    // 开始新的流式请求
    const startStreaming = async () => {
      try {
        setStatus('connecting');
        setContent('');
        setErrorMessage('');

        const token = localStorage.getItem('auth_token');
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        };

        const requestBody = JSON.stringify({ subject, text, mode });

        let response = await fetch('/api/v1/email/ai-render-stream', {
          method: 'POST',
          headers,
          body: requestBody
        });

        // 某些代理/部署环境可能只允许 GET 访问，遇到 405 时回退为 GET
        if (response.status === 405) {
          const params = new URLSearchParams();
          if (subject) params.set('subject', subject);
          if (text) params.set('text', text);
          if (mode) params.set('mode', mode);

          response = await fetch(`/api/v1/email/ai-render-stream?${params.toString()}`, {
            method: 'GET',
            headers: {
              ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            }
          });
        }

        if (!response.ok) {
          throw new Error('请求失败');
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('无法读取响应流');
        }

        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.type === 'connected') {
                  setStatus('connecting');
                  setStatusMessage('已连接到服务器');
                } else if (data.type === 'thinking') {
                  setStatus('thinking');
                  setStatusMessage(data.message || 'AI正在思考中...');
                  if (data.content) {
                    setThinkingContent(prev => prev + data.content);
                  }
                } else if (data.type === 'generating') {
                  setStatus('generating');
                  setStatusMessage(data.message || 'AI开始生成内容...');
                } else if (data.type === 'content') {
                  setStatus('streaming');
                  setContent(prev => prev + data.content);
                } else if (data.type === 'done') {
                  setStatus('done');
                  setStatusMessage('生成完成');
                } else if (data.type === 'error') {
                  setStatus('error');
                  setErrorMessage(data.message || 'AI 生成失败');
                }
              } catch (e) {
                console.error('解析SSE数据失败:', e);
              }
            }
          }
        }
      } catch (error) {
        console.error('流式请求失败:', error);
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'AI 生成失败');
      }
    };

    startStreaming();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [open, subject, text]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success('已复制到剪贴板');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('复制失败');
    }
  };

  const handleUse = () => {
    if (content && onComplete) {
      onComplete(content);
      onOpenChange(false);
      toast.success('已应用生成的HTML');
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'connecting':
      case 'thinking':
      case 'generating':
      case 'streaming':
        return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
      case 'done':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusText = () => {
    if (statusMessage) return statusMessage;
    
    switch (status) {
      case 'connecting':
        return '正在连接 AI...';
      case 'thinking':
        return 'AI 正在思考中...';
      case 'generating':
        return 'AI 开始生成内容...';
      case 'streaming':
        return 'AI 正在生成中...';
      case 'done':
        return '生成完成';
      case 'error':
        return '生成失败';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStatusIcon()}
            <span>{getStatusText()}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">{errorMessage}</p>
            </div>
          )}

          <div className="h-[400px] w-full rounded-md border p-4 overflow-y-auto" ref={scrollRef}>
            <div className="space-y-2">
              {/* 显示思考链内容 */}
              {thinkingContent && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2">💭 AI 思考过程</div>
                  <pre className="whitespace-pre-wrap break-words text-xs text-blue-600 dark:text-blue-400 font-mono">
                    {thinkingContent}
                  </pre>
                </div>
              )}
              
              {/* 显示生成的内容 */}
              {content ? (
                <pre className="whitespace-pre-wrap break-words text-sm font-mono">
                  {content}
                </pre>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  {status === 'connecting' && (statusMessage || '等待 AI 响应...')}
                  {status === 'thinking' && (statusMessage || 'AI 正在思考中...')}
                  {status === 'generating' && (statusMessage || 'AI 开始生成内容...')}
                  {status === 'streaming' && '正在接收数据...'}
                  {status === 'error' && '生成失败'}
                </div>
              )}
            </div>
          </div>

          {content && (
            <div className="text-xs text-muted-foreground">
              已生成 {content.length} 个字符
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleCopy}
            disabled={!content || status === 'streaming'}
            className="gap-2"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? '已复制' : '复制'}
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            关闭
          </Button>
          <Button
            onClick={handleUse}
            disabled={!content || status === 'streaming' || status === 'error'}
          >
            使用此HTML
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
