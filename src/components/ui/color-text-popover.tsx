import React, { useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Palette, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// 预定义颜色
export const TEXT_COLORS = [
  { label: '默认', value: '', preview: '#000000' },
  { label: '黑色', value: '#000000', preview: '#000000' },
  { label: '深灰', value: '#374151', preview: '#374151' },
  { label: '灰色', value: '#6B7280', preview: '#6B7280' },
  { label: '浅灰', value: '#9CA3AF', preview: '#9CA3AF' },
  { label: '红色', value: '#EF4444', preview: '#EF4444' },
  { label: '橙色', value: '#F97316', preview: '#F97316' },
  { label: '黄色', value: '#EAB308', preview: '#EAB308' },
  { label: '绿色', value: '#22C55E', preview: '#22C55E' },
  { label: '蓝色', value: '#3B82F6', preview: '#3B82F6' },
  { label: '靛蓝', value: '#6366F1', preview: '#6366F1' },
  { label: '紫色', value: '#A855F7', preview: '#A855F7' },
  { label: '粉色', value: '#EC4899', preview: '#EC4899' },
];

export const HIGHLIGHT_COLORS = [
  { label: '无高亮', value: '', preview: 'transparent' },
  { label: '黄色高亮', value: '#FEF08A', preview: '#FEF08A' },
  { label: '绿色高亮', value: '#BBF7D0', preview: '#BBF7D0' },
  { label: '蓝色高亮', value: '#BFDBFE', preview: '#BFDBFE' },
  { label: '紫色高亮', value: '#DDD6FE', preview: '#DDD6FE' },
  { label: '粉色高亮', value: '#FBCFE8', preview: '#FBCFE8' },
  { label: '橙色高亮', value: '#FED7AA', preview: '#FED7AA' },
  { label: '红色高亮', value: '#FECACA', preview: '#FECACA' },
  { label: '灰色高亮', value: '#F3F4F6', preview: '#F3F4F6' },
];

interface ColorChangeEvent {
  type: 'text' | 'highlight';
  label: string;
  value: string;
}

interface ColorTextPopoverProps {
  editor: Editor | null;
  hideWhenUnavailable?: boolean;
  onColorChanged?: (event: ColorChangeEvent) => void;
}

// 自定义Hook：最近使用的颜色
function useRecentColors(maxItems: number = 6) {
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // 从localStorage加载最近颜色
    try {
      const stored = localStorage.getItem('tiptap-recent-colors');
      if (stored) {
        setRecentColors(JSON.parse(stored));
      }
    } catch (error) {
      console.warn('Failed to load recent colors:', error);
    }
    setIsInitialized(true);
  }, []);

  const addRecentColor = (color: string) => {
    if (!color || color === '') return;
    
    setRecentColors(prev => {
      const newColors = [color, ...prev.filter(c => c !== color)].slice(0, maxItems);
      
      // 保存到localStorage
      try {
        localStorage.setItem('tiptap-recent-colors', JSON.stringify(newColors));
      } catch (error) {
        console.warn('Failed to save recent colors:', error);
      }
      
      return newColors;
    });
  };

  return { recentColors, addRecentColor, isInitialized };
}

// 颜色选择面板组件
function ColorPanel({ 
  colors, 
  activeColor, 
  onColorSelect, 
  type 
}: { 
  colors: typeof TEXT_COLORS; 
  activeColor: string; 
  onColorSelect: (color: string, label: string) => void;
  type: 'text' | 'highlight';
}) {
  return (
    <div className="grid grid-cols-4 gap-1 p-2">
      {colors.map((color) => (
        <button
          key={color.value}
          className={cn(
            "w-8 h-8 rounded-md border-2 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring",
            activeColor === color.value 
              ? "border-foreground ring-2 ring-ring" 
              : "border-border hover:border-foreground"
          )}
          style={{ 
            backgroundColor: type === 'text' ? color.preview : color.preview,
            backgroundImage: type === 'text' && color.value === '' 
              ? 'linear-gradient(45deg, transparent 40%, #000 40%, #000 60%, transparent 60%)' 
              : undefined
          }}
          onClick={() => onColorSelect(color.value, color.label)}
          title={color.label}
          aria-label={color.label}
        />
      ))}
    </div>
  );
}

