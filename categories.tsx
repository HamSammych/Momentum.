import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { Category } from '@/types/database';
import { Plus, ChevronRight } from 'lucide-react-native';
import { Skeleton } from '@/components/Skeleton';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function CategoriesScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [taskCounts, setTaskCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadCategories();
    }, [user])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCategories();
    setRefreshing(false);
  }, [user]);

  const loadCategories = async () => {
    if (!user) return;

    try {
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (categoriesData) {
        setCategories(categoriesData);

        const counts: Record<string, number> = {};
        for (const category of categoriesData) {
          const { count } = await supabase
            .from('task_categories')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id);

          counts[category.id] = count || 0;
        }
        setTaskCounts(counts);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">Categories</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
          onPress={() => router.push('/categories/new')}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Add category"
        >
          <Plus size={20} color={colors.white} />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <Text style={[styles.subtitle, { color: colors.textTertiary }]}>
          Organize your tasks by different areas of your life
        </Text>

        {loading && (
          <View style={styles.grid}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={[styles.categoryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={styles.categoryContent}>
                  <Skeleton width={56} height={56} borderRadius={18} />
                  <View style={[styles.categoryInfo, { gap: 8 }]}>
                    <Skeleton width="60%" height={16} borderRadius={6} />
                    <Skeleton width="30%" height={12} borderRadius={5} />
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.grid}>
          {categories.map((category, index) => (
            <Animated.View
              key={category.id}
              entering={FadeInDown.delay(120 + index * 60).springify()}
            >
              <TouchableOpacity
                style={[
                  styles.categoryCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() =>
                  router.push(`/categories/${category.id}` as any)
                }
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`${category.name} category, ${taskCounts[category.id] || 0} tasks`}
              >
                <View style={styles.categoryContent}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: `${category.color}10` },
                    ]}
                  >
                    <Text style={styles.categoryIcon}>{category.icon}</Text>
                  </View>
                  <View style={styles.categoryInfo}>
                    <Text style={[styles.categoryName, { color: colors.text }]}>
                      {category.name}
                    </Text>
                    <Text
                      style={[
                        styles.taskCount,
                        { color: colors.textTertiary },
                      ]}
                    >
                      {taskCounts[category.id] || 0}{' '}
                      {taskCounts[category.id] === 1 ? 'task' : 'tasks'}
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.colorStrip,
                    { backgroundColor: category.color },
                  ]}
                />
                <ChevronRight size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {categories.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No categories yet
            </Text>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              Create categories to organize your tasks
            </Text>
          </View>
        )}

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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
    paddingBottom: 12,
  },
  title: {
    fontSize: 36,
    fontFamily: 'Inter-Bold',
    letterSpacing: -1,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 40,
    paddingTop: 16,
    paddingBottom: 24,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 22,
    marginBottom: 32,
  },
  grid: {
    gap: 12,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    gap: 16,
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    flex: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIcon: {
    fontSize: 28,
  },
  categoryInfo: {
    flex: 1,
    gap: 4,
  },
  categoryName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: -0.2,
  },
  taskCount: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
  },
  colorStrip: {
    width: 4,
    height: 36,
    borderRadius: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 22,
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
});
