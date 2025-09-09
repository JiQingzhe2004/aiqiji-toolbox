import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X, Settings, Shield, BarChart3, Check, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  functional: boolean;
}

/**
 * Cookie同意横幅组件
 * 符合GDPR等隐私法规要求
 */
function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // 必要Cookie始终启用
    analytics: false,
    functional: false,
  });

  // 检查是否已经有Cookie同意记录
  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      // 延迟显示，避免影响页面首次加载体验
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      // 如果已有同意记录，应用用户的偏好设置
      try {
        const savedPreferences = JSON.parse(consent);
        setPreferences(savedPreferences);
        applyAnalyticsSettings(savedPreferences.analytics);
      } catch (error) {
        console.error('解析Cookie偏好设置失败:', error);
      }
    }
  }, []);

  // 应用分析工具设置
  const applyAnalyticsSettings = (enabled: boolean) => {
    if (enabled) {
      // 启用Google Analytics和Cloudflare Insights
      // Google Analytics
      if (typeof window.gtag !== 'undefined') {
        window.gtag('consent', 'update', {
          analytics_storage: 'granted'
        });
      }
      
      // Cloudflare Browser Insights会自动工作，但可以通过beacon设置控制
      if (window.cloudflare && window.cloudflare.beacon) {
        window.cloudflare.beacon.enabled = true;
      }
    } else {
      // 禁用分析工具
      if (typeof window.gtag !== 'undefined') {
        window.gtag('consent', 'update', {
          analytics_storage: 'denied'
        });
      }
      
      if (window.cloudflare && window.cloudflare.beacon) {
        window.cloudflare.beacon.enabled = false;
      }
    }
  };

  // 保存Cookie偏好设置
  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem('cookie-consent', JSON.stringify(prefs));
    localStorage.setItem('cookie-consent-date', new Date().toISOString());
    applyAnalyticsSettings(prefs.analytics);
    setPreferences(prefs);
  };

  // 接受所有Cookie
  const acceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      functional: true,
    };
    savePreferences(allAccepted);
    setIsVisible(false);
    setShowSettings(false);
  };

  // 仅接受必要Cookie
  const acceptNecessary = () => {
    const necessaryOnly = {
      necessary: true,
      analytics: false,
      functional: false,
    };
    savePreferences(necessaryOnly);
    setIsVisible(false);
    setShowSettings(false);
  };

  // 保存自定义设置
  const saveCustomSettings = () => {
    savePreferences(preferences);
    setIsVisible(false);
    setShowSettings(false);
  };

  // 更新单个偏好设置
  const updatePreference = (key: keyof CookiePreferences, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: key === 'necessary' ? true : value // 必要Cookie不能被禁用
    }));
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Cookie同意横幅 */}
      <AnimatePresence>
        {isVisible && !showSettings && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur-md border-t border-border shadow-lg"
          >
            <div className="container mx-auto max-w-6xl">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                {/* 图标和文本 */}
                <div className="flex items-start gap-3 flex-1">
                  <Cookie className="w-6 h-6 text-violet-500 shrink-0 mt-1" />
                  <div className="space-y-1">
                    <h3 className="font-semibold text-foreground">
                      我们使用Cookie来改善您的体验
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      我们使用Cookie和类似技术来分析网站流量、个性化内容并改善用户体验。
                      这包括Google Analytics和Cloudflare Browser Insights用于网站分析。
                      您可以选择接受所有Cookie或自定义您的偏好设置。
                    </p>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSettings(true)}
                    className="flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    自定义设置
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={acceptNecessary}
                    className="flex items-center gap-2"
                  >
                    <Ban className="w-4 h-4" />
                    仅必要Cookie
                  </Button>
                  <Button
                    size="sm"
                    onClick={acceptAll}
                    className="bg-black hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 text-white flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    接受所有
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cookie设置对话框 */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-violet-500" />
              隐私偏好设置
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              管理您的Cookie偏好设置。您可以随时更改这些设置。
            </p>

            {/* 必要Cookie */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="font-medium">必要Cookie</h4>
                  <p className="text-sm text-muted-foreground">
                    这些Cookie对于网站的基本功能是必需的，无法禁用。
                  </p>
                </div>
                <Switch
                  checked={preferences.necessary}
                  disabled={true}
                  aria-label="必要Cookie（无法禁用）"
                />
              </div>
            </div>

            {/* 分析Cookie */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="font-medium flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    分析Cookie
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    帮助我们了解访问者如何使用我们的网站，以便改善用户体验。
                    包括Google和Cloudflare。
                  </p>
                </div>
                <Switch
                  checked={preferences.analytics}
                  onCheckedChange={(checked) => updatePreference('analytics', checked)}
                  aria-label="分析Cookie"
                />
              </div>
            </div>

            {/* 功能Cookie */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="font-medium">功能Cookie</h4>
                  <p className="text-sm text-muted-foreground">
                    用于记住您的偏好设置和选择，提供个性化体验。
                  </p>
                </div>
                <Switch
                  checked={preferences.functional}
                  onCheckedChange={(checked) => updatePreference('functional', checked)}
                  aria-label="功能Cookie"
                />
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={acceptNecessary}
                className="flex items-center gap-2"
              >
                <Ban className="w-4 h-4" />
                仅必要Cookie
              </Button>
              <Button
                onClick={saveCustomSettings}
                className="bg-black hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 text-white flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                保存设置
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// 类型声明，避免TypeScript错误
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    cloudflare?: {
      beacon?: {
        enabled: boolean;
      };
    };
  }
}

export default CookieConsent;
