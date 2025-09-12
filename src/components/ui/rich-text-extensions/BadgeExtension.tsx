import React from 'react';
import { Mark, mergeAttributes } from '@tiptap/core';
import { Badge } from '@/components/ui/badge';

export interface BadgeOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    badge: {
      setBadge: (options: { text: string; variant?: string }) => ReturnType;
    };
  }
}

export const BadgeExtension = Mark.create<BadgeOptions>({
  name: 'badge',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      text: {
        default: 'Badge',
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
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="badge"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes, mark }) {
    const { text, variant } = mark.attrs;
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'badge',
        'data-text': text,
        'data-variant': variant,
        'class': getVariantClasses(variant),
      }),
      text,
    ];
  },

  addCommands() {
    return {
      setBadge: (options) => ({ commands, state, dispatch }) => {
        const { text = 'Badge', variant = 'default' } = options;
        
        if (dispatch) {
          const { from, to } = state.selection;
          
          // 如果有选中文本，替换它；否则插入新文本
          if (from === to) {
            // 没有选中文本，插入新的徽章文本
            const textNode = state.schema.text(text, [this.type.create({ text, variant })]);
            const tr = state.tr.replaceWith(from, to, textNode);
            dispatch(tr);
          } else {
            // 有选中文本，将其标记为徽章
            const tr = state.tr.addMark(from, to, this.type.create({ text, variant }));
            dispatch(tr);
          }
        }
        return true;
      },
    };
  },
});

function getVariantClasses(variant: string): string {
  const baseClasses = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';
  
  switch (variant) {
    case 'secondary':
      return `${baseClasses} border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80`;
    case 'destructive':
      return `${baseClasses} border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80`;
    case 'outline':
      return `${baseClasses} text-foreground border border-input bg-background hover:bg-accent hover:text-accent-foreground`;
    default:
      return `${baseClasses} border-transparent bg-primary text-primary-foreground hover:bg-primary/80`;
  }
}

export default BadgeExtension;