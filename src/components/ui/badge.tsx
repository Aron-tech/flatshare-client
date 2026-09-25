import { TextClassContext } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { Slot } from '@rn-primitives/slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Platform, View } from 'react-native';

// DESIGN.md → Chips & Filter Pills: pill forma, tónusos kitöltés, keret nélkül.
const badgeVariants = cva(
  cn(
    'group shrink-0 flex-row items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-3 py-1',
    Platform.select({
      web: 'focus-visible:border-ring focus-visible:ring-ring/50 w-fit whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] [&>svg]:pointer-events-none [&>svg]:size-3',
    })
  ),
  {
    variants: {
      variant: {
        /** Aktív / figyelmet kérő – terrakotta tint */
        default: 'bg-primary-soft',
        /** Inaktív chip – soft sand */
        secondary: 'bg-secondary',
        /** Pozitív visszajelzés (kész, elért) – sage tint */
        success: 'bg-success-soft',
        destructive: 'bg-destructive/10',
        outline: cn('border-border', Platform.select({ web: '[a&]:hover:bg-accent' })),
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const badgeTextVariants = cva('text-label-md', {
  variants: {
    variant: {
      default: 'text-primary-soft-foreground',
      secondary: 'text-muted-foreground',
      success: 'text-success-soft-foreground',
      destructive: 'text-destructive',
      outline: 'text-muted-foreground',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

type BadgeProps = React.ComponentProps<typeof View> & React.RefAttributes<View> & {
  asChild?: boolean;
} & VariantProps<typeof badgeVariants>;

function Badge({ className, variant, asChild, ...props }: BadgeProps) {
  const Component = asChild ? Slot : View;
  return (
    <TextClassContext.Provider value={badgeTextVariants({ variant })}>
      <Component className={cn(badgeVariants({ variant }), className)} {...props} />
    </TextClassContext.Provider>
  );
}

export { Badge, badgeTextVariants, badgeVariants };
export type { BadgeProps };
