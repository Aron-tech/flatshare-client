import { CategoryIconBadge } from "@/components/category-icon";
import { Button } from "@/components/ui/button";
import { ChipGroup } from "@/components/ui/chip-group";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import { Elevation } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useHouseholdMembers } from "@/hooks/use-household-members";
import { formatDue, isOverdue } from "@/lib/format";
import { CreateTaskOfferDto, TaskInstance } from "@/types/dashboard";
import { ArrowLeftRight, CalendarClock } from "lucide-react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Modal, Pressable, ScrollView, View } from "react-native";

/** Egy türelmi nap ennyi órával tolja ki a határidőt (backend: `TaskInstanceUser::GRACE_HOURS`). */
const GRACE_HOURS = 24;
const ANYONE = 0;

interface ClaimRequestSheetProps {
  /** A vállalt feladat; null, ha a sheet zárva van. */
  item: TaskInstance | null;
  graceDaysLeft: number;
  spendablePoints: number;
  isBusy: boolean;
  onClose: () => void;
  onGraceDay: () => void;
  onOffer: (dto: CreateTaskOfferDto) => void;
  onCancelOffer: (offerId: number) => void;
}

/**
 * Csere vagy türelmi nap kérése egy vállalt, határidős feladatra:
 * türelmi nap (jóváhagyás nélkül, ciklusonként 1) vagy átadás pont-ajánlattal (a pont zárolódik, az átvevő a teljesítéskor kapja meg).
 */
export function ClaimRequestSheet(props: ClaimRequestSheetProps) {
  return (
    <Modal visible={props.item !== null} transparent animationType="fade" onRequestClose={props.onClose}>
      {/* A `key` miatt másik feladat megnyitásakor az űrlap alapállapotba kerül. */}
      {props.item && <SheetBody key={props.item.id} {...props} item={props.item} />}
    </Modal>
  );
}

function SheetBody({
  item,
  graceDaysLeft,
  spendablePoints,
  isBusy,
  onClose,
  onGraceDay,
  onOffer,
  onCancelOffer,
}: ClaimRequestSheetProps & { item: TaskInstance }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const members = useHouseholdMembers().filter((member) => member.user_id !== user?.id);
  const minPoints = item.min_offer_points ?? 0;
  const [pointsText, setPointsText] = useState(String(minPoints));
  const [targetId, setTargetId] = useState<number>(ANYONE);

  const overdue = isOverdue(item.due_at);
  const graceBlocker = !item.due_at
    ? t("request.graceNoDue")
    : overdue
      ? t("request.graceOverdue")
      : item.grace_granted_at
        ? t("request.graceAlreadyUsed")
        : graceDaysLeft <= 0
          ? t("request.graceQuotaUsed")
          : null;

  const points = Number.parseInt(pointsText, 10);
  const offerBlocker = !item.due_at || overdue
    ? t("request.offerNoDue")
    : Number.isNaN(points) || points < minPoints
      ? t("request.offerBelowMin", { count: minPoints })
      : points > spendablePoints
        ? t("request.offerNotEnough", { count: spendablePoints })
        : null;

  return (
    <Pressable onPress={onClose} className="flex-1 items-center justify-center bg-black/40 p-6">
      <Pressable
        onPress={(e) => e.stopPropagation()}
        className="max-h-full w-full max-w-sm rounded-card bg-popover"
        style={Elevation.level2}
      >
        <ScrollView contentContainerClassName="gap-5 p-6" keyboardShouldPersistTaps="handled">
          <View className="flex-row items-center gap-3">
            <CategoryIconBadge
              color={item.task.category?.color}
              hints={[item.task.category?.icon, item.task.category?.name, item.task.icon, item.task.name]}
              shape="rounded"
              size={44}
            />
            <View className="flex-1 gap-0.5">
              <Text className="font-serif text-headline-sm">{item.task.name}</Text>
              <Text variant="muted">{formatDue(item.due_at, t)}</Text>
            </View>
          </View>

          {item.is_penalty && (
            <Text className="text-body-sm text-muted-foreground">{t("request.penaltyHint", { count: minPoints })}</Text>
          )}

          <View className="gap-3">
            <View className="flex-row items-center gap-2">
              <Icon as={CalendarClock} size={18} className="text-primary" />
              <Text className="text-label-md uppercase text-muted-foreground">{t("request.graceTitle")}</Text>
            </View>
            <Text className="text-body-md">
              {t("request.graceDescription", { hours: GRACE_HOURS, count: graceDaysLeft })}
            </Text>
            {graceBlocker && <Text className="text-body-sm text-muted-foreground">{graceBlocker}</Text>}
            <Button variant="secondary" disabled={isBusy || graceBlocker !== null} onPress={onGraceDay}>
              <Text>{t("request.graceAction", { hours: GRACE_HOURS })}</Text>
            </Button>
          </View>

          <Separator />

          <View className="gap-3">
            <View className="flex-row items-center gap-2">
              <Icon as={ArrowLeftRight} size={18} className="text-primary" />
              <Text className="text-label-md uppercase text-muted-foreground">{t("request.offerTitle")}</Text>
            </View>

            {item.my_offer ? (
              <>
                <Text className="text-body-md">
                  {t("request.offerOpen", {
                    count: item.my_offer.points,
                    target: item.my_offer.target_name ?? t("request.anyone"),
                  })}
                </Text>
                <Button variant="outline" disabled={isBusy} onPress={() => onCancelOffer(item.my_offer!.id)}>
                  <Text>{t("request.offerCancel")}</Text>
                </Button>
              </>
            ) : (
              <>
                <Text className="text-body-md">{t("request.offerDescription")}</Text>
                <View className="gap-1.5">
                  <Text className="text-label-lg">{t("request.offerPoints")}</Text>
                  <Input
                    value={pointsText}
                    onChangeText={(text) => setPointsText(text.replace(/[^0-9]/g, ""))}
                    keyboardType="number-pad"
                    editable={!isBusy}
                    accessibilityLabel={t("request.offerPoints")}
                  />
                  <Text variant="muted">
                    {minPoints > 0
                      ? t("request.offerLimitsPenalty", { min: minPoints, count: spendablePoints })
                      : t("request.offerLimits", { count: spendablePoints })}
                  </Text>
                </View>
                {members.length > 1 && (
                  <View className="gap-1.5">
                    <Text className="text-label-lg">{t("request.offerTarget")}</Text>
                    <ChipGroup
                      value={targetId}
                      onChange={setTargetId}
                      options={[
                        { value: ANYONE, label: t("request.anyone") },
                        ...members.map((member) => ({ value: member.user_id, label: member.name })),
                      ]}
                    />
                  </View>
                )}
                {offerBlocker && <Text className="text-body-sm text-destructive">{offerBlocker}</Text>}
                <Button
                  disabled={isBusy || offerBlocker !== null}
                  onPress={() => onOffer({ points, target_user_id: targetId === ANYONE ? null : targetId })}
                >
                  <Text>{t("request.offerAction")}</Text>
                </Button>
              </>
            )}
          </View>

          {isBusy && <ActivityIndicator className="text-primary" />}

          <Button variant="ghost" onPress={onClose}>
            <Text>{t("common.close")}</Text>
          </Button>
        </ScrollView>
      </Pressable>
    </Pressable>
  );
}
