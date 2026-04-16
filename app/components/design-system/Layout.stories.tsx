import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { GENIE_CSS, GDS_WRAPPER_STYLE, useGenieFonts } from './_genie-css';

function LayoutSection() {
  useGenieFonts();
  return (
    <div className="gds-root" style={GDS_WRAPPER_STYLE}>
      <style dangerouslySetInnerHTML={{ __html: GENIE_CSS }} />
      <section className="section" id="layout">
        <div className="section-header">
          <span className="section-number">13</span>
          <h2 className="section-title">
            Layout <em>Model</em>
          </h2>
          <p className="section-desc">
            Three-zone model: nav rail · primary workspace · context panel.
            Canvas-first, not page-first.
          </p>
        </div>
        <div className="layout-diagram">
          <div className="layout-zone" style={{ alignItems: 'center' }}>
            <div className="layout-zone-label">Nav Rail</div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: 'rgba(184,255,216,0.4)',
                }}
              />
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: 'var(--n-150)',
                }}
              />
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: 'var(--n-150)',
                }}
              />
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: 'var(--n-150)',
                }}
              />
            </div>
          </div>
          <div className="layout-zone">
            <div className="layout-zone-label h">Primary Workspace</div>
            <div className="layout-zone-mock">
              <div className="layout-mock-bar" style={{ width: '70%' }} />
              <div className="layout-mock-card" />
              <div className="layout-mock-card" />
            </div>
          </div>
          <div className="layout-zone">
            <div className="layout-zone-label h">Context Panel</div>
            <div className="layout-zone-mock">
              <div className="layout-mock-bar" style={{ width: '90%' }} />
              <div className="layout-mock-card" style={{ height: 48 }} />
              <div className="layout-mock-card" style={{ height: 48 }} />
              <div className="layout-mock-card" style={{ height: 48 }} />
            </div>
          </div>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3,1fr)',
            gap: 8,
          }}
        >
          {[
            { label: 'Nav Rail', spec: '72px · fixed · icon + tooltip' },
            { label: 'Workspace', spec: 'minmax(720px, 1fr) · scrollable' },
            {
              label: 'Context Panel',
              spec: '320px · collapsible · sticky',
            },
          ].map((z) => (
            <div
              key={z.label}
              style={{
                padding: '12px 14px',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.6)',
                border: '1px solid var(--border-default)',
              }}
            >
              <div
                style={{
                  fontFamily: "'Geist Mono', monospace",
                  fontSize: 10,
                  color: 'var(--text-tertiary)',
                  marginBottom: 4,
                }}
              >
                {z.label}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {z.spec}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const meta: Meta<typeof LayoutSection> = {
  title: 'UI / Tokens / Layout',
  component: LayoutSection,
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    actions: { disable: true },
  },
};

export default meta;
type Story = StoryObj<typeof LayoutSection>;

export const Default: Story = {};
