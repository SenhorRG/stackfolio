import { Suspense } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { LoginForm } from './login-form';

function LoginFormFallback() {
  return (
    <Card className="mx-auto max-w-md">
      <CardHeader />
      <CardContent className="h-48 animate-pulse rounded-md bg-muted" />
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFormFallback />}>
      <LoginForm />
    </Suspense>
  );
}
