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

/** Az összes teljesítés, görgetéskor oldalanként (kurzorral) töltve. */
export function ActivityModal({ visible, onClose }: ActivityModalProps) {
  const { t } = useTranslation();
  const { entries, isLoading, isLoadingMore, error, loadMore } = useActivityFeed(visible);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center p-6">
        {/* Külön háttér-réteg: ha a kártyát egy Pressable fogná körbe, az elvenné az érintést a listától. */}
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
              // Zsugorodás nélkül a lista a teljes tartalom magasságát venné fel (a kártya levágná),
              // így nem görgethető, és az onEndReached sorra betöltené az összes oldalt.
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
