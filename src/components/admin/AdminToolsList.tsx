/**
 * 管理页面工具列表组件
 */

import React, { useState } from 'react';
import { Edit, Trash2, ExternalLink, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/EmptyState';
import { ToolContentEditor } from './ToolContentEditor';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { Tool } from '@/types';
import { getToolIconUrl } from '@/utils/imageUtils';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';
import { toolsApi } from '@/services/toolsApi';

interface AdminToolsListProps {
  tools: Tool[];
  loading: boolean;
  onEdit: (tool: Tool) => void;
  onDelete: (toolId: string) => void;
  onUpdate?: (tool: Tool) => void;
  selectedTools?: string[];
  onSelectTool?: (toolId: string) => void;
  onSelectAll?: () => void;
}

export function AdminToolsList({ 
  tools, 
  loading, 
  onEdit, 
  onDelete, 
  onUpdate,
  selectedTools = [], 
  onSelectTool, 
  onSelectAll 
}: AdminToolsListProps) {
  const [weightEdits, setWeightEdits] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const saveWeight = async (tool: Tool) => {
    const raw = weightEdits[tool.id];
    const val = raw !== undefined ? raw : (typeof tool.sort_order === 'number' ? String(tool.sort_order) : '0');
    const parsed = Number(val);
    if (Number.isNaN(parsed)) {
      toast.error('权重必须是数字');
      setWeightEdits(prev => ({ ...prev, [tool.id]: String(tool.sort_order ?? 0) }));
      return;
    }
    if (parsed === tool.sort_order) return;
    try {
      setSavingId(tool.id);
      const res = await toolsApi.updateTool(tool.id, { sort_order: parsed });
      if (res.success && res.data) {
        const updated: any = (res.data as any).tool || res.data;
        onUpdate && onUpdate(updated as Tool);
        setWeightEdits(prev => ({ ...prev, [tool.id]: String((updated as Tool).sort_order ?? parsed) }));
        toast.success('已更新权重');
      } else {
        toast.error(res.message || '更新权重失败');
      }
    } catch (e: any) {
      toast.error(e?.message || '更新权重失败');
    } finally {
      setSavingId(null);
    }
  };
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (tools.length === 0) {
    return (
      <EmptyState 
        title="暂无工具数据"
        description="还没有添加任何工具，点击上方按钮开始添加第一个工具吧！"
      />
    );
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'AI': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      '效率': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      '设计': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
      '开发': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      '其他': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    };
    return colors[category] || colors['其他'];
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'active': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'inactive': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      'maintenance': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    };
    return colors[status] || colors['active'];
  };

  return (
    <>
      {/* 移动端简化布局 - 减少嵌套 */}
      <div className="block md:hidden space-y-3">
        {tools.map((tool) => (
          <div key={tool.id} className="bg-card border rounded-lg p-3">
            <div className="flex gap-3 mb-3">
              {getToolIconUrl(tool) ? (
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center p-1 flex-shrink-0">
                  <img
                    src={getToolIconUrl(tool)}
                    alt={tool.name || '工具图标'}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-medium text-blue-800">{tool.name?.charAt(0) || '?'}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-base truncate">{tool.name || '未命名工具'}</h3>
                  {tool.featured && (
                    <Star className="w-4 h-4 text-yellow-500 fill-current flex-shrink-0" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                  {tool.description || '暂无描述'}
                </p>
                <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                  <span>权重：</span>
                  <Input
                    className="h-7 w-20"
                    type="number"
                    value={weightEdits[tool.id] ?? String(tool.sort_order ?? 0)}
                    onChange={(e) => setWeightEdits(prev => ({ ...prev, [tool.id]: e.target.value }))}
                    onBlur={() => saveWeight(tool)}
                    onKeyDown={(e) => { if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur(); }}
                    disabled={savingId === tool.id}
                  />
                </div>
                {/* 状态和分类一行 */}
                <div className="flex items-center gap-2 mb-2 overflow-x-auto scrollbar-hide">
                  <Badge className={cn(getStatusColor(tool.status), "text-xs flex-shrink-0")}>
                    {tool.status === 'active' ? '正常' : 
                     tool.status === 'inactive' ? '停用' : '维护'}
                  </Badge>
                  {(Array.isArray(tool.category) ? tool.category : [tool.category]).map((cat, index) => (
                    <Badge key={`${tool.id}-cat-${index}`} className={cn(getCategoryColor(cat), "text-xs flex-shrink-0")}>
                      {cat}
                    </Badge>
                  ))}
                </div>
                {/* 标签单独一行 */}
                {tool.tags && tool.tags.length > 0 && (
                  <div className="flex gap-1 mb-2 overflow-x-auto scrollbar-hide">
                    {tool.tags.map((tag, index) => (
                      <Badge key={`${tool.id}-tag-${index}`} variant="secondary" className="text-xs flex-shrink-0">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                {/* 创建时间 */}
                <p className="text-xs text-muted-foreground">
                  {tool.created_at ? new Date(tool.created_at).toLocaleDateString('zh-CN') : '未知时间'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {onUpdate && (
                <ToolContentEditor
                  tool={tool}
                  onUpdate={onUpdate}
                  iconOnly={false}
                />
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(tool)}
                className="flex-1"
              >
                <Edit className="w-4 h-4 mr-1" />
                编辑
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(tool.url, '_blank')}
                className="flex-1"
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                访问
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive-foreground hover:bg-destructive flex-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>确认删除</AlertDialogTitle>
                    <AlertDialogDescription>
                      确定要删除工具 "{tool.name || '未命名工具'}" 吗？此操作无法撤销。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => onDelete(tool.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      删除
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
      </div>

      {/* 桌面端表格布局 */}
      <div className="hidden md:block border rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="table-fixed w-full">
        <TableHeader>
          <TableRow>
            {onSelectAll && (
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedTools.length === tools.length && tools.length > 0}
                  onCheckedChange={onSelectAll}
                />
              </TableHead>
            )}
            <TableHead className="w-2/5">工具信息</TableHead>
            <TableHead className="w-20">分类</TableHead>
            <TableHead className="w-20">状态</TableHead>
            <TableHead className="w-28">权重</TableHead>
            <TableHead className="w-24">创建时间</TableHead>
            <TableHead className="flex-1">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tools.map((tool) => (
            <TableRow key={tool.id}>
              {onSelectTool && (
                <TableCell>
                  <Checkbox
                    checked={selectedTools.includes(tool.id)}
                    onCheckedChange={() => onSelectTool(tool.id)}
                  />
                </TableCell>
              )}
              <TableCell className="w-2/5">
                <div className="flex items-start space-x-3">
                  {getToolIconUrl(tool) ? (
                    <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center p-2">
                      <img
                        src={getToolIconUrl(tool)}
                        alt={tool.name || '工具图标'}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-800">{tool.name?.charAt(0) || '?'}</span>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{tool.name || '未命名工具'}</p>
                      {tool.featured && (
                        <Star className="w-4 h-4 text-yellow-500 fill-current flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate max-w-full">
                      {tool.description || '暂无描述'}
                    </p>
                    {tool.tags && tool.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1 max-w-full overflow-hidden">
                        {tool.tags.slice(0, 2).map((tag, index) => (
                          <Badge key={`${tool.id}-tag-${index}`} variant="secondary" className="text-xs truncate max-w-20">
                            {tag}
                          </Badge>
                        ))}
                        {tool.tags.length > 2 && (
                          <Badge variant="secondary" className="text-xs flex-shrink-0">
                            +{tool.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell className="w-20">
                <div className="flex flex-wrap gap-1">
                  {(Array.isArray(tool.category) ? tool.category : [tool.category]).map((cat, index) => (
                    <Badge key={`${tool.id}-cat-${index}`} className={cn(getCategoryColor(cat), "text-xs")}>
                      {cat}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell className="w-20">
                <Badge className={cn(getStatusColor(tool.status), "text-xs")}>
                  {tool.status === 'active' ? '正常' : 
                   tool.status === 'inactive' ? '停用' : '维护'}
                </Badge>
              </TableCell>
              <TableCell className="w-28">
                <div className="flex items-center gap-2">
                  <Input
                    className="h-8 w-24"
                    type="number"
                    value={weightEdits[tool.id] ?? String(tool.sort_order ?? 0)}
                    onChange={(e) => setWeightEdits(prev => ({ ...prev, [tool.id]: e.target.value }))}
                    onBlur={() => saveWeight(tool)}
                    onKeyDown={(e) => { if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur(); }}
                    disabled={savingId === tool.id}
                  />
                </div>
              </TableCell>
              <TableCell className="w-24">
                <div className="text-xs text-muted-foreground">
                  {(() => {
                    const dateString = tool.created_at || tool.createdAt;
                    if (!dateString) return '-';
                    
                    try {
                      const date = new Date(dateString);
                      if (isNaN(date.getTime())) {
                        console.warn('Invalid date value:', dateString, 'for tool:', tool.name);
                        return '-';
                      }
                      return date.toLocaleDateString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                      });
                    } catch (error) {
                      console.warn('Date parsing error:', error, 'dateString:', dateString, 'tool:', tool.name);
                      return '-';
                    }
                  })()}
                </div>
              </TableCell>
              <TableCell className="flex-1">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(tool.url, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  {onUpdate && (
                    <ToolContentEditor
                      tool={tool}
                      onUpdate={onUpdate}
                      iconOnly={true}
                    />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(tool)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>确认删除</AlertDialogTitle>
                        <AlertDialogDescription>
                          确定要删除工具 "{tool.name || '未命名工具'}" 吗？此操作无法撤销。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(tool.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          删除
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        </Table>
        </div>
      </div>
    </>
  );
}
