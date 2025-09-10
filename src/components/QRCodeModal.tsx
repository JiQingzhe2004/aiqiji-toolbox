import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, AlertTriangle, ExternalLink } from 'lucide-react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  toolName: string;
  toolUrl: string;
  toolDescription?: string;
}

/**
 * 二维码弹框组件
 * 显示工具的二维码和免责声明
 */
export function QRCodeModal({ 
  isOpen, 
  onClose, 
  toolName, 
  toolUrl, 
  toolDescription 
}: QRCodeModalProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // 生成二维码
  useEffect(() => {
    if (isOpen && toolUrl) {
      setIsLoading(true);
      setError('');
      
      QRCode.toDataURL(toolUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      })
      .then(url => {
        setQrCodeUrl(url);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('生成二维码失败:', err);
        setError('生成二维码失败，请稍后重试');
        setIsLoading(false);
      });
    }
  }, [isOpen, toolUrl]);

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // 防止背景滚动
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // 下载二维码
  const downloadQRCode = () => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `${toolName}-二维码.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 复制链接
  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(toolUrl);
      // 这里可以添加成功提示
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
        >
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
          />
          
          {/* 弹框内容 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-md"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <Card className="shadow-2xl border-2">
              <CardHeader className="text-center pb-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-xs">
                    二维码分享
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="h-8 w-8 rounded-full hover:bg-muted"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <CardTitle className="text-lg font-semibold line-clamp-1">
                  {toolName}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* 二维码区域 */}
                <div className="flex justify-center">
                  <div className="relative">
                    {isLoading ? (
                      <div className="w-64 h-64 bg-muted rounded-lg flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : error ? (
                      <div className="w-64 h-64 bg-muted rounded-lg flex flex-col items-center justify-center text-center p-4">
                        <AlertTriangle className="w-8 h-8 text-destructive mb-2" />
                        <p className="text-sm text-muted-foreground">{error}</p>
                      </div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        className="relative"
                      >
                        <img 
                          src={qrCodeUrl} 
                          alt={`${toolName} 二维码`}
                          className="w-64 h-64 rounded-lg border-2 border-border bg-white p-4"
                        />
                        <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
                      </motion.div>
                    )}
                  </div>
                </div>


                {/* 免责声明 */}
                <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800/50">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                      请谨慎扫描，我们不对第三方工具负责，使用前请自行评估风险
                    </p>
                  </div>
                </div>

                {/* 操作按钮 */}
                <Button
                  onClick={downloadQRCode}
                  disabled={!qrCodeUrl || isLoading}
                  variant="blackWhite"
                  className="w-full gap-2"
                >
                  <Download className="w-4 h-4" />
                  下载二维码
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
