import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { GENIE_CSS, GDS_WRAPPER_STYLE, useGenieFonts } from './_genie-css';

function SemanticStatesSection() {
  useGenieFonts();
  return (
    <div className="gds-root" style={GDS_WRAPPER_STYLE}>
      <style dangerouslySetInnerHTML={{ __html: GENIE_CSS }} />
      <section className="section" id="semantic">
        <div className="section-header">
          <span className="section-number">14</span>
          <h2 className="section-title">
            Semantic <em>States</em>
          </h2>
          <p className="section-desc">
            Every interactive component has five states. Disabled = 0.45
            opacity, no shadows, flat gradients.
          </p>
        </div>
        <div className="glass" style={{ overflow: 'hidden' }}>
          <table className="token-table">
            <thead>
              <tr>
                <th>State</th>
                <th>Surface</th>
                <th>Border</th>
                <th>Shadow</th>
                <th>Motion</th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  state: 'Default',
                  surface: 'base / 0.72',
                  border: 'white/52',
                  shadow: 'shadow-md',
                  motion: '—',
                },
                {
                  state: 'Hover',
                  surface: 'elevated / 0.82',
                  border: 'white/70',
                  shadow: 'shadow-lg',
                  motion: 'translateY(−1px) · 200ms',
                },
                {
                  state: 'Active',
                  surface: 'elevated',
                  border: 'strong',
                  shadow: 'shadow-sm',
                  motion: 'scale(0.99) · 160ms',
                },
                {
                  state: 'Selected',
                  surface: 'elevated',
                  border: 'tinted outline',
                  shadow: 'shadow-glow',
                  motion: '—',
                },
                {
                  state: 'Disabled',
                  surface: 'base · opacity 0.45',
                  border: 'subtle',
                  shadow: 'none',
                  motion: 'cursor: not-allowed',
                },
                {
                  state: 'Loading',
                  surface: 'base · shimmer',
                  border: 'subtle',
                  shadow: 'shadow-xs',
                  motion: 'pulse · opacity · 1.2s',
                },
              ].map((r) => (
                <tr key={r.state}>
                  <td>{r.state}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {r.surface}
                  </td>
                  <td>
                    <code>{r.border}</code>
                  </td>
                  <td>
                    <code>{r.shadow}</code>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{r.motion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

const meta: Meta<typeof SemanticStatesSection> = {
  title: 'UI / Tokens / Semantic States',
  component: SemanticStatesSection,
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    actions: { disable: true },
  },
};

export default meta;
type Story = StoryObj<typeof SemanticStatesSection>;

export const Default: Story = {};
