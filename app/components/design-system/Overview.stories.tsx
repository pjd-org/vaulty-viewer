import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { GENIE_CSS, GDS_WRAPPER_STYLE, useGenieFonts } from './_genie-css';

function OverviewSection() {
  useGenieFonts();
  return (
    <div className="gds-root" style={GDS_WRAPPER_STYLE}>
      <style dangerouslySetInnerHTML={{ __html: GENIE_CSS }} />
      <section className="section" id="overview">
        <div className="hero glass">
          <div className="hero-tag">v1.0 · Soft-Futuristic AI UI</div>
          <h1 className="hero-display">
            Genie
            <br />
            <em>Design System</em>
          </h1>
          <p className="hero-body">
            A card-native, glass-surface, calm-motion design system built for AI
            workspaces. Low noise. High softness. Objects over paragraphs.
          </p>
          <div className="hero-traits">
            {[
              'Airy',
              'Card-first',
              'Low-noise',
              'Translucent surfaces',
              'Soft gradients',
              'Calm motion',
            ].map((t) => (
              <span key={t} className="hero-trait">
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

const meta: Meta<typeof OverviewSection> = {
  title: 'UI / Tokens / Overview',
  component: OverviewSection,
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    actions: { disable: true },
  },
};

export default meta;
type Story = StoryObj<typeof OverviewSection>;

export const Default: Story = {};
