import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { GENIE_CSS, GDS_WRAPPER_STYLE, useGenieFonts } from './_genie-css';

function SurfacesSection() {
  useGenieFonts();
  return (
    <div className="gds-root" style={GDS_WRAPPER_STYLE}>
      <style dangerouslySetInnerHTML={{ __html: GENIE_CSS }} />
      <section className="section" id="surfaces">
        <div className="section-header">
          <span className="section-number">04</span>
          <h2 className="section-title">
            Surface <em>Model</em>
          </h2>
          <p className="section-desc">
            Four tiers of frosted surface. Each adds opacity and elevation. Use
            1–2 layers maximum per view.
          </p>
        </div>
        <div className="surface-row">
          {[
            {
              name: 'canvas',
              bg: 'var(--surf-canvas)',
              value: 'rgba(250,250,252,0.92)\nbackdrop: blur(24px)',
            },
            {
              name: 'base',
              bg: 'var(--surf-base)',
              value: 'rgba(255,255,255,0.72)\nbackdrop: blur(24px)',
            },
            {
              name: 'elevated',
              bg: 'var(--surf-elevated)',
              value: 'rgba(255,255,255,0.82)\nshadow: md',
              extra: { boxShadow: 'var(--shadow-md)' },
            },
            {
              name: 'overlay',
              bg: 'var(--surf-overlay)',
              value: 'rgba(255,255,255,0.58)\nbackdrop: blur(16px)',
            },
          ].map((s) => (
            <div
              key={s.name}
              className="surface-demo"
              style={{ background: s.bg, ...s.extra }}
            >
              <div className="surface-demo-name">{s.name}</div>
              <div className="surface-demo-value">{s.value}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const meta: Meta<typeof SurfacesSection> = {
  title: 'UI / Tokens / Surfaces',
  component: SurfacesSection,
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    actions: { disable: true },
  },
};

export default meta;
type Story = StoryObj<typeof SurfacesSection>;

export const Default: Story = {};
