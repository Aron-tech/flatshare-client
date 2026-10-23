import { Emblem } from "@/components/brand/emblem";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Progress } from "@/components/ui/progress";
import { Text } from "@/components/ui/text";
import { Elevation } from "@/constants/theme";
import { finishOnboarding, useOnboarding } from "@/hooks/use-onboarding";
import { useThemeColors } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";
import { withAlpha } from "@/theme/palettes";
import {
  ArrowLeftRight,
  Circle,
  Gift,
  House,
  type LucideIcon,
  PawPrint,
  Plus,
  Sticker,
} from "lucide-react-native";
import { type ReactNode, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Modal,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const STEPS = ["welcome", "tasks", "pool", "points", "house"] as const;
type Step = (typeof STEPS)[number];

const MAX_PAGE_WIDTH = 480;

function MockCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <View className={cn("w-full rounded-card border border-border bg-card p-4", className)} style={Elevation.level1}>
      {children}
    </View>
  );
}

function TaskMock() {
  const { t } = useTranslation();
  return (
    <MockCard className="gap-3">
      <View className="flex-row items-center gap-3">
        <Icon as={Circle} size={30} strokeWidth={2} className="text-primary" />
        <View className="flex-1">
          <Text className="text-body-lg font-semibold">{t("onboarding.sample.task")}</Text>
          <Text variant="muted" className="text-body-sm">
            {t("onboarding.sample.due")}
          </Text>
        </View>
        <Text className="text-label-lg text-success-soft-foreground">{t("dashboard.plusPoints", { count: 15 })}</Text>
      </View>
      <View className="flex-row items-center gap-1.5 self-start rounded-full bg-muted px-3 py-1">
        <Icon as={ArrowLeftRight} size={14} className="text-muted-foreground" />
        <Text className="text-label-md text-muted-foreground">{t("request.cardLink")}</Text>
      </View>
    </MockCard>
  );
}

function PoolMock() {
  const { t } = useTranslation();
  const { primaryActive } = useThemeColors();
  return (
    <View className="w-full items-center gap-6">
      <View className="w-full flex-row rounded-full bg-muted p-1">
        <View className="flex-1 items-center rounded-full py-2">
          <Text className="text-label-lg text-muted-foreground">{t("dashboard.myTasks")}</Text>
        </View>
        <View className="flex-1 items-center rounded-full bg-card py-2" style={Elevation.level1}>
          <Text className="text-label-lg">{t("dashboard.instantPool")}</Text>
        </View>
      </View>
      <View
        className="h-16 w-16 items-center justify-center rounded-full bg-primary"
        style={{ boxShadow: `0px 10px 24px -6px ${withAlpha(primaryActive, 0.55)}` }}
      >
        <Icon as={Plus} size={30} strokeWidth={2.5} className="text-primary-foreground" />
      </View>
    </View>
  );
}

function PointsMock() {
  const { t } = useTranslation();
  return (
    <MockCard className="gap-3">
      <View className="flex-row items-baseline justify-between">
        <Text className="text-label-md uppercase text-muted-foreground">{t("dashboard.myPoints")}</Text>
        <Text className="text-label-lg">
          45 <Text className="text-label-lg text-muted-foreground">{t("dashboard.ofPoints", { count: 60 })}</Text>
        </Text>
      </View>
      <Progress value={75} />
      <View className="flex-row items-center gap-2 pt-1">
        <Icon as={Gift} size={18} className="text-primary" />
        <Text className="text-body-sm text-muted-foreground">{t("onboarding.sample.reward")}</Text>
      </View>
    </MockCard>
  );
}

