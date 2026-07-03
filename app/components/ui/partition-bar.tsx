import {
  Children,
  createContext,
  HTMLAttributes,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useContext,
} from 'react';
import { cn } from '@/src/lib/utils';
import { cva, VariantProps } from 'class-variance-authority';

type PartitionBarContextType = {
  total: number;
  size: VariantProps<typeof partitionBarVariants>['size'];
};

const PartitionBarCtxt = createContext<PartitionBarContextType | null>(null);

function usePartitionBarContext(): PartitionBarContextType {
  const context = useContext(PartitionBarCtxt);
  if (!context) {
    throw new Error(
      'usePartitionBarContext must be used within a PartitionBarProvider'
    );
  }
  return context;
}

//////////////////////////////////////////////////////////////////////////////

const partitionBarVariants = cva('flex flex-row', {
  variants: {
    size: {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-md',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

interface PartitionBarProps
  extends
    HTMLAttributes<HTMLUListElement>,
    VariantProps<typeof partitionBarVariants> {
  children?: ReactNode;
  gap?: number;
}

export default function PartitionBar({
  children,
  className,
  gap = 1,
  size,
  ...props
}: PartitionBarProps) {
  const total = Children.toArray(children).reduce<number>(
    (sum, child) =>
      isValidElement(child)
        ? sum + ((child.props as PartitionBarSegmentProps).num ?? 0)
        : sum,
    0
  );

  return (
    <PartitionBarCtxt.Provider value={{ total, size }}>
      <ul
        className={cn(partitionBarVariants({ size }), className)}
        style={{ gap: `${gap * 0.25}rem` }}
        {...props}
      >
        {children}
      </ul>
    </PartitionBarCtxt.Provider>
  );
}

//////////////////////////////////////////////////////////////////////////////

const partitionBarSegmentVariants = cva(
  'flex flex-col overflow-hidden rounded-md',
  {
    variants: {
      variant: {
        default: 'bg-primary',
        secondary: 'bg-secondary',
        destructive: 'bg-destructive',
        outline: 'bg-transparent border border-input',
        muted: 'bg-muted',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const partitionBarTitleVariants = cva('', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      secondary: 'text-secondary-foreground',
      destructive: 'text-destructive-foreground',
      outline: 'text-foreground',
      muted: 'text-muted-foreground',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

interface PartitionBarSegmentProps
  extends
    HTMLAttributes<HTMLLIElement>,
    VariantProps<typeof partitionBarSegmentVariants> {
  num?: number;
  alignment?: 'left' | 'center' | 'right';
  children?: React.ReactNode;
}

export function PartitionBarSegment({
  children,
  className,
  variant,
  num = 0,
  alignment = 'center',
  ...props
}: PartitionBarSegmentProps) {
  const { total, size } = usePartitionBarContext();
  const pct = total > 0 ? (num / total) * 100 : 0;

  return (
    <li
      className={cn(partitionBarSegmentVariants({ variant }), className)}
      style={{ width: `${pct}%` }}
      {...props}
    >
      <div
        className={cn(
          partitionBarTitleVariants({ variant }),
          'w-full whitespace-normal flex flex-col',
          size === 'sm' ? 'mt-2' : size === 'md' ? 'mt-3' : 'mt-4',
          alignment === 'left' && 'items-start',
          alignment === 'center' && 'items-center',
          alignment === 'right' && 'items-end'
        )}
      >
        {children}
      </div>
    </li>
  );
}

/////////////////////////////////////////////////////////////////////////////

interface PartitionBarSegmentTitleProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function PartitionBarSegmentTitle({
  children,
  className,
}: PartitionBarSegmentTitleProps) {
  return <div className={cn('w-fit font-semibold', className)}>{children}</div>;
}

interface PartitionBarSegmentValueProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function PartitionBarSegmentValue({
  children,
  className,
}: PartitionBarSegmentValueProps) {
  return (
    <div className={cn('w-fit text-text2 text-[80%]', className)}>
      {children}
    </div>
  );
}
