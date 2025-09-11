import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CopyButtonProps {
  text: string;
  className?: string;
}

export function CopyButton({ text, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className={cn("h-8 px-3 text-xs", className)}
    >
      {copied ? (
        <>
          <Check className="w-3 h-3 mr-1" />
          已复制
        </>
      ) : (
        <>
          <Copy className="w-3 h-3 mr-1" />
          复制
        </>
      )}
    </Button>
  );
}
