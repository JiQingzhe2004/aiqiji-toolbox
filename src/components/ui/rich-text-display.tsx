import React, { useEffect } from 'react';
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
import { BadgeExtension } from './rich-text-extensions/BadgeExtension';
import { ButtonExtension } from './rich-text-extensions/ButtonExtension';
import { CardExtension } from './rich-text-extensions/CardExtension';
import { cn } from '@/lib/utils';

interface RichTextDisplayProps {
  content: string;
  className?: string;
}

export function RichTextDisplay({ content, className }: RichTextDisplayProps) {
  // 创建只读编辑器实例
  const editor = useEditor({
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
      BadgeExtension,
      ButtonExtension,
      CardExtension,
    ],
    content,
    editable: false, // 设置为只读
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-lg max-w-none focus:outline-none',
          'dark:prose-invert',
          'space-y-4 text-base leading-relaxed',
          // 自定义HTML元素样式
          '[&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6',
          '[&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-5', 
          '[&_h3]:text-xl [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-4',
          '[&_p]:mb-4 [&_p]:leading-relaxed',
          '[&_strong]:font-semibold [&_strong]:text-foreground',
          '[&_em]:italic',
          '[&_ul]:mb-4 [&_ul]:pl-6 [&_ul]:list-disc',
          '[&_ol]:mb-4 [&_ol]:pl-6 [&_ol]:list-decimal',
          '[&_li]:mb-2',
          '[&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic',
          '[&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm',
          '[&_mark]:px-1 [&_mark]:py-0.5 [&_mark]:rounded [&_mark]:inline-block',
          '[&_.my-highlight]:px-1 [&_.my-highlight]:py-0.5 [&_.my-highlight]:rounded [&_.my-highlight]:inline-block',
          '[&_u]:underline [&_u]:decoration-2',
          '[&_.my-horizontal-rule]:border-t-2 [&_.my-horizontal-rule]:border-border [&_.my-horizontal-rule]:my-6',
          '[&_.my-image]:max-w-full [&_.my-image]:h-auto [&_.my-image]:rounded-lg [&_.my-image]:my-2 [&_.my-image]:shadow-md',
          '[&_.my-badge]:inline-flex [&_.my-badge]:items-center [&_.my-badge]:rounded-full [&_.my-badge]:bg-primary [&_.my-badge]:text-primary-foreground [&_.my-badge]:px-2 [&_.my-badge]:py-1 [&_.my-badge]:text-xs [&_.my-badge]:font-medium [&_.my-badge]:mx-1',
          '[&_.my-card]:bg-white [&_.my-card]:dark:bg-card [&_.my-card]:border [&_.my-card]:border-gray-200 [&_.my-card]:dark:border-border [&_.my-card]:rounded-xl [&_.my-card]:shadow-sm [&_.my-card]:my-8 [&_.my-card]:overflow-hidden',
          '[&_.my-button]:inline-flex [&_.my-button]:items-center [&_.my-button]:justify-center [&_.my-button]:bg-primary [&_.my-button]:text-primary-foreground [&_.my-button]:border-0 [&_.my-button]:rounded-md [&_.my-button]:px-4 [&_.my-button]:py-2 [&_.my-button]:text-sm [&_.my-button]:font-medium [&_.my-button]:cursor-pointer [&_.my-button]:m-1 [&_.my-button]:transition-colors',
        ),
      },
    },
  });

  // 添加高亮样式支持
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .rich-text-display .ProseMirror .my-highlight {
        padding: 0.1em 0.3em;
        border-radius: 0.3em;
        box-decoration-break: clone;
        display: inline;
      }
      .rich-text-display .ProseMirror mark {
        padding: 0.1em 0.3em;
        border-radius: 0.3em;
        box-decoration-break: clone;
        display: inline;
      }
    `;
    if (!document.head.querySelector('style[data-display-highlight]')) {
      style.setAttribute('data-display-highlight', 'true');
      document.head.appendChild(style);
    }
  }, []);

  if (!editor) {
    return null;
  }

  return (
    <div className={cn('rich-text-display', className)}>
      <EditorContent editor={editor} />
    </div>
  );
}