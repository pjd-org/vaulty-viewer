import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { GENIE_CSS, GDS_WRAPPER_STYLE, useGenieFonts } from '../_genie-css';

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
function OrganismsSection() {
  useGenieFonts();

  const sectionStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginBottom: 40,
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

      <section className="section" id="organisms">
        <div className="section-header">
          <span className="section-number">A3</span>
          <h2 className="section-title">
            Organism <em>Tokens</em>
          </h2>
          <p className="section-desc">
            Layer 3 component tokens for complex layout sections: Navbar,
            Sidebar, Modal, Table, Form.
          </p>
        </div>

        <div
          className="component-canvas"
          style={{ display: 'flex', flexDirection: 'column', gap: 48 }}
        >
          {/* ── Navbar ───────────────────────────────────────────────── */}
          <div style={sectionStyle}>
            <div style={labelStyle}>Navbar</div>
            <div
              style={{
                background: 'var(--org-nav-bg)',
                height: 'var(--org-nav-height)',
                borderBottom: '1px solid var(--org-nav-border)',
                boxShadow: 'var(--org-nav-shadow)',
                display: 'flex',
                alignItems: 'center',
                padding: '0 var(--org-nav-px)',
                gap: 24,
                borderRadius: 12,
              }}
            >
              <span
                style={{
                  color: 'var(--org-nav-fg-bright)',
                  fontWeight: 700,
                  fontSize: 15,
                  letterSpacing: '-0.01em',
                }}
              >
                ✦ Vault
              </span>
              {['Dashboard', 'Tasks', 'Notes', 'Knowledge'].map((item, i) => (
                <span
                  key={item}
                  style={{
                    fontSize: 13,
                    color:
                      i === 0 ? 'var(--org-nav-fg)' : 'var(--org-nav-fg-muted)',
                    background:
                      i === 0 ? 'var(--org-nav-link-active)' : 'transparent',
                    padding: '4px 10px',
                    borderRadius: 6,
                    cursor: 'pointer',
                  }}
                >
                  {item}
                </span>
              ))}
              <div style={{ flex: 1 }} />
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'rgba(79,140,255,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  color: 'var(--org-nav-fg)',
                }}
              >
                D
              </div>
            </div>
            <TokenRow
              tokens={[
                '--org-nav-bg',
                '--org-nav-height',
                '--org-nav-fg',
                '--org-nav-fg-muted',
                '--org-nav-fg-bright',
                '--org-nav-link-hover',
                '--org-nav-link-active',
                '--org-nav-border',
                '--org-nav-shadow',
                '--org-nav-px',
              ]}
            />
          </div>

          {/* ── Sidebar ──────────────────────────────────────────────── */}
          <div style={sectionStyle}>
            <div style={labelStyle}>Sidebar</div>
            <div
              style={{
                width: 'var(--org-sidebar-width)',
                background: 'var(--org-sidebar-bg)',
                borderRight: '1px solid var(--org-sidebar-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--org-sidebar-gap)',
                padding: '12px 8px',
                borderRadius: 12,
                minHeight: 220,
              }}
            >
              {[
                { icon: '⌂', active: true },
                { icon: '✓', active: false },
                { icon: '◎', active: false },
                { icon: '✦', active: false },
                { icon: '⚙', active: false },
              ].map(({ icon, active }, i) => (
                <div
                  key={i}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 'var(--org-sidebar-item-py) 0',
                    borderRadius: 'var(--org-sidebar-radius)',
                    background: active
                      ? 'var(--org-sidebar-active-bg)'
                      : 'transparent',
                    color: active
                      ? 'var(--org-sidebar-icon-active)'
                      : 'var(--org-sidebar-icon)',
                    fontSize: 16,
                    cursor: 'pointer',
                  }}
                >
                  {icon}
                </div>
              ))}
            </div>
            <TokenRow
              tokens={[
                '--org-sidebar-width',
                '--org-sidebar-bg',
                '--org-sidebar-border',
                '--org-sidebar-icon',
                '--org-sidebar-icon-active',
                '--org-sidebar-active-bg',
                '--org-sidebar-radius',
                '--org-sidebar-item-py',
                '--org-sidebar-gap',
              ]}
            />
          </div>

          {/* ── Modal ────────────────────────────────────────────────── */}
          <div style={sectionStyle}>
            <div style={labelStyle}>Modal / Dialog</div>
            <div
              style={{
                position: 'relative',
                borderRadius: 16,
                overflow: 'hidden',
                maxWidth: 480,
              }}
            >
              {/* Overlay strip */}
              <div
                style={{
                  background: 'var(--org-modal-overlay)',
                  height: 48,
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: 16,
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.6)',
                }}
              >
                ← overlay:{' '}
                <code style={{ fontSize: 10, marginLeft: 4 }}>
                  --org-modal-overlay
                </code>
              </div>
              <div
                style={{
                  background: 'var(--org-modal-bg)',
                  border: '1px solid var(--org-modal-border)',
                  borderRadius: 'var(--org-modal-radius)',
                  boxShadow: 'var(--org-modal-shadow)',
                  padding: 'var(--org-modal-padding)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--org-modal-gap)',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: 'var(--org-modal-fg)',
                      marginBottom: 4,
                    }}
                  >
                    Confirm action
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: 'var(--text-secondary)',
                      lineHeight: 1.6,
                    }}
                  >
                    This will permanently archive the note. You can restore it
                    from the archive within 30 days.
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: 10,
                    justifyContent: 'flex-end',
                  }}
                >
                  <button
                    type="button"
                    style={{
                      background: 'var(--atom-btn-secondary-bg)',
                      color: 'var(--atom-btn-secondary-fg)',
                      border: '1px solid var(--atom-btn-secondary-border)',
                      borderRadius: 'var(--atom-btn-radius)',
                      padding: '8px 18px',
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    style={{
                      background: 'var(--atom-btn-danger-bg)',
                      color: 'var(--atom-btn-danger-fg)',
                      border: 'none',
                      borderRadius: 'var(--atom-btn-radius)',
                      padding: '8px 18px',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Archive
                  </button>
                </div>
              </div>
            </div>
            <TokenRow
              tokens={[
                '--org-modal-overlay',
                '--org-modal-bg',
                '--org-modal-fg',
                '--org-modal-border',
                '--org-modal-radius',
                '--org-modal-shadow',
                '--org-modal-padding',
                '--org-modal-gap',
                '--org-modal-max-width',
                '--org-modal-backdrop-blur',
              ]}
            />
          </div>

          {/* ── Table ────────────────────────────────────────────────── */}
          <div style={sectionStyle}>
            <div style={labelStyle}>Table</div>
            <div
              style={{
                border: '1px solid var(--org-table-border)',
                borderRadius: 'var(--org-table-radius)',
                overflow: 'hidden',
                fontSize: 'var(--org-table-font-size)',
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr',
                  background: 'var(--org-table-header-bg)',
                  color: 'var(--org-table-header-fg)',
                  fontWeight:
                    'var(--org-table-header-font-weight)' as React.CSSProperties['fontWeight'],
                  fontSize: 'var(--org-table-header-font-size)',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  borderBottom: '1px solid var(--org-table-border)',
                }}
              >
                {['Task', 'Status', 'Priority', 'Due'].map((col) => (
                  <div
                    key={col}
                    style={{
                      padding:
                        'var(--org-table-cell-py) var(--org-table-cell-px)',
                    }}
                  >
                    {col}
                  </div>
                ))}
              </div>
              {/* Rows */}
              {[
                {
                  task: 'Finalize token spec',
                  status: 'In progress',
                  priority: 'High',
                  due: 'Today',
                },
                {
                  task: 'Write Atoms story',
                  status: 'Done',
                  priority: 'Med',
                  due: 'Yesterday',
                },
                {
                  task: 'Review organisms',
                  status: 'Backlog',
                  priority: 'Low',
                  due: 'Fri',
                },
              ].map((row, i) => (
                <div
                  key={row.task}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr',
                    background:
                      i === 0
                        ? 'var(--org-table-row-hover-bg)'
                        : 'var(--org-table-row-bg)',
                    color: 'var(--org-table-row-fg)',
                    borderBottom:
                      i < 2 ? '1px solid var(--org-table-border)' : 'none',
                  }}
                >
                  {[row.task, row.status, row.priority, row.due].map(
                    (cell, j) => (
                      <div
                        key={j}
                        style={{
                          padding:
                            'var(--org-table-cell-py) var(--org-table-cell-px)',
                        }}
                      >
                        {cell}
                      </div>
                    )
                  )}
                </div>
              ))}
            </div>
            <TokenRow
              tokens={[
                '--org-table-header-bg',
                '--org-table-header-fg',
                '--org-table-header-font-weight',
                '--org-table-header-font-size',
                '--org-table-row-bg',
                '--org-table-row-hover-bg',
                '--org-table-row-fg',
                '--org-table-border',
                '--org-table-cell-px',
                '--org-table-cell-py',
                '--org-table-font-size',
                '--org-table-radius',
              ]}
            />
          </div>

          {/* ── Form ─────────────────────────────────────────────────── */}
          <div style={sectionStyle}>
            <div style={labelStyle}>Form (full layout)</div>
            <div
              style={{
                background: 'var(--org-form-bg)',
                borderRadius: 'var(--org-form-radius)',
                boxShadow: 'var(--org-form-shadow)',
                padding: 'var(--org-form-padding)',
                maxWidth: 'var(--org-form-max-width)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--org-form-gap)',
              }}
            >
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                }}
              >
                New task
              </div>
              {(['Title', 'Description'] as const).map((field) => (
                <div
                  key={field}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--org-form-section-gap)',
                  }}
                >
                  <label
                    style={{
                      fontSize: 'var(--mol-field-label-font-size)',
                      color: 'var(--mol-field-label-fg)',
                      fontWeight: 500,
                    }}
                  >
                    {field}
                  </label>
                  <input
                    placeholder={`Enter ${field.toLowerCase()}…`}
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
                </div>
              ))}
              <div
                style={{
                  display: 'flex',
                  gap: 'var(--org-form-footer-gap)',
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  type="button"
                  style={{
                    background: 'var(--atom-btn-secondary-bg)',
                    color: 'var(--atom-btn-secondary-fg)',
                    border: '1px solid var(--atom-btn-secondary-border)',
                    borderRadius: 'var(--atom-btn-radius)',
                    padding: '8px 18px',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  style={{
                    background: 'var(--atom-btn-bg)',
                    color: 'var(--atom-btn-fg)',
                    border: 'none',
                    borderRadius: 'var(--atom-btn-radius)',
                    padding: '8px 18px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Create task
                </button>
              </div>
            </div>
            <TokenRow
              tokens={[
                '--org-form-gap',
                '--org-form-section-gap',
                '--org-form-max-width',
                '--org-form-bg',
                '--org-form-padding',
                '--org-form-radius',
                '--org-form-shadow',
                '--org-form-footer-gap',
              ]}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

const meta: Meta<typeof OrganismsSection> = {
  title: 'UI / Atomic / Organisms',
  component: OrganismsSection,
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    actions: { disable: true },
  },
};

export default meta;
type Story = StoryObj<typeof OrganismsSection>;

export const Default: Story = {};
