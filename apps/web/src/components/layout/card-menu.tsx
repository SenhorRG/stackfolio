'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export type CardMenuItem = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
};

type CardMenuProps = {
  ariaLabel: string;
  items: CardMenuItem[];
};

export function CardMenu({ ariaLabel, items }: CardMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="px-2"
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
      >
        ⋯
      </Button>
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-10 cursor-default"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-1 min-w-[10rem] rounded-md border border-border bg-card py-1 shadow-md">
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                className={`block w-full px-3 py-2 text-left text-sm hover:bg-muted ${
                  item.destructive ? 'text-destructive' : ''
                }`}
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false);
                  item.onClick();
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
