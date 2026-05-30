'use client';

import Link from 'next/link';
import { useState } from 'react';
import { DevPasswordResetLinkPanel } from '@/features/auth/components/dev-password-reset-link-panel';
import { requestPasswordReset } from '@/features/auth/services/request-password-reset';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Enter your email address and we will send you instructions to reset your
        password.
      </p>
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          setMessage(null);
          setDevResetUrl(null);
          setLoading(true);
          try {
            const result = await requestPasswordReset(email);
            setMessage(result.message);
            setDevResetUrl(result.devResetUrl ?? null);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Request failed');
          } finally {
            setLoading(false);
          }
        }}
      >
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
        {devResetUrl && <DevPasswordResetLinkPanel resetUrl={devResetUrl} />}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Sending...' : 'Send reset link'}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
