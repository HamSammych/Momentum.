import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { Task, Category, Subtask } from '@/types/database';
import {
  X,
  Trash2,
  Flag,
  Edit2,
  Plus,
  CheckCircle2,
  Circle,
  Calendar,
  Clock,
  Repeat,
} from 'lucide-react-native';
import { getPriorityColors } from '@/constants/Colors';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

function formatDueDate(dateStr: string): string {
  const d = new Date(dateStr);
  const month = d.toLocaleDateString('en-US', { month: 'short' });
  const day = d.getDate();
  const year = d.getFullYear();
  const time = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${month} ${day}, ${year}  •  ${time}`;
}

function getDueDateStatus(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'overdue';
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'tomorrow';
  return 'future';
}

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const { colors, accent } = useTheme();
  const router = useRouter();
  const priorityColors = getPriorityColors(accent);
  const [task, setTask] = useState<Task | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    loadTask();
  }, [id]);

  const loadTask = async () => {
    if (!user || !id) return;

    try {
      const { data: taskData } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (taskData) {
        setTask(taskData);
        setEditTitle(taskData.title);
        setEditDescription(taskData.description || '');

        const { data: taskCats } = await supabase
          .from('task_categories')
          .select('category_id, categories(*)')
          .eq('task_id', taskData.id);

        if (taskCats) {
          setCategories(
            taskCats.map((tc: any) => tc.categories).filter(Boolean)
          );
        }

        const { data: subtasksData } = await supabase
          .from('subtasks')
          .select('*')
          .eq('task_id', taskData.id)
          .order('position', { ascending: true });

        if (subtasksData) setSubtasks(subtasksData);
      }
    } catch (error) {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    if (!id) return;
    await supabase.from('tasks').delete().eq('id', id);
    router.back();
  };

  const toggleStatus = async () => {
    if (!task) return;

    const newStatus = task.status === 'done' ? 'todo' : 'done';
    const updates: any = { status: newStatus };

    if (newStatus === 'done') {
      updates.completed_at = new Date().toISOString();
    } else {
      updates.completed_at = null;
    }

    await supabase.from('tasks').update(updates).eq('id', task.id);
    setTask({ ...task, ...updates });
  };

  const handleSaveEdit = async () => {
    if (!task || !editTitle.trim()) return;

    try {
      await supabase
        .from('tasks')
        .update({
          title: editTitle.trim(),
          description: editDescription.trim() || null,
        })
        .eq('id', task.id);

      setTask({
        ...task,
        title: editTitle.trim(),
        description: editDescription.trim() || null,
      });
      setIsEditing(false);
    } catch (error: any) {
      // silently fail
    }
  };

  const handleAddSubtask = async () => {
    if (!newSubtask.trim() || !task) return;

    try {
      const { data } = await supabase
        .from('subtasks')
        .insert({
          task_id: task.id,
          title: newSubtask.trim(),
          position: subtasks.length,
        })
        .select()
        .single();

      if (data) {
        setSubtasks([...subtasks, data]);
        setNewSubtask('');
      }
    } catch (error: any) {
      // silently fail
    }
  };

  const toggleSubtask = async (subtask: Subtask) => {
    try {
      await supabase
        .from('subtasks')
        .update({ completed: !subtask.completed })
        .eq('id', subtask.id);

      setSubtasks(
        subtasks.map((st) =>
          st.id === subtask.id ? { ...st, completed: !st.completed } : st
        )
      );
    } catch (error) {
      // silently fail
    }
  };

  const deleteSubtask = async (subtaskId: string) => {
    try {
      await supabase.from('subtasks').delete().eq('id', subtaskId);
      setSubtasks(subtasks.filter((st) => st.id !== subtaskId));
    } catch (error) {
      // silently fail
    }
  };

  if (loading) {
    return (
      <View
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.closeBtn, { backgroundColor: colors.surfaceLight }]}
          >
            <X size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!task) {
    return (
      <View
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.closeBtn, { backgroundColor: colors.surfaceLight }]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <X size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <View style={styles.centered}>
          <Text style={[styles.notFound, { color: colors.textTertiary }]}>
            Task not found
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

  const completedSubtasks = subtasks.filter((s) => s.completed).length;
  const dueStatus = task.due_date && task.status !== 'done'
    ? getDueDateStatus(task.due_date)
    : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.closeBtn, { backgroundColor: colors.surfaceLight }]}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <X size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          {isEditing ? (
            <TouchableOpacity
              onPress={handleSaveEdit}
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              accessibilityRole="button"
              accessibilityLabel="Save changes"
            >
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                onPress={() => setIsEditing(true)}
                style={[
                  styles.headerAction,
                  { backgroundColor: colors.surfaceLight },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Edit task"
              >
                <Edit2 size={17} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDelete}
                style={[
                  styles.headerAction,
                  {
                    backgroundColor: confirmDelete
                      ? 'rgba(239, 68, 68, 0.12)'
                      : colors.surfaceLight,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={confirmDelete ? 'Confirm delete' : 'Delete task'}
              >
                <Trash2
                  size={17}
                  color={colors.error}
                />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(400)}>
          <TouchableOpacity
            style={[
              styles.statusBtn,
              {
                backgroundColor:
                  task.status === 'done'
                    ? colors.primaryAlpha10
                    : colors.surface,
                borderColor:
                  task.status === 'done' ? colors.primary : colors.border,
              },
            ]}
            onPress={toggleStatus}
            activeOpacity={0.7}
          >
            {task.status === 'done' ? (
              <CheckCircle2 size={18} color={colors.primary} />
            ) : (
              <Circle size={18} color={colors.textTertiary} />
            )}
            <Text
              style={[
                styles.statusText,
                {
                  color:
                    task.status === 'done'
                      ? colors.primary
                      : colors.textSecondary,
                },
              ]}
            >
              {task.status === 'done' ? 'Completed' : 'Mark as Done'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {isEditing ? (
          <>
            <TextInput
              style={[styles.titleInput, { color: colors.text }]}
              value={editTitle}
              onChangeText={setEditTitle}
              multiline
            />
            <TextInput
              style={[
                styles.descInput,
                {
                  backgroundColor: colors.surface,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={editDescription}
              onChangeText={setEditDescription}
              placeholder="Add description..."
              placeholderTextColor={colors.textTertiary}
              multiline
            />
          </>
        ) : (
          <>
            <Text
              style={[
                styles.title,
                { color: colors.text },
                task.status === 'done' && styles.titleStrikethrough,
                task.status === 'done' && { color: colors.textTertiary },
              ]}
            >
              {task.title}
            </Text>
            {task.description ? (
              <Text style={[styles.desc, { color: colors.textSecondary }]}>
                {task.description}
              </Text>
            ) : null}
          </>
        )}

        <View
          style={[
            styles.metaCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.metaRow}>
            <Flag size={16} color={priorityColors[task.priority]} />
            <Text style={[styles.metaLabel, { color: colors.textTertiary }]}>
              Priority
            </Text>
            <View
              style={[
                styles.priorityBadge,
                { borderColor: `${priorityColors[task.priority]}40` },
              ]}
            >
              <View
                style={[
                  styles.priorityDotSmall,
                  { backgroundColor: priorityColors[task.priority] },
                ]}
              />
              <Text
                style={[
                  styles.metaValue,
                  { color: priorityColors[task.priority] },
                ]}
              >
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
              </Text>
            </View>
          </View>

          {task.due_date ? (
            <>
              <View style={[styles.metaDivider, { backgroundColor: colors.border }]} />
              <View style={styles.metaRow}>
                <Calendar
                  size={16}
                  color={
                    dueStatus === 'overdue'
                      ? colors.primaryDark
                      : dueStatus === 'today'
                        ? colors.primary
                        : colors.textTertiary
                  }
                />
                <Text style={[styles.metaLabel, { color: colors.textTertiary }]}>
                  Due
                </Text>
                <Text
                  style={[
                    styles.metaValue,
                    {
                      color:
                        dueStatus === 'overdue'
                          ? colors.primaryDark
                          : dueStatus === 'today'
                            ? colors.primary
                            : colors.text,
                    },
                  ]}
                >
                  {formatDueDate(task.due_date)}
                </Text>
              </View>
            </>
          ) : null}

          {task.is_recurring && task.recurrence_pattern ? (
            <>
              <View style={[styles.metaDivider, { backgroundColor: colors.border }]} />
              <View style={styles.metaRow}>
                <Repeat size={16} color={colors.primary} />
                <Text style={[styles.metaLabel, { color: colors.textTertiary }]}>
                  Repeats
                </Text>
                <Text style={[styles.metaValue, { color: colors.text }]}>
                  {task.recurrence_pattern.charAt(0).toUpperCase() + task.recurrence_pattern.slice(1)}
                </Text>
              </View>
            </>
          ) : null}
        </View>

        {categories.length > 0 ? (
          <View style={styles.catSection}>
            <Text
              style={[styles.sectionLabel, { color: colors.textTertiary }]}
            >
              CATEGORIES
            </Text>
            <View style={styles.catList}>
              {categories.map((cat) => (
                <View
                  key={cat.id}
                  style={[
                    styles.catTag,
                    {
                      backgroundColor: `${cat.color}10`,
                      borderColor: `${cat.color}30`,
                    },
                  ]}
                >
                  <Text style={styles.catIcon}>{cat.icon}</Text>
                  <Text style={[styles.catName, { color: colors.text }]}>
                    {cat.name}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.subtasksSection}>
          <View style={styles.subtasksHeader}>
            <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
              SUBTASKS
            </Text>
            {subtasks.length > 0 ? (
              <Text style={[styles.subtaskCount, { color: colors.textTertiary }]}>
                {completedSubtasks}/{subtasks.length}
              </Text>
            ) : null}
          </View>

          {subtasks.length > 0 ? (
            <View
              style={[
                styles.progressBarBg,
                { backgroundColor: colors.surfaceLight },
              ]}
            >
              <View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: colors.primary,
                    width: `${subtasks.length > 0 ? (completedSubtasks / subtasks.length) * 100 : 0}%`,
                  },
                ]}
              />
            </View>
          ) : null}

          {subtasks.map((subtask, index) => (
            <Animated.View
              key={subtask.id}
              entering={FadeInDown.delay(index * 50).springify()}
              style={[
                styles.subtaskItem,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <TouchableOpacity
                onPress={() => toggleSubtask(subtask)}
                style={styles.subtaskCheck}
              >
                {subtask.completed ? (
                  <CheckCircle2 size={20} color={colors.primary} />
                ) : (
                  <Circle size={20} color={colors.textTertiary} />
                )}
              </TouchableOpacity>
              <Text
                style={[
                  styles.subtaskTitle,
                  {
                    color: subtask.completed
                      ? colors.textTertiary
                      : colors.text,
                  },
                  subtask.completed && styles.subtaskDone,
                ]}
              >
                {subtask.title}
              </Text>
              <TouchableOpacity onPress={() => deleteSubtask(subtask.id)}>
                <X size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            </Animated.View>
          ))}

          <View
            style={[
              styles.addSubtaskRow,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Plus size={18} color={colors.textTertiary} />
            <TextInput
              style={[styles.addSubtaskInput, { color: colors.text }]}
              placeholder="Add a subtask..."
              placeholderTextColor={colors.textTertiary}
              value={newSubtask}
              onChangeText={setNewSubtask}
              onSubmitEditing={handleAddSubtask}
            />
          </View>
        </View>

        {confirmDelete ? (
          <Animated.View entering={FadeIn.duration(200)} style={styles.deleteConfirmWrap}>
            <View
              style={[
                styles.deleteConfirmCard,
                {
                  backgroundColor: 'rgba(239, 68, 68, 0.06)',
                  borderColor: 'rgba(239, 68, 68, 0.2)',
                },
              ]}
            >
              <Text style={[styles.deleteConfirmText, { color: colors.text }]}>
                Delete this task permanently?
              </Text>
              <View style={styles.deleteConfirmActions}>
                <Pressable
                  onPress={() => setConfirmDelete(false)}
                  style={[styles.deleteConfirmBtn, { backgroundColor: colors.surfaceLight }]}
                >
                  <Text style={[styles.deleteConfirmBtnText, { color: colors.textSecondary }]}>
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleDelete}
                  style={[styles.deleteConfirmBtn, { backgroundColor: colors.error }]}
                >
                  <Trash2 size={14} color={colors.white} />
                  <Text style={[styles.deleteConfirmBtnText, { color: colors.white }]}>
                    Delete
                  </Text>
                </Pressable>
              </View>
            </View>
          </Animated.View>
        ) : null}

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
    paddingBottom: 24,
    borderBottomWidth: 1,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerAction: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
  saveBtnText: {
    fontSize: 15,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  scroll: {
    paddingHorizontal: 40,
    paddingTop: 32,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFound: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
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
  statusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 22,
    borderRadius: 18,
    alignSelf: 'flex-start',
    marginBottom: 36,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    lineHeight: 40,
    marginBottom: 14,
    letterSpacing: -0.8,
  },
  titleStrikethrough: {
    textDecorationLine: 'line-through',
  },
  titleInput: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    lineHeight: 40,
    marginBottom: 14,
    letterSpacing: -0.8,
  },
  desc: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    lineHeight: 26,
    marginBottom: 36,
  },
  descInput: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    lineHeight: 26,
    marginBottom: 36,
    minHeight: 120,
    padding: 22,
    borderRadius: 24,
    textAlignVertical: 'top',
    borderWidth: 2,
  },
  metaCard: {
    padding: 22,
    borderRadius: 24,
    marginBottom: 32,
    borderWidth: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaLabel: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    flex: 1,
  },
  metaValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  metaDivider: {
    height: 1,
    marginVertical: 16,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  priorityDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  catSection: {
    marginBottom: 36,
    gap: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 1,
    marginBottom: 6,
  },
  catList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  catTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 18,
    borderWidth: 1,
  },
  catIcon: {
    fontSize: 16,
  },
  catName: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  subtasksSection: {
    gap: 12,
  },
  subtasksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subtaskCount: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
  },
  progressBarBg: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  subtaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    gap: 14,
    borderWidth: 1,
  },
  subtaskCheck: {
    marginRight: 2,
  },
  subtaskTitle: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    lineHeight: 22,
  },
  subtaskDone: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  addSubtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    gap: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addSubtaskInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter-Regular',
  },
  deleteConfirmWrap: {
    marginTop: 32,
  },
  deleteConfirmCard: {
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    gap: 16,
  },
  deleteConfirmText: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
  },
  deleteConfirmActions: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteConfirmBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  deleteConfirmBtnText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
});
