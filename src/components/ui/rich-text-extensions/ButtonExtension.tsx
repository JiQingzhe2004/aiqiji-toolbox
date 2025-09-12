import React from 'react';
import { Mark, mergeAttributes } from '@tiptap/core';

export interface ButtonOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    customButton: {
      setCustomButton: (options: { text: string; variant?: string; size?: string; url?: string }) => ReturnType;
    };
  }
}

export const ButtonExtension = Mark.create<ButtonOptions>({
  name: 'customButton',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      text: {
        default: '按钮',
        parseHTML: element => element.getAttribute('data-text'),
        renderHTML: attributes => ({
          'data-text': attributes.text,
        }),
      },
      variant: {
        default: 'default',
        parseHTML: element => element.getAttribute('data-variant'),
        renderHTML: attributes => ({
          'data-variant': attributes.variant,
        }),
      },
      size: {
        default: 'default',
        parseHTML: element => element.getAttribute('data-size'),
        renderHTML: attributes => ({
          'data-size': attributes.size,
        }),
      },
      url: {
        default: '',
        parseHTML: element => element.getAttribute('data-url'),
        renderHTML: attributes => ({
          'data-url': attributes.url,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="custom-button"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes, mark }) {
    const { text, variant, size, url } = mark.attrs;
    const clickHandler = url ? `onclick="window.open('${url}', '_blank')"` : '';
    
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'custom-button',
        'data-text': text,
        'data-variant': variant,
        'data-size': size,
        'data-url': url,
        'class': `${getSizeClasses(size)} ${getVariantClasses(variant)} cursor-pointer`,
        'onclick': url ? `window.open('${url}', '_blank')` : undefined,
      }),
      text,
    ];
  },

  addCommands() {
    return {
      setCustomButton: (options) => ({ commands, state, dispatch }) => {
        const { text = '按钮', variant = 'default', size = 'default', url = '' } = options;
        
        if (dispatch) {
          const { from, to } = state.selection;
          
          // 如果有选中文本，替换它；否则插入新文本
          if (from === to) {
            // 没有选中文本，插入新的按钮文本
            const textNode = state.schema.text(text, [this.type.create({ text, variant, size, url })]);
            const tr = state.tr.replaceWith(from, to, textNode);
            dispatch(tr);
          } else {
            // 有选中文本，将其标记为按钮
            const tr = state.tr.addMark(from, to, this.type.create({ text, variant, size, url }));
            dispatch(tr);
          }
        }
        return true;
      },
    };
  },
});

function getSizeClasses(size: string): string {
  switch (size) {
    case 'sm':
      return 'inline-flex items-center justify-center rounded-md text-xs font-medium px-2 py-1';
    case 'lg':
      return 'inline-flex items-center justify-center rounded-md text-base font-medium px-6 py-3';
    default:
      return 'inline-flex items-center justify-center rounded-md text-sm font-medium px-4 py-2';
  }
}

function getVariantClasses(variant: string): string {
  switch (variant) {
    case 'destructive':
      return 'bg-destructive text-destructive-foreground hover:bg-destructive/90';
    case 'outline':
      return 'border border-input bg-background hover:bg-accent hover:text-accent-foreground';
    case 'secondary':
      return 'bg-secondary text-secondary-foreground hover:bg-secondary/80';
    case 'ghost':
      return 'hover:bg-accent hover:text-accent-foreground';
    case 'link':
      return 'text-primary underline-offset-4 hover:underline';
    default:
      return 'bg-primary text-primary-foreground hover:bg-primary/90';
  }
}

export default ButtonExtension;