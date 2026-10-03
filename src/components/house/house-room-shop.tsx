import { Button } from "@/components/ui/button";
import { ChipGroup } from "@/components/ui/chip-group";
import { Icon } from "@/components/ui/icon";
import { Progress } from "@/components/ui/progress";
import { Text } from "@/components/ui/text";
import { useHouseholdMutation, useHouseholdQuery } from "@/hooks/use-household-query";
import { HouseholdQueries } from "@/lib/queries";
import { houseService } from "@/services/api/HouseService";
import type { HouseMember, HouseRoomState } from "@/types/house";
import { Bath, CheckCircle2, CookingPot, type LucideIcon } from "lucide-react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

const ROOM_ICONS: Record<HouseRoomState["key"], LucideIcon> = {
  kitchen: CookingPot,
  bathroom: Bath,
};

/** Quick amounts; the largest is the missing points or the spendable points, whichever is smaller. */
const STEPS = [10, 50, 100] as const;

interface ContributeVariables {
  room: HouseRoomState["key"];
  amount: number;
}

function RoomCard({ room, members, spendable }: { room: HouseRoomState; members: HouseMember[]; spendable: number }) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState<number | null>(null);
  const contribute = useHouseholdMutation((householdId, token, variables: ContributeVariables) =>
    houseService.contributeToRoom(householdId, variables.room, variables.amount, token)
  );

  const missing = Math.max(0, room.price - room.collected);
  const max = Math.min(missing, spendable);
  const options = [...new Set([...STEPS.filter((step) => step < max), max])]
    .filter((value) => value > 0)
    .map((value) => ({ value, label: value === max ? t("house.rooms.all", { points: value }) : `+${value}` }));
  const selected = amount !== null && amount <= max ? amount : null;
  const names = room.contributors
    .map((contributor) => {
      const name = members.find((member) => member.user_id === contributor.user_id)?.name;
      return name ? `${name} (${contributor.amount})` : null;
    })
    .filter(Boolean)
    .join(", ");

  const submit = async () => {
    if (selected === null) return;
    const result = await contribute.run({ room: room.key, amount: selected });
    // HttpClient already shows the success message.
    if (result) setAmount(null);
  };

  return (
    <View className="gap-3 rounded-container border border-border bg-card p-4">
      <View className="flex-row items-center gap-3">
        <View className="h-9 w-9 items-center justify-center rounded-full bg-primary-soft">
          <Icon as={ROOM_ICONS[room.key]} size={18} className="text-primary" />
        </View>
        <View className="flex-1">
          <Text className="text-label-lg">{t(`house.rooms.names.${room.key}`)}</Text>
          <Text className="text-body-sm text-muted-foreground">
            {t("house.rooms.zones", { zones: room.zones.map((zone) => t(`house.zones.${zone}`)).join(", ") })}
          </Text>
        </View>
        {room.unlocked && <Icon as={CheckCircle2} size={20} className="text-success-active" />}
      </View>

      {room.unlocked ? (
        <Text className="text-body-md text-success-active">{t("house.rooms.unlocked")}</Text>
      ) : (
        <>
          <View className="gap-1">
            <Progress value={(room.collected / room.price) * 100} />
            <Text className="text-body-sm text-muted-foreground">
              {t("house.rooms.progress", { collected: room.collected, price: room.price })}
            </Text>
          </View>
          {max > 0 ? (
            <>
              <ChipGroup options={options} value={selected} onChange={setAmount} />
              <Button disabled={selected === null || contribute.pending !== null} onPress={() => void submit()}>
                <Text>{selected === null ? t("house.rooms.choose") : t("house.rooms.contribute", { points: selected })}</Text>
              </Button>
            </>
          ) : (
            <Text className="text-body-sm text-muted-foreground">{t("house.rooms.noPoints")}</Text>
          )}
        </>
      )}

      {names !== "" && <Text className="text-body-sm text-muted-foreground">{t("house.rooms.contributors", { names })}</Text>}
    </View>
  );
}

/**
 * The room shop: members collect points together for a new room (from their spendable points).
 * When the price is reached the room is built and takes over its zones.
 */
export function HouseRoomShop({ rooms, members }: { rooms: HouseRoomState[]; members: HouseMember[] }) {
  const { t } = useTranslation();
  const { data: me } = useHouseholdQuery(HouseholdQueries.me);
  const spendable = me?.spendable_points ?? 0;

  return (
    <View className="gap-3">
      <Text className="px-1 text-body-md text-muted-foreground">{t("house.rooms.intro", { points: spendable })}</Text>
      {rooms.map((room) => (
        <RoomCard key={room.key} room={room} members={members} spendable={spendable} />
      ))}
    </View>
  );
}
