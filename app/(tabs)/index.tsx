// app/(tabs)/index.tsx (or wherever it is)
import { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { hexToRgba, generateShades, getPriorityStyle } from '@/constants/Colors'; // Add these imports
import { supabase } from '@/lib/supabase';
import { Task, Category } from '@/types/database';
import { TaskCard } from '@/components/TaskCard';
import { TaskCardSkeleton, StatCardSkeleton } from '@/components/Skeleton';
import { Plus, Flame, CheckCircle2 } from 'lucide-react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export default function HomeScreen() {
  const { user, profile } = useAuth();
  const { colors } = useTheme(); // Assume colors includes accentHex from context
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const reduceMotion = useReducedMotion();
  const fabScale = useSharedValue(1);
  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  const streakScale = useSharedValue(1);
  const streakAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: streakScale.value }],
  }));

  const streak = profile?.current_streak || 0;

  // Generate shades from current accent (from theme context)
  const accentShades = generateShades(colors.accentHex || DEFAULT_ACCENT_HEX);

  useEffect(() => {
    if (streak > 0 && !reduceMotion) {
      streakScale.value = withDelay(
        600,
        withRepeat(
          withSequence(
            withTiming(1.15, { duration: 800, easing: Easing.inOut(Easing.ease) }),
            withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        )
      );
    } else {
      streakScale.value = 1;
    }
  }, [streak, reduceMotion]);

  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .or(`due_date.gte.${today.toISOString()},due_date.is.null`)
        .order('position', { ascending: true })
        .limit(20);

      setTasks(tasksData || []);
      // ... (rest of your loadData logic — keep as is)
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData().then(() => setRefreshing(false));
  }, [loadData]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.hero}>
            <StatCardSkeleton />
            <StatCardSkeleton />
          </View>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Today's Tasks</Text>
            {Array.from({ length: 3 }).map((_, i) => (
              <TaskCardSkeleton key={i} />
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.hero}>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>Welcome back,</Text>
          <Text style={[styles.name, { color: colors.textPrimary }]}>{profile?.name || 'there'}</Text>
          <Text style={[styles.tagline, { color: colors.textTertiary }]}>Make today count.</Text>
        </View>

        <Animated.View entering={FadeInDown} style={styles.statsRow}>
          <Animated.View style={[streakAnimStyle, styles.statCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Animated.View style={[styles.statIconWrap, { backgroundColor: hexToRgba(accentShades.accent, 0.1) }]}>
              <Flame size={24} color={accentShades.accent} strokeWidth={2} />
            </Animated.View>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{streak}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Day Streak</Text>
          </Animated.View>

          <Animated.View entering={FadeInUp} style={[styles.statCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Animated.View style={[styles.statIconWrap, { backgroundColor: hexToRgba(accentShades.accent, 0.1) }]}>
              <CheckCircle2 size={24} color={accentShades.accent} strokeWidth={2} />
            </Animated.View>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{tasks.filter(t => t.completed).length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completed</Text>
          </Animated.View>
        </Animated.View>

        {/* ... (your task list section — keep as is, but update TaskCard to use accentShades for priorities) */}
      </ScrollView>

      {/* FAB with accent color */}
      <Animated.View style={[fabStyle, styles.fab, { backgroundColor: accentShades.accent, shadowColor: accentShades.accent }]}>
        <Pressable
          onPress={() => {
            if (!reduceMotion) fabScale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
            router.push('/new-task');
          }}
          onPressOut={() => {
            if (!reduceMotion) fabScale.value = withSpring(1, { damping: 15, stiffness: 400 });
          }}
          style={styles.fabInner}
          accessibilityRole="button"
          accessibilityLabel="Create new task"
        >
          <Plus size={28} color={colors.white} strokeWidth={2.5} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 40,
    paddingTop: 80,
    paddingBottom: 40,
  },
  hero: {
    marginBottom: 48,
    paddingTop: 16,
  },
  greeting: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  name: {
    fontSize: 48,
    fontFamily: 'Inter-Bold',
    letterSpacing: -1.5,
    lineHeight: 56,
  },
  tagline: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginTop: 12,
    letterSpacing: 0.1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 48,
  },
  statCard: {
    flex: 1,
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
  },
  statIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 40,
    fontFamily: 'Inter-Bold',
    letterSpacing: -1.5,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  // ... (rest of styles — keep as is)
  fab: {
    position: 'absolute',
    bottom: 88,
    right: 32,
    width: 64,
    height: 64,
    borderRadius: 32,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
    zIndex: 10,
  },
  fabInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});