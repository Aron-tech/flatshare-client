import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { Pressable, View } from "react-native";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Az aktív szegmens szövegszíne (dashboard: foreground, chores: primary). */
  activeTone?: "foreground" | "primary";
}

/** Pill alakú szegmens-váltó (My Tasks / Instant Pool, Recurring / Instant Pool). */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  activeTone = "foreground",
}: SegmentedControlProps<T>) {
  return (
    <View className="flex-row rounded-full bg-secondary-active p-1" role="tablist">
      {options.map((option, index) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            role="tab"
            aria-selected={active}
            onPress={() => onChange(option.value)}
            className={cn(
              "flex-1 flex-row items-center justify-center gap-1.5 rounded-full py-2",
              active && "bg-card"
            )}
            style={active ? { boxShadow: "0px 2px 8px rgba(44, 43, 41, 0.06)" } : undefined}
          >
            <Text
              className={cn(
                "text-label-lg",
                active
                  ? activeTone === "primary"
                    ? "text-primary"
                    : "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {option.label}
            </Text>
            {option.count !== undefined && (
              <View
                className={cn(
                  "min-w-5 items-center rounded-full px-1.5",
                  index === 0 ? "bg-secondary" : "bg-success-soft"
                )}
              >
                <Text
                  className={cn(
                    "text-label-sm",
                    index === 0 ? "text-muted-foreground" : "text-success-soft-foreground"
                  )}
                >
                  {option.count}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
