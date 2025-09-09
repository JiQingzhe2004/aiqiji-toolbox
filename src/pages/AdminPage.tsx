/**
 * 管理页面
 * 提供工具管理、统计查看等功能
 */

import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, BarChart3, Settings, Users, Database, LogOut, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminToolsList } from '@/components/admin/AdminToolsList';
import { AdminStats } from '@/components/admin/AdminStats';
import { AdminToolForm } from '@/components/admin/AdminToolForm';
import { AdminSystemSettings } from '@/components/admin/AdminSystemSettings';
import { ThemeToggle } from '@/components/ThemeToggle';
import { toolsApi } from '@/services/toolsApi';
import { useAuth } from '@/contexts/AuthContext';
import type { Tool } from '@/types';

function AdminPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('tools');
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // 加载工具列表
  const loadTools = async () => {
    try {
      setLoading(true);
      const response = await toolsApi.getTools({ limit: 1000 });
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

  // 处理工具保存
  const handleToolSave = async (toolData: Partial<Tool>) => {
    try {
      if (selectedTool) {
        // 更新工具
        const response = await toolsApi.updateTool(selectedTool.id, toolData);
        if (response.success) {
          await loadTools();
          setShowForm(false);
          setSelectedTool(null);
        }
      } else {
        // 创建工具
        const response = await toolsApi.createTool(toolData as any);
        if (response.success) {
          await loadTools();
          setShowForm(false);
        }
      }
    } catch (error) {
      console.error('Failed to save tool:', error instanceof Error ? error.message : String(error));
    }
  };

  // 处理工具删除
  const handleToolDelete = async (toolId: string) => {
    try {
      const response = await toolsApi.deleteTool(toolId);
      if (response.success) {
        await loadTools();
        // 从选中列表中移除已删除的工具
        setSelectedTools(prev => prev.filter(id => id !== toolId));
      }
    } catch (error) {
      console.error('Failed to delete tool:', error instanceof Error ? error.message : String(error));
    }
  };

  // 处理批量删除
  const handleBatchDelete = async () => {
    if (selectedTools.length === 0) return;
    
    try {
      await Promise.all(selectedTools.map(toolId => toolsApi.deleteTool(toolId)));
      await loadTools();
      setSelectedTools([]);
    } catch (error) {
      console.error('Failed to batch delete tools:', error instanceof Error ? error.message : String(error));
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
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.description.toLowerCase().includes(searchQuery.toLowerCase())
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
      {/* 固定顶部栏 */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
                className="rounded-xl hover:bg-muted"
                aria-label="返回首页"
                title="返回首页"
              >
                <Home className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">工具箱管理</h1>
                <p className="text-muted-foreground">管理工具、查看统计数据</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>欢迎，{user?.username}</span>
                <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                  {user?.role === 'admin' ? '管理员' : '用户'}
                </span>
              </div>
              <ThemeToggle />
              <Button
                onClick={() => {
                  setSelectedTool(null);
                  setShowForm(true);
                }}
                className="flex items-center gap-2 bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
              >
                <Plus className="w-4 h-4" />
                添加工具
              </Button>
              <Button
                variant="outline"
                onClick={logout}
                className="flex items-center gap-2 border-black text-black hover:bg-black hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black"
              >
                <LogOut className="w-4 h-4" />
                退出登录
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容 - 添加顶部边距以避免被固定顶部栏遮挡 */}
      <main className="container mx-auto px-4 py-6 pt-32">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="tools" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              工具管理
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              统计数据
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              用户管理
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              系统设置
            </TabsTrigger>
          </TabsList>

          {/* 工具管理 */}
          <TabsContent value="tools" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>工具列表</span>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="搜索工具..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="border-black text-black hover:bg-black hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black"
                    >
                      <Filter className="w-4 h-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* 批量操作栏 */}
                {selectedTools.length > 0 && (
                  <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3 mb-4">
                    <span className="text-sm text-muted-foreground">
                      已选择 {selectedTools.length} 个工具
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTools([])}
                        className="border-black text-black hover:bg-black hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black"
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
                  <div className="mt-6 flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      显示 {startIndex + 1}-{Math.min(endIndex, filteredTools.length)} 
                      ，共 {filteredTools.length} 条记录
                    </div>
                    <div className="flex items-center gap-2">
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
                            variant={page === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className={page === currentPage 
                              ? "bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                              : "border-black text-black hover:bg-black hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black"
                            }
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
          </TabsContent>

          {/* 统计数据 */}
          <TabsContent value="stats">
            <AdminStats stats={stats} />
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
        />
      )}
    </div>
  );
}

export default AdminPage;
