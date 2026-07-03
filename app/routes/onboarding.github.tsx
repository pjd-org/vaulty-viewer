import React from 'react';
import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router';
import { PageFrame, SoftPanel } from '../components/layout';
import { Input } from '@/app/components/ui/input';
import { PrimaryButton } from '../components/ui';
import {
  getBootstrapStatus,
  getGitHubStatus,
  patchBootstrapDraft,
  startGitHubInstall,
  type GitHubStatusResponse,
} from '../../src/lib/bootstrap';

export const Route = createFileRoute('/onboarding/github')({
  validateSearch: (search: Record<string, unknown>) => ({
    installed: search['installed'] === 'true' || search['installed'] === true,
    error: typeof search['error'] === 'string' ? search['error'] : undefined,
  }),
  component: OnboardingGitHub,
});

function OnboardingGitHub() {
  const navigate = useNavigate();
  const { installed, error: callbackError } = useSearch({ from: '/onboarding/github' });

  const [owner, setOwner] = React.useState('');
  const [ownerType, setOwnerType] = React.useState<'user' | 'organization'>('user');
  const [repo, setRepo] = React.useState('');
  const [branch, setBranch] = React.useState('main');
  const [visibility, setVisibility] = React.useState<'private' | 'internal' | 'public'>('private');

  const [githubStatus, setGithubStatus] = React.useState<GitHubStatusResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(
    callbackError === 'install_failed' ? 'GitHub App installation failed. Please try again.' : null,
  );

  React.useEffect(() => {
    let mounted = true;
    Promise.all([getBootstrapStatus(), getGitHubStatus()])
      .then(([bootstrapStatus, ghStatus]) => {
        if (!mounted) return;
        setGithubStatus(ghStatus);
        const draft = bootstrapStatus.draft;
        if (draft) {
          const plan = (draft as { githubPlan?: { owner?: string; ownerType?: 'user' | 'organization'; repo?: string; branch?: string; visibility?: 'private' | 'internal' | 'public' } }).githubPlan;
          if (plan?.owner) setOwner(plan.owner);
          if (plan?.ownerType) setOwnerType(plan.ownerType);
          if (plan?.repo) setRepo(plan.repo);
          if (plan?.branch) setBranch(plan.branch);
          if (plan?.visibility) setVisibility(plan.visibility);
        }
      })
      .catch(() => {
        if (mounted) setError('Failed to load GitHub status.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // After a successful callback redirect, re-poll status and advance if connected
  React.useEffect(() => {
    if (!installed) return;
    let mounted = true;
    getGitHubStatus()
      .then((ghStatus) => {
        if (!mounted) return;
        setGithubStatus(ghStatus);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [installed]);

  const handleInstall = async () => {
    if (!owner.trim()) {
      setError('Owner is required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const result = await startGitHubInstall(owner.trim(), ownerType);
      window.location.href = result.installUrl;
    } catch {
      setError('Failed to start GitHub App installation.');
      setSaving(false);
    }
  };

  const handleContinue = async () => {
    if (!githubStatus?.appInstalled) {
      setError('GitHub App is not yet installed.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const bootstrapStatus = await getBootstrapStatus();
      const result = await patchBootstrapDraft(
        {
          githubPlan: {
            owner: owner.trim(),
            ownerType,
            repo: repo.trim() || owner.trim() + '-vault',
            branch,
            visibility,
            installationId: githubStatus.installationId ?? undefined,
            appInstalled: githubStatus.appInstalled,
            verified: githubStatus.verified,
            conflictPolicy: 'block',
          },
        },
        bootstrapStatus.draft?.etag ?? '',
      );
      void navigate({ to: result.status.nextRoute });
    } catch {
      setError('Failed to save GitHub plan.');
    } finally {
      setSaving(false);
    }
  };

  const isConnected = githubStatus?.appInstalled === true;

  return (
    <PageFrame title="Connect GitHub" subtitle="Authorize the Vault GitHub App to manage your repository.">
      <SoftPanel>
        <div className="flex flex-col gap-6 p-6">
          {error ? <p role="alert" className="text-destructive">{error}</p> : null}

          {isConnected ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                GitHub App installed for <strong>{githubStatus?.owner}</strong>.
                {githubStatus?.permissionsOk
                  ? ' Permissions verified.'
                  : ' Permissions pending verification.'}
              </p>
              <div className="flex flex-col gap-3">
                <Input
                  aria-label="Repository name"
                  placeholder="my-vault"
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                />
                <Input
                  aria-label="Default branch"
                  placeholder="main"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                />
                <select
                  aria-label="Visibility"
                  className="border rounded px-3 py-2 text-sm"
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as typeof visibility)}
                >
                  <option value="private">Private</option>
                  <option value="internal">Internal</option>
                  <option value="public">Public</option>
                </select>
              </div>
              <PrimaryButton onClick={handleContinue} disabled={saving || loading || !isConnected}>
                {saving ? 'Saving…' : 'Continue'}
              </PrimaryButton>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Install the Vault GitHub App on your account or organization to allow Vault Genesis to create and manage your repository.
              </p>
              <Input
                aria-label="GitHub owner"
                placeholder="your-username or org-name"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
              />
              <select
                aria-label="Owner type"
                className="border rounded px-3 py-2 text-sm"
                value={ownerType}
                onChange={(e) => setOwnerType(e.target.value as typeof ownerType)}
              >
                <option value="user">Personal account</option>
                <option value="organization">Organization</option>
              </select>
              <PrimaryButton onClick={handleInstall} disabled={saving || loading || !owner.trim()}>
                {saving ? 'Redirecting…' : 'Install GitHub App'}
              </PrimaryButton>
            </div>
          )}
        </div>
      </SoftPanel>
    </PageFrame>
  );
}
