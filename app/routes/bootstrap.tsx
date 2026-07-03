import React from 'react';
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';

import { PageFrame, SoftPanel } from '../components/layout';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { PrimaryButton } from '../components/ui';
import {
  createBootstrapRootUser,
  getBootstrapStatus,
  resolveBootstrapRedirect,
  type BootstrapStatus,
} from '../../src/lib/bootstrap';

type BootstrapSearch = Record<string, never>;

export const Route = createFileRoute('/bootstrap')({
  validateSearch: (_search: Record<string, unknown>): BootstrapSearch => ({}),
  beforeLoad: async ({ location }) => {
    const resolved = await resolveBootstrapRedirect(location.pathname);
    if (resolved.redirectTo) {
      throw redirect({ to: resolved.redirectTo });
    }
    return { bootstrapStatus: resolved.status };
  },
  component: BootstrapRoute,
});

type BootstrapRouteWithPreload = typeof Route & { preload?: () => Promise<void> };

(Route as BootstrapRouteWithPreload).preload = async () => {
  await getBootstrapStatus().catch(() => null);
};

function BootstrapRoute() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [status, setStatus] = React.useState<BootstrapStatus | null>(null);
  const [displayName, setDisplayName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const idempotencyKeyRef = React.useRef(cryptoRandomId());

  React.useEffect(() => {
    let mounted = true;
    getBootstrapStatus()
      .then((nextStatus) => {
        if (!mounted) return;
        setStatus(nextStatus);
        if (nextStatus.nextRoute !== '/bootstrap') {
          void navigate({ to: nextStatus.nextRoute });
        }
      })
      .catch(() => {
        if (!mounted) return;
        setError('Failed to load bootstrap status.');
      });
    return () => {
      mounted = false;
    };
  }, [navigate]);

  const passwordMismatch = password.length > 0 && confirmPassword.length > 0 && password !== confirmPassword;
  const passwordTooShort = password.length > 0 && password.length < 8;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await createBootstrapRootUser({
        email,
        password,
        displayName: displayName || undefined,
      }, idempotencyKeyRef.current);

      await queryClient.invalidateQueries({ queryKey: ['bootstrap', 'status'] });
      void navigate({ to: result.nextRoute });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Bootstrap failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (status?.nextRoute && status.nextRoute !== '/bootstrap') {
    return null;
  }

  return (
    <PageFrame
      title="Create root user"
      subtitle="Create the first root user for this Vaulty instance. This account owns recovery, config, and admin access."
      statusLine={status ? `Bootstrap ${status.state}` : 'Loading bootstrap status'}
      nextAction="Use the root account to finish setup."
      actions={<Badge variant="muted">Root user</Badge>}
    >
      <SoftPanel variant="elevated" className="mx-auto w-full max-w-2xl p-0 overflow-hidden">
        <div className="p-6 sm:p-8">
          <BootstrapWizard
            displayName={displayName}
            email={email}
            password={password}
            confirmPassword={confirmPassword}
            submitting={submitting}
            error={error}
            passwordMismatch={passwordMismatch}
            passwordTooShort={passwordTooShort}
            onDisplayNameChange={setDisplayName}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onConfirmPasswordChange={setConfirmPassword}
            onSubmit={handleSubmit}
          />
        </div>
      </SoftPanel>
    </PageFrame>
  );
}

function cryptoRandomId(): string {
  return `boot_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

function BootstrapWizard({
  displayName,
  email,
  password,
  confirmPassword,
  submitting,
  error,
  passwordMismatch,
  passwordTooShort,
  onDisplayNameChange,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
}: {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
  submitting: boolean;
  error: string | null;
  passwordMismatch: boolean;
  passwordTooShort: boolean;
  onDisplayNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]" htmlFor="displayName">
          Display name
        </label>
        <Input id="displayName" value={displayName} onChange={(event) => onDisplayNameChange(event.target.value)} placeholder="Darry" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]" htmlFor="email">
          Email
        </label>
        <Input id="email" type="email" value={email} onChange={(event) => onEmailChange(event.target.value)} placeholder="root@vault.local" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]" htmlFor="password">
          Password
        </label>
        <Input id="password" type="password" value={password} onChange={(event) => onPasswordChange(event.target.value)} required minLength={8} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]" htmlFor="confirmPassword">
          Confirm password
        </label>
        <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(event) => onConfirmPasswordChange(event.target.value)} required minLength={8} />
      </div>

      <PasswordRules passwordMismatch={passwordMismatch} passwordTooShort={passwordTooShort} />

      {error ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <PrimaryButton className="mt-2 w-full" type="submit" disabled={submitting}>
        {submitting ? 'Creating root user…' : 'Create root user'}
      </PrimaryButton>
    </form>
  );
}

function PasswordRules({
  passwordMismatch,
  passwordTooShort,
}: {
  passwordMismatch: boolean;
  passwordTooShort: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-3 text-sm text-[var(--text-secondary)]">
      <p>Create the first root user for this Vaulty instance.</p>
      <ul className="mt-2 list-disc pl-5">
        <li>Password minimum length: 8 characters.</li>
        <li>Password must match confirmation.</li>
        <li>This account owns recovery, config, and admin access.</li>
      </ul>
      {passwordMismatch ? <p className="mt-2 text-destructive">Passwords do not match.</p> : null}
      {passwordTooShort ? <p className="mt-1 text-destructive">Password is too short.</p> : null}
    </div>
  );
}
