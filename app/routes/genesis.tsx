import React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { PageFrame, SoftPanel } from '../components/layout';
import { PrimaryButton } from '../components/ui';
import {
  getBootstrapGenesisJob,
  getBootstrapStatus,
  startBootstrapGenesis,
  type BootstrapStatus,
  type GenesisJob,
} from '../../src/lib/bootstrap';

export const Route = createFileRoute('/genesis')({
  component: GenesisRoute,
});

function GenesisRoute() {
  const navigate = useNavigate();
  const [status, setStatus] = React.useState<BootstrapStatus | null>(null);
  const [job, setJob] = React.useState<GenesisJob | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [starting, setStarting] = React.useState(false);
  const startedRef = React.useRef(false);
  const idempotencyKeyRef = React.useRef(cryptoRandomId());

  React.useEffect(() => {
    let mounted = true;
    getBootstrapStatus()
      .then((nextStatus) => {
        if (!mounted) return;
        setStatus(nextStatus);
        if (nextStatus.state === 'active') {
          void navigate({ to: '/' });
          return;
        }
        if (nextStatus.genesisJob) {
          setJob(nextStatus.genesisJob);
        }
      })
      .catch((nextError) => {
        if (mounted) {
          setError(nextError instanceof Error ? nextError.message : 'Failed to load genesis status.');
        }
      });
    return () => {
      mounted = false;
    };
  }, [navigate]);

  React.useEffect(() => {
    if (!job || job.status === 'succeeded' || job.status === 'failed') return;
    const timer = window.setInterval(() => {
      void getBootstrapGenesisJob(job.jobId)
        .then(setJob)
        .catch((nextError) => {
          setError(nextError instanceof Error ? nextError.message : 'Failed to poll genesis job.');
        });
    }, 250);
    return () => window.clearInterval(timer);
  }, [job]);

  React.useEffect(() => {
    if (startedRef.current) return;
    if (status?.state !== 'preflight_passed') return;
    if (!status.preflight) {
      setError('Preflight data is missing.');
      return;
    }

    startedRef.current = true;
    setStarting(true);
    setError(null);
    void startBootstrapGenesis(
      {
        reportId: status.preflight.reportId,
        planHash: status.preflight.planHash,
      },
      idempotencyKeyRef.current
    )
      .then((response) => {
        void getBootstrapGenesisJob(response.jobId).then(setJob);
      })
      .catch((nextError) => {
        setError(nextError instanceof Error ? nextError.message : 'Failed to start Genesis.');
      })
      .finally(() => {
        setStarting(false);
      });
  }, [status]);

  React.useEffect(() => {
    if (job?.status === 'succeeded') {
      void navigate({ to: '/' });
    }
    if (job?.status === 'failed') {
      setError(job.error?.detail ?? 'Genesis failed.');
    }
  }, [job, navigate]);

  const handleRetry = async () => {
    if (!status?.preflight) return;
    setError(null);
    setStarting(true);
    startedRef.current = true;
    idempotencyKeyRef.current = cryptoRandomId();
    try {
      const response = await startBootstrapGenesis(
        {
          reportId: status.preflight.reportId,
          planHash: status.preflight.planHash,
        },
        idempotencyKeyRef.current
      );
      setJob(await getBootstrapGenesisJob(response.jobId));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to retry Genesis.');
    } finally {
      setStarting(false);
    }
  };

  return (
    <PageFrame title="Genesis" subtitle="Provisioning the vault asynchronously.">
      <SoftPanel>
        <div className="flex flex-col gap-4 p-6">
          <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm">
            <p><strong>Status:</strong> {job?.status ?? status?.state ?? 'loading'}</p>
            <p><strong>Phase:</strong> {job?.phase ?? 'pending'}</p>
            <p><strong>Progress:</strong> {job ? `${job.percent}%` : '0%'}</p>
            <p><strong>Message:</strong> {job?.message ?? 'Waiting for Genesis to start.'}</p>
          </div>
          {error ? <p role="alert" className="text-destructive">{error}</p> : null}
          {job?.status === 'failed' ? (
            <PrimaryButton onClick={handleRetry} disabled={starting}>
              {starting ? 'Retrying…' : 'Retry Genesis'}
            </PrimaryButton>
          ) : null}
        </div>
      </SoftPanel>
    </PageFrame>
  );
}

function cryptoRandomId(): string {
  return `gen_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}
