/**
 * 管理员系统设置组件
 * 用于管理系统配置，包括备案号等设置
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, RefreshCw, Settings, Globe, Info, Eye, EyeOff, Plus, Edit, Trash, ExternalLink, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  const [savingWebsite, setSavingWebsite] = useState(false);
  const [savingIcp, setSavingIcp] = useState(false);
  const [formData, setFormData] = useState({
    site_name: '',
    site_description: '',
    icp_number: '',
    show_icp: false,
    friend_links: [] as Array<{ name: string; url: string; icon?: string }>
  });

  // 友情链接弹窗状态
  const [friendLinkModal, setFriendLinkModal] = useState({
    open: false,
    editing: false,
    editIndex: -1,
    form: { name: '', url: '', icon: '' }
  });
  
  // 友链操作加载状态
  const [friendLinkLoading, setFriendLinkLoading] = useState(false);

  // 加载系统设置
  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsApi.getAllSettings();
      // console.log('AdminSystemSettings - 系统设置API响应:', response); // 调试日志
      if (response.success) {
        setSettings(response.data);
        
        // 更新表单数据
        const websiteSettings = response.data.website || {};
        // console.log('AdminSystemSettings - 网站设置:', websiteSettings); // 调试日志
        setFormData({
          site_name: websiteSettings.site_name?.value || '',
          site_description: websiteSettings.site_description?.value || '',
          icp_number: websiteSettings.icp_number?.value || '',
          show_icp: websiteSettings.show_icp?.value || false,
          friend_links: Array.isArray(websiteSettings.friend_links?.value) ? websiteSettings.friend_links.value : []
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
        },
        {
          setting_key: 'friend_links',
          setting_value: formData.friend_links,
          setting_type: 'json'
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
        show_icp: websiteSettings.show_icp?.value || false,
        friend_links: Array.isArray(websiteSettings.friend_links?.value) ? websiteSettings.friend_links.value : []
      });
      toast.success('表单已重置');
    }
  };

  // 友情链接操作函数
  const handleFriendLinkAdd = () => {
    setFriendLinkModal({
      open: true,
      editing: false,
      editIndex: -1,
      form: { name: '', url: '', icon: '' }
    });
  };

  const handleFriendLinkEdit = (index: number) => {
    const link = formData.friend_links[index];
    setFriendLinkModal({
      open: true,
      editing: true,
      editIndex: index,
      form: { name: link.name, url: link.url, icon: link.icon || '' }
    });
  };

  const handleFriendLinkDelete = async (index: number) => {
    try {
      setFriendLinkLoading(true);
      const newLinks = formData.friend_links.filter((_, i) => i !== index);
      
      // 立即保存到数据库
      const updates: SettingsUpdateData[] = [{
        setting_key: 'friend_links',
        setting_value: newLinks,
        setting_type: 'json'
      }];
      
      const response = await settingsApi.updateSettings(updates);
      if (response.success) {
        // 更新本地状态
        setFormData(prev => ({ ...prev, friend_links: newLinks }));
        toast.success('友链已删除');
        
        // 无感更新本地状态，避免重新加载
        if (settings?.website) {
          setSettings(prev => ({
            ...prev!,
            website: {
              ...prev!.website,
              friend_links: { ...prev!.website.friend_links, value: newLinks }
            }
          }));
        }
      } else {
        toast.error('删除友链失败');
      }
    } catch (error) {
      console.error('删除友链失败:', error);
      toast.error('删除友链失败');
    } finally {
      setFriendLinkLoading(false);
    }
  };

  const handleFriendLinkSave = async () => {
    const { form, editing, editIndex } = friendLinkModal;
    
    if (!form.name.trim() || !form.url.trim()) {
      toast.error('请填写站点名称和链接');
      return;
    }

    try {
      setFriendLinkLoading(true);
      let newLinks = [...formData.friend_links];
      
      if (editing && editIndex !== -1) {
        newLinks[editIndex] = { ...form };
      } else {
        newLinks.push({ ...form });
      }
      
      // 立即保存到数据库
      const updates: SettingsUpdateData[] = [{
        setting_key: 'friend_links',
        setting_value: newLinks,
        setting_type: 'json'
      }];
      
      const response = await settingsApi.updateSettings(updates);
      if (response.success) {
        // 更新本地状态
        setFormData(prev => ({ ...prev, friend_links: newLinks }));
        
        // 关闭弹窗
        setFriendLinkModal({
          open: false,
          editing: false,
          editIndex: -1,
          form: { name: '', url: '', icon: '' }
        });
        
        if (editing && editIndex !== -1) {
          toast.success('友链已更新');
        } else {
          toast.success('友链已添加');
        }
        
        // 无感更新本地状态，避免重新加载
        if (settings?.website) {
          setSettings(prev => ({
            ...prev!,
            website: {
              ...prev!.website,
              friend_links: { ...prev!.website.friend_links, value: newLinks }
            }
          }));
        }
      } else {
        toast.error('保存友链失败');
      }
    } catch (error) {
      console.error('保存友链失败:', error);
      toast.error('保存友链失败');
    } finally {
      setFriendLinkLoading(false);
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
            <span>重置表单</span>
          </Button>
        </div>
      </div>

      {/* 设置表单 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 网站基本信息 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Globe className="w-5 h-5" />
                <span>网站基本信息</span>
              </CardTitle>
              <Button
                variant="blackWhite"
                onClick={handleSaveWebsite}
                disabled={savingWebsite}
                size="sm"
                className="flex items-center space-x-2"
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
                disabled={savingWebsite}
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
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Info className="w-5 h-5" />
                <span>备案信息</span>
              </CardTitle>
              <Button
                variant="blackWhite"
                onClick={handleSaveIcp}
                disabled={savingIcp}
                size="sm"
                className="flex items-center space-x-2"
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

        {/* 友情链接设置 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Globe className="w-5 h-5" />
                <span>友情链接</span>
              </CardTitle>
              <Dialog 
                open={friendLinkModal.open} 
                onOpenChange={(open) => setFriendLinkModal(prev => ({ ...prev, open }))}
              >
                <DialogTrigger asChild>
                  <Button 
                    variant="blackWhite" 
                    size="sm"
                    onClick={handleFriendLinkAdd}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    新增友链
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {friendLinkModal.editing ? '编辑友情链接' : '新增友情链接'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="link-name">站点名称 *</Label>
                      <Input
                        id="link-name"
                        value={friendLinkModal.form.name}
                        onChange={(e) => setFriendLinkModal(prev => ({
                          ...prev,
                          form: { ...prev.form, name: e.target.value }
                        }))}
                        placeholder="如：AiQiji博客"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="link-url">站点链接 *</Label>
                      <Input
                        id="link-url"
                        value={friendLinkModal.form.url}
                        onChange={(e) => setFriendLinkModal(prev => ({
                          ...prev,
                          form: { ...prev.form, url: e.target.value }
                        }))}
                        placeholder="如：https://aiqji.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="link-icon">站点图标</Label>
                      <Input
                        id="link-icon"
                        value={friendLinkModal.form.icon}
                        onChange={(e) => setFriendLinkModal(prev => ({
                          ...prev,
                          form: { ...prev.form, icon: e.target.value }
                        }))}
                        placeholder="图标URL（可选）"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setFriendLinkModal(prev => ({ ...prev, open: false }))}
                        disabled={friendLinkLoading}
                      >
                        取消
                      </Button>
                      <Button 
                        variant="blackWhite"
                        onClick={handleFriendLinkSave} 
                        disabled={friendLinkLoading}
                      >
                        {friendLinkLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {friendLinkLoading ? '保存中...' : (friendLinkModal.editing ? '更新' : '添加')}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground mb-4">
              配置将在Footer中显示的友情链接。
            </div>
            {formData.friend_links.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {formData.friend_links.map((link, idx) => (
                  <Card key={idx} className="border-2">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            {link.icon ? (
                              <img 
                                src={link.icon} 
                                alt={link.name}
                                className="w-4 h-4 object-contain"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <ExternalLink className="w-4 h-4 text-muted-foreground" />
                            )}
                            <h4 className="font-medium text-sm truncate">{link.name}</h4>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{link.url}</p>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFriendLinkEdit(idx)}
                            className="h-8 w-8 p-0"
                            disabled={friendLinkLoading}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFriendLinkDelete(idx)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            disabled={friendLinkLoading}
                          >
                            {friendLinkLoading ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Trash className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>暂无友情链接</p>
                <p className="text-xs">点击右上角"新增友链"按钮添加</p>
              </div>
            )}
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
              <li>• 友情链接添加、编辑、删除操作会立即生效</li>
              <li>• 所有设置保存后立即生效，无需重启服务</li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
