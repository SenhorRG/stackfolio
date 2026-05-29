'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function AuthNavActions() {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <Link href="/login">
        <Button type="button" variant="ghost" size="sm">
          Login
        </Button>
      </Link>
      <Link href="/register">
        <Button type="button" variant="default" size="sm">
          Sign up
        </Button>
      </Link>
    </div>
  );
}
