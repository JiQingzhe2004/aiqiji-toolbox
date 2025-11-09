import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2, Bot, Plus, Edit, Trash2, Play, Settings, CheckCircle2, XCircle, Save } from 'lucide-react';
import { emailApi, type AiModelPreset } from '@/services/emailApi';
import toast from 'react-hot-toast';

export interface AIConfig {
  ai_enabled: boolean;
  ai_base_url: string;
  ai_api_key: string;
  ai_model: string;
}

interface AIConfigCardProps {
  config: AIConfig;
  onChange: (c: AIConfig) => void;
  onSave: () => void;
  onConfigReload?: () => Promise<void>;
  loading?: boolean;
}

export function AIConfigCard({ config, onChange, onSave, onConfigReload, loading }: AIConfigCardProps) {
  const [presets, setPresets] = useState<AiModelPreset[]>([]);
  const [loadingPresets, setLoadingPresets] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('manual');
  const [presetDialogOpen, setPresetDialogOpen] = useState(false);
  const [presetFormDialogOpen, setPresetFormDialogOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<AiModelPreset | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [presetToDelete, setPresetToDelete] = useState<AiModelPreset | null>(null);
  const [savingPreset, setSavingPreset] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latency_ms?: number } | null>(null);

  // 预设表单数据
  const [presetForm, setPresetForm] = useState({
    name: '',
    provider: '',
    model: '',
    base_url: '',
    api_key: '',
    description: ''
  });

  // 加载预设列表
  const loadPresets = async () => {
    try {
      setLoadingPresets(true);
      const response = await emailApi.getAiModels();
      console.log('加载预设响应:', response);
      if (response.success && response.data) {
        const items = response.data.items || [];
        console.log('加载到预设数量:', items.length);
        setPresets(items);
      } else {
        console.error('加载预设失败:', response);
        toast.error(response.message || '加载预设失败');
      }
    } catch (error) {
      console.error('加载预设异常:', error);
      toast.error(error instanceof Error ? error.message : '加载预设失败');
    } finally {
      setLoadingPresets(false);
    }
  };

  useEffect(() => {
    loadPresets();
  }, []);

  // 检测当前配置对应的预设（通过 base_url 和 model 匹配，不比较 api_key 因为可能有显示问题）
  useEffect(() => {
    if (presets.length > 0 && config.ai_base_url && config.ai_model) {
      const matchedPreset = presets.find(p => 
        p.base_url === config.ai_base_url && 
        p.model === config.ai_model
      );
      if (matchedPreset) {
        setSelectedPresetId(matchedPreset.id || 'manual');
      } else if (selectedPresetId !== 'manual') {
        // 如果当前选中的预设不再匹配，重置为手动配置
        setSelectedPresetId('manual');
      }
    } else if (!config.ai_base_url || !config.ai_model) {
      // 如果配置不完整，重置为手动配置
      if (selectedPresetId !== 'manual') {
        setSelectedPresetId('manual');
      }
    }
  }, [presets, config.ai_base_url, config.ai_model]);

  // 获取当前使用的预设名称
  const getCurrentPresetName = () => {
    if (selectedPresetId && selectedPresetId !== 'manual') {
      const preset = presets.find(p => p.id === selectedPresetId);
      return preset ? preset.name : null;
    }
    return null;
  };

  // 选择预设
  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    if (presetId && presetId !== 'manual') {
      const preset = presets.find(p => p.id === presetId);
      if (preset) {
        onChange({
          ...config,
          ai_base_url: preset.base_url,
          ai_api_key: preset.api_key,
          ai_model: preset.model
        });
      }
    }
  };

  // 应用预设
  const handleApplyPreset = async () => {
    if (!selectedPresetId || selectedPresetId === 'manual') {
      toast.error('请先选择一个预设');
      return;
    }
    try {
      const response = await emailApi.applyAiModel(selectedPresetId);
      if (response.success) {
        toast.success('预设应用成功');
        
        // 获取应用的预设配置
        const preset = presets.find(p => p.id === selectedPresetId);
        if (preset) {
          // 立即更新本地配置
          onChange({
            ...config,
            ai_base_url: preset.base_url,
            ai_api_key: preset.api_key,
            ai_model: preset.model
          });
        }
        
        // 如果有重新加载配置的回调，调用它
        if (onConfigReload) {
          await onConfigReload();
        }
      } else {
        toast.error(response.message || '应用预设失败');
      }
    } catch (error) {
      console.error('应用预设失败:', error);
      toast.error('应用预设失败');
    }
  };

  // 打开创建/编辑预设表单对话框
  const openPresetFormDialog = (preset?: AiModelPreset) => {
    if (preset) {
      setEditingPreset(preset);
      setPresetForm({
        name: preset.name,
        provider: preset.provider,
        model: preset.model,
        base_url: preset.base_url,
        api_key: preset.api_key,
        description: preset.description || ''
      });
    } else {
      setEditingPreset(null);
      setPresetForm({
        name: '',
        provider: '',
        model: '',
        base_url: config.ai_base_url || '',
        api_key: config.ai_api_key || '',
        description: ''
      });
    }
    setPresetFormDialogOpen(true);
  };

  // 保存预设
  const handleSavePreset = async () => {
    if (!presetForm.name || !presetForm.provider || !presetForm.model || !presetForm.base_url || !presetForm.api_key) {
      toast.error('请填写所有必填字段');
      return;
    }
    try {
      setSavingPreset(true);
      let response;
      if (editingPreset) {
        // 更新预设
        console.log('更新预设:', editingPreset.id, presetForm);
        response = await emailApi.updateAiModel(editingPreset.id!, presetForm);
      } else {
        // 创建预设
        console.log('创建预设:', presetForm);
        response = await emailApi.createAiModel(presetForm);
      }
      
      console.log('API响应:', response);
      
      if (response && response.success) {
        toast.success(editingPreset ? '预设更新成功' : '预设创建成功');
        
        // 如果是创建新预设，选中新创建的预设
        if (!editingPreset && response.data?.preset?.id) {
          setSelectedPresetId(response.data.preset.id);
          // 自动填充配置
          onChange({
            ...config,
            ai_base_url: response.data.preset.base_url,
            ai_api_key: response.data.preset.api_key,
            ai_model: response.data.preset.model
          });
        }
        
        setPresetFormDialogOpen(false);
        // 重置表单
        setPresetForm({
          name: '',
          provider: '',
          model: '',
          base_url: '',
          api_key: '',
          description: ''
        });
        setEditingPreset(null);
        // 重新加载预设列表
        await loadPresets();
      } else {
        const errorMsg = response?.message || response?.error || (editingPreset ? '更新预设失败' : '创建预设失败');
        console.error('保存预设失败:', errorMsg, response);
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('保存预设异常:', error);
      const errorMsg = error instanceof Error ? error.message : '保存预设失败';
      toast.error(errorMsg);
    } finally {
      setSavingPreset(false);
    }
  };

  // 删除预设
  const handleDeletePreset = async () => {
    if (!presetToDelete?.id) return;
    try {
      const response = await emailApi.deleteAiModel(presetToDelete.id);
      if (response.success) {
        toast.success('预设删除成功');
        setDeleteDialogOpen(false);
        setPresetToDelete(null);
        if (selectedPresetId === presetToDelete.id) {
          setSelectedPresetId('manual');
        }
        loadPresets();
      } else {
        toast.error(response.message || '删除预设失败');
      }
    } catch (error) {
      console.error('删除预设失败:', error);
      toast.error('删除预设失败');
    }
  };

  // 测试配置
  const handleTestConfig = async () => {
    if (!config.ai_base_url || !config.ai_api_key || !config.ai_model) {
      toast.error('请先填写完整的配置信息');
      return;
    }
    try {
      setTesting(true);
      setTestResult(null);
      const response = await emailApi.testAI({
        base_url: config.ai_base_url,
        api_key: config.ai_api_key,
        model: config.ai_model
      });
      if (response.success && response.data) {
        setTestResult({
          success: true,
          message: `连接成功！延迟: ${response.data.latency_ms || 0}ms`,
          latency_ms: response.data.latency_ms
        });
        toast.success('配置测试成功');
      } else {
        setTestResult({
          success: false,
          message: response.message || '测试失败'
        });
        toast.error(response.message || '配置测试失败');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '测试失败';
      setTestResult({
        success: false,
        message: errorMessage
      });
      toast.error(errorMessage);
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2"><Bot className="w-5 h-5" />AI 配置</CardTitle>
            {getCurrentPresetName() && (
              <div className="mt-1 text-sm text-muted-foreground">
                当前预设: <span className="font-medium text-foreground">{getCurrentPresetName()}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleTestConfig}
              size="sm"
              variant="outline"
              disabled={testing || !config.ai_base_url || !config.ai_api_key || !config.ai_model}
              className="flex items-center gap-2"
            >
              {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              测试配置
            </Button>
            <Button onClick={onSave} size="sm" disabled={loading} className="flex items-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              保存
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 测试结果 */}
        {testResult && (
          <div className={`p-3 rounded-lg flex items-center gap-2 ${testResult.success ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
            ) : (
              <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
            )}
            <span className={`text-sm ${testResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
              {testResult.message}
            </span>
          </div>
        )}

        {/* 预设选择 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>模型预设</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPresetDialogOpen(true)}
                className="flex items-center gap-1"
              >
                <Settings className="w-3 h-3" />
                管理预设
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openPresetFormDialog()}
                className="flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                创建预设
              </Button>
            </div>
          </div>
          <Select
            value={selectedPresetId}
            onValueChange={handleSelectPreset}
            disabled={loadingPresets}
          >
            <SelectTrigger>
              <SelectValue placeholder={loadingPresets ? '加载中...' : '选择预设或手动配置'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">手动配置</SelectItem>
              {presets.filter(p => p.id).map((preset) => (
                <SelectItem key={preset.id} value={preset.id!}>
                  {preset.name} (模型: {preset.model})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedPresetId && selectedPresetId !== 'manual' && (
            <div className="flex items-center gap-2">
              <Button
                onClick={handleApplyPreset}
                size="sm"
                variant="default"
                className="flex items-center gap-1"
              >
                <Settings className="w-3 h-3" />
                应用预设
              </Button>
              <Button
                onClick={() => {
                  const preset = presets.find(p => p.id === selectedPresetId);
                  if (preset) openPresetFormDialog(preset);
                }}
                size="sm"
                variant="outline"
                className="flex items-center gap-1"
              >
                <Edit className="w-3 h-3" />
                编辑
              </Button>
              <Button
                onClick={() => {
                  const preset = presets.find(p => p.id === selectedPresetId);
                  if (preset) {
                    setPresetToDelete(preset);
                    setDeleteDialogOpen(true);
                  }
                }}
                size="sm"
                variant="outline"
                className="flex items-center gap-1 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-3 h-3" />
                删除
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label>启用 AI 渲染</Label>
            <div className="text-xs text-muted-foreground">用于将纯文本自动包装成带样式的 HTML 邮件</div>
          </div>
          <Switch checked={config.ai_enabled} onCheckedChange={(v)=>onChange({ ...config, ai_enabled: !!v })} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>API Base URL</Label>
            <Input placeholder="https://open.bigmodel.cn/api/paas/v4" value={config.ai_base_url} onChange={(e)=>onChange({ ...config, ai_base_url: e.target.value })} />
            <div className="text-xs text-muted-foreground">默认兼容智谱清言（GLM 系列）</div>
          </div>
          <div className="space-y-2">
            <Label>模型（Model）</Label>
            <Input placeholder="glm-4.5" value={config.ai_model} onChange={(e)=>onChange({ ...config, ai_model: e.target.value })} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>API Key</Label>
          <Input type="password" placeholder="sk-..." value={config.ai_api_key} onChange={(e)=>onChange({ ...config, ai_api_key: e.target.value })} />
          <div className="text-xs text-muted-foreground">请妥善保管你的 API Key，不会在前端曝光</div>
        </div>

        {/* 预设列表管理对话框 */}
        <Dialog open={presetDialogOpen} onOpenChange={setPresetDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>预设管理</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {loadingPresets ? (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                </div>
              ) : presets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  暂无预设，点击"创建预设"按钮添加
                </div>
              ) : (
                <div className="space-y-2">
                  {presets.map((preset) => (
                    <div key={preset.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{preset.name}</div>
                        <div className="text-sm text-muted-foreground">
                          模型: {preset.model} | 提供商: {preset.provider}
                        </div>
                        {preset.description && (
                          <div className="text-xs text-muted-foreground mt-1">{preset.description}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setPresetDialogOpen(false);
                            openPresetFormDialog(preset);
                          }}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setPresetToDelete(preset);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* 创建/编辑预设表单对话框 */}
        <Dialog open={presetFormDialogOpen} onOpenChange={(open) => {
          setPresetFormDialogOpen(open);
          if (!open) {
            // 关闭对话框时重置表单
            setPresetForm({
              name: '',
              provider: '',
              model: '',
              base_url: '',
              api_key: '',
              description: ''
            });
            setEditingPreset(null);
          }
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingPreset ? '编辑预设' : '创建预设'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleSavePreset();
            }} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>预设名称 *</Label>
                  <Input
                    placeholder="例如：智谱清言 GLM-4.5"
                    value={presetForm.name}
                    onChange={(e) => setPresetForm({ ...presetForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>提供商 *</Label>
                  <Input
                    placeholder="例如：zhipu, openai"
                    value={presetForm.provider}
                    onChange={(e) => setPresetForm({ ...presetForm, provider: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>模型名称 *</Label>
                <Input
                  placeholder="例如：glm-4.5, gpt-4"
                  value={presetForm.model}
                  onChange={(e) => setPresetForm({ ...presetForm, model: e.target.value })}
                />
                <div className="text-xs text-muted-foreground">这是实际使用的模型标识，用户在选择预设时可以看到</div>
              </div>
              <div className="space-y-2">
                <Label>API Base URL *</Label>
                <Input
                  placeholder="https://open.bigmodel.cn/api/paas/v4"
                  value={presetForm.base_url}
                  onChange={(e) => setPresetForm({ ...presetForm, base_url: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>API Key *</Label>
                <Input
                  type="password"
                  placeholder="sk-..."
                  value={presetForm.api_key}
                  onChange={(e) => setPresetForm({ ...presetForm, api_key: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>描述（可选）</Label>
                <Textarea
                  placeholder="预设描述..."
                  value={presetForm.description}
                  onChange={(e) => setPresetForm({ ...presetForm, description: e.target.value })}
                  rows={3}
                />
              </div>
            </form>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setPresetFormDialogOpen(false);
                  setPresetForm({
                    name: '',
                    provider: '',
                    model: '',
                    base_url: '',
                    api_key: '',
                    description: ''
                  });
                  setEditingPreset(null);
                }} 
                disabled={savingPreset}
              >
                取消
              </Button>
              <Button 
                onClick={(e) => {
                  e.preventDefault();
                  handleSavePreset();
                }} 
                disabled={savingPreset || !presetForm.name || !presetForm.provider || !presetForm.model || !presetForm.base_url || !presetForm.api_key}
              >
                {savingPreset && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {savingPreset ? '保存中...' : '保存'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 删除确认对话框 */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认删除</AlertDialogTitle>
              <AlertDialogDescription>
                确定要删除预设 "{presetToDelete?.name}" 吗？此操作无法撤销。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeletePreset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                删除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

export default AIConfigCard;
