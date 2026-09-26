import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { Elevation } from "@/constants/theme";
import { formatTimeAgo } from "@/lib/format";
import { RewardRedemption, RewardRedemptionListResponse } from "@/types/reward";
import { Check } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, View } from "react-native";

interface RedemptionListProps {
  redemptions: RewardRedemptionListResponse;
  busyId: number | null;
  onFulfill: (redemptionId: number) => void;
}

/**
 * A nyitott beváltások: amelyeket a usernek kell teljesítenie (a saját jutalmai), és amelyekre ő vár.
 * A nem teljesített beváltás a feltöltő távozásakor visszatérítődik, ezért érdemes lezárni.
 */
export function RedemptionList({ redemptions, busyId, onFulfill }: RedemptionListProps) {
  const { t } = useTranslation();

  if (redemptions.to_fulfill.length === 0 && redemptions.waiting.length === 0) return null;

  return (
    <View className="gap-3">
      {redemptions.to_fulfill.length > 0 && (
        <RedemptionSection
          title={t("rewards.redemptions.toFulfill")}
          items={redemptions.to_fulfill}
          describe={(item) => t("rewards.redemptions.redeemedBy", { name: item.user?.name ?? "" })}
          actionLabel={t("rewards.redemptions.fulfill")}
          busyId={busyId}
          onFulfill={onFulfill}
        />
      )}
      {redemptions.waiting.length > 0 && (
        <RedemptionSection
          title={t("rewards.redemptions.waiting")}
          items={redemptions.waiting}
          describe={() => t("rewards.redemptions.waitingHint")}
          actionLabel={t("rewards.redemptions.received")}
          busyId={busyId}
          onFulfill={onFulfill}
        />
      )}
    </View>
  );
}

function RedemptionSection({
  title,
  items,
  describe,
  actionLabel,
  busyId,
  onFulfill,
}: {
  title: string;
  items: RewardRedemption[];
  describe: (item: RewardRedemption) => string;
  actionLabel: string;
  busyId: number | null;
  onFulfill: (redemptionId: number) => void;
}) {
  const { t } = useTranslation();

  return (
    <View className="gap-2">
      <Text className="px-1 text-label-md uppercase text-muted-foreground">{title}</Text>
      {items.map((item) => (
        <View key={item.id} className="flex-row items-center gap-3 rounded-card bg-card p-4" style={Elevation.level1}>
          <View className="flex-1 gap-0.5">
            <Text className="text-body-lg font-semibold">{item.reward?.name ?? ""}</Text>
            <Text className="text-body-sm text-muted-foreground">
              {describe(item)} · {formatTimeAgo(item.created_at, t)}
            </Text>
          </View>
          {busyId === item.id ? (
            <ActivityIndicator className="text-primary" />
          ) : (
            <Button size="sm" variant="outline" disabled={busyId !== null} onPress={() => onFulfill(item.id)}>
              <Icon as={Check} size={16} />
              <Text>{actionLabel}</Text>
            </Button>
          )}
        </View>
      ))}
    </View>
  );
}
