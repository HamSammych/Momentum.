import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { Task, Category } from '@/types/database';
import { TaskCard } from '@/components/TaskCard';
import { TaskCardSkeleton } from '@/components/Skeleton';
import { Plus, Search, ListChecks } from 'lucide-react-native';
import Animated, {
  FadeIn,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

type FilterStatus = 'all' | 'todo' | 'in_progress' | 'done';

export default function TasksScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categoryMap, setCategoryMap] = useState<Record<string, Category[]>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fabScale = useSharedValue(1);
  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  const loadTasks = useCallback(async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) setTasks(data);

      const { data: tcData } = await supabase
        .from('task_categories')
        .select('task_id, category_id, categories(*)')
        .in(
          'task_id',
          (data || []).map((t: Task) => t.id)
        );

      if (tcData) {
        const map: Record<string, Category[]> = {};
        for (const row of tcData as any[]) {
          if (!row.categories) continue;
          if (!map[row.task_id]) map[row.task_id] = [];
          map[row.task_id].push(row.categories);
        }
        setCategoryMap(map);
      }
    } catch (error) {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [loadTasks])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  }, [loadTasks]);

  const toggleTaskStatus = async (task: Task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    const updates: any = { status: newStatus };

    if (newStatus === 'done') {
      updates.completed_at = new Date().toISOString();
    } else {
      updates.completed_at = null;
    }

    await supabase.from('tasks').update(updates).eq('id', task.id);
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, ...updates } : t))
    );
  };

  const deleteTask = async (taskId: string) => {
    await supabase.from('tasks').delete().eq('id', taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || task.status === filter;
    return matchesSearch && matchesFilter;
  });

  const statusCounts = {
    all: tasks.length,
    todo: tasks.filter((t) => t.status === 'todo').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    done: tasks.filter((t) => t.status === 'done').length,
  };

  const filters: { label: string; value: FilterStatus }[] = [
    { label: 'All', value: 'all' },
    { label: 'To Do', value: 'todo' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Done', value: 'done' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">Tasks</Text>
        <Text style={[styles.subtitle, { color: colors.textTertiary }]}>
          {statusCounts.todo + statusCounts.in_progress} remaining
        </Text>
      </View>

      <View style={styles.searchWrap}>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          accessibilityRole="search"
        >
          <Search size={18} color={colors.textTertiary} accessibilityElementsHidden />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search tasks..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            accessibilityLabel="Search tasks"
          />
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {filters.map((item) => {
          const count = statusCounts[item.value];
          const isActive = filter === item.value;
          return (
            <Pressable
              key={item.value}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isActive ? colors.primary : 'transparent',
                  borderColor: isActive ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setFilter(item.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`Filter: ${item.label}, ${count} tasks`}
            >
              <Text
                style={[
                  styles.filterText,
                  {
                    color: isActive ? '#FFFFFF' : colors.textTertiary,
                  },
                ]}
              >
                {item.label}
              </Text>
              <View
                style={[
                  styles.filterBadge,
                  {
                    backgroundColor: isActive
                      ? 'rgba(255,255,255,0.2)'
                      : colors.surfaceLight,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterBadgeText,
                    { color: isActive ? '#FFFFFF' : colors.textTertiary },
                  ]}
                >
                  {count}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {loading ? (
          <View>
            <TaskCardSkeleton />
            <TaskCardSkeleton />
            <TaskCardSkeleton />
            <TaskCardSkeleton />
          </View>
        ) : filteredTasks.length === 0 ? (
          <Animated.View
            entering={FadeIn.duration(400)}
            style={styles.empty}
          >
            <View
              style={[
                styles.emptyIcon,
                { backgroundColor: colors.surfaceLight },
              ]}
            >
              <ListChecks size={40} color={colors.textTertiary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {searchQuery
                ? 'No tasks found'
                : filter === 'done'
                  ? 'No completed tasks yet'
                  : filter === 'in_progress'
                    ? 'Nothing in progress'
                    : 'Start building momentum'}
            </Text>
            <Text
              style={[styles.emptyText, { color: colors.textTertiary }]}
            >
              {searchQuery
                ? 'Try adjusting your search terms'
                : filter === 'all' || filter === 'todo'
                  ? 'Add your first task and take the first step toward getting things done.'
                  : 'Tasks will appear here as you update their status.'}
            </Text>
            {!searchQuery && (filter === 'all' || filter === 'todo') && (
              <Pressable
                style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/tasks/new')}
              >
                <Plus size={18} color="#FFFFFF" />
                <Text style={styles.emptyBtnText}>Add a Task</Text>
              </Pressable>
            )}
          </Animated.View>
        ) : (
          filteredTasks.map((task, index) => (
            <TaskCard
              key={task.id}
              task={task}
              categories={categoryMap[task.id]}
              onPress={() => router.push(`/tasks/${task.id}`)}
              onToggleStatus={() => toggleTaskStatus(task)}
              onDelete={() => deleteTask(task.id)}
              index={index}
            />
          ))
        )}
        <View style={{ height: 140 }} />
      </ScrollView>

      <Animated.View
        entering={FadeInUp.delay(300).springify()}
        style={[styles.fab, { backgroundColor: colors.primary, shadowColor: colors.primary }, fabStyle]}
      >
        <Pressable
          onPress={() => router.push('/tasks/new')}
          onPressIn={() => {
            fabScale.value = withSpring(0.88, {
              damping: 15,
              stiffness: 400,
            });
          }}
          onPressOut={() => {
            fabScale.value = withSpring(1, { damping: 15, stiffness: 400 });
          }}
          style={styles.fabInner}
          accessibilityRole="button"
          accessibilityLabel="Create new task"
        >
          <Plus size={28} color="#FFFFFF" strokeWidth={2.5} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 40,
    paddingTop: 80,
    paddingBottom: 8,
  },
  title: {
    fontSize: 36,
    fontFamily: 'Inter-Bold',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginTop: 4,
  },
  searchWrap: {
    paddingHorizontal: 40,
    marginTop: 16,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 52,
    borderRadius: 18,
    gap: 14,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter-Regular',
  },
  filterRow: {
    paddingHorizontal: 40,
    gap: 10,
    marginBottom: 24,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 18,
    paddingRight: 12,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  filterText: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.2,
  },
  filterBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  filterBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter-Bold',
  },
  scroll: {
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: 'Inter-Bold',
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 28,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
  },
  emptyBtnText: {
    fontSize: 15,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
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
