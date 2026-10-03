import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useMemberDepartures } from "@/hooks/use-member-departures";
import { useRouter } from "expo-router";
import { UserMinus } from "lucide-react-native";
import { useTranslation } from "react-i18next";

/** Tells an admin when a departed member's tasks still need a decision. Render only for admins. */
export function MemberDepartureBanner() {
  const { t } = useTranslation();
  const router = useRouter();
  const { departures } = useMemberDepartures();

  if (departures.length === 0) return null;

  const names = departures.map((departure) => departure.user.name).join(", ");

  return (
    <Alert icon={UserMinus}>
      <AlertTitle>{t("memberDepartures.bannerTitle", { count: departures.length })}</AlertTitle>
      <AlertDescription>{t("memberDepartures.bannerMessage", { names })}</AlertDescription>
      <Button size="sm" variant="outline" className="mb-2 mt-3 self-start" onPress={() => router.push("/member-departures")}>
        <Text>{t("memberDepartures.decide")}</Text>
      </Button>
    </Alert>
  );
}
