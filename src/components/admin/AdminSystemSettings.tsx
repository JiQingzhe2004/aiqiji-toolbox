/**
 * 管理员系统设置组件
 * 用于管理系统配置，包括备案号等设置
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, RefreshCw, Settings, Globe, Info, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { settingsApi, type SettingsUpdateData } from '@/services/settingsApi';
import toast from 'react-hot-toast';

interface SystemSettings {
  website: {
    [key: string]: {
      value: any;
      description: string;
      type: string;
      is_public: boolean;
    };
  };
}

export function AdminSystemSettings() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    site_name: '',
    site_description: '',
    icp_number: '',
    show_icp: false
  });

  // 加载系统设置
  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsApi.getAllSettings();
      if (response.success) {
        setSettings(response.data);
        
        // 更新表单数据
        const websiteSettings = response.data.website || {};
        setFormData({
          site_name: websiteSettings.site_name?.value || '',
          site_description: websiteSettings.site_description?.value || '',
          icp_number: websiteSettings.icp_number?.value || '',
          show_icp: websiteSettings.show_icp?.value || false
        });
      }
    } catch (error) {
      console.error('加载系统设置失败:', error);
      toast.error('加载系统设置失败');
    } finally {
      setLoading(false);
    }
  };

  // 保存设置
  const handleSave = async () => {
    try {
      setSaving(true);
      
      const updates: SettingsUpdateData[] = [
        {
          setting_key: 'site_name',
          setting_value: formData.site_name,
          setting_type: 'string'
        },
        {
          setting_key: 'site_description',
          setting_value: formData.site_description,
          setting_type: 'string'
        },
        {
          setting_key: 'icp_number',
          setting_value: formData.icp_number,
          setting_type: 'string'
        },
        {
          setting_key: 'show_icp',
          setting_value: formData.show_icp,
          setting_type: 'boolean'
        }
      ];
      
      const response = await settingsApi.updateSettings(updates);
      if (response.success) {
        toast.success('系统设置保存成功');
        await loadSettings(); // 重新加载设置
      } else {
        toast.error('保存设置失败');
      }
    } catch (error) {
      console.error('保存系统设置失败:', error);
      toast.error('保存设置失败');
    } finally {
      setSaving(false);
    }
  };

  // 重置表单
  const handleReset = () => {
    if (settings?.website) {
      const websiteSettings = settings.website;
      setFormData({
        site_name: websiteSettings.site_name?.value || '',
        site_description: websiteSettings.site_description?.value || '',
        icp_number: websiteSettings.icp_number?.value || '',
        show_icp: websiteSettings.show_icp?.value || false
      });
      toast.success('表单已重置');
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-10 bg-muted rounded animate-pulse" />
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-10 bg-muted rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">系统设置</h2>
            <p className="text-muted-foreground">管理网站基本信息和显示设置</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>重置</span>
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? '保存中...' : '保存设置'}</span>
          </Button>
        </div>
      </div>

      {/* 设置表单 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 网站基本信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="w-5 h-5" />
              <span>网站基本信息</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="site_name">网站名称</Label>
              <Input
                id="site_name"
                value={formData.site_name}
                onChange={(e) => setFormData(prev => ({ ...prev, site_name: e.target.value }))}
                placeholder="请输入网站名称"
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                网站的显示名称，将在页面标题和Footer中显示
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="site_description">网站描述</Label>
              <Input
                id="site_description"
                value={formData.site_description}
                onChange={(e) => setFormData(prev => ({ ...prev, site_description: e.target.value }))}
                placeholder="请输入网站描述"
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                网站的简短描述，将在首页和Footer中显示
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 备案信息设置 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Info className="w-5 h-5" />
              <span>备案信息</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="icp_number">备案号</Label>
              <Input
                id="icp_number"
                value={formData.icp_number}
                onChange={(e) => setFormData(prev => ({ ...prev, icp_number: e.target.value }))}
                placeholder="请输入备案号，如：京ICP备12345678号"
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                网站的ICP备案号，点击后将链接到beian.miit.gov.cn
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="show_icp" className="flex items-center space-x-2">
                    {formData.show_icp ? (
                      <Eye className="w-4 h-4 text-green-600" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    )}
                    <span>显示备案号</span>
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    控制备案号是否在网站底部显示
                  </p>
                </div>
                <Switch
                  id="show_icp"
                  checked={formData.show_icp}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, show_icp: checked }))}
                />
              </div>
              
              {formData.show_icp && !formData.icp_number && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    ⚠️ 已启用备案号显示，但备案号为空，请填写备案号后再保存
                  </p>
                </div>
              )}
              
              {formData.show_icp && formData.icp_number && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    ✅ 备案号将在网站底部显示：
                    <a
                      href="https://beian.miit.gov.cn/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-1 underline"
                    >
                      {formData.icp_number}
                    </a>
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 保存提示 */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
              设置说明
            </h4>
            <ul className="mt-2 text-xs text-blue-800 dark:text-blue-200 space-y-1">
              <li>• 网站名称和描述将在前端页面中实时更新</li>
              <li>• 备案号支持链接到工信部备案查询网站</li>
              <li>• 显示开关可以控制备案号是否在前端展示</li>
              <li>• 保存后设置将立即生效，无需重启服务</li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
