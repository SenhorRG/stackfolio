'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function SkillCategoryFilter({
  categories,
  selected,
  onChange,
}: {
  categories: string[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  const selectedCount = selected.size;
  const label =
    selectedCount === 0
      ? 'All categories'
      : `${selectedCount} categor${selectedCount === 1 ? 'y' : 'ies'}`;

  const toggle = (cat: string) => {
    const next = new Set(selected);
    if (next.has(cat)) next.delete(cat);
    else next.add(cat);
    onChange(next);
  };

  const selectAll = () => onChange(new Set(categories));
  const deselectAll = () => onChange(new Set());

  return (
    <div ref={rootRef} className="relative">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="min-w-[10rem] justify-between gap-2"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {label}
        <ChevronDown
          size={16}
          className={cn('shrink-0 transition', open && 'rotate-180')}
        />
      </Button>
      {open && (
        <div
          role="listbox"
          aria-multiselectable
          className="absolute left-0 top-full z-20 mt-1 max-h-72 min-w-[14rem] overflow-y-auto rounded-md border border-border bg-card p-2 shadow-lg"
        >
          <div className="mb-2 flex gap-2 border-b border-border pb-2">
            <Button type="button" variant="ghost" size="sm" onClick={selectAll}>
              Select all
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={deselectAll}
            >
              Deselect all
            </Button>
          </div>
          <ul className="space-y-1">
            {categories.map((cat) => (
              <li key={cat}>
                <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted">
                  <input
                    type="checkbox"
                    checked={selected.has(cat)}
                    onChange={() => toggle(cat)}
                    className="rounded border-border"
                  />
                  <span>{cat}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
