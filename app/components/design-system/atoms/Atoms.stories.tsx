import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { GENIE_CSS, GDS_WRAPPER_STYLE, useGenieFonts } from '../_genie-css';
import { Button, Badge, Label } from '@vault/ui/atoms';
import { Input } from '@/app/components/ui/input';
import { SuggestionChip } from '@vault/ui/molecules';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';

/* ── Token callout helper ──────────────────────────────────────────────── */
function TokenTag({ name }: { name: string }) {
  return (
    <code
      style={{
        fontSize: 10,
        fontFamily: 'monospace',
        color: 'var(--text-tertiary)',
        background: 'rgba(0,0,0,0.04)',
        borderRadius: 4,
        padding: '2px 6px',
        letterSpacing: '0.01em',
      }}
    >
      {name}
    </code>
  );
}

function TokenRow({ tokens }: { tokens: string[] }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
      {tokens.map((t) => (
        <TokenTag key={t} name={t} />
      ))}
    </div>
  );
}

/* ── Story component ───────────────────────────────────────────────────── */
function AtomsSection() {
  useGenieFonts();

  const sectionStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginBottom: 32,
  };

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--text-tertiary)',
    marginBottom: 4,
  };

  return (
    <div className="gds-root" style={GDS_WRAPPER_STYLE}>
      <style dangerouslySetInnerHTML={{ __html: GENIE_CSS }} />

      <section className="section" id="atoms">
        <div className="section-header">
          <span className="section-number">A1</span>
          <h2 className="section-title">
            Atomic <em>Tokens</em>
          </h2>
          <p className="section-desc">
            Layer 3 component tokens for indivisible UI primitives. Every token
            references Layer 1 (Genie primitives) or Layer 2 (Vault semantics).
          </p>
        </div>

        <div
          className="component-canvas"
          style={{ display: 'flex', flexDirection: 'column', gap: 40 }}
        >
          {/* ── Button ─────────────────────────────────────────────────── */}
          <div style={sectionStyle}>
            <div style={labelStyle}>Button</div>
            <div style={rowStyle}>
              <Button
                unstyled
                style={{
                  background: 'var(--atom-btn-bg)',
                  color: 'var(--atom-btn-fg)',
                  borderRadius: 'var(--atom-btn-radius)',
                  padding: 'var(--atom-btn-py) var(--atom-btn-px)',
                  fontSize: 'var(--atom-btn-font-size)',
                  fontWeight:
                    'var(--atom-btn-font-weight)' as React.CSSProperties['fontWeight'],
                  boxShadow: 'var(--atom-btn-shadow)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'var(--atom-btn-transition)',
                }}
              >
                Primary
              </Button>
              <Button
                unstyled
                style={{
                  background: 'var(--atom-btn-secondary-bg)',
                  color: 'var(--atom-btn-secondary-fg)',
                  border: '1px solid var(--atom-btn-secondary-border)',
                  borderRadius: 'var(--atom-btn-radius)',
                  padding: 'var(--atom-btn-py) var(--atom-btn-px)',
                  fontSize: 'var(--atom-btn-font-size)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Secondary
              </Button>
              <Button
                unstyled
                style={{
                  background: 'var(--atom-btn-ghost-bg)',
                  color: 'var(--atom-btn-ghost-fg)',
                  border: 'none',
                  borderRadius: 'var(--atom-btn-radius)',
                  padding: 'var(--atom-btn-py) var(--atom-btn-px)',
                  fontSize: 'var(--atom-btn-font-size)',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Ghost
              </Button>
              <Button
                unstyled
                style={{
                  background: 'var(--atom-btn-danger-bg)',
                  color: 'var(--atom-btn-danger-fg)',
                  borderRadius: 'var(--atom-btn-radius)',
                  padding: 'var(--atom-btn-py) var(--atom-btn-px)',
                  fontSize: 'var(--atom-btn-font-size)',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Danger
              </Button>
            </div>
            <TokenRow
              tokens={[
                '--atom-btn-bg',
                '--atom-btn-fg',
                '--atom-btn-hover-bg',
                '--atom-btn-secondary-bg',
                '--atom-btn-ghost-bg',
                '--atom-btn-danger-bg',
                '--atom-btn-radius',
                '--atom-btn-px',
                '--atom-btn-py',
                '--atom-btn-font-size',
                '--atom-btn-font-weight',
                '--atom-btn-shadow',
              ]}
            />
          </div>

          {/* ── Badge ──────────────────────────────────────────────────── */}
          <div style={sectionStyle}>
            <div style={labelStyle}>Badge</div>
            <div style={rowStyle}>
              {(
                [
                  {
                    label: 'Default',
                    bg: 'var(--atom-badge-bg)',
                    fg: 'var(--atom-badge-fg)',
                  },
                  {
                    label: 'Success',
                    bg: 'var(--atom-badge-success-bg)',
                    fg: 'var(--atom-badge-fg)',
                  },
                  {
                    label: 'Warning',
                    bg: 'var(--atom-badge-warning-bg)',
                    fg: 'var(--atom-badge-fg)',
                  },
                  {
                    label: 'Danger',
                    bg: 'var(--atom-badge-danger-bg)',
                    fg: 'var(--atom-badge-fg)',
                  },
                ] as const
              ).map(({ label, bg, fg }) => (
                <Badge
                  key={label}
                  style={{
                    background: bg,
                    color: fg,
                    borderRadius: 'var(--atom-badge-radius)',
                    padding: 'var(--atom-badge-py) var(--atom-badge-px)',
                    fontSize: 'var(--atom-badge-font-size)',
                    fontWeight:
                      'var(--atom-badge-font-weight)' as React.CSSProperties['fontWeight'],
                  }}
                >
                  {label}
                </Badge>
              ))}
            </div>
            <TokenRow
              tokens={[
                '--atom-badge-bg',
                '--atom-badge-fg',
                '--atom-badge-success-bg',
                '--atom-badge-warning-bg',
                '--atom-badge-danger-bg',
                '--atom-badge-radius',
                '--atom-badge-px',
                '--atom-badge-py',
                '--atom-badge-font-size',
              ]}
            />
          </div>

          {/* ── Input ──────────────────────────────────────────────────── */}
          <div style={sectionStyle}>
            <div style={labelStyle}>Input</div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                maxWidth: 360,
              }}
            >
              <Input
                placeholder="Default input…"
                style={{
                  background: 'var(--atom-input-bg)',
                  color: 'var(--atom-input-fg)',
                  border: '1px solid var(--atom-input-border)',
                  borderRadius: 'var(--atom-input-radius)',
                  padding: '0 var(--atom-input-px)',
                  height: 'var(--atom-input-height)',
                  fontSize: 'var(--atom-input-font-size)',
                  outline: 'none',
                  width: '100%',
                }}
              />
              <Input
                placeholder="Error state…"
                style={{
                  background: 'var(--atom-input-bg)',
                  color: 'var(--atom-input-fg)',
                  border: '1.5px solid var(--atom-input-error-border)',
                  borderRadius: 'var(--atom-input-radius)',
                  padding: '0 var(--atom-input-px)',
                  height: 'var(--atom-input-height)',
                  fontSize: 'var(--atom-input-font-size)',
                  outline: 'none',
                  width: '100%',
                }}
              />
              <Input
                placeholder="Disabled…"
                disabled
                style={{
                  background: 'var(--atom-input-disabled-bg)',
                  color: 'var(--atom-input-disabled-fg)',
                  border: '1px solid var(--atom-input-border)',
                  borderRadius: 'var(--atom-input-radius)',
                  padding: '0 var(--atom-input-px)',
                  height: 'var(--atom-input-height)',
                  fontSize: 'var(--atom-input-font-size)',
                  outline: 'none',
                  width: '100%',
                  cursor: 'not-allowed',
                  opacity: 0.6,
                }}
              />
            </div>
            <TokenRow
              tokens={[
                '--atom-input-bg',
                '--atom-input-fg',
                '--atom-input-border',
                '--atom-input-focus-ring',
                '--atom-input-placeholder',
                '--atom-input-error-border',
                '--atom-input-disabled-bg',
                '--atom-input-radius',
                '--atom-input-px',
                '--atom-input-height',
                '--atom-input-font-size',
              ]}
            />
          </div>

          {/* ── Avatar ─────────────────────────────────────────────────── */}
          <div style={sectionStyle}>
            <div style={labelStyle}>Avatar</div>
            <div style={rowStyle}>
              {(
                [
                  { size: 'var(--atom-avatar-size-sm)', label: 'SM' },
                  { size: 'var(--atom-avatar-size-md)', label: 'MD' },
                  { size: 'var(--atom-avatar-size-lg)', label: 'LG' },
                ] as const
              ).map(({ size, label }) => (
                <Avatar
                  key={label}
                  style={{
                    width: size,
                    height: size,
                    borderRadius: 'var(--atom-avatar-radius)',
                    background: 'var(--atom-avatar-bg)',
                    border: '1px solid var(--atom-avatar-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  <AvatarFallback
                    style={{
                      color: 'var(--atom-avatar-fg)',
                      fontSize: 'var(--atom-avatar-font-size)',
                      fontWeight: 600,
                    }}
                  >
                    {label}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            <TokenRow
              tokens={[
                '--atom-avatar-bg',
                '--atom-avatar-fg',
                '--atom-avatar-border',
                '--atom-avatar-size-sm',
                '--atom-avatar-size-md',
                '--atom-avatar-size-lg',
                '--atom-avatar-radius',
                '--atom-avatar-font-size',
              ]}
            />
          </div>

          {/* ── Chip ───────────────────────────────────────────────────── */}
          <div style={sectionStyle}>
            <div style={labelStyle}>Chip</div>
            <div style={rowStyle}>
              <SuggestionChip
                unstyled
                style={{
                  background: 'var(--atom-chip-bg)',
                  color: 'var(--atom-chip-fg)',
                  border: '1px solid var(--atom-chip-border)',
                  borderRadius: 'var(--atom-chip-radius)',
                  padding: 'var(--atom-chip-py) var(--atom-chip-px)',
                  fontSize: 'var(--atom-chip-font-size)',
                  fontWeight:
                    'var(--atom-chip-font-weight)' as React.CSSProperties['fontWeight'],
                  cursor: 'pointer',
                }}
              >
                ✦ Default
              </SuggestionChip>
              <SuggestionChip
                unstyled
                style={{
                  background: 'var(--atom-chip-active-bg)',
                  color: 'var(--atom-chip-active-fg)',
                  border: 'none',
                  borderRadius: 'var(--atom-chip-radius)',
                  padding: 'var(--atom-chip-py) var(--atom-chip-px)',
                  fontSize: 'var(--atom-chip-font-size)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                ✦ Active
              </SuggestionChip>
            </div>
            <TokenRow
              tokens={[
                '--atom-chip-bg',
                '--atom-chip-fg',
                '--atom-chip-border',
                '--atom-chip-active-bg',
                '--atom-chip-active-fg',
                '--atom-chip-radius',
                '--atom-chip-px',
                '--atom-chip-py',
                '--atom-chip-font-size',
              ]}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

const meta: Meta<typeof AtomsSection> = {
  title: 'UI / Atomic / Atoms',
  component: AtomsSection,
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    actions: { disable: true },
  },
};

export default meta;
type Story = StoryObj<typeof AtomsSection>;

export const Default: Story = {};