// 最近颜色面板
function RecentColorsPanel({ 
  recentColors, 
  onColorSelect,
  type 
}: { 
  recentColors: string[]; 
  onColorSelect: (color: string, label: string) => void;
  type: 'text' | 'highlight';
}) {
  if (recentColors.length === 0) return null;

  return (
    <div className="p-2">
      <div className="text-xs font-medium text-muted-foreground mb-2">最近使用</div>
      <div className="flex gap-1">
        {recentColors.map((color, index) => (
          <button
            key={`${color}-${index}`}
            className="w-6 h-6 rounded border border-border hover:border-foreground transition-all hover:scale-110"
            style={{ backgroundColor: color }}
            onClick={() => onColorSelect(color, `最近颜色 ${index + 1}`)}
            title={`最近颜色: ${color}`}
          />
        ))}
      </div>
    </div>
  );
}

// 自定义颜色选择器
function CustomColorPicker({ 
  onColorSelect, 
  type 
}: { 
  onColorSelect: (color: string, label: string) => void;
  type: 'text' | 'highlight';
}) {
  return (
    <div className="p-2">
      <div className="text-xs font-medium text-muted-foreground mb-2">自定义颜色</div>
      <input
        type="color"
        className="w-full h-8 rounded border border-border cursor-pointer"
        onChange={(e) => onColorSelect(e.target.value, `自定义${type === 'text' ? '文字' : '高亮'}颜色`)}
        title="选择自定义颜色"
      />
    </div>
  );
}

export function ColorTextPopover({ 
  editor, 
  hideWhenUnavailable = false, 
  onColorChanged 
}: ColorTextPopoverProps) {
  const [activeTab, setActiveTab] = useState<'text' | 'highlight'>('text');
  const { recentColors, addRecentColor } = useRecentColors();
  
  if (!editor) return null;

  // 检查是否应该显示
  const canUseTextColor = editor.can().setColor('#000000');
  const canUseHighlight = editor.can().setHighlight();
  
  if (hideWhenUnavailable && !canUseTextColor && !canUseHighlight) {
    return null;
  }

  // 获取当前颜色
  const currentTextColor = editor.getAttributes('textStyle').color || '';
  const currentHighlight = editor.getAttributes('highlight').color || '';

  const handleColorSelect = (color: string, label: string, type: 'text' | 'highlight') => {
    if (type === 'text') {
      if (color === '') {
        editor.chain().focus().unsetColor().run();
      } else {
        editor.chain().focus().setColor(color).run();
        addRecentColor(color);
      }
    } else {
      if (color === '') {
        editor.chain().focus().unsetHighlight().run();
      } else {
        editor.chain().focus().setHighlight({ color }).run();
        addRecentColor(color);
      }
    }

    onColorChanged?.({ type, label, value: color });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0 hover:bg-muted data-[state=open]:bg-muted"
          aria-label="文字和高亮颜色"
        >
          <div className="relative">
            <Palette className="h-4 w-4" />
            {/* 颜色指示器 */}
            <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-background">
              <div 
                className="w-full h-full rounded-full"
                style={{ 
                  backgroundColor: activeTab === 'text' ? currentTextColor || '#000000' : currentHighlight || '#FFFF00'
                }}
              />
            </div>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        {/* 标签切换 */}
        <div className="flex border-b">
          <button
            className={cn(
              "flex-1 px-4 py-2 text-sm font-medium transition-colors",
              activeTab === 'text' 
                ? "bg-background text-foreground border-b-2 border-primary" 
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setActiveTab('text')}
            disabled={!canUseTextColor}
          >
            文字颜色
          </button>
          <button
            className={cn(
              "flex-1 px-4 py-2 text-sm font-medium transition-colors",
              activeTab === 'highlight' 
                ? "bg-background text-foreground border-b-2 border-primary" 
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setActiveTab('highlight')}
            disabled={!canUseHighlight}
          >
            背景高亮
          </button>
        </div>

        <div className="p-0">
            {/* 最近使用的颜色 */}
            {recentColors.length > 0 && (
              <>
                <RecentColorsPanel 
                  recentColors={recentColors}
                  onColorSelect={(color, label) => handleColorSelect(color, label, activeTab)}
                  type={activeTab}
                />
                <Separator />
              </>
            )}

            {/* 预设颜色 */}
            <ColorPanel
              colors={activeTab === 'text' ? TEXT_COLORS : HIGHLIGHT_COLORS}
              activeColor={activeTab === 'text' ? currentTextColor : currentHighlight}
              onColorSelect={(color, label) => handleColorSelect(color, label, activeTab)}
              type={activeTab}
            />

            <Separator />

            {/* 自定义颜色 */}
            <CustomColorPicker
              onColorSelect={(color, label) => handleColorSelect(color, label, activeTab)}
              type={activeTab}
            />
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default ColorTextPopover;
