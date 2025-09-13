import TiptapImage from '@tiptap/extension-image';
import { mergeAttributes } from '@tiptap/core';

export type ImageAlignment = 'left' | 'center' | 'right';

const baseImageClasses = [
  'my-image',
  'cursor-pointer',
  'hover:ring-2',
  'hover:ring-primary/50',
  'transition-all',
  'duration-200',
  'object-contain',
  'rounded-lg',
  'border',
].join(' ');

const alignmentToClasses = (alignment: ImageAlignment): string => {
  switch (alignment) {
    case 'left':
      return 'float-left mr-4 mb-2 clear-left';
    case 'right':
      return 'float-right ml-4 mb-2 clear-right';
    case 'center':
    default:
      // 居中：块级 + auto margin，显式取消浮动
      return 'block mx-auto mb-4 float-none';
  }
};

function inferAlignmentFromClass(className: string): ImageAlignment {
  if (className.includes('float-left')) return 'left';
  if (className.includes('float-right')) return 'right';
  if (className.includes('mx-auto') || className.includes('inline-block') || className.includes('text-center')) return 'center';
  return 'center';
}

// 参考文章做法：在 image 节点定义中支持对齐属性
// 文章链接： https://blog.csdn.net/solocao/article/details/140779208
export const ImageAlignExtension = TiptapImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      alignment: {
        default: 'center',
        parseHTML: element => element.getAttribute('data-alignment') || inferAlignmentFromClass(element.getAttribute('class') || ''),
        renderHTML: attributes => ({ 'data-alignment': attributes.alignment }),
      },
      // 额外类名（用于尺寸等非对齐类），保证序列化后持久化
      extraClass: {
        default: '',
        parseHTML: element => {
          const cls = element.getAttribute('class') || '';
          // 移除对齐类与基础类，其余留下
          const filtered = cls
            .split(/\s+/)
            .filter(Boolean)
            .filter(c => !baseImageClasses.split(' ').includes(c))
            .filter(c => !alignmentToClasses('left').split(' ').includes(c))
            .filter(c => !alignmentToClasses('center').split(' ').includes(c))
            .filter(c => !alignmentToClasses('right').split(' ').includes(c));
          return Array.from(new Set(filtered)).join(' ');
        },
        renderHTML: attributes => ({ 'data-extra-class': attributes.extraClass }),
      },
      // alt/title/src 默认由父扩展处理
    };
  },

  renderHTML({ HTMLAttributes, node }) {
    const alignment: ImageAlignment = (node.attrs.alignment as ImageAlignment) || 'center';
    const extraClass: string = (node.attrs.extraClass as string) || '';
    const computedClass = Array.from(new Set([
      ...baseImageClasses.split(' '),
      ...alignmentToClasses(alignment).split(' '),
      ...extraClass.split(' ').filter(Boolean),
    ])).join(' ');

    return [
      'img',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: computedClass,
        title: HTMLAttributes?.title ?? '双击编辑图片',
      }),
    ];
  },
});

export default ImageAlignExtension;


