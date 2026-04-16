import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { GENIE_CSS, GDS_WRAPPER_STYLE, useGenieFonts } from './_genie-css';

function MotionSection() {
  useGenieFonts();
  return (
    <div className="gds-root" style={GDS_WRAPPER_STYLE}>
      <style dangerouslySetInnerHTML={{ __html: GENIE_CSS }} />
      <section className="section" id="motion">
        <div className="section-header">
          <span className="section-number">12</span>
          <h2 className="section-title">
            Motion <em>System</em>
          </h2>
          <p className="section-desc">
            This design dies if motion is wrong. Fast in, soft settle. Spring
            only on cards and sheets.
          </p>
        </div>
        <div className="glass" style={{ overflow: 'hidden' }}>
          <table className="token-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Token</th>
                <th>Duration</th>
                <th>Usage</th>
                <th>Visual</th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  token: 'motion.fast',
                  dur: '160ms',
                  usage: 'Hover, chip toggle, state flash',
                  w: 48,
                },
                {
                  token: 'motion.base',
                  dur: '220ms',
                  usage: 'Buttons, tooltips, dropdowns',
                  w: 66,
                },
                {
                  token: 'motion.slow',
                  dur: '320ms',
                  usage: 'Card appear, panel transition',
                  w: 96,
                },
                {
                  token: 'motion.slower',
                  dur: '420ms',
                  usage: 'Sheet open, page enter',
                  w: 126,
                },
              ].map((r) => (
                <tr key={r.token}>
                  <td>{r.token}</td>
                  <td>
                    <code>{r.dur}</code>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{r.usage}</td>
                  <td>
                    <div className="motion-bar" style={{ width: r.w }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: 20, borderTop: '1px solid var(--n-150)' }}>
            <div className="label" style={{ marginBottom: 12 }}>
              Easings
            </div>
            <table className="token-table">
              <tbody>
                <tr>
                  <td>standard</td>
                  <td>
                    <code>cubic-bezier(0.2, 0.8, 0.2, 1)</code>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    Default — all utility transitions
                  </td>
                </tr>
                <tr>
                  <td>enter</td>
                  <td>
                    <code>cubic-bezier(0.16, 1, 0.3, 1)</code>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    Elements arriving — overshoots softly
                  </td>
                </tr>
                <tr>
                  <td>exit</td>
                  <td>
                    <code>cubic-bezier(0.7, 0, 0.84, 0)</code>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    Elements leaving — accelerates out
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

const meta: Meta<typeof MotionSection> = {
  title: 'UI / Tokens / Motion',
  component: MotionSection,
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    actions: { disable: true },
  },
};

export default meta;
type Story = StoryObj<typeof MotionSection>;

export const Default: Story = {};
