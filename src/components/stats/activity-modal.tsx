import { ActivityRow } from "@/components/stats/activity-row";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Elevation } from "@/constants/theme";
import { useActivityFeed } from "@/hooks/use-activity-feed";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, View } from "react-native";

interface ActivityModalProps {
  visible: boolean;
  onClose: () => void;
}

/** All completions, loaded page by page (with a cursor) on scroll. */
export function ActivityModal({ visible, onClose }: ActivityModalProps) {
  const { t } = useTranslation();
  const { entries, isLoading, isLoadingMore, error, loadMore } = useActivityFeed(visible);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center p-6">
        {/* A separate background layer: if a Pressable wrapped the card it would take the touch away from the list. */}
        <Pressable onPress={onClose} className="bg-black/40" style={StyleSheet.absoluteFill} />
        <View
          className="max-h-[85%] w-full max-w-md gap-4 rounded-card bg-popover p-6"
          style={Elevation.level2}
        >
          <Text className="font-serif text-headline-sm">{t("stats.allActivityTitle")}</Text>

          {isLoading ? (
            <ActivityIndicator className="py-8" />
          ) : (
            <FlatList
              // Without shrinking, the list would take the full content height (the card would clip it), so it would not
              // scroll and onEndReached would load all the pages in a row.
              style={{ flexShrink: 1 }}
              data={entries}
              keyExtractor={(entry) => String(entry.id)}
              renderItem={({ item }) => <ActivityRow entry={item} />}
              ItemSeparatorComponent={() => <View className="h-4" />}
              onEndReached={loadMore}
              onEndReachedThreshold={0.5}
              initialNumToRender={12}
              ListFooterComponent={isLoadingMore ? <ActivityIndicator className="py-4" /> : null}
              ListEmptyComponent={
                error ? <Text className="text-destructive">{error}</Text> : null
              }
            />
          )}

          <Button variant="secondary" onPress={onClose}>
            <Text>{t("common.close")}</Text>
          </Button>
        </View>
      </View>
    </Modal>
  );
}
