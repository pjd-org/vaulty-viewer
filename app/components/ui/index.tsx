// ─── Import conventions ────────────────────────────────────────────────────────
// Primitives (Sheet, Separator, Collapsible, Avatar, Checkbox, Command,
// Skeleton, ScrollArea, Accordion, Drawer, Dialog*, Tooltip*) have been migrated
// to local shadcn equivalents at @/app/components/ui/. Do not re-export them here;
// import directly from their module paths instead.

// ─── @vault/ui pass-throughs ──────────────────────────────────────────────────
// Badge and Button have been migrated to local shadcn with vault variants.
// Re-export from local paths to maintain API compatibility.
export {
  Button,
} from './button';
export type { ButtonProps } from './button';
export {
  Badge,
} from './badge';
export type { BadgeProps } from './badge';

// ─── Local atoms ──────────────────────────────────────────────────────────────
export { Progress } from './progress';
export { Label } from './label';
export { Skeleton } from './skeleton';
export { Spinner } from './spinner';
export { PrimaryButton, SecondaryButton, IconButton } from './Buttons';
export { VaultyLogo } from './vaulty-logo';
export type { ButtonBaseProps, IconButtonProps } from './Buttons';

export { MetricLabel, MetaRow, ReasonText } from './Labels';
export type { ReasonTextProps } from './Labels';

export { SoftChip, StatusPill } from './Chips';
export type {
  SoftChipProps,
  StatusPillProps,
  ChipVariant,
  TaskStatus,
} from './Chips';

export { SegmentedControl } from './Controls';
export type { SegmentedControlProps, SegmentOption } from './Controls';

export { EmptyState } from './EmptyState';
export type { EmptyStateProps } from './EmptyState';

export {
  SurfaceChip,
  SurfaceLinkChip,
  SurfaceButtonChip,
  MetricCard,
  SurfaceSectionCard,
} from './SurfaceChrome';

// ─── Route states ─────────────────────────────────────────────────────────────
export { RouteLoadingState, RouteAsideEmptyState } from './RouteStates';
export { SkeletonCard } from '@vault/ui';

// ─── Avatar molecules / organisms ─────────────────────────────────────────────
export { ActionGuidancePanel } from './ActionGuidancePanel';
export type { ActionGuidancePanelProps } from './ActionGuidancePanel';

export { CapacityGroup } from './CapacityGroup';
export type { CapacityGroupProps } from './CapacityGroup';

export { ExecutionStats } from './ExecutionStats';
export type { ExecutionStatsProps, VitalsData } from './ExecutionStats';

export { ProgressionSummary } from './ProgressionSummary';
export type {
  ProgressionSummaryProps,
  ProgressionData,
} from './ProgressionSummary';

export { ReadinessCard } from './ReadinessCard';

export { ReadinessHeader } from './ReadinessHeader';
export type {
  ReadinessHeaderProps,
  ProfileData,
  FlagsData,
} from './ReadinessHeader';
