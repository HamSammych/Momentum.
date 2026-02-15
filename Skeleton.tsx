import { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}: SkeletonProps) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(reduceMotion ? 0.5 : 0.3);

  useEffect(() => {
    if (!reduceMotion) {
      opacity.value = withRepeat(
        withTiming(0.7, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }
  }, [reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: colors.surfaceLight,
        },
        animatedStyle,
        style,
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

export function TaskCardSkeleton() {
  const { colors } = useTheme();

  return (
    <View
      style={[
        skeletonStyles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
      accessibilityLabel="Loading task"
      accessibilityElementsHidden
    >
      <Skeleton width={22} height={22} borderRadius={11} />
      <View style={skeletonStyles.body}>
        <Skeleton width="75%" height={16} borderRadius={6} />
        <Skeleton width="50%" height={12} borderRadius={5} style={{ marginTop: 8 }} />
        <View style={skeletonStyles.meta}>
          <Skeleton width={60} height={10} borderRadius={4} />
          <Skeleton width={18} height={18} borderRadius={9} />
        </View>
      </View>
    </View>
  );
}

export function StatCardSkeleton() {
  const { colors } = useTheme();

  return (
    <View
      style={[
        skeletonStyles.stat,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <Skeleton width={56} height={56} borderRadius={18} />
      <Skeleton width={48} height={36} borderRadius={8} style={{ marginTop: 14 }} />
      <Skeleton width={64} height={10} borderRadius={4} style={{ marginTop: 14 }} />
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  body: {
    flex: 1,
    gap: 0,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  stat: {
    flex: 1,
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
  },
});
