/**
 * API测试页面
 * 用于测试前后端API集成
 */

import React, { useState, useEffect } from 'react';
import { toolsApi } from '@/services/toolsApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Tool } from '@/types';

export function ApiTestPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  // 测试获取工具列表
  const testGetTools = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await toolsApi.getTools({ limit: 10 });
      if (response.success && response.data) {
        setTools(response.data.items);
        console.log('API Response:', response);
      } else {
        setError(response.message || '获取工具列表失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络错误');
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 测试获取统计信息
  const testGetStats = async () => {
    try {
      const response = await toolsApi.getToolStats();
      if (response.success) {
        setStats(response.data);
        console.log('Stats:', response.data);
      }
    } catch (err) {
      console.error('Stats Error:', err);
    }
  };

  // 测试记录点击
  const testRecordClick = async (toolId: string) => {
    try {
      const response = await toolsApi.recordClick(toolId);
      if (response.success) {
        console.log('Click recorded for:', toolId);
      }
    } catch (err) {
      console.error('Click Error:', err);
    }
  };

  useEffect(() => {
    testGetTools();
    testGetStats();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">API 测试页面</h1>
        <Button onClick={testGetTools} disabled={loading}>
          {loading ? '加载中...' : '刷新数据'}
        </Button>
      </div>

      {/* API 状态 */}
      <Card>
        <CardHeader>
          <CardTitle>API 连接状态</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-red-500">
              <p className="font-semibold">错误:</p>
              <p>{error}</p>
            </div>
          ) : (
            <div className="text-green-500">
              <p>✅ API 连接正常</p>
              {stats && (
                <div className="mt-2 text-sm text-muted-foreground">
                  <p>总工具数: {stats.totalTools}</p>
                  <p>活跃工具: {stats.activeTools}</p>
                  <p>精选工具: {stats.featuredTools}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 工具列表 */}
      <Card>
        <CardHeader>
          <CardTitle>工具列表 (前 10 个)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>加载中...</p>
          ) : tools.length > 0 ? (
            <div className="space-y-4">
              {tools.map((tool) => (
                <div key={tool.id} className="border p-4 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{tool.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {tool.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>分类: {tool.category}</span>
                        <span>浏览: {tool.view_count}</span>
                        <span>点击: {tool.click_count}</span>
                        {tool.featured && <span className="text-yellow-600">⭐ 精选</span>}
                      </div>
                      {tool.tags && tool.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {tool.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(tool.url, '_blank')}
                      >
                        访问
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => testRecordClick(tool.id)}
                      >
                        测试点击
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>暂无数据</p>
          )}
        </CardContent>
      </Card>

      {/* 调试信息 */}
      <Card>
        <CardHeader>
          <CardTitle>调试信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>API 基础地址:</strong> {process.env.NODE_ENV === 'production' ? 'Production API' : 'http://localhost:3001/api/v1'}</p>
            <p><strong>环境:</strong> {process.env.NODE_ENV}</p>
            <p><strong>工具数量:</strong> {tools.length}</p>
            {stats && (
              <div>
                <p><strong>统计信息:</strong></p>
                <pre className="bg-muted p-2 rounded text-xs overflow-auto">
                  {JSON.stringify(stats, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
