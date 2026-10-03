import { CategoryIconBadge } from "@/components/category-icon";
import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";
import { currentLocale } from "@/i18n";
import { cn } from "@/lib/utils";
import { CalendarEvent, CalendarEventStatus } from "@/types/calendar";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

const STATUS_BADGE: Record<CalendarEventStatus, "success" | "default" | "destructive" | "secondary"> = {
  completed: "success",
  open: "default",
  overdue: "destructive",
  planned: "secondary",
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(currentLocale(), { hour: "2-digit", minute: "2-digit" });
}

export function CalendarEventRow({ event, showAssignees }: { event: CalendarEvent; showAssignees: boolean }) {
  const { t } = useTranslation();
  const time = event.completed_at
    ? t("calendar.completedAt", { time: formatTime(event.completed_at) })
    : event.due_at
      ? t("calendar.dueAt", { time: formatTime(event.due_at) })
      : formatTime(event.at);
  const assignees = event.assignees.map((assignee) => assignee.name).join(", ") || t("calendar.unassigned");

  return (
    <View className={cn("flex-row items-center gap-3 rounded-input bg-card px-3 py-2.5", event.status === "planned" && "opacity-70")}>
      <CategoryIconBadge
        color={event.category?.color}
        hints={[event.category?.icon, event.category?.name, event.name]}
        shape="rounded"
        size={36}
      />
      <View className="flex-1 gap-0.5">
        <Text className={cn("text-body-md", event.status === "completed" && "text-muted-foreground line-through")} numberOfLines={1}>
          {event.name}
        </Text>
        <Text className="text-body-sm text-muted-foreground" numberOfLines={1}>
          {showAssignees ? `${time} · ${assignees}` : time}
        </Text>
      </View>
      <Badge variant={STATUS_BADGE[event.status]}>
        <Text>{t(`calendar.status.${event.status}`)}</Text>
      </Badge>
    </View>
  );
}

export function CalendarEventList({
  events,
  showAssignees,
  emptyText,
}: {
  events: CalendarEvent[];
  showAssignees: boolean;
  emptyText?: string;
}) {
  if (events.length === 0) {
    return emptyText ? <Text className="px-1 py-2 text-body-sm text-muted-foreground">{emptyText}</Text> : null;
  }

  return (
    <View className="gap-2">
      {events.map((event) => (
        <CalendarEventRow key={event.id} event={event} showAssignees={showAssignees} />
      ))}
    </View>
  );
}
