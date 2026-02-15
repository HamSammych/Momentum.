import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { Category, Task } from '@/types/database';
import { ArrowLeft, Trash2 } from 'lucide-react-native';
import { TaskCard } from '@/components/TaskCard';

export default function CategoryDetailScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [category, setCategory] = useState<Category | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategoryAndTasks();
  }, [id]);

  const loadCategoryAndTasks = async () => {
    if (!user || !id) return;

    try {
      const { data: categoryData } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (categoryData) {
        setCategory(categoryData);

        const { data: taskCatsData } = await supabase
          .from('task_categories')
          .select('task_id')
          .eq('category_id', id);

        if (taskCatsData && taskCatsData.length > 0) {
          const taskIds = taskCatsData.map((tc) => tc.task_id);

          const { data: tasksData } = await supabase
            .from('tasks')
            .select('*')
            .in('id', taskIds)
            .eq('user_id', user.id)
            .order('position', { ascending: true });

          if (tasksData) setTasks(tasksData);
        }
      }
    } catch (error) {
      console.error('Error loading category:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Category',
      'Are you sure you want to delete this category?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!id) return;
            await supabase.from('categories').delete().eq('id', id);
            router.back();
          },
        },
      ]
    );
  };

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

  if (!category && !loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.surfaceLight }]}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.notFoundState}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Category not found
          </Text>
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
            This category may have been deleted
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.notFoundBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.7}
          >
            <Text style={styles.notFoundBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!category) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.surfaceLight }]}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        {!category.is_default && (
          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: colors.surfaceLight }]}
            onPress={handleDelete}
            accessibilityRole="button"
            accessibilityLabel="Delete category"
          >
            <Trash2 size={18} color={colors.error} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.categoryHeader,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: `${category.color}10` },
            ]}
          >
            <Text style={styles.icon}>{category.icon}</Text>
          </View>
          <Text style={[styles.categoryName, { color: colors.text }]}>
            {category.name}
          </Text>
          <Text style={[styles.taskCount, { color: colors.textTertiary }]}>
            {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
          </Text>
          <View
            style={[
              styles.colorIndicator,
              { backgroundColor: category.color },
            ]}
          />
        </View>

        <View style={styles.tasksContainer}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
            TASKS
          </Text>
          {tasks.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No tasks in this category
              </Text>
              <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                Create a task and assign it to this category
              </Text>
            </View>
          ) : (
            tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                onPress={() => router.push(`/tasks/${task.id}`)}
                onToggleStatus={() => toggleTaskStatus(task)}
                index={index}
              />
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingTop: 64,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 40,
    paddingTop: 28,
    paddingBottom: 28,
  },
  categoryHeader: {
    padding: 36,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 36,
    borderWidth: 1,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  icon: {
    fontSize: 40,
  },
  categoryName: {
    fontSize: 26,
    fontFamily: 'Inter-Bold',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  taskCount: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 16,
  },
  colorIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  tasksContainer: {
    gap: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 1,
    marginBottom: 10,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
  notFoundState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  notFoundBtn: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  notFoundBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
});
