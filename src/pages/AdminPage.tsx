/**
 * 管理页面
 * 提供工具管理、统计查看等功能
 */

import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, BarChart3, Settings, Users, Database, FileSpreadsheet, RefreshCw, ExternalLink, User, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminToolsList } from '@/components/admin/AdminToolsList';
import { AdminStats } from '@/components/admin/AdminStats';
import { AdminToolForm } from '@/components/admin/AdminToolForm';
import { AdminSystemSettings } from '@/components/admin/AdminSystemSettings';
import { AdminExcelImport } from '@/components/admin/AdminExcelImport';
import { AdminFriendLinkApplications } from '@/components/admin/AdminFriendLinkApplications';
import { AdminFriendLinkManager } from '@/components/admin/AdminFriendLinkManager';
import { AdminProfileSettings } from '@/components/admin/AdminProfileSettings';
import { ToolSubmissionManagement } from '@/components/admin/ToolSubmissionManagement';
import { useSEO, SEOPresets } from '@/hooks/useSEO';
import { toolsApi } from '@/services/toolsApi';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import type { Tool } from '@/types';

function AdminPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // 设置管理页面SEO
  useSEO(SEOPresets.adminPanel());
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [stats, setStats] = useState<any>(null);
  // 从URL获取当前tab参数
  const urlParams = new URLSearchParams(location.search);
  const activeTab = urlParams.get('tab') || 'tools';

  // 处理Tab切换
  const handleTabChange = (value: string) => {
    const newParams = new URLSearchParams(location.search);
    newParams.set('tab', value);
    navigate(`${location.pathname}?${newParams.toString()}`, { replace: true });
  };
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 转换后端数据格式到前端格式
  const normalizeToolData = (toolData: any): Tool => {
    return {
      ...toolData,
      created_at: toolData.created_at || toolData.createdAt,
      updated_at: toolData.updated_at || toolData.updatedAt,
      // 确保其他字段的兼容性
      tags: toolData.tags || [],
      category: toolData.category || ['其他'],
    };
  };

  // 加载工具列表 - 管理界面显示所有状态的工具
  const loadTools = async () => {
    try {
      setLoading(true);
      // 传递 status: 'all' 让后端返回所有状态的工具
      const response = await toolsApi.getTools({ 
        limit: 1000,
        status: 'all' // 管理界面需要显示所有状态的工具
      });
      
      if (response.success && response.data) {
        setTools(response.data.tools);
      }
    } catch (error) {
      console.error('Failed to load tools:', error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  // 加载统计数据
  const loadStats = async () => {
    try {
      const response = await toolsApi.getToolStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error instanceof Error ? error.message : String(error));
    }
  };

  // 刷新工具列表
  const handleRefreshTools = async () => {
    try {
      setRefreshing(true);
      toast.loading('正在刷新工具列表...', { id: 'refresh-tools' });
      
      const response = await toolsApi.getTools({ 
        limit: 1000,
        status: 'all'
      });
      
      if (response.success && response.data) {
        setTools(response.data.tools);
        toast.success('工具列表刷新成功', { id: 'refresh-tools' });
      } else {
        toast.error('刷新工具列表失败', { id: 'refresh-tools' });
      }
    } catch (error) {
      console.error('Failed to refresh tools:', error instanceof Error ? error.message : String(error));
      toast.error('刷新工具列表失败', { id: 'refresh-tools' });
    } finally {
      setRefreshing(false);
    }
  };

  // 处理工具保存
  const handleToolSave = async (toolData: Partial<Tool>) => {
    try {
      setSaving(true);
      
      if (selectedTool) {
        // 更新工具
        toast.loading('正在更新工具...', { id: 'tool-save' });
        const response = await toolsApi.updateTool(selectedTool.id, toolData);
        if (response.success && response.data) {
          toast.success('工具更新成功', { id: 'tool-save' });
          
          // 无感刷新：使用正确的数据结构并标准化数据
          const rawTool = (response.data as any).tool || response.data;
          const updatedTool = normalizeToolData(rawTool);
          setTools(prev => prev.map(tool => 
            tool.id === selectedTool.id ? updatedTool : tool
          ));
          
          setShowForm(false);
          setSelectedTool(null);
        } else {
          toast.error(response.message || '工具更新失败', { id: 'tool-save' });
        }
      } else {
        // 创建工具
        toast.loading('正在创建工具...', { id: 'tool-save' });
        const response = await toolsApi.createTool(toolData as any);
        if (response.success && response.data) {
          toast.success('工具创建成功', { id: 'tool-save' });
          
          // 无感刷新：使用正确的数据结构并标准化数据
          const rawTool = (response.data as any).tool || response.data;
          const newTool = normalizeToolData(rawTool);
          setTools(prev => [newTool, ...prev]);
          
          setShowForm(false);
        } else {
          toast.error(response.message || '工具创建失败', { id: 'tool-save' });
        }
      }
    } catch (error) {
      console.error('Failed to save tool:', error instanceof Error ? error.message : String(error));
      toast.error(error instanceof Error ? error.message : '操作失败，请重试', { id: 'tool-save' });
    } finally {
      setSaving(false);
    }
  };

  // 处理工具删除
  const handleToolUpdate = (updatedTool: Tool) => {
    // 无感更新：直接更新本地状态
    setTools(prev => prev.map(tool => 
      tool.id === updatedTool.id ? updatedTool : tool
    ));
  };

  const handleToolDelete = async (toolId: string) => {
    try {
      const response = await toolsApi.deleteTool(toolId);
      if (response.success) {
        // 无感刷新：直接从本地状态中移除
        setTools(prev => prev.filter(tool => tool.id !== toolId));
        // 从选中列表中移除已删除的工具
        setSelectedTools(prev => prev.filter(id => id !== toolId));
        toast.success('工具删除成功');
      } else {
        toast.error(response.message || '删除工具失败');
      }
    } catch (error) {
      console.error('Failed to delete tool:', error instanceof Error ? error.message : String(error));
      toast.error('删除工具失败');
    }
  };

  // 处理批量删除
  const handleBatchDelete = async () => {
    if (selectedTools.length === 0) return;
    
    try {
      const deletePromises = selectedTools.map(toolId => toolsApi.deleteTool(toolId));
      const results = await Promise.all(deletePromises);
      
      // 检查哪些删除成功了
      const successfulDeletes = results
        .map((result, index) => ({ result, toolId: selectedTools[index] }))
        .filter(({ result }) => result.success)
        .map(({ toolId }) => toolId);
      
      if (successfulDeletes.length > 0) {
        // 无感刷新：直接从本地状态中移除成功删除的工具
        setTools(prev => prev.filter(tool => !successfulDeletes.includes(tool.id)));
        toast.success(`成功删除 ${successfulDeletes.length} 个工具`);
      }
      
      // 检查是否有失败的删除
      const failedDeletes = results.filter(result => !result.success);
      if (failedDeletes.length > 0) {
        toast.error(`${failedDeletes.length} 个工具删除失败`);
      }
      
      setSelectedTools([]);
    } catch (error) {
      console.error('Failed to batch delete tools:', error instanceof Error ? error.message : String(error));
      toast.error('批量删除失败');
    }
  };

  // 处理全选/取消全选
  const handleSelectAll = () => {
    if (selectedTools.length === filteredTools.length) {
      setSelectedTools([]);
    } else {
      setSelectedTools(filteredTools.map(tool => tool.id));
    }
  };

  // 过滤工具
  const filteredTools = tools.filter(tool =>
    (tool.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (tool.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  // 分页逻辑
  const totalPages = Math.ceil(filteredTools.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTools = filteredTools.slice(startIndex, endIndex);

  // 重置页码当搜索查询变化时
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    loadTools();
    loadStats();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* 主要内容 */}
      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
        {/* 页面标题和操作按钮 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">工具箱管理</h1>
            <p className="text-muted-foreground">管理工具、查看统计数据</p>
          </div>
          <Button
            onClick={() => {
              setSelectedTool(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2"
            size="sm"
          >
            <Plus className="w-4 h-4" />
            添加工具
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">

          {/* 工具管理 */}
          <TabsContent value="tools" className="space-y-4">
            {/* 手机端简化标题和搜索 */}
            <div className="md:hidden">
              <div className="flex items-center gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="搜索工具..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleRefreshTools}
                  disabled={refreshing}
                  className="border-black text-black hover:bg-black hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black flex-shrink-0"
                  title="刷新工具列表"
                >
                  <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
                </Button>
              </div>
            </div>
            
            {/* 桌面端保持原有Card布局 */}
            <Card className="hidden md:block">
              <CardHeader>
                <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <span>工具列表</span>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="搜索工具..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-full sm:w-64"
                      />
                    </div>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={handleRefreshTools}
                      disabled={refreshing}
                      className="border-black text-black hover:bg-black hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black"
                      title="刷新工具列表"
                    >
                      <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="border-black text-black hover:bg-black hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black"
                      title="筛选工具"
                    >
                      <Filter className="w-4 h-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="hidden md:block">
                {/* 桌面端批量操作栏 */}
                {selectedTools.length > 0 && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-muted/50 rounded-lg p-3 mb-4 gap-3">
                    <span className="text-sm text-muted-foreground">
                      已选择 {selectedTools.length} 个工具
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTools([])}
                        className="border-black text-black hover:bg-black hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black flex-shrink-0"
                      >
                        取消选择
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleBatchDelete}
                        className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                      >
                        批量删除
                      </Button>
                    </div>
                  </div>
                )}
                <AdminToolsList
                  tools={paginatedTools}
                  loading={loading}
                  onEdit={(tool) => {
                    setSelectedTool(tool);
                    setShowForm(true);
                  }}
                  onDelete={handleToolDelete}
                  onUpdate={handleToolUpdate}
                  selectedTools={selectedTools}
                  onSelectTool={(toolId) => {
                    setSelectedTools(prev => 
                      prev.includes(toolId) 
                        ? prev.filter(id => id !== toolId)
                        : [...prev, toolId]
                    );
                  }}
                  onSelectAll={handleSelectAll}
                />
                
                {/* 分页控件 */}
                {totalPages > 1 && (
                  <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="text-sm text-muted-foreground text-center sm:text-left">
                      显示 {startIndex + 1}-{Math.min(endIndex, filteredTools.length)} 
                      ，共 {filteredTools.length} 条记录
                    </div>
                    <div className="flex items-center gap-2 justify-center sm:justify-end flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="border-black text-black hover:bg-black hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black"
                      >
                        上一页
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            variant={page === currentPage ? "blackWhite" : "outline"}
                            size="icon"
                            onClick={() => setCurrentPage(page)}
                            className={cn(
                              "w-8 h-8 rounded-full",
                              page === currentPage 
                                ? "" 
                                : "border-black text-black hover:bg-black hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black"
                            )}
                          >
                            {page}
                          </Button>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="border-black text-black hover:bg-black hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black"
                      >
                        下一页
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* 手机端工具列表 - 不支持批量操作 */}
            <div className="md:hidden">
              <AdminToolsList
                tools={paginatedTools}
                loading={loading}
                onEdit={(tool) => {
                  setSelectedTool(tool);
                  setShowForm(true);
                }}
                onDelete={handleToolDelete}
                onUpdate={handleToolUpdate}
              />
            </div>
            
            {/* 手机端分页控件 */}
            {totalPages > 1 && (
              <div className="md:hidden flex flex-col gap-4">
                <div className="text-sm text-muted-foreground text-center">
                  显示 {startIndex + 1}-{Math.min(endIndex, filteredTools.length)} 
                  ，共 {filteredTools.length} 条记录
                </div>
                <div className="flex items-center gap-2 justify-center flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="border-black text-black hover:bg-black hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black"
                  >
                    上一页
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                      if (pageNum > totalPages) return null;
                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === currentPage ? "blackWhite" : "outline"}
                          size="icon"
                          onClick={() => setCurrentPage(pageNum)}
                          className="w-8 h-8 rounded-full"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="border-black text-black hover:bg-black hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black"
                  >
                    下一页
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Excel批量导入 */}
          <TabsContent value="import">
            <AdminExcelImport onImportComplete={loadTools} />
          </TabsContent>

          {/* 统计数据 */}
          <TabsContent value="stats">
            <AdminStats stats={stats} />
          </TabsContent>

          {/* 工具提交管理 */}
          <TabsContent value="submissions">
            <ToolSubmissionManagement />
          </TabsContent>

          {/* 友链管理 */}
          <TabsContent value="friendlinks" className="space-y-6">
            <div className="space-y-6">
              {/* 友链管理 */}
              <AdminFriendLinkManager />
              
              {/* 友链申请 */}
              <AdminFriendLinkApplications />
            </div>
          </TabsContent>

          {/* 用户管理 */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>用户管理</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">用户管理功能开发中...</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 系统设置 */}
          <TabsContent value="settings">
            <AdminSystemSettings />
          </TabsContent>

          {/* 个人设置 */}
          <TabsContent value="profile">
            <AdminProfileSettings />
          </TabsContent>
        </Tabs>
      </main>

      {/* 工具表单弹窗 */}
      {showForm && (
        <AdminToolForm
          tool={selectedTool || undefined}
          onSave={handleToolSave}
          onClose={() => {
            setShowForm(false);
            setSelectedTool(null);
          }}
          saving={saving}
        />
      )}
    </div>
  );
}

export default AdminPage;
