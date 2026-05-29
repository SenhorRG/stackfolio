import type { ReactNode } from 'react';
import { PageBackLink } from './page-back-link';
import { cn } from '@/lib/utils';

type PageHeaderProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  subtitle,
  backHref,
  backLabel,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-wrap items-center justify-between gap-3',
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          {backHref && (
            <PageBackLink href={backHref} label={backLabel} className="shrink-0" />
          )}
          <h1 className="text-2xl font-bold">{title}</h1>
        </div>
        {subtitle ? (
          <p className="text-base text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
