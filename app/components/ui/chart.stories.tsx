import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from './chart';

const meta = {
  title: 'UI / Charts / Chart',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const data = [
  { month: 'Jan', revenue: 12, tasks: 5 },
  { month: 'Feb', revenue: 18, tasks: 7 },
  { month: 'Mar', revenue: 15, tasks: 9 },
  { month: 'Apr', revenue: 22, tasks: 11 },
  { month: 'May', revenue: 28, tasks: 15 },
  { month: 'Jun', revenue: 24, tasks: 13 },
];

const config = {
  revenue: {
    label: 'Revenue',
    color: 'var(--a-sky)',
  },
  tasks: {
    label: 'Tasks',
    color: 'var(--a-mint)',
  },
} satisfies ChartConfig;

export const LineBasic: Story = {
  name: 'Line',
  render: () => (
    <ChartContainer config={config} className="min-h-[280px] w-full">
      <ResponsiveContainer width="100%" height={280}>
        <RechartsLineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <RechartsTooltip content={<ChartTooltipContent />} />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="var(--color-revenue)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="tasks"
            stroke="var(--color-tasks)"
            strokeWidth={2}
            dot={false}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </ChartContainer>
  ),
};

