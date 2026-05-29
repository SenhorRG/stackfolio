'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

type Props = {
  title: string;
  readOnly?: boolean;
  count?: number;
  children: React.ReactNode;
  action?: React.ReactNode;
};

export function ProfileCollapsibleSection({
  title,
  readOnly = false,
  count,
  children,
  action,
}: Props) {
  const [open, setOpen] = useState(!readOnly);

  if (!readOnly) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">{title}</h3>
          {action}
        </div>
        {children}
      </div>
    );
  }

  return (
    <details
      className="group rounded-lg border border-border"
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-sm font-semibold [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          <ChevronDown
            size={16}
            className="shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
          />
          {title}
          {typeof count === 'number' && (
            <span className="font-normal text-muted-foreground">({count})</span>
          )}
        </span>
      </summary>
      <div className="space-y-2 border-t border-border px-3 py-3">{children}</div>
    </details>
  );
}
