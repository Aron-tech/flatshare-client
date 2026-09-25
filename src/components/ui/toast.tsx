import { Text } from "@/components/ui/text";
import { Elevation } from "@/constants/theme";
import { subscribeToast } from "@/lib/toast";
import { useEffect, useRef, useState } from "react";
import { Animated, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TOAST_DURATION_MS = 3000;

export function ToastHost() {
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState<string | null>(null);
  const [opacity] = useState(() => new Animated.Value(0));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToast((next) => {
      if (timer.current) clearTimeout(timer.current);
      setMessage(next);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
      timer.current = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start(() => setMessage(null));
      }, TOAST_DURATION_MS);
    });
    return () => {
      unsubscribe();
      if (timer.current) clearTimeout(timer.current);
    };
  }, [opacity]);

  if (!message) return null;

  return (
    <View
      pointerEvents="none"
      className="absolute left-0 right-0 items-center px-4"
      // Felül jelenik meg, hogy ne takarja a lebegő tab bart.
      style={{ top: insets.top + 12 }}
    >
      <Animated.View
        style={[Elevation.level2, { opacity }]}
        className="max-w-md rounded-container bg-foreground px-5 py-3"
      >
        <Text className="text-background">{message}</Text>
      </Animated.View>
    </View>
  );
}
