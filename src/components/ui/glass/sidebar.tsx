import * as React from 'react';
import {
  Sidebar as BaseSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenuItem,
} from '@/app/components/ui/sidebar';
import { cn } from '@/src/lib/utils';

export interface SidebarProps extends React.ComponentProps<typeof BaseSidebar> {
  glow?: boolean;
}

/**
 * Glass UI Sidebar - Enhanced sidebar with glassy effects
 */
export const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, variant = 'sidebar', glow = false, ...props }, ref) => {
    return (
      <BaseSidebar
        ref={ref}
        variant={variant}
        className={cn(
          'bg-white/10 backdrop-blur-xl border-r border-white/10',
          glow && 'shadow-lg shadow-purple-500/20',
          className
        )}
        {...props}
      />
    );
  }
);
Sidebar.displayName = 'Sidebar';

export { SidebarHeader, SidebarContent, SidebarFooter, SidebarMenuItem };
