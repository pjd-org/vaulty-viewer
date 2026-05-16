import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { GENIE_CSS, GDS_WRAPPER_STYLE, useGenieFonts } from '../_genie-css';
import { Card } from '@/app/components/ui/card';
import { CardBody } from '@vault/ui/molecules';
import { Label } from '@/app/components/ui';

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
function MoleculesSection() {
  useGenieFonts();

  const sectionStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginBottom: 32,
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

      <section className="section" id="molecules">
        <div className="section-header">
          <span className="section-number">A2</span>
          <h2 className="section-title">
            Molecule <em>Tokens</em>
          </h2>
          <p className="section-desc">
            Layer 3 component tokens for composed atoms: Card, FormField,
            SearchBar, Tooltip, Toast, Dropdown.
          </p>
        </div>

        <div
          className="component-canvas"
          style={{ display: 'flex', flexDirection: 'column', gap: 40 }}
        >
          {/* ── Card ─────────────────────────────────────────────────── */}
          <div style={sectionStyle}>
            <div style={labelStyle}>Card</div>
            <div
              style={{
                display: 'flex',
                gap: 16,
                flexWrap: 'wrap',
                alignItems: 'flex-start',
              }}
            >
              <Card
                style={{
                  background: 'var(--mol-card-bg)',
                  border: '1px solid var(--mol-card-border)',
                  borderRadius: 'var(--mol-card-radius)',
                  boxShadow: 'var(--mol-card-shadow)',
                  padding: 'var(--mol-card-padding)',
                  minWidth: 220,
                  maxWidth: 280,
                  transition: 'var(--mol-card-transition)',
                }}
              >
                <CardBody>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginBottom: 6,
                    }}
                  >
                    Default card
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                    }}
                  >
                    Surface backed by{' '}
                    <code style={{ fontSize: 11 }}>--mol-card-bg</code> with
                    soft border and shadow.
                  </div>
                </CardBody>
              </Card>

              <Card
                style={{
                  background: 'var(--mol-card-bg)',
                  border: '1px solid var(--mol-card-border)',
                  borderRadius: 'var(--mol-card-radius)',
                  boxShadow: 'var(--mol-card-shadow-hover)',
                  padding: 'var(--mol-card-padding-sm)',
                  minWidth: 220,
                  maxWidth: 280,
                }}
              >
                <CardBody>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginBottom: 6,
                    }}
                  >
                    Hover state
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                    }}
                  >
                    Elevated with{' '}
                    <code style={{ fontSize: 11 }}>
                      --mol-card-shadow-hover
                    </code>
                    .
                  </div>
                </CardBody>
              </Card>
            </div>
            <TokenRow
              tokens={[
                '--mol-card-bg',
                '--mol-card-border',
                '--mol-card-radius',
                '--mol-card-shadow',
                '--mol-card-shadow-hover',
                '--mol-card-padding',
                '--mol-card-padding-sm',
                '--mol-card-gap',
                '--mol-card-transition',
              ]}
            />
          </div>

          {/* ── FormField ──────────────────────────────────────────────── */}
          <div style={sectionStyle}>
            <div style={labelStyle}>FormField (Label + Input)</div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--mol-field-gap)',
                maxWidth: 320,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--mol-field-gap)',
                }}
              >
                <Label
                  htmlFor="field-demo"
                  style={{
                    fontSize: 'var(--mol-field-label-font-size)',
                    color: 'var(--mol-field-label-fg)',
                    fontWeight:
                      'var(--mol-field-label-font-weight)' as React.CSSProperties['fontWeight'],
                  }}
                >
                  Email address
                </Label>
                <Input
                  id="field-demo"
                  type="email"
                  placeholder="you@example.com"
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
                <span
                  style={{
                    fontSize: 'var(--mol-field-hint-font-size)',
                    color: 'var(--mol-field-hint-fg)',
                  }}
                >
                  Used for account notifications.
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--mol-field-gap)',
                }}
              >
                <Label
                  htmlFor="field-error"
                  style={{
                    fontSize: 'var(--mol-field-label-font-size)',
                    color: 'var(--mol-field-label-fg)',
                    fontWeight: 500,
                  }}
                >
                  Password
                </Label>
                <Input
                  id="field-error"
                  type="password"
                  placeholder="••••••••"
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
                <span
                  style={{
                    fontSize: 'var(--mol-field-error-font-size)',
                    color: 'var(--mol-field-error-fg)',
                  }}
                >
                  Must be at least 8 characters.
                </span>
              </div>
            </div>
            <TokenRow
              tokens={[
                '--mol-field-gap',
                '--mol-field-label-font-size',
                '--mol-field-label-fg',
                '--mol-field-label-font-weight',
                '--mol-field-hint-font-size',
                '--mol-field-hint-fg',
                '--mol-field-error-fg',
                '--mol-field-error-font-size',
              ]}
            />
          </div>

          {/* ── SearchBar ──────────────────────────────────────────────── */}
          <div style={sectionStyle}>
            <div style={labelStyle}>SearchBar</div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: 'var(--mol-search-bg)',
                border: '1px solid var(--mol-search-border)',
                borderRadius: 'var(--mol-search-radius)',
                height: 'var(--mol-search-height)',
                padding: '0 var(--mol-search-px)',
                maxWidth: 360,
                width: '100%',
              }}
            >
              <svg
                width={16}
                height={16}
                viewBox="0 0 16 16"
                fill="none"
                style={{ color: 'var(--mol-search-icon-color)', flexShrink: 0 }}
              >
                <circle
                  cx="7"
                  cy="7"
                  r="4.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M10.5 10.5L13 13"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              <input
                placeholder="Search notes, tasks, files…"
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: 'var(--atom-input-font-size)',
                  color: 'var(--atom-input-fg)',
                  flex: 1,
                }}
              />
            </div>
            <TokenRow
              tokens={[
                '--mol-search-bg',
                '--mol-search-border',
                '--mol-search-focus-ring',
                '--mol-search-radius',
                '--mol-search-height',
                '--mol-search-px',
                '--mol-search-icon-color',
              ]}
            />
          </div>

          {/* ── Tooltip ────────────────────────────────────────────────── */}
          <div style={sectionStyle}>
            <div style={labelStyle}>Tooltip</div>
            <div
              style={{
                display: 'inline-flex',
                background: 'var(--mol-tooltip-bg)',
                color: 'var(--mol-tooltip-fg)',
                borderRadius: 'var(--mol-tooltip-radius)',
                padding: 'var(--mol-tooltip-py) var(--mol-tooltip-px)',
                fontSize: 'var(--mol-tooltip-font-size)',
                boxShadow: 'var(--mol-tooltip-shadow)',
                maxWidth: 'var(--mol-tooltip-max-width)',
              }}
            >
              Opens the note in full-screen edit mode.
            </div>
            <TokenRow
              tokens={[
                '--mol-tooltip-bg',
                '--mol-tooltip-fg',
                '--mol-tooltip-radius',
                '--mol-tooltip-px',
                '--mol-tooltip-py',
                '--mol-tooltip-font-size',
                '--mol-tooltip-shadow',
                '--mol-tooltip-max-width',
              ]}
            />
          </div>

          {/* ── Toast ──────────────────────────────────────────────────── */}
          <div style={sectionStyle}>
            <div style={labelStyle}>Toast / Snackbar</div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                maxWidth: 360,
              }}
            >
              {(
                [
                  {
                    accent: '--mol-toast-success-accent',
                    label: '✓ Note saved successfully.',
                  },
                  {
                    accent: '--mol-toast-warning-accent',
                    label: '⚠ Connection unstable.',
                  },
                  {
                    accent: '--mol-toast-danger-accent',
                    label: '✕ Failed to save changes.',
                  },
                ] as const
              ).map(({ accent, label }) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    background: 'var(--mol-toast-bg)',
                    color: 'var(--mol-toast-fg)',
                    border: '1px solid var(--mol-toast-border)',
                    borderLeft: `3px solid var(${accent})`,
                    borderRadius: 'var(--mol-toast-radius)',
                    boxShadow: 'var(--mol-toast-shadow)',
                    padding: 'var(--mol-toast-padding)',
                    fontSize: 13,
                  }}
                >
                  {label}
                </div>
              ))}
            </div>
            <TokenRow
              tokens={[
                '--mol-toast-bg',
                '--mol-toast-fg',
                '--mol-toast-border',
                '--mol-toast-radius',
                '--mol-toast-shadow',
                '--mol-toast-padding',
                '--mol-toast-success-accent',
                '--mol-toast-warning-accent',
                '--mol-toast-danger-accent',
              ]}
            />
          </div>

          {/* ── Dropdown ───────────────────────────────────────────────── */}
          <div style={sectionStyle}>
            <div style={labelStyle}>Dropdown / Popover</div>
            <div
              style={{
                background: 'var(--mol-dropdown-bg)',
                border: '1px solid var(--mol-dropdown-border)',
                borderRadius: 'var(--mol-dropdown-radius)',
                boxShadow: 'var(--mol-dropdown-shadow)',
                width: 200,
                overflow: 'hidden',
              }}
            >
              {['Edit', 'Duplicate', 'Archive', 'Delete'].map((item, i) => (
                <div
                  key={item}
                  style={{
                    padding:
                      'var(--mol-dropdown-item-py) var(--mol-dropdown-item-px)',
                    fontSize: 'var(--mol-dropdown-item-font-size)',
                    color:
                      i === 3
                        ? 'var(--atom-btn-danger-bg)'
                        : 'var(--text-primary)',
                    background:
                      i === 0
                        ? 'var(--mol-dropdown-item-hover-bg)'
                        : 'transparent',
                    cursor: 'pointer',
                    borderBottom:
                      i < 3 ? '1px solid var(--mol-dropdown-border)' : 'none',
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
            <TokenRow
              tokens={[
                '--mol-dropdown-bg',
                '--mol-dropdown-border',
                '--mol-dropdown-radius',
                '--mol-dropdown-shadow',
                '--mol-dropdown-item-hover-bg',
                '--mol-dropdown-item-active-bg',
                '--mol-dropdown-item-px',
                '--mol-dropdown-item-py',
                '--mol-dropdown-item-font-size',
              ]}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

const meta: Meta<typeof MoleculesSection> = {
  title: 'UI / Atomic / Molecules',
  component: MoleculesSection,
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    actions: { disable: true },
  },
};

export default meta;
type Story = StoryObj<typeof MoleculesSection>;

export const Default: Story = {};
