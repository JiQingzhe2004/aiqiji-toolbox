/**
 * 管理员系统设置组件
 * 用于管理系统配置，包括备案号等设置
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, RefreshCw, Settings, Globe, Info, Eye, EyeOff, Plus, Edit, Trash, ExternalLink, Loader2, Shield, Mail, TestTube } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { settingsApi, type SettingsUpdateData } from '@/services/settingsApi';
import { EmailConfigCard } from '@/components/EmailConfigCard';
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
  general: {
    [key: string]: {
      value: any;
      description: string;
      type: string;
      is_public: boolean;
    };
  };
  email?: {
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
  const [savingWebsite, setSavingWebsite] = useState(false);
  const [savingIcp, setSavingIcp] = useState(false);
  const [savingVpn, setSavingVpn] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [formData, setFormData] = useState({
    site_name: '',
    site_url: '',
    site_icon: '',
    site_description: '',
    icp_number: '',
    show_icp: false,
    show_vpn_indicator: true
  });
  
  // 邮箱配置表单数据
  const [emailConfig, setEmailConfig] = useState({
    smtp_host: '',
    smtp_port: 587,
    smtp_secure: false,
    smtp_user: '',
    smtp_pass: '',
    from_name: '',
    from_email: '',
    email_enabled: false
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
        // 邮箱设置可能在 email 分类或 general 分类中
        const emailSettings = response.data.email || {};
        const generalSettings = response.data.general || {};
        setFormData({
          site_name: websiteSettings.site_name?.value || '',
          site_url: websiteSettings.site_url?.value || '',
          site_icon: websiteSettings.site_icon?.value || '',
          site_description: websiteSettings.site_description?.value || '',
          icp_number: websiteSettings.icp_number?.value || '',
          show_icp: websiteSettings.show_icp?.value || false,
          show_vpn_indicator: response.data.general?.show_vpn_indicator?.value ?? true
        });
        
        // 更新邮箱配置表单数据 - 从email分类或general分类获取
        const getEmailSetting = (key: string) => {
          return emailSettings[key]?.value || generalSettings[key]?.value || '';
        };
        
        setEmailConfig({
          smtp_host: getEmailSetting('smtp_host'),
          smtp_port: parseInt(getEmailSetting('smtp_port')) || 587,
          smtp_secure: getEmailSetting('smtp_secure') || false,
          smtp_user: getEmailSetting('smtp_user'),
          smtp_pass: getEmailSetting('smtp_pass'),
          from_name: getEmailSetting('from_name'),
          from_email: getEmailSetting('from_email'),
          email_enabled: getEmailSetting('email_enabled') || false
        });
      }
    } catch (error) {
      console.error('加载系统设置失败:', error);
      toast.error('加载系统设置失败');
    } finally {
      setLoading(false);
    }
  };

  // 保存网站基本信息
  const handleSaveWebsite = async () => {
    try {
      setSavingWebsite(true);
      
      const updates: SettingsUpdateData[] = [
        {
          setting_key: 'site_name',
          setting_value: formData.site_name,
          setting_type: 'string'
        },
        {
          setting_key: 'site_url',
          setting_value: formData.site_url,
          setting_type: 'string'
        },
        {
          setting_key: 'site_icon',
          setting_value: formData.site_icon,
          setting_type: 'string'
        },
        {
          setting_key: 'site_description',
          setting_value: formData.site_description,
          setting_type: 'string'
        }
      ];
      
      const response = await settingsApi.updateSettings(updates);
      if (response.success) {
        toast.success('网站基本信息保存成功');
        // 无感更新本地状态，避免重新加载
        if (settings?.website) {
          setSettings(prev => ({
            ...prev!,
            website: {
              ...prev!.website,
              site_name: { ...prev!.website.site_name, value: formData.site_name },
              site_url: { ...prev!.website.site_url, value: formData.site_url },
              site_icon: { ...prev!.website.site_icon, value: formData.site_icon },
              site_description: { ...prev!.website.site_description, value: formData.site_description }
            }
          }));
        }
      } else {
        toast.error('保存网站信息失败');
      }
    } catch (error) {
      console.error('保存网站信息失败:', error);
      toast.error('保存网站信息失败');
    } finally {
      setSavingWebsite(false);
    }
  };

  // 保存备案信息
  const handleSaveIcp = async () => {
    try {
      setSavingIcp(true);
      
      const updates: SettingsUpdateData[] = [
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
        toast.success('备案信息保存成功');
        // 无感更新本地状态，避免重新加载
        if (settings?.website) {
          setSettings(prev => ({
            ...prev!,
            website: {
              ...prev!.website,
              icp_number: { ...prev!.website.icp_number, value: formData.icp_number },
              show_icp: { ...prev!.website.show_icp, value: formData.show_icp }
            }
          }));
        }
      } else {
        toast.error('保存备案信息失败');
      }
    } catch (error) {
      console.error('保存备案信息失败:', error);
      toast.error('保存备案信息失败');
    } finally {
      setSavingIcp(false);
    }
  };

  // 保存VPN设置
  const handleSaveVpn = async () => {
    try {
      setSavingVpn(true);
      
      const updates: SettingsUpdateData[] = [
        {
          setting_key: 'show_vpn_indicator',
          setting_value: formData.show_vpn_indicator,
          setting_type: 'boolean'
        }
      ];
      
      const response = await settingsApi.updateSettings(updates);
      if (response.success) {
        toast.success('VPN设置保存成功');
        // 无感更新本地状态，避免重新加载
        if (settings) {
          setSettings(prev => ({
            ...prev!,
            general: {
              ...prev!.general,
              show_vpn_indicator: { 
                value: formData.show_vpn_indicator, 
                description: '是否显示VPN标识',
                type: 'boolean',
                is_public: true
              }
            }
          }));
        }
      } else {
        toast.error('保存VPN设置失败');
      }
    } catch (error) {
      console.error('保存VPN设置失败:', error);
      toast.error('保存VPN设置失败');
    } finally {
      setSavingVpn(false);
    }
  };

  // 保存所有设置（保留作为备用）
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
          setting_key: 'site_url',
          setting_value: formData.site_url,
          setting_type: 'string'
        },
        {
          setting_key: 'site_icon',
          setting_value: formData.site_icon,
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
    if (settings) {
      const websiteSettings = settings.website || {};
      const generalSettings = settings.general || {};
      setFormData({
        site_name: websiteSettings.site_name?.value || '',
        site_url: websiteSettings.site_url?.value || '',
        site_icon: websiteSettings.site_icon?.value || '',
        site_description: websiteSettings.site_description?.value || '',
        icp_number: websiteSettings.icp_number?.value || '',
        show_icp: websiteSettings.show_icp?.value || false,
        show_vpn_indicator: generalSettings.show_vpn_indicator?.value ?? true
      });
      toast.success('表单已重置');
    }
  };


  // 保存邮箱配置
  const handleSaveEmailConfig = async () => {
    try {
      setSavingEmail(true);
      
      const updates: SettingsUpdateData[] = [
        {
          setting_key: 'smtp_host',
          setting_value: emailConfig.smtp_host,
          setting_type: 'string'
        },
        {
          setting_key: 'smtp_port',
          setting_value: emailConfig.smtp_port.toString(),
          setting_type: 'string'
        },
        {
          setting_key: 'smtp_secure',
          setting_value: emailConfig.smtp_secure,
          setting_type: 'boolean'
        },
        {
          setting_key: 'smtp_user',
          setting_value: emailConfig.smtp_user,
          setting_type: 'string'
        },
        {
          setting_key: 'smtp_pass',
          setting_value: emailConfig.smtp_pass,
          setting_type: 'string'
        },
        {
          setting_key: 'from_name',
          setting_value: emailConfig.from_name,
          setting_type: 'string'
        },
        {
          setting_key: 'from_email',
          setting_value: emailConfig.from_email,
          setting_type: 'string'
        },
        {
          setting_key: 'email_enabled',
          setting_value: emailConfig.email_enabled,
          setting_type: 'boolean'
        }
      ];
      
      const response = await settingsApi.updateSettings(updates);
      if (response.success) {
        toast.success('邮箱配置保存成功');
      } else {
        toast.error('保存邮箱配置失败');
      }
    } catch (error) {
      console.error('保存邮箱配置失败:', error);
      toast.error('保存邮箱配置失败');
    } finally {
      setSavingEmail(false);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold">系统设置</h2>
            <p className="text-muted-foreground text-sm sm:text-base">管理网站基本信息和显示设置</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex items-center space-x-2"
            size="sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">重置表单</span>
            <span className="sm:hidden">重置</span>
          </Button>
        </div>
      </div>

      {/* 设置表单 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* 网站基本信息 */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="flex items-center space-x-2">
                <Globe className="w-5 h-5" />
                <span>网站基本信息</span>
              </CardTitle>
              <Button
                variant="blackWhite"
                onClick={handleSaveWebsite}
                disabled={savingWebsite}
                size="sm"
                className="flex items-center space-x-2 w-full sm:w-auto"
              >
                {savingWebsite && <Loader2 className="w-4 h-4 animate-spin" />}
                <Save className="w-4 h-4" />
                <span>{savingWebsite ? '保存中...' : '保存'}</span>
              </Button>
            </div>
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
                disabled={savingWebsite}
              />
              <p className="text-xs text-muted-foreground">
                网站的显示名称，将在页面标题和友链申请中显示
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="site_url">网站地址</Label>
              <Input
                id="site_url"
                type="url"
                value={formData.site_url}
                onChange={(e) => setFormData(prev => ({ ...prev, site_url: e.target.value }))}
                placeholder="https://example.com"
                className="w-full"
                disabled={savingWebsite}
              />
              <p className="text-xs text-muted-foreground">
                网站的完整URL地址，将在友链申请中显示
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="site_icon">网站图标</Label>
              <Input
                id="site_icon"
                type="url"
                value={formData.site_icon}
                onChange={(e) => setFormData(prev => ({ ...prev, site_icon: e.target.value }))}
                placeholder="https://example.com/favicon.ico"
                className="w-full"
                disabled={savingWebsite}
              />
              <p className="text-xs text-muted-foreground">
                网站图标的URL地址，将在友链申请中显示
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
                disabled={savingWebsite}
              />
              <p className="text-xs text-muted-foreground">
                网站的简短描述，将在首页和友链申请中显示
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 备案信息设置 */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="flex items-center space-x-2">
                <Info className="w-5 h-5" />
                <span>备案信息</span>
              </CardTitle>
              <Button
                variant="blackWhite"
                onClick={handleSaveIcp}
                disabled={savingIcp}
                size="sm"
                className="flex items-center space-x-2 w-full sm:w-auto"
              >
                {savingIcp && <Loader2 className="w-4 h-4 animate-spin" />}
                <Save className="w-4 h-4" />
                <span>{savingIcp ? '保存中...' : '保存'}</span>
              </Button>
            </div>
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
                disabled={savingIcp}
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
                  disabled={savingIcp}
                />
              </div>
              
              {formData.show_icp && !formData.icp_number && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    ⚠️ 已启用备案号显示，但备案号为空，请填写备案号后再保存
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* VPN设置 */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>VPN标识</span>
              </CardTitle>
              <Button
                variant="blackWhite"
                onClick={handleSaveVpn}
                disabled={savingVpn}
                size="sm"
                className="flex items-center space-x-2 w-full sm:w-auto"
              >
                {savingVpn && <Loader2 className="w-4 h-4 animate-spin" />}
                <Save className="w-4 h-4" />
                <span>{savingVpn ? '保存中...' : '保存'}</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="show_vpn_indicator" className="flex items-center space-x-2">
                    {formData.show_vpn_indicator ? (
                      <Eye className="w-4 h-4 text-green-600" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    )}
                    <span>显示VPN标识</span>
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    控制是否在工具卡片上显示VPN标识
                  </p>
                </div>
                <Switch
                  id="show_vpn_indicator"
                  checked={formData.show_vpn_indicator}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, show_vpn_indicator: checked }))}
                  disabled={savingVpn}
                />
              </div>
              
              {formData.show_vpn_indicator && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    💡 启用后，需要VPN才能访问的工具将显示VPN标识，帮助用户了解访问要求
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
              <li>• 每个设置区域都有独立的保存按钮，修改后点击对应的保存按钮即可</li>
              <li>• 网站名称和描述将在前端页面中实时更新</li>
              <li>• 备案号支持链接到工信部备案查询网站</li>
              <li>• VPN标识帮助用户了解工具的访问要求</li>
              <li>• 所有设置保存后立即生效，无需重启服务</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 邮箱配置卡片 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <EmailConfigCard
          config={emailConfig}
          onChange={setEmailConfig}
          onSave={handleSaveEmailConfig}
          loading={savingEmail}
        />
      </motion.div>
    </motion.div>
  );
}
