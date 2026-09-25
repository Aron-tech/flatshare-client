import { CategoryIconBadge } from "@/components/category-icon";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import { Elevation } from "@/constants/theme";
import { Category, TASK_USER_WEIGHTS, TaskUserWeight } from "@/types/task";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, LayoutChangeEvent, Modal, PanResponder, Pressable, View } from "react-native";

export interface TaskActionsTarget {
  taskId: number;
  name: string;
  category: Category | null;
  iconHint: string | null;
  /** Gyerek szerepkör nem szerkesztheti és nem törölheti. */
  canManage: boolean;
}

interface TaskActionsSheetProps {
  target: TaskActionsTarget | null;
  isBusy: boolean;
  onClose: () => void;
  onWeight: (weight: TaskUserWeight) => void;
  /** Nélkülük a szerkesztés/törlés gomb nem jelenik meg (pl. a kezdőlapi gyors súlyozásnál). */
  onEdit?: () => void;
  onDelete?: () => void;
}

const THUMB = 28;
const NEUTRAL_INDEX = TASK_USER_WEIGHTS.indexOf("neutral");
const LAST_STEP = TASK_USER_WEIGHTS.length - 1;

/** Vízszintes, 5 állású csúszka; elengedéskor adja vissza a kiválasztott súlyt. */
function WeightSlider({ disabled, onChange }: { disabled: boolean; onChange: (weight: TaskUserWeight) => void }) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(NEUTRAL_INDEX);
  const widthRef = useRef(0);
  const [width, setWidth] = useState(0);
  // A PanResponder egyszer jön létre, ezért a friss propokat refen keresztül olvassa.
  const onChangeRef = useRef(onChange);
  const disabledRef = useRef(disabled);
  useLayoutEffect(() => {
    onChangeRef.current = onChange;
    disabledRef.current = disabled;
  });

  // A refeket csak a gesztus-callbackek olvassák, nem a render.
  // eslint-disable-next-line react-hooks/refs
  const [responder] = useState(() => {
    const update = (x: number) => {
      const usable = widthRef.current - THUMB;
      if (usable <= 0) return;
      const next = Math.min(LAST_STEP, Math.max(0, Math.round(((x - THUMB / 2) / usable) * LAST_STEP)));
      setIndex(next);
      onChangeRef.current(TASK_USER_WEIGHTS[next]);
    };

    return PanResponder.create({
      onStartShouldSetPanResponder: () => !disabledRef.current,
      onMoveShouldSetPanResponder: () => !disabledRef.current,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => update(e.nativeEvent.locationX),
      onPanResponderMove: (e) => update(e.nativeEvent.locationX),
    });
  });

  const onLayout = (e: LayoutChangeEvent) => {
    widthRef.current = e.nativeEvent.layout.width;
    setWidth(e.nativeEvent.layout.width);
  };

  const fraction = index / LAST_STEP;

  return (
    <View className="gap-3">
      <Text className="text-center text-label-lg">{t(`chores.weights.${TASK_USER_WEIGHTS[index]}`)}</Text>
      <View onLayout={onLayout} className="h-10 justify-center" {...responder.panHandlers}>
        <View pointerEvents="none" className="h-1.5 rounded-full bg-secondary" />
        <View
          pointerEvents="none"
          className="absolute h-1.5 rounded-full bg-primary"
          style={{ left: 0, width: THUMB / 2 + fraction * Math.max(0, width - THUMB) }}
        />
        <View
          pointerEvents="none"
          className="absolute rounded-full bg-primary"
          style={[
            { width: THUMB, height: THUMB },
            Elevation.level1,
            { left: `${fraction * 100}%`, marginLeft: -THUMB * fraction },
          ]}
        />
      </View>
      <View className="flex-row justify-between">
        <Text variant="muted">{t("chores.weights.hate")}</Text>
        <Text variant="muted">{t("chores.weights.love")}</Text>
      </View>
    </View>
  );
}

/** Feladat-műveletek: saját súlyozás (pontszorzó), szerkesztés és törlés. */
export function TaskActionsSheet({ target, isBusy, onClose, onWeight, onEdit, onDelete }: TaskActionsSheetProps) {
  const { t } = useTranslation();
  // Másik feladat megnyitásakor a súly semlegesre áll vissza (a csúszka is újramountol a `key` miatt).
  const [selection, setSelection] = useState<{ taskId?: number; weight: TaskUserWeight }>({ weight: "neutral" });
  const weight = selection.taskId === target?.taskId ? selection.weight : "neutral";
  const setWeight = useCallback(
    (next: TaskUserWeight) => setSelection({ taskId: target?.taskId, weight: next }),
    [target?.taskId],
  );

  const confirmDelete = () => {
    if (!target) return;
    Alert.alert(t("chores.deleteTitle"), t("chores.deleteMessage", { name: target.name }), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("common.delete"), style: "destructive", onPress: onDelete },
    ]);
  };

  return (
    <Modal visible={target !== null} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} className="flex-1 items-center justify-center bg-black/40 p-6">
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="w-full max-w-sm gap-5 rounded-card bg-popover p-6"
          style={Elevation.level2}
        >
          {target && (
            <View className="flex-row items-center gap-3">
              <CategoryIconBadge
                color={target.category?.color}
                hints={[target.category?.icon, target.category?.name, target.iconHint, target.name]}
                shape="rounded"
                size={44}
              />
              <Text className="flex-1 font-serif text-headline-sm">{target.name}</Text>
            </View>
          )}

          <View className="gap-2">
            <Text className="text-label-md uppercase text-muted-foreground">{t("chores.weightTitle")}</Text>
            <View style={{ pointerEvents: isBusy ? "none" : "auto" }}>
              <WeightSlider key={target?.taskId} disabled={isBusy} onChange={setWeight} />
            </View>
          </View>

          {isBusy && <ActivityIndicator className="text-primary" />}

          <View className="gap-4">
            <Button disabled={isBusy} onPress={() => onWeight(weight)}>
              <Text>{t("common.save")}</Text>
            </Button>
            {target?.canManage && (onEdit || onDelete) && (
              <>
                <Separator />
                <View className="flex-row gap-2">
                  {onEdit && (
                    <Button variant="outline" className="h-11 flex-1 border" disabled={isBusy} onPress={onEdit}>
                      <Text>{t("chores.editTask")}</Text>
                    </Button>
                  )}
                  {onDelete && (
                    <Button variant="destructive" className="h-11 flex-1 border border-destructive" disabled={isBusy} onPress={confirmDelete}>
                      <Text>{t("chores.deleteTask")}</Text>
                    </Button>
                  )}
                </View>
              </>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
