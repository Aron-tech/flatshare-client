import { useThemeColors } from '@/hooks/use-theme';
import { cn } from '@/lib/utils';
import { useFontFamily } from '@/theme/fonts';
import * as React from 'react';
import { Platform, TextInput, type TextInputProps } from 'react-native';

// DESIGN.md → Input Fields: sand kitöltés keret nélkül; fókuszban 1.5px terrakotta keret
// és fehér felület. 12px sarok, 0.75rem × 1rem padding.
function Input({
  className,
  style,
  onFocus,
  onBlur,
  ...props
}: TextInputProps & React.RefAttributes<TextInput>) {
  const colors = useThemeColors();
  const [focused, setFocused] = React.useState(false);
  const mergedClassName = cn(
    'bg-muted text-foreground text-body-md leading-5 h-12 w-full min-w-0 rounded-input border-[1.5px] border-transparent px-4',
    focused && 'border-ring bg-card',
    props.editable === false && 'opacity-50',
    Platform.select({
      web: 'outline-none transition-[color,background-color,border-color] selection:bg-primary-soft',
    }),
    className
  );

  const fontFamily = useFontFamily(mergedClassName);

  return (
    <TextInput
      className={mergedClassName}
      placeholderTextColor={colors.placeholder}
      selectionColor={colors.primary}
      cursorColor={colors.primary}
      style={[{ fontFamily }, style]}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      {...props}
    />
  );
}

export { Input };
