import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { Elevation } from "@/constants/theme";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, X } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

export interface SelectOption<T extends string | number> {
  value: T;
  label: string;
  /** Kisebb, másodlagos sor a címke alatt. */
  description?: string;
}

interface SearchableSelectProps<T extends string | number> {
  options: SelectOption<T>[];
  value: T | null;
  /** `null`, ha a kijelölést törölték. */
  onChange: (value: T | null) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
  /** Töltés alatt (`options` még nincs meg) a lista nem nyílik meg. */
  disabled?: boolean;
}

/** Legördülő választó beépített kereséssel; a kijelölés törölhető (nem kötelező mező). */
export function SearchableSelect<T extends string | number>({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyText,
  disabled,
}: SearchableSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = options.find((option) => option.value === value) ?? null;
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return options.filter((option) => option.label.toLowerCase().includes(needle));
  }, [options, query]);

  const toggle = () => {
    setOpen((current) => !current);
    setQuery("");
  };

  const pick = (next: T | null) => {
    onChange(next);
    setOpen(false);
    setQuery("");
  };

  return (
    <View className="gap-2">
      <View className="flex-row items-center gap-2">
        <Pressable
          onPress={toggle}
          disabled={disabled}
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-12 flex-1 flex-row items-center justify-between gap-2 rounded-input border-[1.5px] bg-muted px-4",
            open ? "border-ring bg-card" : "border-transparent",
            disabled && "opacity-50"
          )}
        >
          <Text numberOfLines={1} className={cn("flex-1", !selected && "text-muted-foreground")}>
            {selected?.label ?? placeholder}
          </Text>
          <Icon as={ChevronDown} size={18} className="text-muted-foreground" />
        </Pressable>
        {selected && (
          <Pressable
            onPress={() => pick(null)}
            role="button"
            accessibilityLabel="clear"
            className="h-12 w-12 items-center justify-center rounded-input bg-muted"
          >
            <Icon as={X} size={18} className="text-muted-foreground" />
          </Pressable>
        )}
      </View>

      {open && (
        <View className="gap-2 rounded-card bg-card p-3" style={Elevation.level1}>
          <Input value={query} onChangeText={setQuery} placeholder={searchPlaceholder} autoFocus returnKeyType="search" />
          <ScrollView style={{ maxHeight: 240 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
            {visible.length === 0 ? (
              <Text variant="muted" className="px-2 py-3">
                {emptyText}
              </Text>
            ) : (
              visible.map((option) => {
                const active = option.value === value;
                return (
                  <Pressable
                    key={String(option.value)}
                    onPress={() => pick(option.value)}
                    role="option"
                    aria-selected={active}
                    className={cn("flex-row items-center gap-3 rounded-input px-3 py-2.5", active && "bg-primary-soft")}
                  >
                    <View className="flex-1">
                      <Text className="text-label-lg">{option.label}</Text>
                      {option.description ? (
                        <Text variant="muted" numberOfLines={1}>
                          {option.description}
                        </Text>
                      ) : null}
                    </View>
                    {active && <Icon as={Check} size={16} className="text-primary" />}
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}
