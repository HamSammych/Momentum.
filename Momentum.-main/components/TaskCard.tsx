import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Task, Category } from '@/types/database';
import { CheckCircle2, Circle, Clock, Trash2, AlertTriangle } from 'lucide-react-native';
import { getPriorityStyle } from '@/constants/Colors';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface TaskCardProps {
  task: Task;
  categories?: Category[];
  onPress: () => void;
  onToggleStatus: () => void;
  onDelete?: () => void;
  index?: number;
}

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

function getDateInfo(dateStr: string | null) {
  if (!dateStr) return { label: null, isOverdue: false, isSoon: false };

  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  let label: string;
  if (diffDays < 0) label = `${Math.abs(diffDays)}d overdue`;
  else if (diffDays === 0) label = 'Today';
  else if (diffDays === 1) label = 'Tomorrow';
  else label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return {
    label,
    isOverdue: diffDays < 0,
    isSoon: diffDays === 0 || diffDays === 1,
  };
}

export function TaskCard({
  task,
  categories,
  onPress,
  onToggleStatus,
  onDelete,
  index = 0,
}: TaskCardProps) {
  const { colors, accent } = useTheme();
  const isDone = task.status === 'done';
  const [confirmDelete, setConfirmDelete] = useState(false);
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const dateInfo = isDone ? { label: null, isOverdue: false, isSoon: false } : getDateInfo(task.due_date);
  const priorityStyle = getPriorityStyle(task.priority, accent);

  const dateColor = dateInfo.isOverdue
    ? priorityStyle.dot
    : dateInfo.isSoon
      ? colors.primary
      : colors.textTertiary;

  const handleDeletePress = () => {
    if (confirmDelete) {
      onDelete?.();
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  const entering = reduceMotion
    ? undefined
    : FadeInDown.delay(index * 60).springify();

  return (
    <Animated.View
      entering={entering}
      style={[styles.wrapper, cardAnimStyle]}
    >
      <Pressable
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: isDone ? colors.border : dateInfo.isOverdue ? priorityStyle.bg : colors.border,
          },
        ]}
        onPress={onPress}
        onPressIn={() => {
          if (!reduceMotion) scale.value = withSpring(0.975, { damping: 15, stiffness: 300 });
        }}
        onPressOut={() => {
          if (!reduceMotion) scale.value = withSpring(1, { damping: 15, stiffness: 300 });
        }}
        accessibilityRole="button"
        accessibilityLabel={`Task: ${task.title}. Priority: ${PRIORITY_LABELS[task.priority] || task.priority}. Status: ${isDone ? 'completed' : 'pending'}${dateInfo.label ? `. Due: ${dateInfo.label}` : ''}`}
      >
        <TouchableOpacity
          onPress={onToggleStatus}
          style={styles.checkbox}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isDone }}
          accessibilityLabel={isDone ? 'Mark task as not done' : 'Mark task as done'}
        >
          {isDone ? (
            <CheckCircle2 size={22} color={colors.primary} />
          ) : (
            <Circle size={22} color={colors.textTertiary} />
          )}
        </TouchableOpacity>

        <View style={styles.body}>
          <Text
            style={[
              styles.title,
              { color: isDone ? colors.textTertiary : colors.text },
              isDone && styles.titleDone,
            ]}
            numberOfLines={2}
          >
            {task.title}
          </Text>

          {task.description ? (
            <Text
              style={[styles.desc, { color: colors.textTertiary }]}
              numberOfLines={1}
            >
              {task.description}
            </Text>
          ) : null}

          <View style={styles.meta}>
            {dateInfo.label ? (
              <View
                style={[
                  styles.dateBadge,
                  dateInfo.isOverdue && {
                    backgroundColor: priorityStyle.bg,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 8,
                  },
                ]}
                accessibilityLabel={`Due: ${dateInfo.label}`}
              >
                {dateInfo.isOverdue ? (
                  <AlertTriangle size={11} color={dateColor} />
                ) : (
                  <Clock size={12} color={dateColor} />
                )}
                <Text style={[styles.dateText, { color: dateColor }]}>
                  {dateInfo.label}
                </Text>
              </View>
            ) : task.due_date && isDone ? (
              <View style={styles.dateBadge}>
                <Clock size={12} color={colors.textTertiary} />
                <Text style={[styles.dateText, { color: colors.textTertiary }]}>
                  {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </View>
            ) : null}

            {categories && categories.length > 0 ? (
              <View style={styles.cats} accessibilityElementsHidden>
                {categories.slice(0, 2).map((cat) => (
                  <View
                    key={cat.id}
                    style={[
                      styles.catDot,
                      { backgroundColor: `${cat.color}15` },
                    ]}
                  >
                    <Text style={styles.catIcon}>{cat.icon}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            <View
              style={[
                styles.priorityPip,
                { borderColor: priorityStyle.bg },
              ]}
              accessibilityLabel={`${PRIORITY_LABELS[task.priority]} priority`}
            >
              <View
                style={[
                  styles.priorityDot,
                  { backgroundColor: priorityStyle.dot },
                ]}
              />
            </View>
          </View>
        </View>

        {onDelete ? (
          <Pressable
            onPress={handleDeletePress}
            style={[
              styles.deleteBtn,
              confirmDelete && {
                backgroundColor: `${colors.error}1A`,
                borderRadius: 10,
              },
            ]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={confirmDelete ? 'Confirm delete task' : 'Delete task'}
            accessibilityHint={confirmDelete ? 'Tap to permanently delete' : 'Tap once to confirm, then tap again to delete'}
          >
            <Trash2
              size={14}
              color={confirmDelete ? colors.error : colors.textTertiary}
            />
          </Pressable>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 10,
  },
  card: {
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    borderWidth: 1,
  },
  checkbox: {
    paddingTop: 2,
  },
  body: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  titleDone: {
    textDecorationLine: 'line-through',
  },
  desc: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    lineHeight: 18,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dateText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.2,
  },
  cats: {
    flexDirection: 'row',
    gap: 4,
  },
  catDot: {
    width: 22,
    height: 22,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catIcon: {
    fontSize: 11,
  },
  priorityPip: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  deleteBtn: {
    padding: 6,
    opacity: 0.6,
    marginTop: 2,
  },
});
