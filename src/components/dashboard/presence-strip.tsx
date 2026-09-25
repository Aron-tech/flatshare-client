import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { ActivityEntry } from "@/types/stats";
import { BadgeCheck } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

const AVATAR_TONES = ["bg-primary-soft", "bg-success-soft"] as const;
const AVATAR_TEXT = ["text-primary-soft-foreground", "text-success-soft-foreground"] as const;

/** "Márton & Eszter ma aktívak" – a mai aktivitásból (más lakótársak). */
export function PresenceStrip({ activity }: { activity: ActivityEntry[] }) {
  const { t } = useTranslation();
  const today = new Date().toDateString();
  const todays = activity.filter(
    (a) => !a.is_me && new Date(a.completed_at).toDateString() === today
  );
  const names = [...new Set(todays.map((a) => a.user_name.split(" ")[0]))];

  if (names.length === 0) return null;

  return (
    <View className="flex-row items-center gap-3 rounded-card border border-border bg-muted p-4">
      <View className="flex-row">
        {names.slice(0, 3).map((name, i) => (
          <View
            key={name}
            className={cn(
              "h-10 w-10 items-center justify-center rounded-full border-2 border-muted",
              AVATAR_TONES[i % 2],
              i > 0 && "-ml-3"
            )}
          >
            <Text className={cn("text-label-lg", AVATAR_TEXT[i % 2])}>{name[0]}</Text>
          </View>
        ))}
      </View>
      <View className="flex-1">
        <Text className="text-label-lg">
          {t("dashboard.activeToday", { names: names.slice(0, 2).join(" & "), count: names.length })}
        </Text>
        <Text variant="muted">{t("dashboard.completedToday", { count: todays.length })}</Text>
      </View>
      <Icon as={BadgeCheck} size={22} className="text-success-active" />
    </View>
  );
}
