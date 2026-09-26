import { TextClassContext } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { ICON_SETS, IconSetContext } from '@/theme/icon-sets';
import type { LucideIcon, LucideProps } from 'lucide-react-native';
import { cssInterop } from 'nativewind';
import * as React from 'react';
import { StyleSheet } from 'react-native';

type IconProps = LucideProps & {
  as: LucideIcon;
} & React.RefAttributes<LucideIcon>;

function IconImpl({ as: IconComponent, color, style, ...props }: IconProps) {
  // A `text-*` osztály színe a style-ba kerül; explicit `color` propként is átadjuk,
  // mert nem minden készlet olvassa a style-t (a Phosphor alapból feketét rajzol).
  const resolvedColor = color ?? (StyleSheet.flatten(style) as { color?: string } | undefined)?.color;
  return <IconComponent color={resolvedColor} style={style} {...props} />;
}

cssInterop(IconImpl, {
  className: {
    target: 'style',
    nativeStyleToProp: {
      height: 'size',
      width: 'size',
    },
  },
});

/**
 * A wrapper component for Lucide icons with Nativewind `className` support via `cssInterop`.
 *
 * This component allows you to render any Lucide icon while applying utility classes
 * using `nativewind`. It avoids the need to wrap or configure each icon individually.
 *
 * @component
 * @example
 * ```tsx
 * import { ArrowRight } from 'lucide-react-native';
 * import { Icon } from '@/registry/components/ui/icon';
 *
 * <Icon as={ArrowRight} className="text-red-500" size={16} />
 * ```
 *
 * @param {LucideIcon} as - The Lucide icon component to render.
 * @param {string} className - Utility classes to style the icon using Nativewind.
 * @param {number} size - Icon size (defaults to 14).
 * @param {...LucideProps} ...props - Additional Lucide icon props passed to the "as" icon.
 */
function Icon({ as: IconComponent, className, size = 14, strokeWidth, ...props }: IconProps) {
  const textClass = React.useContext(TextClassContext);
  const set = ICON_SETS[React.useContext(IconSetContext)];
  // A beállított készlet ikonja; ha nincs megfelelője, marad a Lucide.
  const mapped = set.map?.get(IconComponent);
  return (
    <IconImpl
      as={(mapped ?? IconComponent) as LucideIcon}
      {...(mapped ? set.props : { strokeWidth })}
      className={cn('text-foreground', textClass, className)}
      size={size}
      {...props}
    />
  );
}

export { Icon };
