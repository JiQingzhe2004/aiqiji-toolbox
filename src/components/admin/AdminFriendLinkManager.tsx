import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Loader2,
  Save,
  X,
  Link2,
  Globe,
  Image
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { settingsApi } from '@/services/settingsApi';
import type { SettingsUpdateData } from '@/services/settingsApi';
import toast from 'react-hot-toast';

interface FriendLink {
  name: string;
  url: string;
  description?: string;
  icon?: string;
}

export function AdminFriendLinkManager() {
  const [friendLinks, setFriendLinks] = useState<FriendLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // 友情链接弹窗状态
  const [modal, setModal] = useState({
    open: false,
    editing: false,
    editIndex: -1,
    form: { name: '', url: '', description: '', icon: '' }
  });

  // 加载友情链接数据
  const loadFriendLinks = async () => {
    try {
      setLoading(true);
      const response = await settingsApi.getAllSettings();
      if (response.success) {
        const websiteSettings = response.data.website || {};
        const links = Array.isArray(websiteSettings.friend_links?.value) 
          ? websiteSettings.friend_links.value 
          : [];
        setFriendLinks(links);
      }
    } catch (error) {
      console.error('加载友情链接失败:', error);
      toast.error('加载友情链接失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFriendLinks();
  }, []);

  // 保存友情链接到后端
  const saveFriendLinksToBackend = async (links: FriendLink[]) => {
    const updateData: SettingsUpdateData = {
      setting_key: 'friend_links',
      setting_value: links,
      setting_type: 'json'
    };

    const response = await settingsApi.updateSettings([updateData]);
    if (!response.success) {
      throw new Error(response.message || '保存失败');
    }
    return response;
  };

  // 添加友情链接
  const handleAdd = () => {
    setModal({
      open: true,
      editing: false,
      editIndex: -1,
      form: { name: '', url: '', description: '', icon: '' }
    });
  };

  // 编辑友情链接
  const handleEdit = (index: number) => {
    const link = friendLinks[index];
    setModal({
      open: true,
      editing: true,
      editIndex: index,
      form: { 
        name: link.name, 
        url: link.url, 
        description: link.description || '',
        icon: link.icon || '' 
      }
    });
  };

  // 删除友情链接
  const handleDelete = async (index: number) => {
    if (!confirm('确定要删除这个友情链接吗？')) {
      return;
    }

    try {
      setSaving(true);
      const newLinks = friendLinks.filter((_, i) => i !== index);
      
      await saveFriendLinksToBackend(newLinks);
      setFriendLinks(newLinks);
      toast.success('友情链接删除成功');
    } catch (error) {
      console.error('删除友情链接失败:', error);
      toast.error('删除友情链接失败');
    } finally {
      setSaving(false);
    }
  };

  // 保存友情链接（新增或编辑）
  const handleSave = async () => {
    const { form, editing, editIndex } = modal;
    
    // 验证表单
    if (!form.name.trim() || !form.url.trim()) {
      toast.error('请填写完整的友情链接信息');
      return;
    }

    // 验证URL格式
    try {
      new URL(form.url);
    } catch {
      toast.error('请输入有效的网站地址');
      return;
    }

    // 验证图标URL格式（如果提供了图标）
    if (form.icon && form.icon.trim()) {
      try {
        new URL(form.icon);
      } catch {
        toast.error('请输入有效的图标地址');
        return;
      }
    }

    try {
      setSaving(true);
      let newLinks = [...friendLinks];
      
      const linkData: FriendLink = {
        name: form.name.trim(),
        url: form.url.trim(),
        ...(form.description.trim() && { description: form.description.trim() }),
        ...(form.icon.trim() && { icon: form.icon.trim() })
      };

      if (editing && editIndex >= 0) {
        newLinks[editIndex] = linkData;
      } else {
        newLinks.push(linkData);
      }

      await saveFriendLinksToBackend(newLinks);
      setFriendLinks(newLinks);
      
      setModal({
        open: false,
        editing: false,
        editIndex: -1,
        form: { name: '', url: '', description: '', icon: '' }
      });
      
      toast.success(editing ? '友情链接更新成功' : '友情链接添加成功');
    } catch (error) {
      console.error('保存友情链接失败:', error);
      toast.error('保存友情链接失败');
    } finally {
      setSaving(false);
    }
  };

  // 关闭弹窗
  const handleClose = () => {
    setModal({
      open: false,
      editing: false,
      editIndex: -1,
      form: { name: '', url: '', description: '', icon: '' }
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>加载友情链接中...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部操作区 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-primary" />
                友情链接管理
              </CardTitle>
              <CardDescription>
                管理网站底部展示的友情链接，支持添加、编辑和删除操作
              </CardDescription>
            </div>
            <Dialog open={modal.open} onOpenChange={(open) => !open && handleClose()}>
              <DialogTrigger asChild>
                <Button onClick={handleAdd} className="gap-2">
                  <Plus className="w-4 h-4" />
                  添加友链
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {modal.editing ? '编辑友情链接' : '新增友情链接'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">网站名称 *</Label>
                    <Input
                      id="name"
                      value={modal.form.name}
                      onChange={(e) => setModal(prev => ({
                        ...prev,
                        form: { ...prev.form, name: e.target.value }
                      }))}
                      placeholder="请输入网站名称"
                      disabled={saving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="url">网站地址 *</Label>
                    <Input
                      id="url"
                      type="url"
                      value={modal.form.url}
                      onChange={(e) => setModal(prev => ({
                        ...prev,
                        form: { ...prev.form, url: e.target.value }
                      }))}
                      placeholder="https://example.com"
                      disabled={saving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">网站描述</Label>
                    <Textarea
                      id="description"
                      value={modal.form.description}
                      onChange={(e) => setModal(prev => ({
                        ...prev,
                        form: { ...prev.form, description: e.target.value }
                      }))}
                      placeholder="请简要介绍网站内容和特色"
                      rows={3}
                      disabled={saving}
                    />
                    <p className="text-xs text-muted-foreground">
                      可选，用于在友情链接中展示网站介绍
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="icon">网站图标</Label>
                    <Input
                      id="icon"
                      type="url"
                      value={modal.form.icon}
                      onChange={(e) => setModal(prev => ({
                        ...prev,
                        form: { ...prev.form, icon: e.target.value }
                      }))}
                      placeholder="https://example.com/favicon.ico"
                      disabled={saving}
                    />
                    <p className="text-xs text-muted-foreground">
                      可选，留空将显示默认图标
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    disabled={saving}
                  >
                    取消
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {saving ? '保存中...' : (modal.editing ? '更新' : '添加')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* 友情链接列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">当前友情链接</CardTitle>
          <CardDescription>
            共 {friendLinks.length} 个友情链接，将在网站底部展示
          </CardDescription>
        </CardHeader>
        <CardContent>
          {friendLinks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {friendLinks.map((link, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: idx * 0.05 }}
                >
                  <Card className="border-2 hover:border-primary/30 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            {link.icon ? (
                              <img 
                                src={link.icon} 
                                alt={link.name}
                                className="w-5 h-5 object-contain rounded-sm"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <Globe className="w-5 h-5 text-muted-foreground" />
                            )}
                            <h4 className="font-medium text-sm truncate">{link.name}</h4>
                          </div>
                          <p className="text-xs text-muted-foreground truncate" title={link.url}>
                            {link.url}
                          </p>
                          {link.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2" title={link.description}>
                              {link.description}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(idx)}
                          disabled={saving}
                          className="flex-1"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          编辑
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(idx)}
                          disabled={saving}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(link.url, '_blank')}
                          title="访问网站"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Link2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">暂无友情链接</h3>
              <p className="text-muted-foreground mb-4">
                点击"添加友链"按钮添加第一个友情链接
              </p>
              <Button onClick={handleAdd} className="gap-2">
                <Plus className="w-4 h-4" />
                添加友链
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 使用说明 */}
      <Alert>
        <Image className="h-4 w-4" />
        <AlertDescription>
          <strong>使用说明：</strong>
          <ul className="mt-2 ml-4 list-disc space-y-1 text-sm">
            <li>友情链接将在网站底部"友情链接"区域显示</li>
            <li>网站图标支持 ico、png、jpg、svg 等格式</li>
            <li>建议图标尺寸为 16x16 或 32x32 像素</li>
            <li>友情链接添加、编辑、删除操作会立即生效</li>
            <li>支持手动排序，按添加顺序显示</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}

export default AdminFriendLinkManager;
