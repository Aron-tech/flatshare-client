import { Text } from "@/components/ui/text";
import { currentLocale } from "@/i18n";
import { addDays, dayKey, isSameDay } from "@/lib/calendar";
import { cn } from "@/lib/utils";
import { CalendarEvent } from "@/types/calendar";
import { Pressable, View } from "react-native";

const MAX_DOTS = 3;

interface MonthGridProps {
  /** First day of the grid (start of the week before the month). */
  from: Date;
  to: Date;
  month: number;
  selected: Date;
  eventsByDay: Map<string, CalendarEvent[]>;
  onSelect: (day: Date) => void;
}

export function MonthGrid({ from, to, month, selected, eventsByDay, onSelect }: MonthGridProps) {
  const today = new Date();
  const days: Date[] = [];
  for (let day = from; day < to; day = addDays(day, 1)) days.push(day);
  const weeks = Array.from({ length: days.length / 7 }, (_, index) => days.slice(index * 7, index * 7 + 7));

  return (
    <View className="gap-1">
      <View className="flex-row">
        {weeks[0]?.map((day) => (
          <Text key={day.getDay()} className="flex-1 text-center text-label-sm uppercase text-muted-foreground">
            {day.toLocaleDateString(currentLocale(), { weekday: "narrow" })}
          </Text>
        ))}
      </View>
      {weeks.map((week) => (
        <View key={dayKey(week[0])} className="flex-row">
          {week.map((day) => {
            const events = eventsByDay.get(dayKey(day)) ?? [];
            const isSelected = isSameDay(day, selected);
            const isToday = isSameDay(day, today);
            return (
              <Pressable
                key={dayKey(day)}
                onPress={() => onSelect(day)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={day.toLocaleDateString(currentLocale(), { month: "long", day: "numeric" })}
                className="flex-1 items-center gap-1 py-1.5"
              >
                <View
                  className={cn(
                    "h-8 w-8 items-center justify-center rounded-full",
                    isSelected ? "bg-primary" : isToday && "border border-primary"
                  )}
                >
                  <Text
                    className={cn(
                      "text-label-lg",
                      isSelected
                        ? "text-primary-foreground"
                        : day.getMonth() !== month
                          ? "text-muted-foreground opacity-50"
                          : "text-foreground"
                    )}
                  >
                    {day.getDate()}
                  </Text>
                </View>
                <View className="h-1.5 flex-row gap-0.5">
                  {events.slice(0, MAX_DOTS).map((event) => (
                    <View
                      key={event.id}
                      className={cn("h-1.5 w-1.5 rounded-full", !event.category?.color && "bg-primary")}
                      style={[
                        event.category?.color ? { backgroundColor: event.category.color } : null,
                        event.status === "planned" || event.status === "completed" ? { opacity: 0.45 } : null,
                      ]}
                    />
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
