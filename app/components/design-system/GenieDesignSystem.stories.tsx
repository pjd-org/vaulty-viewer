import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Design System / Genie Tokens',
  component: () => (
    <iframe
      src="/genie-design-system.html"
      title="Genie Design System"
      style={{
        border: 'none',
        width: '100%',
        height: '100vh',
        display: 'block',
      }}
    />
  ),
  parameters: {
    layout: 'fullscreen',
    // Hide the controls/actions panels — this is a doc page, not a component
    controls: { disable: true },
    actions: { disable: true },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
