import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { Underline } from '@tiptap/extension-underline';
import { HorizontalRule } from '@tiptap/extension-horizontal-rule';
import { Image } from '@tiptap/extension-image';
import { TextAlign } from '@tiptap/extension-text-align';
import { Typography } from '@tiptap/extension-typography';
import { Placeholder } from '@tiptap/extension-placeholder';
import { BadgeExtension } from './rich-text-extensions/BadgeExtension';
import { ButtonExtension } from './rich-text-extensions/ButtonExtension';
import { CardExtension } from './rich-text-extensions/CardExtension';
import { Button } from '@/components/ui/button';
import { ColorTextPopover } from '@/components/ui/color-text-popover';
import { ImageDialog, BadgeDialog, ButtonDialog, CardDialog } from './rich-text-dialogs';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  List, 
  ListOrdered, 
  Quote,
  Code,
  CodeSquare,
  Undo,
  Redo,
  Heading1,
  Heading2,
  Heading3,
  Minus,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Badge as BadgeIcon,
  Dock,
  MousePointer,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function RichTextEditor({ 
  content = '', 
  onChange, 
  placeholder = '请输入内容...', 
  className,
  disabled = false 
}: RichTextEditorProps) {
  const [isSourceMode, setIsSourceMode] = useState(false);
  const [sourceContent, setSourceContent] = useState('');
  
  // 对话框状态
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showBadgeDialog, setShowBadgeDialog] = useState(false);
  const [showButtonDialog, setShowButtonDialog] = useState(false);
  const [showCardDialog, setShowCardDialog] = useState(false);

  // 格式化HTML代码
  const formatHTML = (html: string): string => {
    try {
      // 简单的HTML格式化
      let formatted = html
        // 添加换行
        .replace(/></g, '>\n<')
        // 处理自闭合标签
        .replace(/(<[^>]+\/>)/g, '$1\n')
        // 处理块级元素
        .replace(/(<\/?(div|p|h[1-6]|ul|ol|li|blockquote|section|article|header|footer|nav|main)[^>]*>)/gi, '\n$1\n')
        // 清理多余空行
        .replace(/\n\s*\n/g, '\n')
        .trim();

      // 添加缩进
      const lines = formatted.split('\n');
      let indentLevel = 0;
      const indentSize = 2;
      
      return lines.map(line => {
        const trimmed = line.trim();
        if (!trimmed) return '';
        
        // 减少缩进：闭合标签
        if (trimmed.startsWith('</')) {
          indentLevel = Math.max(0, indentLevel - 1);
        }
        
        const indented = ' '.repeat(indentLevel * indentSize) + trimmed;
        
        // 增加缩进：开放标签（非自闭合）
        if (trimmed.startsWith('<') && !trimmed.startsWith('</') && !trimmed.endsWith('/>') && !trimmed.includes('</')) {
          indentLevel++;
        }
        
        return indented;
      }).join('\n');
    } catch (error) {
      console.warn('HTML formatting failed:', error);
      return html;
    }
  };

  const editor = useEditor({
    immediatelyRender: false, // 避免立即渲染
    shouldRerenderOnTransaction: false, // 避免每次事务都重新渲染
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
        horizontalRule: false, // 禁用内置的，使用单独的扩展
        paragraph: {
          HTMLAttributes: {
            class: 'paragraph-node',
          },
        },
        // document 保持默认配置
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
        HTMLAttributes: {
          class: 'my-highlight',
        },
      }),
      Underline,
      HorizontalRule.configure({
        HTMLAttributes: {
          class: 'my-horizontal-rule',
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: 'my-image',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
        defaultAlignment: 'left',
      }),
      Typography.configure({
        openDoubleQuote: '"',
        closeDoubleQuote: '"',
        openSingleQuote: "'",
        closeSingleQuote: "'",
        ellipsis: '…',
        emDash: '—',
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return '输入标题...';
          }
          return '开始输入内容...';
        },
        includeChildren: true,
      }),
      BadgeExtension,
      ButtonExtension,
      CardExtension,
    ],
    content,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      // 使用 setTimeout 避免在渲染过程中同步更新
      setTimeout(() => {
        const html = editor.getHTML();
        onChange?.(html);
      }, 0);
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-lg max-w-none focus:outline-none',
          'min-h-[200px] p-4',
          'dark:prose-invert',
          'space-y-6 text-base leading-relaxed',
          disabled && 'opacity-50 cursor-not-allowed'
        ),
      },
    },
  });


  // 确保编辑器样式正确应用
  useEffect(() => {
    if (editor) {
      // 添加自定义样式类
      const editorElement = editor.view.dom as HTMLElement;
      editorElement.style.minHeight = 'calc(70vh - 100px)';
      editorElement.style.outline = 'none';
      editorElement.style.border = 'none';
      
      // 添加自定义CSS样式
      const style = document.createElement('style');
      style.textContent = `
        .ProseMirror .my-highlight {
          background-color: var(--highlight-color, #ffff00);
          padding: 0.1em 0.3em;
          border-radius: 0.3em;
          box-decoration-break: clone;
        }
        .ProseMirror mark {
          padding: 0.1em 0.3em;
          border-radius: 0.3em;
          box-decoration-break: clone;
        }
        .ProseMirror .my-horizontal-rule {
          border: none;
          border-top: 2px solid hsl(var(--border));
          margin: 1.5rem 0;
          padding: 0;
        }
        .ProseMirror .my-image {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 0.5rem 0;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }
        .ProseMirror .my-badge {
          display: inline-flex;
          align-items: center;
          border-radius: 9999px;
          background-color: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          padding: 0.125rem 0.5rem;
          font-size: 0.75rem;
          font-weight: 500;
          margin: 0 0.125rem;
        }
        .ProseMirror .my-card {
          background-color: hsl(var(--card));
          border: 1px solid hsl(var(--border));
          border-radius: 0.5rem;
          padding: 1rem;
          margin: 1rem 0;
          box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
        }
        .ProseMirror .my-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background-color: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          border: none;
          border-radius: 0.375rem;
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          margin: 0.25rem;
          transition: background-color 0.2s;
        }
        .ProseMirror .my-button:hover {
          background-color: hsl(var(--primary) / 0.9);
        }
        .ProseMirror .paragraph-node {
          margin: 0.25rem 0;
          min-height: 1.25rem;
        }
        .ProseMirror .card-node-view {
          margin: 2rem 0;
          clear: both;
        }
        .ProseMirror .card-node-view .group:hover {
          transform: translateY(-2px);
        }
        .ProseMirror [data-type="badge"] {
          display: inline-flex !important;
          margin: 0 0.125rem;
          vertical-align: middle;
        }
        .ProseMirror [data-type="custom-button"] {
          display: inline-flex !important;
          margin: 0 0.125rem;
          vertical-align: middle;
          transition: all 0.2s;
        }
        .ProseMirror [data-type="custom-button"]:hover {
          opacity: 0.9;
        }
        .ProseMirror p:empty {
          margin: 0.25rem 0;
        }
        .ProseMirror p:empty::before {
          content: '';
          display: inline-block;
          width: 0;
          height: 1rem;
        }
      `;
      if (!document.head.querySelector('style[data-editor-highlight]')) {
        style.setAttribute('data-editor-highlight', 'true');
        document.head.appendChild(style);
      }
    }
  }, [editor]);

  // 初始化和同步源代码内容
  useEffect(() => {
    if (editor) {
      const currentHTML = editor.getHTML();
      if (currentHTML !== sourceContent && !isSourceMode) {
        setSourceContent(currentHTML);
      }
    }
  }, [editor, content]);

  // 当编辑器内容变化时同步到源代码（仅在非源代码模式下）
  useEffect(() => {
    if (editor && !isSourceMode) {
      const handleUpdate = () => {
        const currentHTML = editor.getHTML();
        setSourceContent(currentHTML);
      };
      
      editor.on('update', handleUpdate);
      return () => {
        editor.off('update', handleUpdate);
      };
    }
  }, [editor, isSourceMode]);


  if (!editor) {
    return null;
  }

  const ToolbarButton = ({ 
    onClick, 
    isActive = false, 
    disabled = false, 
    children 
  }: {
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
  }) => (
    <Button
      type="button"
      variant={isActive ? "default" : "ghost"}
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className="h-8 w-8 p-0"
    >
      {children}
    </Button>
  );

  return (
    <div className={cn('border rounded-lg bg-background', className)}>
      {/* 工具栏 - 固定在编辑器顶部 */}
      <div className="border-b p-3 bg-muted/30 flex-shrink-0">
        <div className="flex flex-wrap gap-1">
          {/* 撤销重做 */}
          <div className="flex gap-1 mr-2">
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().chain().focus().undo().run()}
            >
              <Undo className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().chain().focus().redo().run()}
            >
              <Redo className="h-4 w-4" />
            </ToolbarButton>
          </div>

          <div className="w-px h-6 bg-border mx-1" />

          {/* 标题 */}
          <div className="flex gap-1 mr-2">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              isActive={editor.isActive('heading', { level: 1 })}
            >
              <Heading1 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              isActive={editor.isActive('heading', { level: 2 })}
            >
              <Heading2 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              isActive={editor.isActive('heading', { level: 3 })}
            >
              <Heading3 className="h-4 w-4" />
            </ToolbarButton>
          </div>

          <div className="w-px h-6 bg-border mx-1" />

          {/* 文字格式 */}
          <div className="flex gap-1 mr-2">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive('bold')}
            >
              <Bold className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive('italic')}
            >
              <Italic className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              isActive={editor.isActive('underline')}
            >
              <UnderlineIcon className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleCode().run()}
              isActive={editor.isActive('code')}
            >
              <Code className="h-4 w-4" />
            </ToolbarButton>
          </div>

          <div className="w-px h-6 bg-border mx-1" />

          {/* 颜色工具 */}
          <div className="flex gap-1 mr-2">
            <ColorTextPopover 
              editor={editor}
              hideWhenUnavailable={false}
              onColorChanged={({ type, label, value }) => {
                console.log(`应用 ${type} 颜色: ${label} (${value})`);
              }}
            />
          </div>

          <div className="w-px h-6 bg-border mx-1" />

          {/* 列表 */}
          <div className="flex gap-1 mr-2">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive('bulletList')}
            >
              <List className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive('orderedList')}
            >
              <ListOrdered className="h-4 w-4" />
            </ToolbarButton>
          </div>

          <div className="w-px h-6 bg-border mx-1" />

          {/* 文本对齐 */}
          <div className="flex gap-1 mr-2">
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              isActive={editor.isActive({ textAlign: 'left' }) || (!editor.isActive({ textAlign: 'center' }) && !editor.isActive({ textAlign: 'right' }) && !editor.isActive({ textAlign: 'justify' }))}
            >
              <AlignLeft className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              isActive={editor.isActive({ textAlign: 'center' })}
            >
              <AlignCenter className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              isActive={editor.isActive({ textAlign: 'right' })}
            >
              <AlignRight className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('justify').run()}
              isActive={editor.isActive({ textAlign: 'justify' })}
            >
              <AlignJustify className="h-4 w-4" />
            </ToolbarButton>
          </div>

          <div className="w-px h-6 bg-border mx-1" />

          {/* 插入工具 */}
          <div className="flex gap-1 mr-2">
            <ToolbarButton
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
            >
              <Minus className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => setShowImageDialog(true)}
            >
              <ImageIcon className="h-4 w-4" />
            </ToolbarButton>
          </div>

          <div className="w-px h-6 bg-border mx-1" />

          {/* UI 组件 */}
          <div className="flex gap-1 mr-2">
            <ToolbarButton
              onClick={() => setShowBadgeDialog(true)}
            >
              <BadgeIcon className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => setShowButtonDialog(true)}
            >
              <MousePointer className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => setShowCardDialog(true)}
            >
              <Dock className="h-4 w-4" />
            </ToolbarButton>
          </div>

          <div className="w-px h-6 bg-border mx-1" />

          {/* 其他 */}
          <div className="flex gap-1">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              isActive={editor.isActive('blockquote')}
            >
              <Quote className="h-4 w-4" />
            </ToolbarButton>
          </div>

          <div className="w-px h-6 bg-border mx-1" />

          {/* 源代码模式 */}
          <ToolbarButton
            onClick={() => {
              if (!isSourceMode) {
                // 切换到源代码模式
                const currentHTML = editor.getHTML();
                const formattedHTML = formatHTML(currentHTML);
                setSourceContent(formattedHTML);
                setIsSourceMode(true);
              } else {
                // 切换回富文本模式 - 使用 setTimeout 避免 flushSync 错误
                setTimeout(() => {
                  editor.commands.setContent(sourceContent);
                  setIsSourceMode(false);
                }, 0);
              }
            }}
            isActive={isSourceMode}
          >
            <CodeSquare className="h-4 w-4" />
          </ToolbarButton>
        </div>
      </div>

      {/* 编辑器内容区域 - 大幅增加高度 */}
      <div className="relative h-[75vh] overflow-y-auto">
        <div className="p-4">
          {isSourceMode ? (
            <textarea
              value={sourceContent}
              onChange={(e) => {
                setSourceContent(e.target.value);
                // 避免实时更新编辑器，防止 flushSync 错误
                // 编辑器内容将在切换回富文本模式时更新
                onChange?.(e.target.value);
              }}
              className="w-full h-full min-h-[calc(75vh-200px)] p-3 text-sm font-mono bg-muted border border-border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              placeholder="在此编辑HTML源代码..."
              spellCheck={false}
            />
          ) : (
            <>
              <EditorContent editor={editor} />
              
              {/* 占位符 */}
              {editor.isEmpty && (
                <div className="absolute top-4 left-4 text-muted-foreground pointer-events-none select-none">
                  {placeholder}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 对话框 */}
      <ImageDialog
        open={showImageDialog}
        onOpenChange={setShowImageDialog}
        onConfirm={(url) => {
          setTimeout(() => {
            editor?.chain().focus().setImage({ src: url }).run();
          }, 0);
          setShowImageDialog(false);
        }}
      />

      <BadgeDialog
        open={showBadgeDialog}
        onOpenChange={setShowBadgeDialog}
        onConfirm={(data) => {
          setTimeout(() => {
            editor?.chain().focus().setBadge(data).run();
          }, 0);
          setShowBadgeDialog(false);
        }}
      />

      <ButtonDialog
        open={showButtonDialog}
        onOpenChange={setShowButtonDialog}
        onConfirm={(data) => {
          setTimeout(() => {
            editor?.chain().focus().setCustomButton(data).run();
          }, 0);
          setShowButtonDialog(false);
        }}
      />

      <CardDialog
        open={showCardDialog}
        onOpenChange={setShowCardDialog}
        onConfirm={(data) => {
          setTimeout(() => {
            editor?.chain().focus().setCustomCard(data).run();
          }, 0);
          setShowCardDialog(false);
        }}
      />
    </div>
  );
}
