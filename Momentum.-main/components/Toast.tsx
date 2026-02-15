import { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { CheckCircle2, AlertCircle } from 'lucide-react-native';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  visible: boolean;
  onHide: () => void;
  duration?: number;
}

export function Toast({ message, type, visible, onHide, duration = 2500 }: ToastProps) {
  const { colors } = useTheme();
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: 300 });
      opacity.value = withTiming(1, { duration: 300 });

      translateY.value = withDelay(
        duration,
        withTiming(-100, { duration: 300 }, () => {
          runOnJS(onHide)();
        })
      );
      opacity.value = withDelay(duration, withTiming(0, { duration: 300 }));
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  const bgColor = type === 'success' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)';
  const borderColor = type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)';
  const iconColor = type === 'success' ? colors.success : colors.error;

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: bgColor, borderColor },
        animatedStyle,
      ]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      accessibilityLabel={`${type === 'success' ? 'Success' : 'Error'}: ${message}`}
    >
      {type === 'success' ? (
        <CheckCircle2 size={18} color={iconColor} />
      ) : (
        <AlertCircle size={18} color={iconColor} />
      )}
      <Text style={[styles.text, { color: colors.text }]}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 40,
    right: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 18,
    borderWidth: 1,
    zIndex: 100,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 20,
  },
  text: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
});
