import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Text } from "@/components/ui/text";
import { Elevation } from "@/constants/theme";
import { useHouseholdMutation, useHouseholdQuery } from "@/hooks/use-household-query";
import { HouseholdQueries } from "@/lib/queries";
import { showToast } from "@/lib/toast";
import { calendarService } from "@/services/api/CalendarService";
import { CalendarScope } from "@/types/calendar";
import * as Clipboard from "expo-clipboard";
import { CalendarPlus, Copy, Smartphone, X } from "lucide-react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, Linking, Modal, Pressable, ScrollView, View } from "react-native";

interface CalendarExportSheetProps {
  initialScope: CalendarScope;
  onClose: () => void;
}

/**
 * Subscription to the household's iCalendar feed: Apple Calendar opens the webcal:// link, Google Calendar
 * (and thus the Android calendar) takes the URL. The calendars refresh the feed themselves.
 * Render only while open (the initial view is the calendar's current switch).
 */
export function CalendarExportSheet({ initialScope, onClose }: CalendarExportSheetProps) {
  const { t } = useTranslation();
  const [scope, setScope] = useState<CalendarScope>(initialScope);
  const { data: subscription } = useHouseholdQuery(HouseholdQueries.calendarSubscription);
  // After revoking, the household data (and so the links) go stale; the next open requests a new link.
  const reset = useHouseholdMutation((householdId, token, _: void) => calendarService.resetSubscription(householdId, token));

  const feed = subscription?.[scope] ?? null;

  const open = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      showToast(t("calendar.export.openFailed"));
    }
  };

  const copy = async () => {
    if (!feed) return;
    await Clipboard.setStringAsync(feed.url);
    showToast(t("calendar.export.copied"));
  };

  const confirmReset = () =>
    Alert.alert(t("calendar.export.resetTitle"), t("calendar.export.resetMessage"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("calendar.export.resetConfirm"),
        style: "destructive",
        onPress: async () => {
          await reset.run();
          onClose();
        },
      },
    ]);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} className="flex-1 items-center justify-center bg-black/40 p-6">
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="max-h-full w-full max-w-sm rounded-card bg-popover"
          style={Elevation.level2}
        >
          <ScrollView contentContainerClassName="gap-5 p-6">
            <View className="flex-row items-center gap-3">
              <Icon as={CalendarPlus} size={22} className="text-primary" />
              <Text className="flex-1 font-serif text-headline-sm">{t("calendar.export.title")}</Text>
              <Button size="icon" variant="ghost" onPress={onClose} accessibilityLabel={t("common.close")}>
                <Icon as={X} size={20} />
              </Button>
            </View>

            <Text className="text-body-md text-muted-foreground">{t("calendar.export.intro")}</Text>

            <SegmentedControl<CalendarScope>
              value={scope}
              onChange={setScope}
              options={[
                { value: "mine", label: t("calendar.export.scopeMine") },
                { value: "household", label: t("calendar.export.scopeHousehold") },
              ]}
            />

            {!feed ? (
              <ActivityIndicator className="py-6 text-primary" />
            ) : (
              <View className="gap-2">
                <Button onPress={() => void open(feed.webcal_url)}>
                  <Icon as={Smartphone} size={18} className="text-primary-foreground" />
                  <Text>{t("calendar.export.apple")}</Text>
                </Button>
                <Button
                  variant="outline"
                  onPress={() =>
                    void open(`https://calendar.google.com/calendar/r?cid=${encodeURIComponent(feed.webcal_url)}`)
                  }
                >
                  <Icon as={CalendarPlus} size={18} />
                  <Text>{t("calendar.export.google")}</Text>
                </Button>
                <Text className="px-1 text-body-sm text-muted-foreground">{t("calendar.export.googleHint")}</Text>
                <Button variant="ghost" onPress={() => void copy()}>
                  <Icon as={Copy} size={18} />
                  <Text>{t("calendar.export.copy")}</Text>
                </Button>
                <Button variant="ghost" disabled={reset.pending !== null} onPress={confirmReset}>
                  <Text className="text-destructive">{t("calendar.export.reset")}</Text>
                </Button>
              </View>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
