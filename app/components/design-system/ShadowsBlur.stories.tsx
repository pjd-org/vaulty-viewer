import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { GENIE_CSS, GDS_WRAPPER_STYLE, useGenieFonts } from './_genie-css';

function ShadowsBlurSection() {
  useGenieFonts();
  return (
    <div className="gds-root" style={GDS_WRAPPER_STYLE}>
      <style dangerouslySetInnerHTML={{ __html: GENIE_CSS }} />
      <section className="section" id="shadow">
        <div className="section-header">
          <span className="section-number">07</span>
          <h2 className="section-title">
            Shadows &amp; <em>Blur</em>
          </h2>
          <p className="section-desc">
            Low-saturation shadows only. Blur is decorative, not informational —
            never hide content behind blur.
          </p>
        </div>
        <div className="shadow-grid">
          {[
            {
              token: 'shadow-xs',
              shadow: 'var(--shadow-xs)',
              sub: '2px 8px · 0.04',
              pillBg: undefined,
            },
            {
              token: 'shadow-sm',
              shadow: 'var(--shadow-sm)',
              sub: '8px 20px · 0.06',
              pillBg: undefined,
            },
            {
              token: 'shadow-md',
              shadow: 'var(--shadow-md)',
              sub: '16px 40px · 0.08',
              pillBg: undefined,
            },
            {
              token: 'shadow-lg',
              shadow: 'var(--shadow-lg)',
              sub: '24px 60px · 0.10',
              pillBg: undefined,
            },
            {
              token: 'shadow-glow',
              shadow: 'var(--shadow-glow)',
              sub: 'mint ring + bloom',
              pillBg: 'var(--a-mint)',
            },
          ].map((s) => (
            <div
              key={s.token}
              className="shadow-demo"
              style={{ boxShadow: s.shadow }}
            >
              <div
                className="shadow-pill"
                style={s.pillBg ? { background: s.pillBg } : undefined}
              />
              <div className="shadow-label">
                {s.token}
                <br />
                <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                  {s.sub}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="label-row" style={{ marginTop: 8 }}>
          <span className="label">Blur scale</span>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4,1fr)',
            gap: 12,
          }}
        >
          {[
            { label: 'blur-sm', px: '8px', blur: 'blur(8px)' },
            { label: 'blur-md', px: '16px', blur: 'blur(16px)' },
            { label: 'blur-lg', px: '24px', blur: 'blur(24px)' },
            { label: 'blur-xl', px: '32px', blur: 'blur(32px)' },
          ].map((b) => (
            <div
              key={b.label}
              style={{
                textAlign: 'center',
                padding: 16,
                borderRadius: 14,
                background: 'rgba(255,255,255,0.4)',
                border: '1px solid var(--border-default)',
                backdropFilter: b.blur,
                WebkitBackdropFilter: b.blur,
              }}
            >
              <div
                style={{
                  fontFamily: "'Geist Mono', monospace",
                  fontSize: 11,
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                }}
              >
                {b.label}
              </div>
              <div
                style={{
                  fontFamily: "'Geist Mono', monospace",
                  fontSize: 10,
                  color: 'var(--text-tertiary)',
                }}
              >
                {b.px}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const meta: Meta<typeof ShadowsBlurSection> = {
  title: 'UI / Tokens / Shadows & Blur',
  component: ShadowsBlurSection,
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    actions: { disable: true },
  },
};

export default meta;
type Story = StoryObj<typeof ShadowsBlurSection>;

export const Default: Story = {};
