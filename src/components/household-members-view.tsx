import { alertError } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Text } from "@/components/ui/text";
import { Config } from "@/config/env";
import { useAuth } from "@/context/AuthContext";
import { useHousehold } from "@/context/HouseholdContext";
import { householdKey, HouseholdQueries } from "@/lib/queries";
import { householdUserService } from "@/services/api/HouseholdUserService";
import { HouseholdRole, HouseholdUser } from "@/types/household-user";
import { skipToken, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, FlatList, Linking, View } from "react-native";

const ROLES = ["admin", "user", "child"] as const;

/** A row in the list; `householdUser` only exists for the creator (for editing). */
type MemberRow = {
  userId: number;
  name: string;
  householdUser: HouseholdUser | null;
};

type Props = {
  householdId: number;
  onBack: () => void;
};

/**
 * Member list. The creator can change roles and remove a member; anyone can report the other members
 * (App Review 1.2: user content needs a reporting option). The report goes to the support address by e-mail.
 */
export function HouseholdMembersView({ householdId, onBack }: Props) {
  const { t } = useTranslation();
  const { user, token } = useAuth();
  const { households } = useHousehold();
  const queryClient = useQueryClient();
  const household = households.find((h) => h.id === householdId);
  const viewerIsOwner = household ? user?.id === household.created_by : false;

  // The full list (role, e-mail) is for admins only; other members get the name list.
  const membersKey = HouseholdQueries.householdUsers.key(householdId);
  const fullList = useQuery({
    queryKey: membersKey,
    queryFn: token && viewerIsOwner ? () => HouseholdQueries.householdUsers.fetch(householdId, token) : skipToken,
  });
  const nameList = useQuery({
    queryKey: HouseholdQueries.members.key(householdId),
    queryFn: token && !viewerIsOwner ? () => HouseholdQueries.members.fetch(householdId, token) : skipToken,
  });
  const isPending = viewerIsOwner ? fullList.isPending : nameList.isPending;
  const rows: MemberRow[] = viewerIsOwner
    ? (fullList.data ?? []).map((m) => ({ userId: m.user_id, name: m.user.name, householdUser: m }))
    : (nameList.data ?? []).map((m) => ({ userId: m.user_id, name: m.name, householdUser: null }));
  const [busyUserId, setBusyUserId] = useState<number | null>(null);

  /** Refreshes the list immediately, then the household's other data (points, stats…) too. */
  const updateMembers = (update: (current: HouseholdUser[]) => HouseholdUser[]) => {
    queryClient.setQueryData<HouseholdUser[]>(membersKey, (current) => update(current ?? []));
    void queryClient.invalidateQueries({ queryKey: householdKey(householdId) });
  };

  const handleRoleChange = async (member: HouseholdUser, role: HouseholdRole) => {
    if (!token || role === member.role) return;
    try {
      setBusyUserId(member.user_id);
      const updated = await householdUserService.update(member.id, { role }, token);
      // The response does not load the `user` relation, so only the role is taken over.
      updateMembers((current) => current.map((m) => (m.id === member.id ? { ...m, role: updated.role } : m)));
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
              updateMembers((current) => current.filter((m) => m.id !== member.id));
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

  /** Prefilled e-mail to support; without a mail client it shows the address. */
  const handleReport = (member: MemberRow) => {
    const subject = t("members.reportSubject", { name: member.name });
    const body = t("members.reportBody", {
      household: household?.name ?? "",
      householdId,
      name: member.name,
      userId: member.userId,
    });
    Linking.openURL(
      `mailto:${Config.SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
    ).catch(() => Alert.alert(t("members.report"), t("members.reportFallback", { email: Config.SUPPORT_EMAIL })));
  };

  const renderItem = ({ item }: { item: MemberRow }) => {
    const isOwner = household ? item.userId === household.created_by : false;
    const isSelf = user?.id === item.userId;
    const isBusy = busyUserId === item.userId;
    const member = item.householdUser;

    const canEdit = member !== null && !isOwner && !isSelf;
    const details = [member?.user.email, isOwner ? t("members.owner") : null].filter(Boolean).join(" · ");

    return (
      <View className="mb-3 gap-3 rounded-card border border-border bg-card p-4">
        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-1">
            <Text variant="h4">
              {item.name}
            </Text>
            {details !== "" && <Text variant="muted">{details}</Text>}
          </View>
          {!isSelf && (
            <Button size="sm" variant="outline" onPress={() => handleReport(item)}>
              <Text>{t("members.report")}</Text>
            </Button>
          )}
          {canEdit && (
            <Button
              size="sm"
              variant="destructive"
              disabled={isBusy}
              onPress={() => handleRemove(member)}
            >
              <Text>{t("members.remove")}</Text>
            </Button>
          )}
        </View>
        {canEdit && (
          <View className={isBusy ? "opacity-50" : undefined} style={{ pointerEvents: isBusy ? "none" : "auto" }}>
            <SegmentedControl
              activeTone="primary"
              value={member.role}
              onChange={(role) => handleRoleChange(member, role)}
              options={ROLES.map((role) => ({ value: role, label: t(`members.roles.${role}`) }))}
            />
          </View>
        )}
      </View>
    );
  };

  if (isPending && token) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" className="text-primary" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background p-6">
      <Text variant="h3" className="mb-1">
        {viewerIsOwner ? t("members.title") : t("members.listTitle")}
      </Text>
      <Text variant="muted" className="mb-6">
        {household?.name}
      </Text>

      <FlatList
        data={rows}
        keyExtractor={(item) => item.userId.toString()}
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
