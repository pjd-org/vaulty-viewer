import React from 'react';

import { GlassBadge, GlassButton } from '@vault/ui/atoms';
import { GlassCard } from '@vault/ui/molecules';
import { useConfigAdmin } from '../../../src/hooks/useConfigAdmin';

const DEFAULT_REQUEST = JSON.stringify(
  {
    target: '.env',
    changes: {
      LOG_LEVEL: 'debug',
    },
  },
  null,
  2
);

export function ConfigAdminPanel() {
  const admin = useConfigAdmin();
  const [requestText, setRequestText] = React.useState(DEFAULT_REQUEST);
  const [primaryConfig, setPrimaryConfig] = React.useState({
    provider: '',
    model: '',
    baseUrl: '',
    chatModel: '',
    apiKey: '',
  });

  React.useEffect(() => {
    const fields = admin.snapshot?.fields ?? [];
    const valueFor = (key: string) =>
      fields.find((field) => field.key === key)?.value;
    setPrimaryConfig((current) => ({
      provider: current.provider || String(valueFor('LLM_PROVIDER') ?? ''),
      model: current.model || String(valueFor('LLM_MODEL') ?? ''),
      baseUrl: current.baseUrl || String(valueFor('OLLAMA_BASE_URL') ?? ''),
      chatModel:
        current.chatModel || String(valueFor('OLLAMA_CHAT_MODEL') ?? ''),
      apiKey: current.apiKey,
    }));
  }, [admin.snapshot]);

  const primaryRequest = React.useCallback(
    () => ({
      target: '.env',
      changes: {
        LLM_PROVIDER: primaryConfig.provider,
        LLM_MODEL: primaryConfig.model,
        OLLAMA_BASE_URL: primaryConfig.baseUrl,
        OLLAMA_CHAT_MODEL: primaryConfig.chatModel,
        ...(primaryConfig.apiKey.trim()
          ? { OLLAMA_API_KEY: primaryConfig.apiKey }
          : {}),
      },
    }),
    [primaryConfig]
  );

  const runPrimaryPreview = React.useCallback(async () => {
    await admin.previewMutation(primaryRequest());
  }, [admin, primaryRequest]);

  const runPrimaryApply = React.useCallback(async () => {
    await admin.applyMutation(primaryRequest());
    setPrimaryConfig((current) => ({ ...current, apiKey: '' }));
  }, [admin, primaryRequest]);
  const statusTone =
    admin.status?.status === 'ok'
      ? 'mint'
      : admin.status?.status === 'degraded'
        ? 'sun'
        : !admin.status
          ? 'aqua'

          : 'neutral';

  const runPreview = React.useCallback(async () => {
    const parsed = JSON.parse(requestText) as {
      target: string;
      changes: Record<string, string | number | boolean | null>;
    };
    await admin.previewMutation(parsed);
  }, [admin, requestText]);

  const runApply = React.useCallback(async () => {
    const parsed = JSON.parse(requestText) as {
      target: string;
      changes: Record<string, string | number | boolean | null>;
    };
    await admin.applyMutation(parsed);
  }, [admin, requestText]);

  return (
    <GlassCard
      glow={false}
      className="overflow-hidden border-[var(--border-glass-soft)] bg-[var(--surf-utility)] p-4"
    >
      <div className="flex flex-col gap-4">
        <PanelBox title="Primary LLM">
          <p className="mb-3 text-xs text-[var(--text-secondary)]">
            Updates the root environment used by Tensura. API keys are write-only.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <ConfigField
              label="Provider"
              value={primaryConfig.provider}
              onChange={(provider) =>
                setPrimaryConfig((current) => ({ ...current, provider }))
              }
              placeholder="ollama-cloud"
            />
            <ConfigField
              label="Model"
              value={primaryConfig.model}
              onChange={(model) =>
                setPrimaryConfig((current) => ({ ...current, model }))
              }
              placeholder="glm-5.2:cloud"
            />
            <ConfigField
              label="Ollama base URL"
              value={primaryConfig.baseUrl}
              onChange={(baseUrl) =>
                setPrimaryConfig((current) => ({ ...current, baseUrl }))
              }
              placeholder="https://ollama.com/api"
            />
            <ConfigField
              label="Ollama chat model"
              value={primaryConfig.chatModel}
              onChange={(chatModel) =>
                setPrimaryConfig((current) => ({ ...current, chatModel }))
              }
              placeholder="glm-5.2:cloud"
            />
            <ConfigField
              label="Ollama API key"
              type="password"
              value={primaryConfig.apiKey}
              onChange={(apiKey) =>
                setPrimaryConfig((current) => ({ ...current, apiKey }))
              }
              placeholder="Leave blank to keep existing key"
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <GlassButton type="button" tone="sky" onClick={() => void runPrimaryPreview()}>
              Preview LLM update
            </GlassButton>
            <GlassButton type="button" tone="mint" onClick={() => void runPrimaryApply()}>
              Apply LLM update
            </GlassButton>
          </div>
        </PanelBox>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
            Config Admin
            </h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Viewer {'->'} API bridge {'->'} private config surface.
            </p>
          </div>
          <GlassBadge tone={statusTone} size="sm">
            {admin.status?.status ?? 'loading'}
          </GlassBadge>
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          <Stat label="Status" value={admin.status?.status ?? 'loading'} />
          <Stat label="Targets" value={String(admin.status?.summary.targetCount ?? 0)} />
          <Stat label="Editable" value={String(admin.status?.summary.editableFields ?? 0)} />
          <Stat label="Secrets" value={String(admin.status?.summary.secretFields ?? 0)} />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <PanelBox title="Snapshot">
            <pre className="overflow-auto rounded-xl bg-black/5 p-3 text-xs text-[var(--text-secondary)]">
              {JSON.stringify(admin.snapshot, null, 2)}
            </pre>
          </PanelBox>

          <PanelBox title="Preview / Result">
            <pre className="overflow-auto rounded-xl bg-black/5 p-3 text-xs text-[var(--text-secondary)]">

              {JSON.stringify(admin.preview ?? admin.applyResult, null, 2)}
            </pre>
          </PanelBox>
        </div>

        <PanelBox title="Mutation payload">
          <textarea
            aria-label="Config mutation payload"
            value={requestText}
            onChange={(event) => setRequestText(event.target.value)}
            rows={10}
            className="min-h-[200px] w-full rounded-xl border border-border bg-background p-3 font-mono text-xs"
          />
        </PanelBox>

        <div className="flex flex-wrap gap-2">
          <GlassButton
            type="button"
            tone="neutral"
            onClick={() => void admin.refresh()}
          >
            Refresh
          </GlassButton>
          <GlassButton
            type="button"
            tone="sky"
            onClick={() => void runPreview()}
          >
            Preview
          </GlassButton>
          <GlassButton
            type="button"
            tone="mint"
            onClick={() => void runApply()}
          >
            Apply
          </GlassButton>
          <GlassButton
            type="button"
            tone="rose"
            onClick={() => void admin.regenerate()}
          >
            Regenerate
          </GlassButton>
        </div>

        {admin.error && (
          <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {admin.error}
          </p>
        )}
      </div>
    </GlassCard>
  );
}
function ConfigField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: React.HTMLInputTypeAttribute;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-[var(--text-secondary)]">
      <span className="font-semibold uppercase tracking-[0.14em]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground"
      />
    </label>
  );
}

function PanelBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[18px] border border-[var(--border-glass-soft)] bg-[color-mix(in_srgb,var(--surf-elevated)_85%,transparent)] p-4">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
        {title}
      </h4>
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-[var(--border-glass-soft)] bg-[color-mix(in_srgb,var(--surf-elevated)_85%,transparent)] p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--text-tertiary)]">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{value}</p>
    </div>
  );
}
