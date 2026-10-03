import { PET_ATLAS, PET_SOURCES, type SpriteFacing } from "@/lib/house/pet-sprites.generated";
import type { PetAnimation, PetId } from "@/lib/house/scene.generated";
import { useEffect } from "react";
import { View } from "react-native";
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";

interface PetSpriteProps {
  pet: PetId;
  animation: PetAnimation;
  facing: SpriteFacing;
  /** Scale relative to the room image (screen pt / image px). */
  scale: number;
  /** Only the first frame is shown (e.g. reduced motion). */
  paused?: boolean;
}

/**
 * One animation of the pet from the sprite atlas (for the character picker; the House view is 3D): the atlas
 * offset in the frame window steps on the UI thread (Reanimated). The "sw" / "nw" direction mirrors "se" / "ne".
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
        // Always an array: React Native processes a transform switched to `undefined` as `null` and throws in dev
        // mode (`processTransform` → "Cannot read property 'forEach' of null").
        transform: [{ scaleX: facing === "sw" || facing === "nw" ? -1 : 1 }],
      }}
    >
      <Animated.Image
        // A newer backend may send a pet this app version does not know yet.
        source={PET_SOURCES[pet] ?? PET_SOURCES.cat}
        style={[{ width: columns * frameWidth, height: rows * frameHeight }, atlasStyle]}
      />
    </View>
  );
}
