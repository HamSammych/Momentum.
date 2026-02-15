import { useState, useEffect } from 'react';
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
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { Category, Priority } from '@/types/database';
import { X, Calendar, Clock, Repeat, Plus } from 'lucide-react-native';
import { getPriorityColors } from '@/constants/Colors';
import { DateTimePicker } from '@/components/DateTimePicker';
import { Toast } from '@/components/Toast';

const DEFAULT_CATEGORIES = [
  { name: 'Work', icon: '💼', color: '#71717A' },
  { name: 'Personal', icon: '🏠', color: '#A1A1AA' },
  { name: 'Family', icon: '👨‍👩‍👧', color: '#52525B' },
  { name: 'Health', icon: '💪', color: '#6B7280' },
];

type RecurrenceOption = 'none' | 'daily' | 'weekly';

function getDefaultDueDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d;
}

function formatDateTime(date: Date): string {
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  const year = date.getFullYear();
  const time = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${month} ${day}, ${year}  •  ${time}`;
}

export default function NewTaskScreen() {
  const { user } = useAuth();
  const { colors, accent } = useTheme();
  const router = useRouter();
  const priorityColors = getPriorityColors(accent);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState<Date>(getDefaultDueDate());
  const [showPicker, setShowPicker] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [recurrence, setRecurrence] = useState<RecurrenceOption>('none');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; visible: boolean }>({
    message: '',
    type: 'success',
    visible: false,
  });

  useEffect(() => {
    loadOrCreateCategories();
  }, [user]);

  const loadOrCreateCategories = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (data && data.length > 0) {
      setCategories(data);
    } else {
      const rows = DEFAULT_CATEGORIES.map((c) => ({
        user_id: user.id,
        name: c.name,
        icon: c.icon,
        color: c.color,
        is_default: true,
      }));

      const { data: created } = await supabase
        .from('categories')
        .insert(rows)
        .select();

      if (created) setCategories(created);
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      setError('Please enter a task title');
      return;
    }
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data: task, error: insertError } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          priority,
          due_date: dueDate.toISOString(),
          status: 'todo',
          position: 0,
          is_recurring: recurrence !== 'none',
          recurrence_pattern: recurrence === 'none' ? null : recurrence,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      if (task && selectedCategories.length > 0) {
        await supabase.from('task_categories').insert(
          selectedCategories.map((catId) => ({
            task_id: task.id,
            category_id: catId,
          }))
        );
      }

      setToast({ message: 'Task created!', type: 'success', visible: true });

      setTimeout(() => {
        router.back();
      }, 800);
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to save', type: 'error', visible: true });
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const priorities: Priority[] = ['low', 'medium', 'high'];
  const recurrenceOptions: { label: string; value: RecurrenceOption }[] = [
    { label: 'None', value: 'none' },
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onHide={() => setToast((prev) => ({ ...prev, visible: false }))}
      />

      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.closeBtn, { backgroundColor: colors.surfaceLight }]}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <X size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          New Task
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {error ? (
          <View
            style={[
              styles.errorBanner,
              {
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                borderColor: 'rgba(239, 68, 68, 0.2)',
              },
            ]}
            accessibilityRole="alert"
            accessibilityLiveRegion="assertive"
          >
            <Text style={[styles.errorText, { color: colors.error }]}>
              {error}
            </Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <TextInput
            style={[styles.titleInput, { color: colors.text }]}
            placeholder="Task title"
            placeholderTextColor={colors.textTertiary}
            value={title}
            onChangeText={(t) => {
              setTitle(t);
              setError(null);
            }}
            autoFocus
            multiline
            accessibilityLabel="Task title"
          />
        </View>

        <View style={styles.section}>
          <TextInput
            style={[
              styles.descInput,
              {
                backgroundColor: colors.surface,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            placeholder="Add description..."
            placeholderTextColor={colors.textTertiary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            accessibilityLabel="Task description"
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textTertiary }]}>
            PRIORITY
          </Text>
          <View style={styles.priorityRow}>
            {priorities.map((p) => (
              <Pressable
                key={p}
                style={[
                  styles.priorityPill,
                  {
                    backgroundColor: 'transparent',
                    borderColor:
                      priority === p ? priorityColors[p] : colors.border,
                    borderWidth: priority === p ? 2 : 1,
                  },
                ]}
                onPress={() => setPriority(p)}
                accessibilityRole="radio"
                accessibilityState={{ selected: priority === p }}
                accessibilityLabel={`${p.charAt(0).toUpperCase() + p.slice(1)} priority`}
              >
                <View
                  style={[
                    styles.priorityDot,
                    { backgroundColor: priorityColors[p] },
                  ]}
                />
                <Text
                  style={[
                    styles.priorityText,
                    {
                      color:
                        priority === p
                          ? priorityColors[p]
                          : colors.textTertiary,
                    },
                  ]}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textTertiary }]}>
            DUE DATE & TIME
          </Text>
          <Pressable
            style={[
              styles.dateBtn,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setShowPicker(true)}
          >
            <View style={styles.dateRow}>
              <Calendar size={18} color={colors.primary} />
              <Text style={[styles.dateText, { color: colors.text }]}>
                {formatDateTime(dueDate)}
              </Text>
            </View>
            <Clock size={16} color={colors.textTertiary} />
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textTertiary }]}>
            CATEGORIES
          </Text>
          <View style={styles.catGrid}>
            {categories.map((cat) => {
              const isSelected = selectedCategories.includes(cat.id);
              return (
                <Pressable
                  key={cat.id}
                  style={[
                    styles.catChip,
                    {
                      backgroundColor: isSelected
                        ? `${cat.color}15`
                        : 'transparent',
                      borderColor: isSelected ? cat.color : colors.border,
                    },
                  ]}
                  onPress={() => toggleCategory(cat.id)}
                >
                  <Text style={styles.catIcon}>{cat.icon}</Text>
                  <Text
                    style={[
                      styles.catText,
                      {
                        color: isSelected
                          ? colors.text
                          : colors.textTertiary,
                      },
                    ]}
                  >
                    {cat.name}
                  </Text>
                </Pressable>
              );
            })}
            <Pressable
              style={[styles.catChip, { borderColor: colors.border, borderStyle: 'dashed' }]}
              onPress={() => router.push('/categories/new')}
            >
              <Plus size={14} color={colors.textTertiary} />
              <Text style={[styles.catText, { color: colors.textTertiary }]}>
                Create new...
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textTertiary }]}>
            REPEAT
          </Text>
          <View style={styles.recurrenceRow}>
            {recurrenceOptions.map((opt) => (
              <Pressable
                key={opt.value}
                style={[
                  styles.recurrencePill,
                  {
                    backgroundColor:
                      recurrence === opt.value ? colors.surfaceLight : 'transparent',
                    borderColor:
                      recurrence === opt.value ? colors.primary : colors.border,
                    borderWidth: recurrence === opt.value ? 2 : 1,
                  },
                ]}
                onPress={() => setRecurrence(opt.value)}
              >
                {opt.value !== 'none' && (
                  <Repeat
                    size={14}
                    color={recurrence === opt.value ? colors.primary : colors.textTertiary}
                  />
                )}
                <Text
                  style={[
                    styles.recurrenceText,
                    {
                      color:
                        recurrence === opt.value
                          ? colors.primary
                          : colors.textTertiary,
                    },
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable
          onPress={handleCreate}
          disabled={loading || !title.trim()}
          style={[
            styles.createBtn,
            {
              backgroundColor: !title.trim()
                ? colors.surfaceLight
                : colors.primary,
              shadowColor: title.trim() ? colors.primary : 'transparent',
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text
              style={[
                styles.createBtnText,
                {
                  color: !title.trim() ? colors.textTertiary : '#FFFFFF',
                },
              ]}
            >
              Create Task
            </Text>
          )}
        </Pressable>

        <View style={{ height: 60 }} />
      </ScrollView>

      <DateTimePicker
        visible={showPicker}
        value={dueDate}
        onConfirm={(date) => {
          setDueDate(date);
          setShowPicker(false);
        }}
        onCancel={() => setShowPicker(false)}
      />
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
  headerTitle: {
    fontSize: 17,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: -0.2,
  },
  scroll: {
    paddingHorizontal: 40,
    paddingTop: 32,
    paddingBottom: 32,
  },
  errorBanner: {
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 28,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  section: {
    marginBottom: 36,
  },
  titleInput: {
    fontSize: 30,
    fontFamily: 'Inter-Bold',
    lineHeight: 38,
    letterSpacing: -0.8,
    paddingVertical: 16,
  },
  descInput: {
    paddingVertical: 20,
    paddingHorizontal: 22,
    borderRadius: 24,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    lineHeight: 26,
    minHeight: 120,
    borderWidth: 2,
  },
  label: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
    letterSpacing: 1,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 12,
  },
  priorityPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 18,
    gap: 8,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 22,
    borderRadius: 24,
    borderWidth: 2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  dateText: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    letterSpacing: -0.1,
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  catChip: {
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
  catText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  recurrenceRow: {
    flexDirection: 'row',
    gap: 12,
  },
  recurrencePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 18,
    gap: 8,
  },
  recurrenceText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  createBtn: {
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
  },
  createBtnText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
});
