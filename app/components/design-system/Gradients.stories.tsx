import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { GENIE_CSS, GDS_WRAPPER_STYLE, useGenieFonts } from './_genie-css';

function GradientsSection() {
  useGenieFonts();
  return (
    <div className="gds-root" style={GDS_WRAPPER_STYLE}>
      <style dangerouslySetInnerHTML={{ __html: GENIE_CSS }} />
      <section className="section" id="gradients">
        <div className="section-header">
          <span className="section-number">03</span>
          <h2 className="section-title">
            Gradient <em>Library</em>
          </h2>
          <p className="section-desc">
            These matter more than raw colors. Low opacity, multi-stop radial
            compositions.
          </p>
        </div>
        <div className="gradient-grid">
          {[
            {
              label: 'hero',
              bg: 'var(--grad-hero)',
              shadow: 'var(--shadow-md)',
            },
            {
              label: 'cardGlow',
              bg: 'var(--grad-card-glow)',
              shadow: 'var(--shadow-md)',
            },
            {
              label: 'mintToSky',
              bg: 'var(--grad-mint-sky)',
              shadow: '0 8px 32px rgba(169,215,255,0.3)',
            },
            {
              label: 'roseToPeach',
              bg: 'var(--grad-rose-peach)',
              shadow: '0 8px 32px rgba(255,210,184,0.3)',
            },
            {
              label: 'limeToMint',
              bg: 'var(--grad-lime-mint)',
              shadow: '0 8px 32px rgba(184,255,216,0.3)',
            },
            {
              label: 'lilacToSky',
              bg: 'linear-gradient(135deg, rgba(216,199,255,0.5) 0%, rgba(169,215,255,0.4) 100%)',
              shadow: '0 8px 32px rgba(216,199,255,0.25)',
            },
          ].map((g) => (
            <div
              key={g.label}
              className="gradient-card"
              style={{ background: g.bg, boxShadow: g.shadow }}
            >
              <div className="gradient-card-label">{g.label}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const meta: Meta<typeof GradientsSection> = {
  title: 'UI / Tokens / Gradients',
  component: GradientsSection,
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    actions: { disable: true },
  },
};

export default meta;
type Story = StoryObj<typeof GradientsSection>;

export const Default: Story = {};
