import React from 'react';

import { GlassBadge, GlassButton } from '@vault/ui/atoms';
import { GlassCard } from '@vault/ui/molecules';
import { useConfigAdmin } from '../../../src/hooks/useConfigAdmin';

const CREDENTIAL_FIELDS = [
  { key: 'OLLAMA_API_KEY', label: 'Ollama API key' },
  { key: 'PROVIDER_TOKEN_OPENAI', label: 'OpenAI provider token' },
  { key: 'PROVIDER_TOKEN_ANTHROPIC', label: 'Anthropic provider token' },
  { key: 'PROVIDER_TOKEN_MISTRAL', label: 'Mistral provider token' },
  { key: 'PROVIDER_TOKEN_OLLAMA_CLOUD', label: 'Ollama Cloud provider token' },
  { key: 'ALADDIN_OPENAI_API_KEY', label: 'Aladdin OpenAI API key' },
  { key: 'ALADDIN_MISTRAL_API_KEY', label: 'Aladdin Mistral API key' },
  { key: 'ALADDIN_ANTHROPIC_API_KEY', label: 'Aladdin Anthropic API key' },
] as const;

const LLM_KEYS = new Set(['LLM_PROVIDER', 'LLM_MODEL']);
const KNOWN_CREDENTIAL_KEYS = new Set(CREDENTIAL_FIELDS.map(({ key }) => key));

type CredentialKey = (typeof CREDENTIAL_FIELDS)[number]['key'];

function emptyCredentials(): Record<CredentialKey, string> {
  return Object.fromEntries(CREDENTIAL_FIELDS.map(({ key }) => [key, ''])) as Record<
    CredentialKey,
    string
  >;
}

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
    credentials: emptyCredentials(),
  });
  const touchedLlmFields = React.useRef({ provider: false, model: false });

  React.useEffect(() => {
    const fields = admin.snapshot?.fields ?? [];
    const valueFor = (key: string) => {
      const field = fields.find((candidate) => candidate.key === key);
      return field && !field.secret ? field.value : undefined;
    };
    setPrimaryConfig((current) => ({
      provider: touchedLlmFields.current.provider
        ? current.provider
        : String(valueFor('LLM_PROVIDER') ?? ''),
      model: touchedLlmFields.current.model
        ? current.model
        : String(valueFor('LLM_MODEL') ?? ''),
      baseUrl: current.baseUrl || String(valueFor('OLLAMA_BASE_URL') ?? ''),
      chatModel:
        current.chatModel || String(valueFor('OLLAMA_CHAT_MODEL') ?? ''),
      credentials: current.credentials,
    }));
  }, [admin.snapshot]);

  const primaryImpactNotes = React.useMemo(() => {
    const fields = admin.snapshot?.fields ?? [];
    return [...new Set(
      fields
        .filter((field) => field.key && LLM_KEYS.has(field.key))
        .map((field) => field.impact?.note)
        .filter((note): note is string => Boolean(note))
    )];
  }, [admin.snapshot]);

  const displaySnapshot = React.useMemo(
    () => redactSnapshot(admin.snapshot),
    [admin.snapshot]
  );

  const primaryRequest = React.useCallback(() => {
    const changes: Record<string, string> = {};
    for (const [key, value, touched] of [
      ['LLM_PROVIDER', primaryConfig.provider, touchedLlmFields.current.provider],
      ['LLM_MODEL', primaryConfig.model, touchedLlmFields.current.model],
    ] as const) {
      if (touched && value.trim()) changes[key] = value;
    }
    for (const [key, value] of [
      ['OLLAMA_BASE_URL', primaryConfig.baseUrl],
      ['OLLAMA_CHAT_MODEL', primaryConfig.chatModel],
    ]) {
      if (value.trim()) changes[key] = value;
    }
    for (const { key } of CREDENTIAL_FIELDS) {
      const value = primaryConfig.credentials[key];
      if (value.trim()) changes[key] = value;
    }

    return { target: '.env', changes };
  }, [primaryConfig]);

  const runPrimaryPreview = React.useCallback(async () => {
    await admin.previewMutation(primaryRequest());
  }, [admin, primaryRequest]);

  const runPrimaryApply = React.useCallback(async () => {
    await admin.applyMutation(primaryRequest());
    setPrimaryConfig((current) => ({ ...current, credentials: emptyCredentials() }));
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
          {primaryImpactNotes.length > 0 && (
            <ul className="mb-3 space-y-1 text-xs text-[var(--text-secondary)]">
              {primaryImpactNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <ConfigField
              label="Provider"
              value={primaryConfig.provider}
              onChange={(provider) => {
                touchedLlmFields.current.provider = true;
                setPrimaryConfig((current) => ({ ...current, provider }));
              }}
              placeholder="ollama-cloud"
            />
            <ConfigField
              label="Model"
              value={primaryConfig.model}
              onChange={(model) => {
                touchedLlmFields.current.model = true;
                setPrimaryConfig((current) => ({ ...current, model }));
              }}
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
            {CREDENTIAL_FIELDS.map(({ key, label }) => (
              <ConfigField
                key={key}
                label={label}
                type="password"
                value={primaryConfig.credentials[key]}
                onChange={(value) =>
                  setPrimaryConfig((current) => ({
                    ...current,
                    credentials: { ...current.credentials, [key]: value },
                  }))
                }
                placeholder="Leave blank to keep existing key"
              />
            ))}
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
            <pre
              tabIndex={0}
              className="overflow-auto rounded-xl bg-black/5 p-3 text-xs text-[var(--text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              {JSON.stringify(displaySnapshot, null, 2)}
            </pre>
          </PanelBox>

          <PanelBox title="Preview / Result">
            <pre
              tabIndex={0}
              className="overflow-auto rounded-xl bg-black/5 p-3 text-xs text-[var(--text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
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
          <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-[var(--text-danger)]">
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

function redactSnapshot(snapshot: ReturnType<typeof useConfigAdmin>['snapshot']) {
  if (!snapshot) return snapshot;

  const secretKeys = new Set([
    ...KNOWN_CREDENTIAL_KEYS,
    ...(snapshot.fields ?? [])
      .filter((field) => field.secret && field.key)
      .map((field) => field.key as string),
  ]);
  const fields = snapshot.fields?.map((field) =>
    field.secret || (field.key && secretKeys.has(field.key))
      ? { ...field, value: '[REDACTED]' }
      : field
  );

  return redactValues({ ...snapshot, fields }, secretKeys);
}

function redactValues(value: unknown, secretKeys: Set<string>): unknown {
  if (Array.isArray(value)) return value.map((entry) => redactValues(entry, secretKeys));
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
      key,
      secretKeys.has(key) ? '[REDACTED]' : redactValues(entry, secretKeys),
    ])
  );
}
