'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { AuthNavActions } from '@/features/auth/components/auth-nav-actions';
import { UserMenu } from '@/features/auth/components/user-menu';

const publicLinks = [
  { href: '/', label: 'Home' },
  { href: '/skills', label: 'Skills' },
  { href: '/profiles', label: 'Profiles' },
];

export function AppNav() {
  const pathname = usePathname();
  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const navLinks = publicLinks;

  return (
    <nav className="flex flex-wrap items-center gap-4 border-b border-border px-6 py-3 text-sm font-medium">
      <Link href="/" className="font-bold text-primary">
        Stackfolio
      </Link>
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            'hover:text-primary',
            pathname === link.href && 'text-primary underline',
          )}
        >
          {link.label}
        </Link>
      ))}
      <div className="ml-auto flex shrink-0 items-center">
        {isAuthenticated ? <UserMenu /> : <AuthNavActions />}
      </div>
    </nav>
  );
}
