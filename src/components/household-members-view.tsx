import { alertError } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/context/AuthContext";
import { useHousehold } from "@/context/HouseholdContext";
import { householdUserService } from "@/services/api/HouseholdUserService";
import { HouseholdRole, HouseholdUser } from "@/types/household-user";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, FlatList, View } from "react-native";

const ROLES = ["admin", "user", "child"] as const;

export type MembersEntry = {
  data?: HouseholdUser[];
  promise: Promise<HouseholdUser[]>;
};

type Props = {
  householdId: number;
  getMembers: () => MembersEntry;
  onMembersChange: (members: HouseholdUser[]) => void;
  onBack: () => void;
};

export function HouseholdMembersView({
  householdId,
  getMembers,
  onMembersChange,
  onBack,
}: Props) {
  const { t } = useTranslation();
  const { user, token } = useAuth();
  const { households } = useHousehold();

  const parsedHouseholdId = householdId;
  const household = households.find((h) => h.id === parsedHouseholdId);

  const [initialEntry] = useState(getMembers);
  const [members, setMembers] = useState<HouseholdUser[]>(
    initialEntry.data ?? [],
  );
  const [loading, setLoading] = useState(!initialEntry.data);
  const [busyUserId, setBusyUserId] = useState<number | null>(null);

  useEffect(() => {
    if (initialEntry.data) return;
    let cancelled = false;
    initialEntry.promise
      .then((list) => {
        if (!cancelled) setMembers(list);
      })
      .catch((error) => {
        if (cancelled) return;
        alertError(error, t("members.loadFailed"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [initialEntry, t]);

  const updateMembers = (next: HouseholdUser[]) => {
    setMembers(next);
    onMembersChange(next);
  };

  const handleRoleChange = async (member: HouseholdUser, role: HouseholdRole) => {
    if (!token || role === member.role) return;
    try {
      setBusyUserId(member.user_id);
      const updated = await householdUserService.update(member.id, { role }, token);
      // A válasz nem tölti be a `user` relációt, ezért csak a szerepkört vesszük át.
      updateMembers(
        members.map((m) => (m.id === member.id ? { ...m, role: updated.role } : m)),
      );
    } catch (error) {
      alertError(error, t("members.roleFailed"));
    } finally {
      setBusyUserId(null);
    }
  };

  const handleRemove = (member: HouseholdUser) => {
    Alert.alert(
      t("members.removeTitle"),
      t("members.removeMessage", {
        name: member.user.name,
      }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("members.remove"),
          style: "destructive",
          onPress: async () => {
            if (!token) return;
            try {
              setBusyUserId(member.user_id);
              await householdUserService.remove(member.id, token);
              updateMembers(members.filter((m) => m.id !== member.id));
            } catch (error) {
              alertError(error, t("members.removeFailed"));
            } finally {
              setBusyUserId(null);
            }
          },
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: HouseholdUser }) => {
    const isOwner = household ? item.user_id === household.created_by : false;
    const isSelf = user?.id === item.user_id;
    const isBusy = busyUserId === item.user_id;

    const canEdit = !isOwner && !isSelf;

    return (
      <View className="mb-3 gap-3 rounded-card border border-border bg-card p-4">
        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-1">
            <Text variant="h4">
              {item.user.name}
            </Text>
            <Text variant="muted">
              {item.user.email}
              {isOwner ? ` · ${t("members.owner")}` : ""}
            </Text>
          </View>
          {canEdit && (
            <Button
              size="sm"
              variant="destructive"
              disabled={isBusy}
              onPress={() => handleRemove(item)}
            >
              <Text>{t("members.remove")}</Text>
            </Button>
          )}
        </View>
        {canEdit && (
          <View className={isBusy ? "opacity-50" : undefined} style={{ pointerEvents: isBusy ? "none" : "auto" }}>
            <SegmentedControl
              activeTone="primary"
              value={item.role}
              onChange={(role) => handleRoleChange(item, role)}
              options={ROLES.map((role) => ({ value: role, label: t(`members.roles.${role}`) }))}
            />
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" className="text-primary" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background p-6">
      <Text variant="h3" className="mb-1">
        {t("members.title")}
      </Text>
      <Text variant="muted" className="mb-6">
        {household?.name}
      </Text>

      <FlatList
        data={members}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        className="flex-1"
      />

      <View className="mt-4">
        <Button size="lg" variant="ghost" onPress={onBack}>
          <Text>{t("common.back")}</Text>
        </Button>
      </View>
    </View>
  );
}
