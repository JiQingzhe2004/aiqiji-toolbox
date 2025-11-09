import React, { useState, useEffect } from 'react';
import { PencilLine, Save, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { toolsApi } from '@/services/toolsApi';
import type { Tool } from '@/types';
import toast from 'react-hot-toast';

interface ToolContentEditorProps {
  tool: Tool;
  onUpdate: (updatedTool: Tool) => void;
  iconOnly?: boolean; // 是否只显示图标（桌面端）
}

export function ToolContentEditor({ tool, onUpdate, iconOnly = false }: ToolContentEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState(tool.content || '');
  const [saving, setSaving] = useState(false);

  // 当tool变化时更新content
  useEffect(() => {
    setContent(tool.content || '');
  }, [tool.content]);

  // 锁定背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const response = await toolsApi.updateTool(tool.id, {
        content: content
      });

      if (response.success) {
        const updatedTool = { ...tool, content };
        onUpdate(updatedTool);
        setIsOpen(false);
        toast.success('工具内容已更新');
      } else {
        toast.error(response.message || '更新失败');
      }
    } catch (error) {
      console.error('更新工具内容失败:', error);
      toast.error('更新失败');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    // 如果有未保存的更改，询问用户
    if (content !== (tool.content || '')) {
      if (window.confirm('有未保存的更改，确定要关闭吗？')) {
        setContent(tool.content || '');
        setIsOpen(false);
      }
    } else {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* 触发按钮 */}
      <Button
        variant={iconOnly ? "ghost" : "outline"}
        size="sm"
        onClick={() => setIsOpen(true)}
        className={iconOnly ? "p-2" : "flex items-center gap-2 flex-1"}
        title="编辑工具详细说明"
      >
        <PencilLine className="w-4 h-4" />
        {!iconOnly && (
          <>
            <span className="mr-1">内容</span>
          </>
        )}
      </Button>

      {/* 全屏编辑页面 */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          {/* 顶部标题栏 */}
          <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <PencilLine className="w-5 h-5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-semibold hidden md:block">编辑工具详细说明</h1>
                <h1 className="text-lg font-semibold md:hidden truncate">{tool.name}</h1>
                <span className="text-sm text-muted-foreground hidden md:inline">- {tool.name}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClose}
                disabled={saving}
              >
                <X className="w-4 h-4 mr-2" />
                取消
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="min-w-[100px]"
              >
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Save className="w-4 h-4 mr-2" />
                保存
              </Button>
            </div>
          </div>

          {/* 主要内容区域 */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-0 md:p-6">
              <RichTextEditor
                content={content}
                onChange={setContent}
                placeholder="请输入工具的详细说明内容..."
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
