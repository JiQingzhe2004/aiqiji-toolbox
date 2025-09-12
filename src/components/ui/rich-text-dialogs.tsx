import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ImageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: { url: string; size: string; alignment: string }) => void;
  initialData?: { url: string; size: string; alignment: string };
}

export function ImageDialog({ open, onOpenChange, onConfirm, initialData }: ImageDialogProps) {
  const [url, setUrl] = useState('');
  const [alignment, setAlignment] = useState('center');
  const [size, setSize] = useState('medium');
  const [imageError, setImageError] = useState(false);

  // 当对话框打开且有初始数据时，设置初始值
  React.useEffect(() => {
    if (open && initialData) {
      setUrl(initialData.url);
      setAlignment(initialData.alignment);
      setSize(initialData.size);
      setImageError(false);
    }
  }, [open, initialData]);

  const handleConfirm = () => {
    if (url.trim()) {
      onConfirm({
        url: url.trim(),
        size,
        alignment
      });
      setUrl('');
      setAlignment('center');
      setSize('medium');
      setImageError(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setUrl('');
    setAlignment('center');
    setSize('medium');
    setImageError(false);
  };

  // 图片尺寸配置（使用宽度百分比）
  const sizeConfig = {
    small: 'w-[25%] max-w-xs',
    medium: 'w-[50%] max-w-md', 
    large: 'w-[100%] max-w-lg'
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>插入图片</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* 图片预览区域 */}
          {url && (
            <div className="space-y-3">
              <Label>图片预览</Label>
              <div className={`border-2 border-dashed border-muted-foreground/20 rounded-lg p-4 flex ${
                alignment === 'left' ? 'justify-start' : 
                alignment === 'center' ? 'justify-center' : 'justify-end'
              }`}>
                {!imageError ? (
                  <img
                    src={url}
                    alt="图片预览"
                    className={`${sizeConfig[size as keyof typeof sizeConfig]} object-contain rounded-lg border bg-background`}
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className={`${sizeConfig[size as keyof typeof sizeConfig]} border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center bg-muted/30`}>
                    <span className="text-muted-foreground text-sm">图片加载失败</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* URL输入 */}
          <div className="space-y-2">
            <Label htmlFor="image-url">图片URL</Label>
            <Input
              id="image-url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setImageError(false);
              }}
              placeholder="https://example.com/image.jpg"
              type="url"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleConfirm();
                }
              }}
            />
          </div>

          {/* 图片设置 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 图片大小 */}
            <div className="space-y-2">
              <Label>图片大小</Label>
              <Select value={size} onValueChange={setSize}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">小 (25%宽度)</SelectItem>
                  <SelectItem value="medium">中 (50%宽度)</SelectItem>
                  <SelectItem value="large">大 (100%宽度)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 对齐方式 */}
            <div className="space-y-2">
              <Label>对齐方式</Label>
              <Select value={alignment} onValueChange={setAlignment}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">左对齐</SelectItem>
                  <SelectItem value="center">居中</SelectItem>
                  <SelectItem value="right">右对齐</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              取消
            </Button>
            <Button onClick={handleConfirm} disabled={!url.trim()}>
              插入图片
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface BadgeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: { text: string; variant: string }) => void;
}

export function BadgeDialog({ open, onOpenChange, onConfirm }: BadgeDialogProps) {
  const [text, setText] = useState('');
  const [variant, setVariant] = useState('default');

  const handleConfirm = () => {
    if (text.trim()) {
      onConfirm({ text: text.trim(), variant });
      setText('');
      setVariant('default');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>插入徽章</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="badge-text">徽章文本</Label>
            <Input
              id="badge-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="输入徽章文本"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleConfirm();
                }
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="badge-variant">徽章样式</Label>
            <Select value={variant} onValueChange={setVariant}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">默认</SelectItem>
                <SelectItem value="secondary">次要</SelectItem>
                <SelectItem value="destructive">警告</SelectItem>
                <SelectItem value="outline">轮廓</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button onClick={handleConfirm} disabled={!text.trim()}>
              插入
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ButtonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: { text: string; variant: string; size: string; url?: string }) => void;
}

export function ButtonDialog({ open, onOpenChange, onConfirm }: ButtonDialogProps) {
  const [text, setText] = useState('');
  const [variant, setVariant] = useState('default');
  const [size, setSize] = useState('default');
  const [url, setUrl] = useState('');

  const handleConfirm = () => {
    if (text.trim()) {
      onConfirm({ 
        text: text.trim(), 
        variant, 
        size, 
        url: url.trim() || undefined 
      });
      setText('');
      setVariant('default');
      setSize('default');
      setUrl('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>插入按钮</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="button-text">按钮文本</Label>
            <Input
              id="button-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="输入按钮文本"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  handleConfirm();
                }
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="button-url">链接地址（可选）</Label>
            <Input
              id="button-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              type="url"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="button-variant">按钮样式</Label>
              <Select value={variant} onValueChange={setVariant}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">默认</SelectItem>
                  <SelectItem value="destructive">警告</SelectItem>
                  <SelectItem value="outline">轮廓</SelectItem>
                  <SelectItem value="secondary">次要</SelectItem>
                  <SelectItem value="ghost">幽灵</SelectItem>
                  <SelectItem value="link">链接</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="button-size">按钮大小</Label>
              <Select value={size} onValueChange={setSize}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sm">小</SelectItem>
                  <SelectItem value="default">默认</SelectItem>
                  <SelectItem value="lg">大</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button onClick={handleConfirm} disabled={!text.trim()}>
              插入
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface CardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: { title: string; description?: string; content: string }) => void;
}

export function CardDialog({ open, onOpenChange, onConfirm }: CardDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');

  const handleConfirm = () => {
    if (title.trim() && content.trim()) {
      onConfirm({ 
        title: title.trim(), 
        description: description.trim() || undefined, 
        content: content.trim() 
      });
      setTitle('');
      setDescription('');
      setContent('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>插入卡片</DialogTitle>
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
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button onClick={handleConfirm} disabled={!title.trim() || !content.trim()}>
              插入
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
