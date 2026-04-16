import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { GENIE_CSS, GDS_WRAPPER_STYLE, useGenieFonts } from './_genie-css';

function TypographySection() {
  useGenieFonts();
  return (
    <div className="gds-root" style={GDS_WRAPPER_STYLE}>
      <style dangerouslySetInnerHTML={{ __html: GENIE_CSS }} />
      <section className="section" id="typography">
        <div className="section-header">
          <span className="section-number">05</span>
          <h2 className="section-title">
            Type <em>Scale</em>
          </h2>
          <p className="section-desc">
            Instrument Serif for display. Geist for everything else. Negative
            tracking throughout. Short line-lengths inside cards.
          </p>
        </div>
        <div className="glass" style={{ padding: '4px 0', overflow: 'hidden' }}>
          {[
            {
              token: 'displayLg',
              style: {
                fontFamily: "'Instrument Serif', Georgia, serif",
                fontSize: 48,
                lineHeight: '56px',
                letterSpacing: '-0.03em',
                fontWeight: 600,
                color: 'var(--text-primary)',
              },
              sample: 'Genie',
              meta: '48 / 56 / −0.03em / 600',
            },
            {
              token: 'h1',
              style: {
                fontFamily: "'Geist', sans-serif",
                fontSize: 32,
                lineHeight: '40px',
                letterSpacing: '-0.025em',
                fontWeight: 600,
                color: 'var(--text-primary)',
              },
              sample: 'Design System',
              meta: '32 / 40 / −0.025em / 600',
            },
            {
              token: 'h2',
              style: {
                fontFamily: "'Geist', sans-serif",
                fontSize: 24,
                lineHeight: '32px',
                letterSpacing: '-0.02em',
                fontWeight: 600,
                color: 'var(--text-primary)',
              },
              sample: 'Visual Foundations',
              meta: '24 / 32 / −0.02em / 600',
            },
            {
              token: 'h3',
              style: {
                fontFamily: "'Geist', sans-serif",
                fontSize: 20,
                lineHeight: '28px',
                letterSpacing: '-0.015em',
                fontWeight: 600,
                color: 'var(--text-primary)',
              },
              sample: 'Surface model',
              meta: '20 / 28 / −0.015em / 600',
            },
            {
              token: 'title',
              style: {
                fontFamily: "'Geist', sans-serif",
                fontSize: 16,
                lineHeight: '24px',
                letterSpacing: '-0.01em',
                fontWeight: 600,
                color: 'var(--text-primary)',
              },
              sample: 'Card header label',
              meta: '16 / 24 / −0.01em / 600',
            },
            {
              token: 'bodyLg',
              style: {
                fontFamily: "'Geist', sans-serif",
                fontSize: 16,
                lineHeight: '24px',
                letterSpacing: '-0.01em',
                fontWeight: 400,
                color: 'var(--text-secondary)',
              },
              sample: 'Comfortable reading text for main content areas.',
              meta: '16 / 24 / −0.01em / 400',
            },
            {
              token: 'body',
              style: {
                fontFamily: "'Geist', sans-serif",
                fontSize: 14,
                lineHeight: '22px',
                letterSpacing: '-0.005em',
                fontWeight: 400,
                color: 'var(--text-secondary)',
              },
              sample: 'Default body text inside cards and panels.',
              meta: '14 / 22 / −0.005em / 400',
            },
            {
              token: 'label',
              style: {
                fontFamily: "'Geist', sans-serif",
                fontSize: 13,
                lineHeight: '18px',
                fontWeight: 500,
                color: 'var(--text-secondary)',
              },
              sample: 'Metadata · Status · Actions',
              meta: '13 / 18 / 0em / 500',
            },
            {
              token: 'micro',
              style: {
                fontFamily: "'Geist', sans-serif",
                fontSize: 11,
                lineHeight: '14px',
                letterSpacing: '0.02em',
                fontWeight: 500,
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase' as const,
              },
              sample: 'TIMESTAMPS · CAPTIONS',
              meta: '11 / 14 / +0.02em / 500',
            },
          ].map((row) => (
            <div key={row.token} className="type-row">
              <div className="type-token">{row.token}</div>
              <div style={row.style}>{row.sample}</div>
              <div className="type-meta">{row.meta}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const meta: Meta<typeof TypographySection> = {
  title: 'UI / Tokens / Typography',
  component: TypographySection,
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    actions: { disable: true },
  },
};

export default meta;
type Story = StoryObj<typeof TypographySection>;

export const Default: Story = {};
