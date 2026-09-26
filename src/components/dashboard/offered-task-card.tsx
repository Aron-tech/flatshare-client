import { CategoryIconBadge } from "@/components/category-icon";
import { PointsChip } from "@/components/dashboard/points-chip";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { Elevation } from "@/constants/theme";
import { formatDue } from "@/lib/format";
import { TaskInstance } from "@/types/dashboard";
import { ArrowLeftRight } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, View } from "react-native";

interface OfferedTaskCardProps {
  /** Az `offered` lista eleme: az `offer` mindig ki van töltve. */
  item: TaskInstance;
  isBusy: boolean;
  onAccept: () => void;
}

/** Egy másik tag által átadásra felajánlott feladat: átvéve a feladat pontján felül a felajánlott jutalom is jár. */
export function OfferedTaskCard({ item, isBusy, onAccept }: OfferedTaskCardProps) {
  const { t } = useTranslation();
  const offer = item.offer!;
  const category = item.task.category;

  const confirmAccept = () => {
    Alert.alert(
      t("request.acceptTitle"),
      t("request.acceptMessage", { name: item.task.name, due: formatDue(item.due_at, t), count: offer.points }),
      [
        { text: t("common.cancel"), style: "cancel" },
        { text: t("request.acceptConfirm"), onPress: onAccept },
      ]
    );
  };

  return (
    <View className="gap-4 rounded-card bg-card p-4" style={Elevation.level1}>
      <View className="flex-row gap-3">
        <CategoryIconBadge
          color={category?.color}
          hints={[category?.icon, category?.name, item.task.icon, item.task.name]}
          shape="rounded"
        />
        <View className="flex-1 gap-0.5">
          <Text className="text-label-md uppercase text-primary">
            {offer.is_targeted
              ? t("request.offeredToYou", { name: offer.offered_by_name })
              : t("request.offeredBy", { name: offer.offered_by_name })}
          </Text>
          <Text className="text-headline-sm">{item.task.name}</Text>
          <Text variant="muted">{formatDue(item.due_at, t)}</Text>
        </View>
        <View className="items-end gap-1.5">
          <PointsChip points={item.points} claimers={item.claimers} />
          {offer.points > 0 && (
            <View className="rounded-full bg-primary-soft px-2.5 py-0.5">
              <Text className="text-label-md text-primary-soft-foreground">
                {t("request.bonusChip", { count: offer.points })}
              </Text>
            </View>
          )}
        </View>
      </View>
      <Button
        className="h-11 border border-success"
        variant="success"
        onPress={confirmAccept}
        disabled={isBusy}
        accessibilityLabel={t("request.acceptLabel", { name: item.task.name })}
      >
        {isBusy ? (
          <ActivityIndicator className="text-success-foreground" />
        ) : (
          <>
            <Icon as={ArrowLeftRight} size={16} className="text-success-foreground" />
            <Text>{t("request.accept")}</Text>
          </>
        )}
      </Button>
    </View>
  );
}
