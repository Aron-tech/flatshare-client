import { PET_ATLAS, PET_SOURCES, type SpriteFacing } from "@/lib/house/pet-sprites.generated";
import type { PetAnimation, PetId } from "@/lib/house/scene.generated";
import { useEffect } from "react";
import { View } from "react-native";
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";

interface PetSpriteProps {
  pet: PetId;
  animation: PetAnimation;
  facing: SpriteFacing;
  /** A szoba képéhez viszonyított méretarány (képernyő pt / kép px). */
  scale: number;
  /** Csak az első képkocka látszik (pl. csökkentett mozgás). */
  paused?: boolean;
}

/**
 * Az állat egy animációja a sprite-atlaszból (a karakterválasztóhoz; a Ház nézet 3D): a képkocka-ablakban az atlasz eltolása
 * a UI szálon lép (Reanimated). A "sw" / "nw" irány a "se" / "ne" tükörképe.
 */
export function PetSprite({ pet, animation, facing, scale, paused = false }: PetSpriteProps) {
  const { frame, columns, rows, perFacing } = PET_ATLAS;
  const anim = PET_ATLAS.animations[animation];
  const start = (facing === "ne" || facing === "nw" ? perFacing : 0) + anim.start;
  const count = anim.count;
  const frameWidth = frame.width * scale;
  const frameHeight = frame.height * scale;

  const progress = useSharedValue(0);
  useEffect(() => {
    cancelAnimation(progress);
    progress.value = 0;
    if (paused) return;
    progress.value = withRepeat(
      withTiming(count, { duration: (count / anim.fps) * 1000, easing: Easing.linear }),
      -1,
      false
    );
    return () => cancelAnimation(progress);
  }, [progress, count, anim.fps, start, paused]);

  const atlasStyle = useAnimatedStyle(() => {
    const index = start + Math.min(count - 1, Math.floor(progress.value));
    return {
      transform: [
        { translateX: -(index % columns) * frameWidth },
        { translateY: -Math.floor(index / columns) * frameHeight },
      ],
    };
  });

  return (
    <View
      pointerEvents="none"
      style={{
        width: frameWidth,
        height: frameHeight,
        overflow: "hidden",
        // Mindig tömb: az `undefined`-ra váltó transform-ot a React Native `null`-ként dolgozza fel, és fejlesztői
        // módban elszáll (`processTransform` → "Cannot read property 'forEach' of null").
        transform: [{ scaleX: facing === "sw" || facing === "nw" ? -1 : 1 }],
      }}
    >
      <Animated.Image
        // Egy újabb backend olyan állatot is küldhet, amit ez az app-verzió még nem ismer.
        source={PET_SOURCES[pet] ?? PET_SOURCES.cat}
        style={[{ width: columns * frameWidth, height: rows * frameHeight }, atlasStyle]}
      />
    </View>
  );
}