function IconCluster({ main, satellites }: { main: LucideIcon; satellites: [LucideIcon, LucideIcon] }) {
  return (
    <View className="h-36 w-36 items-center justify-center">
      <View className="h-28 w-28 items-center justify-center rounded-full bg-primary/10">
        <Icon as={main} size={52} strokeWidth={1.75} className="text-primary" />
      </View>
      <View className="absolute right-0 top-1 rounded-full bg-card p-2.5" style={Elevation.level1}>
        <Icon as={satellites[0]} size={22} className="text-success-soft-foreground" />
      </View>
      <View className="absolute bottom-1 left-0 rounded-full bg-card p-2.5" style={Elevation.level1}>
        <Icon as={satellites[1]} size={22} className="text-primary" />
      </View>
    </View>
  );
}

const ILLUSTRATIONS: Record<Step, () => ReactNode> = {
  welcome: () => <Emblem size={112} />,
  tasks: () => <TaskMock />,
  pool: () => <PoolMock />,
  points: () => <PointsMock />,
  house: () => <IconCluster main={House} satellites={[PawPrint, Sticker]} />,
};

/**
 * First-run tour: five swipeable cards, each showing a small replica of the real UI element and where
 * to find it. Shown once after the user first reaches a household; Settings can reopen it.
 */
export function OnboardingTour({ active }: { active: boolean }) {
  const { t } = useTranslation();
  const status = useOnboarding();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const pageWidth = Math.min(width, MAX_PAGE_WIDTH);
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);

  if (!active || status !== "open") return null;

  const isLast = index === STEPS.length - 1;

  const close = () => {
    finishOnboarding();
    setIndex(0);
  };

  const goTo = (next: number) => {
    scrollRef.current?.scrollTo({ x: next * pageWidth, animated: true });
    setIndex(next);
  };

  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) =>
    setIndex(Math.round(event.nativeEvent.contentOffset.x / pageWidth));

  return (
    <Modal visible animationType="fade" onRequestClose={close}>
      <View
        className="flex-1 items-center bg-background"
        style={{ paddingTop: insets.top + 8, paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <View className="w-full flex-row justify-end px-5" style={{ maxWidth: MAX_PAGE_WIDTH }}>
          <Pressable
            onPress={close}
            accessibilityRole="button"
            hitSlop={12}
            className={cn("rounded-full px-3 py-1.5 active:bg-muted", isLast && "opacity-0")}
            disabled={isLast}
          >
            <Text className="text-label-lg text-muted-foreground">{t("onboarding.skip")}</Text>
          </Pressable>
        </View>

        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScrollEnd}
          style={{ width: pageWidth, flexGrow: 1 }}
        >
          {STEPS.map((step, i) => (
            <View
              key={step}
              style={{ width: pageWidth }}
              className="justify-center gap-8 px-8"
              accessibilityElementsHidden={i !== index}
              importantForAccessibility={i === index ? "auto" : "no-hide-descendants"}
            >
              <View className="h-52 items-center justify-center">{ILLUSTRATIONS[step]()}</View>
              <View className="gap-3">
                <Text className="text-center font-serif text-headline-md">{t(`onboarding.steps.${step}.title`)}</Text>
                <Text className="text-center text-body-lg text-muted-foreground">
                  {t(`onboarding.steps.${step}.body`)}
                </Text>
              </View>
              <View className="self-center rounded-full bg-primary/10 px-3 py-1">
                <Text className="text-label-md text-primary">{t(`onboarding.steps.${step}.where`)}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <View className="w-full gap-5 px-6" style={{ maxWidth: MAX_PAGE_WIDTH }}>
          <View
            className="flex-row justify-center gap-2"
            accessibilityLabel={t("onboarding.progress", { current: index + 1, total: STEPS.length })}
          >
            {STEPS.map((step, i) => (
              <View
                key={step}
                className={cn("h-2 rounded-full", i === index ? "w-6 bg-primary" : "w-2 bg-border")}
              />
            ))}
          </View>
          <Button size="lg" onPress={isLast ? close : () => goTo(index + 1)}>
            <Text>{isLast ? t("onboarding.start") : t("common.continue")}</Text>
          </Button>
        </View>
      </View>
    </Modal>
  );
}
