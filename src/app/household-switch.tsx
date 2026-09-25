import { alertError } from "@/lib/errors";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  HouseholdMembersView,
  MembersEntry,
} from "@/components/household-members-view";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { Elevation } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useHousehold } from "@/context/HouseholdContext";
import { householdUserService } from "@/services/api/HouseholdUserService";
import { Household } from "@/types/household";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import {
  Check,
  LogOut,
  Pencil,
  QrCode,
  Trash2,
  Users,
  X,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Modal,
  Pressable,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { SvgXml } from "react-native-svg";

export default function HouseholdSwitchScreen() {
  const { t } = useTranslation();
  const { user, token } = useAuth();
  const {
    households,
    activeHousehold,
    selectHousehold,
    renameHousehold,
    leaveHousehold,
    deleteHousehold,
    getHouseholdQrCode,
  } = useHousehold();
  const router = useRouter();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [isManaging, setIsManaging] = useState(false);
  const [membersHouseholdId, setMembersHouseholdId] = useState<number | null>(
    null,
  );
  const [qrTarget, setQrTarget] = useState<Household | null>(null);
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  // Lusta inicializálás: nem jön létre minden renderkor új Animated.Value.
  const [copiedOpacity] = useState(() => new Animated.Value(0));

  const membersCache = useRef(new Map<number, MembersEntry>());

  const getMembersEntry = (householdId: number): MembersEntry => {
    const cached = membersCache.current.get(householdId);
    if (cached) return cached;
    const entry: MembersEntry = {
      promise: householdUserService
        .getByHousehold(householdId, token ?? "")
        .then((list) => {
          entry.data = list;
          return list;
        })
        .catch((error) => {
          if (membersCache.current.get(householdId) === entry) {
            membersCache.current.delete(householdId);
          }
          throw error;
        }),
    };
    membersCache.current.set(householdId, entry);
    return entry;
  };

  // Háttérben előtöltjük a tagokat, hogy a "Tagok kezelése" azonnal nyíljon.
  useEffect(() => {
    if (!isManaging || !token) return;
    households
      .filter((h) => h.created_by === user?.id)
      .forEach((h) => {
        getMembersEntry(h.id).promise.catch(() => {});
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isManaging, token, households, user?.id]);

  const handleSelect = async (id: number) => {
    if (isManaging) return;
    await selectHousehold(id);
    router.dismissTo("/");
  };

  const stopManaging = () => {
    cancelEdit();
    membersCache.current.clear();
    setIsManaging(false);
  };

  const openQrCode = async (item: Household) => {
    setQrTarget(item);
    setQrSvg(null);
    setQrLoading(true);
    try {
      const svg = await getHouseholdQrCode(item.id);
      setQrSvg(svg);
    } catch (error) {
      alertError(error, t("switch.qrLoadFailed"));
      setQrTarget(null);
    } finally {
      setQrLoading(false);
    }
  };

  const closeQrCode = () => {
    setQrTarget(null);
    setQrSvg(null);
  };

  const copyCodeToClipboard = async (code: string) => {
    await Clipboard.setStringAsync(code);
    copiedOpacity.stopAnimation();
    Animated.sequence([
      Animated.timing(copiedOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.delay(900),
      Animated.timing(copiedOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const startEdit = (item: Household) => {
    setEditingId(item.id);
    setEditValue(item.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const confirmEdit = async (item: Household) => {
    const trimmed = editValue.trim();
    if (!trimmed) {
      Alert.alert(t("common.error"), t("switch.nameRequired"));
      return;
    }
    if (trimmed === item.name) {
      cancelEdit();
      return;
    }

    try {
      setBusyId(item.id);
      await renameHousehold(item.id, trimmed);
      cancelEdit();
    } catch (error) {
      alertError(error, t("switch.renameFailed"));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = (item: Household) => {
    Alert.alert(
      t("switch.deleteTitle"),
      t("switch.deleteMessage", { name: item.name }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              setBusyId(item.id);
              await deleteHousehold(item.id);
            } catch (error) {
              alertError(error, t("switch.deleteFailed"));
            } finally {
              setBusyId(null);
            }
          },
        },
      ],
    );
  };

  const handleLeave = (item: Household) => {
    Alert.alert(
      t("switch.leaveTitle"),
      t("switch.leaveMessage", { name: item.name }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("switch.leave"),
          style: "destructive",
          onPress: async () => {
            try {
              setBusyId(item.id);
              await leaveHousehold(item.id);
            } catch (error) {
              alertError(error, t("switch.leaveFailed"));
            } finally {
              setBusyId(null);
            }
          },
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: Household }) => {
    const isSelected = activeHousehold?.id === item.id;
    const isOwner = user?.id === item.created_by;
    const isEditing = editingId === item.id;
    const isBusy = busyId === item.id;

    if (isEditing) {
      return (
        <View className="mb-3 flex-row items-center gap-2 rounded-card border border-primary bg-primary-soft p-4">
          <Input
            value={editValue}
            onChangeText={setEditValue}
            autoFocus
            editable={!isBusy}
            className="h-11 flex-1"
          />
          <Button
            size="icon"
            variant="default"
            disabled={isBusy}
            onPress={() => confirmEdit(item)}
            accessibilityLabel={t("common.save")}
          >
            <Icon as={Check} size={18} className="text-primary-foreground" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            disabled={isBusy}
            onPress={cancelEdit}
            accessibilityLabel={t("common.cancel")}
          >
            <Icon as={X} size={18} />
          </Button>
        </View>
      );
    }

    return (
      <View
        className={`mb-3 rounded-card border p-4 ${
          isSelected && !isManaging
            ? "border-primary bg-primary-soft"
            : "border-border bg-card"
        }`}
      >
        <Pressable
          onPress={() => handleSelect(item.id)}
          className="flex-row items-center justify-between"
        >
          <Text variant="h4">{item.name}</Text>
          {isSelected && !isManaging && (
            <Badge>
              <Text>{t("switch.active")}</Text>
            </Badge>
          )}
        </Pressable>

        {isManaging && (
          <View className="mt-3 flex-row items-start justify-between gap-2">
            <Button
              size="icon"
              variant="outline"
              onPress={() => openQrCode(item)}
              accessibilityLabel={t("switch.showCode")}
            >
              <Icon as={QrCode} size={18} />
            </Button>
            <View className="flex-1 flex-row flex-wrap justify-end gap-2">
              {isOwner ? (
                <>
                  <Button
                    size="icon"
                    variant="outline"
                    disabled={isBusy}
                    onPress={() => startEdit(item)}
                    accessibilityLabel={t("switch.rename")}
                  >
                    <Icon as={Pencil} size={18} />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    disabled={isBusy}
                    onPress={() => setMembersHouseholdId(item.id)}
                    accessibilityLabel={t("switch.manageMembers")}
                  >
                    <Icon as={Users} size={18} />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    disabled={isBusy}
                    onPress={() => handleDelete(item)}
                    accessibilityLabel={t("common.delete")}
                  >
                    <Icon as={Trash2} size={18} className="text-white" />
                  </Button>
                </>
              ) : (
                <Button
                  size="icon"
                  variant="destructive"
                  disabled={isBusy}
                  onPress={() => handleLeave(item)}
                  accessibilityLabel={t("switch.leave")}
                >
                  <Icon as={LogOut} size={18} className="text-white" />
                </Button>
              )}
            </View>
          </View>
        )}
      </View>
    );
  };

  if (membersHouseholdId !== null) {
    return (
      <HouseholdMembersView
        householdId={membersHouseholdId}
        getMembers={() => getMembersEntry(membersHouseholdId)}
        onMembersChange={(list) => {
          const entry = membersCache.current.get(membersHouseholdId);
          if (entry) entry.data = list;
        }}
        onBack={() => setMembersHouseholdId(null)}
      />
    );
  }

  return (
    <View className="flex-1 bg-background p-6">
      <Text variant="h3" className="mb-1">
        {isManaging ? t("switch.manageTitle") : t("switch.switchTitle")}
      </Text>
      <Text variant="muted" className="mb-6">
        {t("switch.subtitle")}
      </Text>

      <FlatList
        data={households}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        className="flex-1"
      />

      <View className="mt-4 gap-3">
        {isManaging ? (
          <Button size="lg" variant="default" onPress={stopManaging}>
            <Text>{t("switch.done")}</Text>
          </Button>
        ) : (
          <>
            <Button
              size="lg"
              variant="outline"
              onPress={() => router.push("/household-setup")}
            >
              <Text>{t("switch.newOrJoin")}</Text>
            </Button>
            <Button
              size="lg"
              variant="outline"
              onPress={() => setIsManaging(true)}
            >
              <Text>{t("switch.manageTitle")}</Text>
            </Button>
            <Button size="lg" variant="ghost" onPress={() => router.back()}>
              <Text>{t("common.cancel")}</Text>
            </Button>
          </>
        )}
      </View>

      <Modal
        visible={qrTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={closeQrCode}
      >
        <Pressable
          onPress={closeQrCode}
          className="flex-1 items-center justify-center bg-black/40 p-6"
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="w-full max-w-sm items-center gap-4 rounded-card bg-popover p-6"
            style={Elevation.level2}
          >
            <Text variant="h4">
              {qrTarget?.name}
            </Text>

            {qrLoading ? (
              <ActivityIndicator size="large" className="text-primary" />
            ) : (
              qrSvg && (
                <View className="items-center justify-center rounded-container bg-white p-4">
                  <SvgXml xml={qrSvg} width={220} height={220} />
                </View>
              )
            )}

            {qrTarget && (
              <View className="items-center gap-1">
                <Pressable
                  onPress={() => copyCodeToClipboard(qrTarget.join_code)}
                >
                  <Text className="tracking-widest text-muted-foreground">
                    {t("switch.code", { code: qrTarget.join_code })}
                  </Text>
                </Pressable>
                <Animated.View style={{ opacity: copiedOpacity }}>
                  <Text className="text-label-md text-primary">
                    {t("switch.codeCopied")}
                  </Text>
                </Animated.View>
              </View>
            )}

            <Button size="lg" variant="ghost" onPress={closeQrCode}>
              <Text>{t("common.close")}</Text>
            </Button>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
