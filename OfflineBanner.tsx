import { StyleSheet, Text, View, Platform } from 'react-native';
import { WifiOff } from 'lucide-react-native';
import { useNetwork } from '@/contexts/NetworkContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInUp,
  FadeOutUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export function OfflineBanner() {
  const { isConnected, isChecking } = useNetwork();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const iconOpacity = useSharedValue(1);

  const iconStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
  }));

  useEffect(() => {
    if (!isConnected && !isChecking && !reduceMotion) {
      iconOpacity.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      iconOpacity.value = 1;
    }
  }, [isConnected, isChecking, reduceMotion]);

  if (isChecking || isConnected) return null;

  const topOffset = Platform.OS === 'web' ? 0 : insets.top;

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeInUp.duration(300)}
      exiting={reduceMotion ? undefined : FadeOutUp.duration(300)}
      style={[styles.container, { paddingTop: topOffset + 10 }]}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      accessibilityLabel="You are offline. Some features may be unavailable."
    >
      <View style={styles.content} accessibilityElementsHidden>
        <Animated.View style={reduceMotion ? undefined : iconStyle}>
          <WifiOff size={18} color={colors.white} />
        </Animated.View>
        <Text style={[styles.text, { color: colors.white }]}>You're offline. Some features may be unavailable.</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: 'rgba(239, 68, 68, 0.92)',
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
