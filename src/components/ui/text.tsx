import { cn } from '@/lib/utils';
import { useFontFamily } from '@/theme/fonts';
import { Slot } from '@rn-primitives/slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { Platform, Text as RNText, type Role } from 'react-native';

const textVariants = cva(
  cn(
    'text-foreground text-body-md',
    Platform.select({
      web: 'select-text',
    })
  ),
  {
    variants: {
      variant: {
        default: '',
        h1: cn(
          'text-headline-xl-mobile text-center',
          Platform.select({ web: 'scroll-m-20 text-balance' })
        ),
        h2: cn('text-headline-lg', Platform.select({ web: 'scroll-m-20 first:mt-0' })),
        h3: cn('text-headline-md', Platform.select({ web: 'scroll-m-20' })),
        h4: cn('text-headline-sm', Platform.select({ web: 'scroll-m-20' })),
        p: 'text-body-md mt-3 sm:mt-6',
        blockquote: 'text-headline-sm mt-4 border-l-2 border-border pl-3 italic sm:mt-6 sm:pl-6',
        code: cn(
          'bg-muted relative rounded-sm px-[0.3rem] py-[0.2rem] font-mono text-body-sm'
        ),
        lead: 'text-muted-foreground text-body-lg',
        large: 'text-body-lg font-semibold',
        small: 'text-label-lg',
        label: 'text-label-md text-muted-foreground',
        muted: 'text-muted-foreground text-body-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

type TextVariantProps = VariantProps<typeof textVariants>;

type TextVariant = NonNullable<TextVariantProps['variant']>;

const ROLE: Partial<Record<TextVariant, Role>> = {
  h1: 'heading',
  h2: 'heading',
  h3: 'heading',
  h4: 'heading',
  blockquote: Platform.select({ web: 'blockquote' as Role }),
  code: Platform.select({ web: 'code' as Role }),
};

const ARIA_LEVEL: Partial<Record<TextVariant, string>> = {
  h1: '1',
  h2: '2',
  h3: '3',
  h4: '4',
};

const TextClassContext = React.createContext<string | undefined>(undefined);

function Text({
  className,
  asChild = false,
  variant = 'default',
  style,
  ...props
}: React.ComponentProps<typeof RNText> &
  React.RefAttributes<typeof RNText> &
  TextVariantProps & {
    asChild?: boolean;
  }) {
  const textClass = React.useContext(TextClassContext);
  const Component = asChild ? Slot : RNText;
  const mergedClassName = cn(textVariants({ variant }), textClass, className);
  // Súlyonként külön fontfájl van (SDK 57), ezért a `font-semibold` stb. alapján
  // választjuk ki a pontos családot. A `code` variáns a rendszer mono fontját használja.
  const resolvedFamily = useFontFamily(mergedClassName);
  const fontFamily = variant === 'code' ? undefined : resolvedFamily;
  return (
    <Component
      className={mergedClassName}
      role={variant ? ROLE[variant] : undefined}
      aria-level={variant ? ARIA_LEVEL[variant] : undefined}
      style={fontFamily ? [{ fontFamily }, style] : style}
      {...props}
    />
  );
}

export { Text, TextClassContext, textVariants };
