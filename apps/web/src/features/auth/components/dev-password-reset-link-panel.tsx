'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

type DevPasswordResetLinkPanelProps = {
  resetUrl: string;
};

export function DevPasswordResetLinkPanel({
  resetUrl,
}: DevPasswordResetLinkPanelProps) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="rounded-md border border-dashed border-amber-500/50 bg-amber-500/5 p-3 space-y-2">
      <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
        Development only — reset link
      </p>
      <p className="break-all text-xs text-muted-foreground">{resetUrl}</p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={async () => {
            await navigator.clipboard.writeText(resetUrl);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          }}
        >
          {copied ? 'Copied' : 'Copy link'}
        </Button>
        <a
          href={resetUrl}
          className="inline-flex h-8 items-center justify-center rounded-md border border-border bg-transparent px-3 text-sm font-medium transition hover:bg-muted"
        >
          Open link
        </a>
      </div>
    </div>
  );
}
