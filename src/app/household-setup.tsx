import { alertError } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/context/AuthContext";
import { useHousehold } from "@/context/HouseholdContext";
import { householdService } from "@/services/api/HouseholdService";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, View } from "react-native";

type SetupStep = "SELECTION" | "CREATE" | "JOIN_INPUT" | "JOIN_SCANNER";

export default function HouseholdSetupScreen() {
  const { t } = useTranslation();
  const { token } = useAuth();
  const { refreshHouseholds, selectHousehold } = useHousehold();
  const router = useRouter();

  const [step, setStep] = useState<SetupStep>("SELECTION");
  const [householdName, setHouseholdName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const handleHouseholdSuccess = useCallback(
    async (householdId: number) => {
      await refreshHouseholds();
      await selectHousehold(householdId);
      router.dismissTo("/");
    },
    [refreshHouseholds, selectHousehold, router],
  );

  const handleCreate = async () => {
    if (!householdName.trim()) {
      Alert.alert(t("common.error"), t("setup.nameRequired"));
      return;
    }
    if (!token) return;

    try {
      setLoading(true);
      const household = await householdService.create(
        { name: householdName.trim() },
        token,
      );
      await handleHouseholdSuccess(household.id);
    } catch (error) {
      alertError(error, t("setup.createFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleJoinByCode = async (codeToSubmit: string) => {
    const sanitized = codeToSubmit.replace(/\D/g, "").slice(0, 10);
    if (sanitized.length !== 10) {
      Alert.alert(t("common.error"), t("setup.invalidCode"));
      return;
    }
    if (!token) return;

    try {
      setLoading(true);
      const household = await householdService.join({ code: sanitized }, token);
      await handleHouseholdSuccess(household.id);
    } catch (error) {
      alertError(error, t("setup.joinFailed"));
    } finally {
      setLoading(false);
    }
  };

  const startScanner = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert(t("setup.permissionDenied"), t("setup.cameraRequired"));
        return;
      }
    }
    setStep("JOIN_SCANNER");
  };

  const onBarcodeScanned = (scannedData: string) => {
    const extractedCode = scannedData.trim().replace(/\D/g, "");
    if (extractedCode.length === 10) {
      setStep("JOIN_INPUT");
      setInviteCode(extractedCode);
      handleJoinByCode(extractedCode);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" className="text-primary" />
      </View>
    );
  }

  return (
    <View className="flex-1 justify-center bg-background p-6">
      {step === "SELECTION" && (
        <View className="w-full gap-4">
          <Text variant="h1" className="mb-2">
            {t("setup.welcome")}
          </Text>
          <Text variant="lead" className="mb-6 text-center">
            {t("setup.intro")}
          </Text>
          <Button size="lg" variant="default" onPress={() => setStep("CREATE")}>
            <Text>{t("setup.createNew")}</Text>
          </Button>
          <Button
            size="lg"
            variant="outline"
            onPress={() => setStep("JOIN_INPUT")}
          >
            <Text>{t("setup.joinExisting")}</Text>
          </Button>
        </View>
      )}

      {step === "CREATE" && (
        <View className="w-full gap-4">
          <Text variant="h3" className="mb-2">
            {t("setup.newHousehold")}
          </Text>
          <Input
            placeholder={t("setup.householdNamePlaceholder")}
            value={householdName}
            onChangeText={setHouseholdName}
          />
          <Button size="lg" variant="default" onPress={handleCreate}>
            <Text>{t("setup.create")}</Text>
          </Button>
          <Button
            size="lg"
            variant="ghost"
            onPress={() => setStep("SELECTION")}
          >
            <Text>{t("common.back")}</Text>
          </Button>
        </View>
      )}

      {step === "JOIN_INPUT" && (
        <View className="w-full gap-4">
          <Text variant="h3" className="mb-2">
            {t("setup.joinByCodeTitle")}
          </Text>
          <Input
            placeholder={t("setup.codePlaceholder")}
            value={inviteCode}
            onChangeText={(val) =>
              setInviteCode(val.replace(/\D/g, "").slice(0, 10))
            }
            keyboardType="numeric"
            maxLength={10}
            className="text-center text-headline-sm font-sans tracking-widest"
          />
          <Button
            size="lg"
            variant="default"
            onPress={() => handleJoinByCode(inviteCode)}
          >
            <Text>{t("setup.joinByCode")}</Text>
          </Button>
          <Button size="lg" variant="outline" onPress={startScanner}>
            <Text>{t("setup.scanQr")}</Text>
          </Button>
          <Button
            size="lg"
            variant="ghost"
            onPress={() => setStep("SELECTION")}
          >
            <Text>{t("common.back")}</Text>
          </Button>
        </View>
      )}

      {step === "JOIN_SCANNER" && (
        <View className="flex-1 overflow-hidden rounded-card">
          <CameraView
            style={{ flex: 1 }}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={({ data }) => onBarcodeScanned(data)}
          />
          <View className="absolute bottom-6 left-6 right-6">
            <Button
              size="lg"
              variant="secondary"
              onPress={() => setStep("JOIN_INPUT")}
            >
              <Text>{t("common.close")}</Text>
            </Button>
          </View>
        </View>
      )}
    </View>
  );
}
