'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function UserMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const label =
    session?.user?.name ?? session?.user?.email ?? 'Account';

  return (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="max-w-[12rem] truncate font-medium"
        onClick={() => setOpen((v) => !v)}
      >
        {label}
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
            <Link
              href="/skills/admin"
              className="block px-3 py-2 text-sm hover:bg-muted"
              onClick={() => setOpen(false)}
            >
              Skills admin
            </Link>
            <button
              type="button"
              className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
              onClick={() => {
                setOpen(false);
                void signOut({ callbackUrl: '/' });
              }}
            >
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
