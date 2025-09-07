import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'qrcode';

interface QRCodeTooltipProps {
  url: string;
  title: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * 二维码悬停提示组件
 * 鼠标悬停时显示二维码
 */
export function QRCodeTooltip({ 
  url, 
  title, 
  children, 
  position = 'top' 
}: QRCodeTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [qrCode, setQrCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // 生成二维码
  useEffect(() => {
    if (isVisible && !qrCode && !isLoading) {
      setIsLoading(true);
      QRCode.toDataURL(url, {
        width: 100,  // 缩小二维码尺寸
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }).then((dataUrl) => {
        setQrCode(dataUrl);
        setIsLoading(false);
      }).catch((error) => {
        console.error('生成二维码失败:', error);
        setIsLoading(false);
      });
    }
  }, [isVisible, url, qrCode, isLoading]);

  // 获取提示框位置样式
  const getPositionStyles = () => {
    switch (position) {
      case 'top':
        return {
          bottom: '100%',
          left: '50%',
          marginLeft: '-58px',  // 116px / 2 = 58px，向左偏移一半宽度实现居中
          marginBottom: '12px'
        };
      case 'bottom':
        return {
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginTop: '8px'
        };
      case 'left':
        return {
          right: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          marginRight: '8px'
        };
      case 'right':
        return {
          left: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          marginLeft: '8px'
        };
      default:
        return {};
    }
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute z-[9999] bg-white border border-gray-200 rounded-lg shadow-lg p-2 w-[116px] h-[116px] flex items-center justify-center"
            style={getPositionStyles()}
          >
            {/* 箭头 */}
            <div 
              className={`absolute w-2 h-2 bg-white border transform rotate-45 ${
                position === 'top' ? 'top-full left-1/2 -translate-x-1/2 -mt-1 border-b border-r border-t-0 border-l-0' :
                position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 -mb-1 border-t border-l border-b-0 border-r-0' :
                position === 'left' ? 'left-full top-1/2 -translate-y-1/2 -ml-1 border-t border-r border-b-0 border-l-0' :
                'right-full top-1/2 -translate-y-1/2 -mr-1 border-b border-l border-t-0 border-r-0'
              }`}
            />
            
            {/* 只显示二维码，无文字 */}
            {isLoading ? (
              <div className="w-[100px] h-[100px] bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              </div>
            ) : qrCode ? (
              <img 
                src={qrCode} 
                alt={`${title}二维码`}
                className="w-[100px] h-[100px] rounded-lg object-contain"
                style={{ aspectRatio: '1/1' }}
              />
            ) : (
              <div className="w-[100px] h-[100px] bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 text-xs">
                ×
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
