import Link from 'next/link';
import { cn } from '@/lib/utils';

type PageBackLinkProps = {
  href: string;
  label?: string;
  className?: string;
};

export function PageBackLink({
  href,
  label = 'Back',
  className,
}: PageBackLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline',
        className,
      )}
    >
      <span aria-hidden>←</span>
      {label}
    </Link>
  );
}
