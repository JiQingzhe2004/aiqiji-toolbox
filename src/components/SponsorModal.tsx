import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Coffee, Heart, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AiOutlineAlipay } from "react-icons/ai";
import QRCode from 'qrcode';

interface SponsorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SponsorOption {
  amount: string;
  url: string;
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

/**
 * 赞助二维码弹窗组件
 * 显示支付宝赞助二维码选项
 */
export function SponsorModal({ isOpen, onClose }: SponsorModalProps) {
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});
  const [selectedOption, setSelectedOption] = useState<string>('5');

  // 赞助选项配置
  const sponsorOptions: Record<string, SponsorOption> = {
    '1': {
      amount: '1元',
      url: 'https://qr.alipay.com/2m615384z5b11xeajzcaw5a',
      icon: Coffee,
      color: 'from-amber-400 to-orange-500',
      description: '请我喝杯咖啡'
    },
    '5': {
      amount: '5元',
      url: 'https://qr.alipay.com/2m619750xo391ckgnevei96',
      icon: Heart,
      color: 'from-pink-400 to-red-500',
      description: '支持我的创作'
    },
    '10': {
      amount: '10元',
      url: 'https://qr.alipay.com/2m613514v5ubpvez7jsweef',
      icon: Zap,
      color: 'from-purple-400 to-indigo-500',
      description: '助力项目发展'
    }
  };


  // 创建支付宝Logo SVG
  const createAlipayLogoSvg = (size: number) => {
    return `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" rx="${size/8}" fill="white"/>
        <g transform="translate(${size*0.1}, ${size*0.1}) scale(${size*0.8/1024})">
          <path d="M1024.0512 701.0304V196.864A196.9664 196.9664 0 0 0 827.136 0H196.864A196.9664 196.9664 0 0 0 0 196.864v630.272A196.9152 196.9152 0 0 0 196.864 1024h630.272a197.12 197.12 0 0 0 193.8432-162.0992c-52.224-22.6304-278.528-120.32-396.4416-176.64-89.7024 108.6976-183.7056 173.9264-325.3248 173.9264s-236.1856-87.2448-224.8192-194.048c7.4752-70.0416 55.552-184.576 264.2944-164.9664 110.08 10.3424 160.4096 30.8736 250.1632 60.5184 23.1936-42.5984 42.496-89.4464 57.1392-139.264H248.064v-39.424h196.9152V311.1424H204.8V267.776h240.128V165.632s2.1504-15.9744 19.8144-15.9744h98.4576V267.776h256v43.4176h-256V381.952h208.8448a805.9904 805.9904 0 0 1-84.8384 212.6848c60.672 22.016 336.7936 106.3936 336.7936 106.3936zM283.5456 791.6032c-149.6576 0-173.312-94.464-165.376-133.9392 7.8336-39.3216 51.2-90.624 134.4-90.624 95.5904 0 181.248 24.4736 284.0576 74.5472-72.192 94.0032-160.9216 150.016-253.0816 150.016z" fill="#009FE8"/>
        </g>
      </svg>
    `;
  };

  // 生成带支付宝Logo的二维码
  const generateQRCodeWithLogo = async (url: string): Promise<string> => {
    try {
      // 生成基础二维码
      const qrCanvas = document.createElement('canvas');
      await QRCode.toCanvas(qrCanvas, url, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // 创建最终画布
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = 200;
      finalCanvas.height = 200;
      const ctx = finalCanvas.getContext('2d')!;

      // 绘制二维码
      ctx.drawImage(qrCanvas, 0, 0);

      // 在中心添加支付宝Logo
      const logoSize = 40;
      const centerX = 100;
      const centerY = 100;

      // 创建支付宝Logo图片
      const logoSvg = createAlipayLogoSvg(logoSize);
      const svgBlob = new Blob([logoSvg], { type: 'image/svg+xml' });
      const logoImg = new Image();
      
      // 等待Logo加载完成
      await new Promise<void>((resolve) => {
        logoImg.onload = () => {
          // 直接绘制Logo，不添加圆形背景
          ctx.drawImage(logoImg, centerX - logoSize/2, centerY - logoSize/2, logoSize, logoSize);
          URL.revokeObjectURL(logoImg.src); // 清理内存
          resolve();
        };
        logoImg.onerror = () => {
          // 如果Logo加载失败，什么都不绘制
          resolve();
        };
        logoImg.src = URL.createObjectURL(svgBlob);
      });

      return finalCanvas.toDataURL();
    } catch (error) {
      console.error('生成二维码失败:', error);
      // 降级到普通二维码
      return await QRCode.toDataURL(url, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    }
  };

  // 生成二维码
  useEffect(() => {
    if (isOpen) {
      const generateQRCodes = async () => {
        const codes: Record<string, string> = {};
        
        for (const [key, option] of Object.entries(sponsorOptions)) {
          try {
            codes[key] = await generateQRCodeWithLogo(option.url);
          } catch (error) {
            console.error(`生成${key}元二维码失败:`, error);
          }
        }
        
        setQrCodes(codes);
      };

      generateQRCodes();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedOptionData = sponsorOptions[selectedOption];
  const SelectedIcon = selectedOptionData.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* 背景遮罩 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* 弹窗内容 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="relative bg-background border border-muted-foreground/20 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
        >
          {/* 关闭按钮 */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-4 z-10 rounded-full hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </Button>

          {/* 头部 */}
          <div className="p-6 pb-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className={`w-10 h-10 bg-gradient-to-br ${selectedOptionData.color} rounded-xl flex items-center justify-center`}>
                <SelectedIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <AiOutlineAlipay className="w-6 h-6 text-[#1677FF]" />
                  <h2 className="text-xl font-bold text-foreground">支持我的工作</h2>
                </div>
                <p className="text-sm text-muted-foreground">感谢您的支持和鼓励！</p>
              </div>
            </div>

            {/* 选项卡 */}
            <div className="flex space-x-2 mb-4">
              {Object.entries(sponsorOptions).map(([key, option]) => {
                const OptionIcon = option.icon;
                const isSelected = selectedOption === key;
                
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedOption(key)}
                    className={`flex-1 p-3 rounded-xl border transition-all duration-200 ${
                      isSelected
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-muted-foreground/20 hover:border-muted-foreground/40 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-1">
                      <OptionIcon className="w-5 h-5" />
                      <span className="text-sm font-medium">{option.amount}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 二维码显示区域 */}
          <div className="px-6 pb-6">
            <div className="bg-muted/30 rounded-xl p-6 text-center">
              {qrCodes[selectedOption] ? (
                <div className="space-y-4">
                  <img
                    src={qrCodes[selectedOption]}
                    alt={`${selectedOptionData.amount}赞助二维码`}
                    className="w-48 h-48 mx-auto rounded-lg border border-muted-foreground/20"
                  />
                  <div>
                    <p className="text-lg font-semibold text-foreground mb-1">
                      {selectedOptionData.description}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      使用支付宝扫描二维码赞助 {selectedOptionData.amount}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="w-48 h-48 mx-auto flex items-center justify-center bg-muted/50 rounded-lg">
                  <div className="text-center">
                    <Coffee className="w-8 h-8 mx-auto mb-2 text-muted-foreground animate-pulse" />
                    <p className="text-sm text-muted-foreground">生成二维码中...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 底部说明 */}
          <div className="px-6 pb-6">
            <div className="bg-gradient-to-r from-violet-500/10 to-cyan-500/10 rounded-lg p-4 border border-violet-500/20">
              <div className="flex items-center space-x-2 mb-2">
                <Heart className="w-4 h-4 text-violet-500" />
                <span className="text-sm font-medium text-foreground">感谢您的支持</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                您的每一份支持都是我继续创作和维护开源项目的动力。
                所有赞助将用于服务器维护、工具开发和内容创作。
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
