import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { GENIE_CSS, GDS_WRAPPER_STYLE, useGenieFonts } from './_genie-css';

function SpacingRadiusSection() {
  useGenieFonts();
  return (
    <div className="gds-root" style={GDS_WRAPPER_STYLE}>
      <style dangerouslySetInnerHTML={{ __html: GENIE_CSS }} />
      <section className="section" id="spacing">
        <div className="section-header">
          <span className="section-number">06</span>
          <h2 className="section-title">
            Spacing &amp; <em>Radius</em>
          </h2>
          <p className="section-desc">
            This system is round-heavy. Start at 14px radius minimum. Use 999px
            (pill) for all inline controls.
          </p>
        </div>
        <div className="label-row">
          <span className="label">Border Radius</span>
        </div>
        <div className="token-grid">
          {[
            { label: 'xs', px: 10 },
            { label: 'sm', px: 14 },
            { label: 'md', px: 18 },
            { label: 'lg', px: 24 },
            { label: 'xl', px: 28 },
            { label: '2xl', px: 32 },
            { label: 'full', px: 999 },
          ].map((r) => (
            <div
              key={r.label}
              className="radius-demo"
              style={{ borderRadius: r.px, boxShadow: 'var(--shadow-xs)' }}
            >
              <div className="radius-box" style={{ borderRadius: r.px }} />
              <div className="radius-label">
                {r.label}
                <br />
                {r.px === 999 ? '999px' : `${r.px}px`}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const meta: Meta<typeof SpacingRadiusSection> = {
  title: 'UI / Tokens / Spacing & Radius',
  component: SpacingRadiusSection,
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    actions: { disable: true },
  },
};

export default meta;
type Story = StoryObj<typeof SpacingRadiusSection>;

export const Default: Story = {};
