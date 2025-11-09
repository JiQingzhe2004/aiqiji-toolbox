import React, { useState, useEffect } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer, ReactNodeViewProps } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Edit, X } from 'lucide-react';
import { settingsApi } from '@/services/settingsApi';

interface CardComponentProps extends ReactNodeViewProps {}

const CardComponent = ({ node, updateAttributes, deleteNode, editor }: CardComponentProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(node.attrs.title);
  const [description, setDescription] = useState(node.attrs.description || '');
  const [content, setContent] = useState(node.attrs.content);
  const [siteName, setSiteName] = useState('工具导航站点');

  // 检查是否为只读模式
  const isReadOnly = !editor?.isEditable;

  // 获取网站名称
  useEffect(() => {
    const fetchSiteName = async () => {
      try {
        const info = await settingsApi.getWebsiteInfo();
        setSiteName(info.site_name || '工具导航站点');
      } catch (error) {
        console.error('获取网站名称失败:', error);
        // 使用默认值
        setSiteName('工具导航站点');
      }
    };

    fetchSiteName();
  }, []);

  const handleSave = () => {
    updateAttributes({ title, description, content });
    setIsEditing(false);
  };

  return (
    <NodeViewWrapper className="block my-8">
      <div className={`group relative ${!isReadOnly ? 'hover:translate-y-[-2px]' : ''}`}>
        <Card className="
          bg-white dark:bg-card 
          border-2 border-gray-300 dark:border-border 
          rounded-xl 
          shadow-sm hover:shadow-md 
          transition-all duration-200 
          overflow-hidden
        ">
          {/* 卡片标题区域 */}
          <CardHeader className="px-4 py-3 bg-gray-50 dark:bg-muted/30">
            <CardTitle className="text-xl font-semibold text-gray-900 dark:text-foreground !m-0 !p-0 !mt-0">
              {node.attrs.title}
            </CardTitle>
            {node.attrs.description && (
              <CardDescription className="text-sm text-gray-500 dark:text-muted-foreground leading-relaxed !m-0 !p-0 !mt-0">
                {node.attrs.description}
              </CardDescription>
            )}
          </CardHeader>
          
          {/* 分隔线 */}
          <div className="border-t-2 border-gray-200 dark:border-border"></div>
          
          {/* 卡片内容区域 */}
          <CardContent className="px-6 py-5">
            {/* 内容文字 - 每行文字都有下划线 */}
            <div className="space-y-3">
              {node.attrs.content.split('\n').map((line: string, index: number) => (
                <div key={index} className="relative min-h-[1.5rem]">
                  {line ? (
                    <span className="inline-block text-gray-700 dark:text-foreground/90 leading-relaxed border-b-2 border-gray-200 dark:border-border">
                      {line}
                    </span>
                  ) : (
                    <span className="inline-block">\u00A0</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
          
          {/* 底部全宽分割线 */}
          <div className="border-t-2 border-gray-200 dark:border-border"></div>
          
          {/* 底部网站名称区域 */}
          <div className="px-4 py-3 bg-gray-50 dark:bg-muted/30">
            <div className="text-xs text-gray-400 dark:text-muted-foreground text-center">
              {siteName}
            </div>
          </div>
        </Card>
        
        {/* 编辑按钮 - 只在非只读模式下显示 */}
        {!isReadOnly && (
          <div className="hidden group-hover:flex absolute top-2 right-2 gap-1">
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0 bg-background border shadow-sm"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>编辑卡片</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="card-title">卡片标题</Label>
                  <Input
                    id="card-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="输入卡片标题"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="card-description">卡片描述（可选）</Label>
                  <Input
                    id="card-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="输入卡片描述"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="card-content">卡片内容</Label>
                  <Textarea
                    id="card-content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="输入卡片内容"
                    rows={4}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    取消
                  </Button>
                  <Button onClick={handleSave}>
                    保存
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0 bg-background border shadow-sm text-destructive hover:text-destructive-foreground hover:bg-destructive"
              onClick={deleteNode}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};

export interface CardOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    customCard: {
      setCustomCard: (options: { title: string; description?: string; content: string }) => ReturnType;
    };
  }
}

export const CardExtension = Node.create<CardOptions>({
  name: 'customCard',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  group: 'block',

  atom: true,
  
  content: '',

  addAttributes() {
    return {
      title: {
        default: '卡片标题',
        parseHTML: element => element.getAttribute('data-title'),
        renderHTML: attributes => ({
          'data-title': attributes.title,
        }),
      },
      description: {
        default: '',
        parseHTML: element => element.getAttribute('data-description'),
        renderHTML: attributes => ({
          'data-description': attributes.description,
        }),
      },
      content: {
        default: '卡片内容',
        parseHTML: element => element.getAttribute('data-content'),
        renderHTML: attributes => ({
          'data-content': attributes.content,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="custom-card"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 'data-type': 'custom-card' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CardComponent, {
      as: 'div',
      className: 'card-node-view',
      contentDOMElementTag: 'div',
    });
  },

  addCommands() {
    return {
      setCustomCard: (options) => ({ commands, tr, dispatch }) => {
        if (dispatch) {
          const node = this.type.create(options);
          const transaction = tr.replaceSelectionWith(node);
          dispatch(transaction);
        }
        return true;
      },
    };
  },
});

export default CardExtension;
