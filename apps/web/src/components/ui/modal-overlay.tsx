'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

type ModalOverlayProps = {
  open: boolean;
  children: ReactNode;
  className?: string;
  onBackdropClick?: () => void;
};

export function ModalOverlay({
  open,
  children,
  className,
  onBackdropClick,
}: ModalOverlayProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-50 m-0 flex min-h-screen w-screen items-center justify-center bg-black/50 p-4',
        className,
      )}
      role="presentation"
      onClick={onBackdropClick}
    >
      {children}
    </div>,
    document.body,
  );
}
