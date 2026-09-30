import { CalendarEventList } from "@/components/calendar/calendar-event-row";
import { CalendarExportSheet } from "@/components/calendar/calendar-export-sheet";
import { MonthGrid } from "@/components/calendar/month-grid";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { Gutter, MaxContentWidth } from "@/constants/theme";
import { useHousehold } from "@/context/HouseholdContext";
import { useHouseholdQuery } from "@/hooks/use-household-query";
import { useThemeColors } from "@/hooks/use-theme";
import { currentLocale } from "@/i18n";
import {
  addDays,
  dayKey,
  defaultCalendarView,
  groupByDay,
  isSameDay,
  shiftAnchor,
  startOfDay,
  visibleRange,
  weekStartDay,
} from "@/lib/calendar";
import { calendarEventsQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { CalendarScope, CalendarView } from "@/types/calendar";
import { useRouter } from "expo-router";
import { CalendarPlus, ChevronLeft, ChevronRight, X } from "lucide-react-native";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Switch, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * A user naptára: az elvállalt feladatai és az ismétlődő feladatok rá eső, előre vetített példányai;
 * kapcsolóval a teljes háztartásé. Az alapnézet a háztartás időszaka szerint heti vagy havi.
 */
export default function CalendarScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useThemeColors();
  const { activeHousehold } = useHousehold();
  const settings = activeHousehold?.settings;
  const firstDay = weekStartDay(settings);

  const [view, setView] = useState<CalendarView>(() => defaultCalendarView(settings));
  const [date, setDate] = useState(() => startOfDay(new Date()));
  const [scope, setScope] = useState<CalendarScope>("mine");
  const [exportOpen, setExportOpen] = useState(false);

  const { from, to } = useMemo(() => visibleRange(view, date, firstDay), [view, date, firstDay]);
  const query = useMemo(() => calendarEventsQuery(scope, from, to), [scope, from, to]);
  const { data: events, isLoading } = useHouseholdQuery(query, { keepPrevious: true });
  const eventsByDay = useMemo(() => groupByDay(events ?? []), [events]);
  const showAssignees = scope === "household";
  const hasPlanned = events?.some((event) => event.status === "planned") ?? false;

  const title =
    view === "day"
      ? date.toLocaleDateString(currentLocale(), { weekday: "long", month: "long", day: "numeric" })
      : view === "week"
        ? `${from.toLocaleDateString(currentLocale(), { month: "short", day: "numeric" })} – ${addDays(to, -1).toLocaleDateString(currentLocale(), { month: "short", day: "numeric" })}`
        : date.toLocaleDateString(currentLocale(), { year: "numeric", month: "long" });

  const shift = (direction: 1 | -1) => {
    const next = shiftAnchor(view, date, direction);
    // Havi lapozásnál a mai napra ugrik, ha az a megjelenő hónapba esik.
    const today = startOfDay(new Date());
    setDate(view === "month" && next.getMonth() === today.getMonth() && next.getFullYear() === today.getFullYear() ? today : next);
  };

  const days: Date[] = [];
  if (view === "week") for (let day = from; day < to; day = addDays(day, 1)) days.push(day);

  return (
    <View className="flex-1 flex-row justify-center bg-background">
      <SafeAreaView edges={["top", "bottom"]} className="w-full flex-1" style={{ maxWidth: MaxContentWidth }}>
        <View className="flex-row items-center justify-between gap-3 py-4" style={{ paddingHorizontal: Gutter }}>
          <Text className="flex-1 text-headline-lg">{t("calendar.title")}</Text>
          <Button size="icon" variant="ghost" onPress={() => router.back()} accessibilityLabel={t("common.close")}>
            <Icon as={X} size={20} />
          </Button>
        </View>

        <View className="gap-3 pb-3" style={{ paddingHorizontal: Gutter }}>
          <SegmentedControl<CalendarView>
            value={view}
            onChange={setView}
            options={[
              { value: "day", label: t("calendar.views.day") },
              { value: "week", label: t("calendar.views.week") },
              { value: "month", label: t("calendar.views.month") },
            ]}
          />
          <View className="flex-row items-center justify-between">
            <Text className="text-body-md">{t("calendar.householdToggle")}</Text>
            <Switch
              value={scope === "household"}
              onValueChange={(value) => setScope(value ? "household" : "mine")}
              trackColor={{ true: colors.primary }}
              accessibilityLabel={t("calendar.householdToggle")}
            />
          </View>
          <View className="flex-row items-center gap-2">
            <Button size="icon" variant="ghost" onPress={() => shift(-1)} accessibilityLabel={t("calendar.previous")}>
              <Icon as={ChevronLeft} size={20} />
            </Button>
            <Text className="flex-1 text-center font-serif text-headline-sm" numberOfLines={1}>
              {title.charAt(0).toUpperCase() + title.slice(1)}
            </Text>
            <Button size="icon" variant="ghost" onPress={() => shift(1)} accessibilityLabel={t("calendar.next")}>
              <Icon as={ChevronRight} size={20} />
            </Button>
            <Button size="sm" variant="secondary" onPress={() => setDate(startOfDay(new Date()))}>
              <Text>{t("calendar.today")}</Text>
            </Button>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: Gutter, paddingBottom: 24, gap: 16 }}>
          {isLoading ? (
            <Skeleton className="h-64 w-full rounded-card" />
          ) : view === "month" ? (
            <>
              <MonthGrid
                from={from}
                to={to}
                month={date.getMonth()}
                selected={date}
                eventsByDay={eventsByDay}
                onSelect={setDate}
              />
              <View className="gap-2">
                <Text className="text-label-md uppercase text-muted-foreground">
                  {date.toLocaleDateString(currentLocale(), { weekday: "long", month: "long", day: "numeric" })}
                </Text>
                <CalendarEventList
                  events={eventsByDay.get(dayKey(date)) ?? []}
                  showAssignees={showAssignees}
                  emptyText={t("calendar.empty")}
                />
              </View>
            </>
          ) : view === "week" ? (
            days.map((day) => (
              <View key={dayKey(day)} className="gap-2">
                <Pressable
                  onPress={() => {
                    setDate(day);
                    setView("day");
                  }}
                  accessibilityRole="button"
                >
                  <Text
                    className={cn(
                      "text-label-md uppercase",
                      isSameDay(day, new Date()) ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {day.toLocaleDateString(currentLocale(), { weekday: "long", month: "short", day: "numeric" })}
                  </Text>
                </Pressable>
                <CalendarEventList events={eventsByDay.get(dayKey(day)) ?? []} showAssignees={showAssignees} emptyText="—" />
              </View>
            ))
          ) : (
            <CalendarEventList
              events={eventsByDay.get(dayKey(date)) ?? []}
              showAssignees={showAssignees}
              emptyText={t("calendar.empty")}
            />
          )}

          {hasPlanned && <Text className="text-body-sm text-muted-foreground">{t("calendar.plannedHint")}</Text>}
        </ScrollView>

        <View className="pt-2" style={{ paddingHorizontal: Gutter }}>
          <Button variant="outline" onPress={() => setExportOpen(true)}>
            <Icon as={CalendarPlus} size={18} />
            <Text>{t("calendar.export.button")}</Text>
          </Button>
        </View>
      </SafeAreaView>

      {exportOpen && <CalendarExportSheet initialScope={scope} onClose={() => setExportOpen(false)} />}
    </View>
  );
}
