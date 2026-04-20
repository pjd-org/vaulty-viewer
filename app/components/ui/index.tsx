// ─── @vault/ui pass-throughs ──────────────────────────────────────────────────
export {
  Badge,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardGlowOverlay,
  Dock,
  DockDropdownItem,
  DockIcon,
  DockItem,
  DockLink,
  GlassSurface,
  Inline,
  Input,
  ProgressBar,
  PromptInput,
  SidebarRail,
  Spinner,
  Stack,
  SuggestionChip,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  TabsRoot,
  Toast,
} from '@vault/ui';

export type {
  BadgeProps,
  ButtonProps,
  InputProps,
  LabelProps,
} from '@vault/ui';

// ─── Local atoms ──────────────────────────────────────────────────────────────
export { PrimaryButton, SecondaryButton, IconButton } from './Buttons';
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
