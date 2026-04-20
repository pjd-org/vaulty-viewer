import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { GENIE_CSS, GDS_WRAPPER_STYLE, useGenieFonts } from '../_genie-css';
import { Button } from '@vault/ui/atoms';

function ButtonsSection() {
  useGenieFonts();
  return (
    <div className="gds-root" style={GDS_WRAPPER_STYLE}>
      <style dangerouslySetInnerHTML={{ __html: GENIE_CSS }} />
      <section className="section" id="buttons">
        <div className="section-header">
          <span className="section-number">08</span>
          <h2 className="section-title">
            Button <em>Variants</em>
          </h2>
          <p className="section-desc">
            Always pill-shaped. Four semantic variants. Three sizes.
          </p>
        </div>
        <div className="component-canvas">
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              position: 'relative',
              zIndex: 1,
            }}
          >
            <div>
              <div className="label" style={{ marginBottom: 10 }}>
                Variants · md
              </div>
              <div className="btn-row">
                <Button unstyled className="btn btn-sm btn-primary">
                  Small
                </Button>
                <Button unstyled className="btn btn-md btn-primary">
                  Medium
                </Button>
                <Button unstyled className="btn btn-lg btn-primary">
                  Large
                </Button>
              </div>
            </div>
            <div>
              <div className="label" style={{ marginBottom: 10 }}>
                Sizes · primary
              </div>
              <div className="btn-row">
                <Button unstyled className="btn btn-md btn-primary">
                  Primary
                </Button>
                <Button unstyled className="btn btn-md btn-secondary">
                  Secondary
                </Button>
                <Button unstyled className="btn btn-md btn-ghost">
                  Ghost
                </Button>
                <Button unstyled className="btn btn-md btn-accent">
                  ✦ Accent
                </Button>
              </div>
            </div>
            <div>
              <div className="label" style={{ marginBottom: 10 }}>
                Disabled state
              </div>
              <div className="btn-row">
                <Button unstyled className="btn btn-md btn-info">
                  ℹ Info
                </Button>
                <Button unstyled className="btn btn-md btn-success">
                  ✓ Success
                </Button>
                <Button unstyled className="btn btn-md btn-warning">
                  ⚠ Warning
                </Button>
                <Button unstyled className="btn btn-md btn-danger">
                  ✕ Danger
                </Button>
              </div>
            </div>
            <div>
              <div className="label" style={{ marginBottom: 10 }}>
                Accent tints · pastel fill, dark text
              </div>
              <div className="btn-row">
                {(
                  [
                    'mint',
                    'lime',
                    'aqua',
                    'sky',
                    'lilac',
                    'peach',
                    'rose',
                    'sun',
                  ] as const
                ).map((c) => (
                  <Button key={c} unstyled className={`btn btn-md btn-${c}`}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <div className="label" style={{ marginBottom: 10 }}>
                Semantic status · tinted surface, accessible text
              </div>
              <div className="btn-row">
                <Button unstyled className="btn btn-md btn-primary" disabled>
                  Primary
                </Button>
                <Button unstyled className="btn btn-md btn-secondary" disabled>
                  Secondary
                </Button>
                <Button unstyled className="btn btn-md btn-accent" disabled>
                  Accent
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

const meta: Meta<typeof ButtonsSection> = {
  title: 'UI / Tokens / Buttons',
  component: ButtonsSection,
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    actions: { disable: true },
  },
};

export default meta;
type Story = StoryObj<typeof ButtonsSection>;

export const Default: Story = {};
