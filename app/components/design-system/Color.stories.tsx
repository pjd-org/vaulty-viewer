import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { GENIE_CSS, GDS_WRAPPER_STYLE, useGenieFonts } from './_genie-css';

function ColorSection() {
  useGenieFonts();
  return (
    <div className="gds-root" style={GDS_WRAPPER_STYLE}>
      <style dangerouslySetInnerHTML={{ __html: GENIE_CSS }} />
      <section className="section" id="color">
        <div className="section-header">
          <span className="section-number">02</span>
          <h2 className="section-title">
            Color <em>System</em>
          </h2>
          <p className="section-desc">
            Neutral fog surfaces + pastel spectral accents. Accents are used
            sparingly — glow, never fill.
          </p>
        </div>

        <div className="label-row">
          <span className="label">Neutral scale</span>
        </div>
        <div
          style={{
            background: 'white',
            borderRadius: 16,
            padding: 20,
            border: '1px solid var(--border-strong)',
          }}
        >
          <div className="swatch-row">
            {[
              {
                bg: '#FFFFFF',
                extra: { border: '1.5px solid var(--n-200)' },
              },
              { bg: '#FCFCFD' },
              { bg: '#F8F8FA' },
              { bg: '#F1F2F5' },
              { bg: '#E9EBF0' },
              { bg: '#DFE3EA' },
              { bg: '#C8CFDA' },
              { bg: '#AAB4C3' },
              { bg: '#8793A6' },
              { bg: '#667085' },
              { bg: '#4B5565' },
              { bg: '#313846' },
              { bg: '#1C2230' },
              { bg: '#11151D' },
            ].map((s, i) => (
              <div
                key={i}
                className="swatch-step"
                style={{ background: s.bg, ...s.extra }}
              />
            ))}
          </div>
          <div className="swatch-label-row">
            {[
              '0',
              '25',
              '50',
              '100',
              '150',
              '200',
              '300',
              '400',
              '500',
              '600',
              '700',
              '800',
              '900',
              '950',
            ].map((l) => (
              <span key={l} className="swatch-step-label">
                {l}
              </span>
            ))}
          </div>
        </div>

        <div className="label-row" style={{ marginTop: 8 }}>
          <span className="label">Accent palette</span>
        </div>
        <div className="swatch-grid">
          {[
            { name: 'mint', hex: '#B8FFD8', glow: 'rgba(184,255,216,0.5)' },
            { name: 'lime', hex: '#D9FF8C', glow: 'rgba(217,255,140,0.5)' },
            { name: 'aqua', hex: '#97F0FF', glow: 'rgba(151,240,255,0.5)' },
            { name: 'sky', hex: '#A9D7FF', glow: 'rgba(169,215,255,0.5)' },
            {
              name: 'lilac',
              hex: '#D8C7FF',
              glow: 'rgba(216,199,255,0.5)',
            },
            {
              name: 'peach',
              hex: '#FFD2B8',
              glow: 'rgba(255,210,184,0.5)',
            },
            { name: 'rose', hex: '#FFC7DE', glow: 'rgba(255,199,222,0.5)' },
            { name: 'sun', hex: '#FFF0A6', glow: 'rgba(255,240,166,0.5)' },
          ].map((a) => (
            <div key={a.name} className="swatch">
              <div
                className="swatch-color"
                style={{
                  background: a.hex,
                  boxShadow: `0 4px 16px ${a.glow}`,
                }}
              />
              <div className="swatch-name">{a.name}</div>
              <div className="swatch-value">{a.hex}</div>
            </div>
          ))}
        </div>

        <div className="label-row" style={{ marginTop: 8 }}>
          <span className="label">Semantic</span>
        </div>
        <div className="semantic-row">
          {[
            {
              color: '#7CCBFF',
              bg: 'rgba(124,203,255,0.12)',
              border: 'rgba(124,203,255,0.3)',
              text: '#2a6590',
              label: 'info · #7CCBFF',
            },
            {
              color: '#8EE7A0',
              bg: 'rgba(142,231,160,0.12)',
              border: 'rgba(142,231,160,0.3)',
              text: '#276b38',
              label: 'success · #8EE7A0',
            },
            {
              color: '#FFD66B',
              bg: 'rgba(255,214,107,0.12)',
              border: 'rgba(255,214,107,0.3)',
              text: '#7a5c00',
              label: 'warning · #FFD66B',
            },
            {
              color: '#FF8F8F',
              bg: 'rgba(255,143,143,0.12)',
              border: 'rgba(255,143,143,0.3)',
              text: '#8c1f1f',
              label: 'danger · #FF8F8F',
            },
          ].map((s) => (
            <div
              key={s.label}
              className="semantic-pill"
              style={{ background: s.bg, border: `1px solid ${s.border}` }}
            >
              <div className="semantic-dot" style={{ background: s.color }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: s.text }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const meta: Meta<typeof ColorSection> = {
  title: 'UI / Tokens / Color',
  component: ColorSection,
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    actions: { disable: true },
  },
};

export default meta;
type Story = StoryObj<typeof ColorSection>;

export const Default: Story = {};
