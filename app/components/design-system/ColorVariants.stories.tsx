import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { GENIE_CSS, GDS_WRAPPER_STYLE, useGenieFonts } from './_genie-css';

function ColorVariantsSection() {
  useGenieFonts();
  return (
    <div className="gds-root" style={GDS_WRAPPER_STYLE}>
      <style dangerouslySetInnerHTML={{ __html: GENIE_CSS }} />
      <section className="section" id="color-variants">
        <div className="section-header">
          <span className="section-number">16</span>
          <h2 className="section-title">
            Color <em>Variants</em>
          </h2>
          <p className="section-desc">
            How each accent and semantic color maps to component surfaces.
            Accents are backgrounds and borders — never text fills. Text always
            uses dark neutrals or accessible semantic tones.
          </p>
        </div>

        {/* Usage rules */}
        <div
          className="glass"
          style={{ padding: 24, overflow: 'hidden', position: 'relative' }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'var(--grad-card-glow)',
              pointerEvents: 'none',
            }}
          />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="label" style={{ marginBottom: 14 }}>
              Usage rules
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))',
                gap: 10,
              }}
            >
              {[
                {
                  bg: 'rgba(184,255,216,0.2)',
                  border: 'rgba(184,255,216,0.4)',
                  title: '✓ Accent as background',
                  titleColor: 'var(--n-800)',
                  body: 'Use at 20–50% opacity on glass surfaces',
                },
                {
                  bg: 'rgba(169,215,255,0.2)',
                  border: 'rgba(169,215,255,0.4)',
                  title: '✓ Accent as border/glow',
                  titleColor: 'var(--n-800)',
                  body: 'Use at 40–70% for border-color, full for shadow glow',
                },
                {
                  bg: 'rgba(255,210,184,0.2)',
                  border: 'rgba(255,210,184,0.4)',
                  title: '✓ Accent as avatar/icon bg',
                  titleColor: 'var(--n-800)',
                  body: 'Full opacity for small avatar chips and icon containers',
                },
                {
                  bg: 'rgba(255,143,143,0.12)',
                  border: 'rgba(255,143,143,0.3)',
                  title: '✕ Never as text color',
                  titleColor: '#8c1f1f',
                  body: 'Pastels fail WCAG AA at any text size — use dark neutrals or semantic text tokens',
                },
              ].map((r) => (
                <div
                  key={r.title}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 12,
                    background: r.bg,
                    border: `1px solid ${r.border}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: r.titleColor,
                      marginBottom: 4,
                    }}
                  >
                    {r.title}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    {r.body}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Accent mapping */}
        <div className="label" style={{ marginTop: 4, marginBottom: 12 }}>
          Accent → component mapping
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))',
            gap: 10,
          }}
        >
          {[
            {
              hex: '#B8FFD8',
              bg: 'rgba(184,255,216,0.25)',
              border: 'rgba(184,255,216,0.5)',
              name: 'Mint',
              usage:
                'Accent button · Genie avatar · success-adjacent chip · progress bar fill',
            },
            {
              hex: '#D9FF8C',
              bg: 'rgba(217,255,140,0.25)',
              border: 'rgba(217,255,140,0.5)',
              name: 'Lime',
              usage:
                'Gradient accent button · brand logo bg · high-energy metric fill',
            },
            {
              hex: '#97F0FF',
              bg: 'rgba(151,240,255,0.25)',
              border: 'rgba(151,240,255,0.5)',
              name: 'Aqua',
              usage: 'Code / technical card · data chip · analytics avatar',
            },
            {
              hex: '#A9D7FF',
              bg: 'rgba(169,215,255,0.25)',
              border: 'rgba(169,215,255,0.5)',
              name: 'Sky',
              usage:
                'Focused input ring · knowledge card · info-adjacent state',
            },
            {
              hex: '#D8C7FF',
              bg: 'rgba(216,199,255,0.25)',
              border: 'rgba(216,199,255,0.5)',
              name: 'Lilac',
              usage: 'AI / creative card · imagination chip · assistant avatar',
            },
            {
              hex: '#FFD2B8',
              bg: 'rgba(255,210,184,0.25)',
              border: 'rgba(255,210,184,0.5)',
              name: 'Peach',
              usage: 'Social / food card · warm action button · welcoming chip',
            },
            {
              hex: '#FFC7DE',
              bg: 'rgba(255,199,222,0.25)',
              border: 'rgba(255,199,222,0.5)',
              name: 'Rose',
              usage:
                'Personal / favourited card · wellness chip · heart action',
            },
            {
              hex: '#FFF0A6',
              bg: 'rgba(255,240,166,0.25)',
              border: 'rgba(255,240,166,0.5)',
              name: 'Sun',
              usage: 'Featured / tip card · highlight chip · warm spotlight',
            },
          ].map((a) => (
            <div
              key={a.name}
              style={{
                padding: '14px 16px',
                borderRadius: 14,
                background: a.bg,
                border: `1px solid ${a.border}`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 6,
                    background: a.hex,
                  }}
                />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--n-800)',
                  }}
                >
                  {a.name}
                </span>
                <span
                  style={{
                    fontFamily: "'Geist Mono', monospace",
                    fontSize: 10,
                    color: 'var(--text-tertiary)',
                  }}
                >
                  {a.hex}
                </span>
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.7,
                }}
              >
                {a.usage}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const meta: Meta<typeof ColorVariantsSection> = {
  title: 'UI / Tokens / Color Variants',
  component: ColorVariantsSection,
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    actions: { disable: true },
  },
};

export default meta;
type Story = StoryObj<typeof ColorVariantsSection>;

export const Default: Story = {};
