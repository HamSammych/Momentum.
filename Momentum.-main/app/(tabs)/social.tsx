import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/database';
import { Search, UserPlus, TrendingUp } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function SocialScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'feed' | 'discover'>('feed');
  const [feedTasks, setFeedTasks] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestedUsers, setSuggestedUsers] = useState<Profile[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (activeTab === 'feed') {
      loadFeed();
    } else {
      loadSuggestedUsers();
    }
  }, [activeTab, user]);

  useEffect(() => {
    if (activeTab !== 'discover') return;
    const timer = setTimeout(() => {
      loadSuggestedUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (activeTab === 'feed') {
      await loadFeed();
    } else {
      await loadSuggestedUsers();
    }
    setRefreshing(false);
  }, [activeTab, user, searchQuery]);

  const loadFeed = async () => {
    if (!user) return;

    try {
      const { data: followingData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (!followingData || followingData.length === 0) {
        setFeedTasks([]);
        return;
      }

      const followingIds = followingData.map((f) => f.following_id);

      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*, profiles:user_id(*)')
        .in('user_id', followingIds)
        .eq('is_public', true)
        .eq('status', 'done')
        .order('completed_at', { ascending: false })
        .limit(20);

      if (tasksData) setFeedTasks(tasksData);
    } catch (error) {
      console.error('Error loading feed:', error);
    }
  };

  const loadSuggestedUsers = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .eq('is_public', true)
        .neq('id', user.id);

      if (searchQuery.trim()) {
        query = query.ilike('full_name', `%${searchQuery.trim()}%`);
      }

      const { data } = await query.limit(20);

      if (data) setSuggestedUsers(data);
    } catch (error) {
      console.error('Error loading suggested users:', error);
    }
  };

  const followUser = async (userId: string) => {
    if (!user) return;

    try {
      await supabase.from('follows').insert({
        follower_id: user.id,
        following_id: userId,
      });

      setSuggestedUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">Social</Text>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(120).springify()}
        style={[styles.tabs, { borderBottomColor: colors.border }]}
      >
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'feed' && [
              styles.activeTab,
              { borderBottomColor: colors.primary },
            ],
          ]}
          onPress={() => setActiveTab('feed')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'feed' }}
          accessibilityLabel="Feed"
        >
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === 'feed' ? colors.primary : colors.textTertiary,
              },
            ]}
          >
            Feed
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'discover' && [
              styles.activeTab,
              { borderBottomColor: colors.primary },
            ],
          ]}
          onPress={() => setActiveTab('discover')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'discover' }}
          accessibilityLabel="Discover people"
        >
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === 'discover'
                    ? colors.primary
                    : colors.textTertiary,
              },
            ]}
          >
            Discover
          </Text>
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
        {activeTab === 'feed' ? (
          feedTasks.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TrendingUp size={40} color={colors.textTertiary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                Your feed is empty
              </Text>
              <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                Follow people to see their achievements
              </Text>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
                onPress={() => setActiveTab('discover')}
                activeOpacity={0.7}
              >
                <Text style={styles.buttonText}>Discover People</Text>
              </TouchableOpacity>
            </View>
          ) : (
            feedTasks.map((item, index) => (
              <Animated.View
                key={item.id}
                entering={FadeInDown.delay(index * 60).springify()}
                style={[
                  styles.feedCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.feedHeader}>
                  <View
                    style={[
                      styles.avatar,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Text style={styles.avatarText}>
                      {item.profiles?.full_name?.[0] || 'U'}
                    </Text>
                  </View>
                  <View style={styles.feedUserInfo}>
                    <Text style={[styles.feedUserName, { color: colors.text }]}>
                      {item.profiles?.full_name || 'Unknown User'}
                    </Text>
                    <Text
                      style={[styles.feedTime, { color: colors.textTertiary }]}
                    >
                      completed a task
                    </Text>
                  </View>
                </View>
                <Text style={[styles.feedTaskTitle, { color: colors.text }]}>
                  {item.title}
                </Text>
              </Animated.View>
            ))
          )
        ) : (
          <View>
            <View style={styles.searchContainer}>
              <View
                style={[
                  styles.searchBar,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                accessibilityRole="search"
              >
                <Search size={18} color={colors.textTertiary} accessibilityElementsHidden />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Search people..."
                  placeholderTextColor={colors.textTertiary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  accessibilityLabel="Search people"
                />
              </View>
            </View>

            {suggestedUsers.map((userProfile, index) => (
              <Animated.View
                key={userProfile.id}
                entering={FadeInDown.delay(index * 60).springify()}
                style={[
                  styles.userCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View
                  style={[styles.avatar, { backgroundColor: colors.primary }]}
                >
                  <Text style={styles.avatarText}>
                    {userProfile.full_name?.[0] || 'U'}
                  </Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={[styles.userName, { color: colors.text }]}>
                    {userProfile.full_name || 'Unknown User'}
                  </Text>
                  <Text
                    style={[
                      styles.userStats,
                      { color: colors.textTertiary },
                    ]}
                  >
                    {userProfile.total_tasks_completed} tasks completed
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.followButton,
                    { backgroundColor: colors.primary, shadowColor: colors.primary },
                  ]}
                  onPress={() => followUser(userProfile.id)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`Follow ${userProfile.full_name || 'user'}`}
                >
                  <UserPlus size={16} color={colors.white} />
                </TouchableOpacity>
              </Animated.View>
            ))}

            {suggestedUsers.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  No users found
                </Text>
                <Text
                  style={[styles.emptyText, { color: colors.textTertiary }]}
                >
                  Try searching for someone
                </Text>
              </View>
            )}
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
    paddingHorizontal: 40,
    paddingTop: 80,
    paddingBottom: 12,
  },
  title: {
    fontSize: 36,
    fontFamily: 'Inter-Bold',
    letterSpacing: -1,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 40,
    borderBottomWidth: 1,
    marginTop: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
  },
  scrollContent: {
    paddingHorizontal: 40,
    paddingTop: 24,
    paddingBottom: 24,
  },
  searchContainer: {
    marginBottom: 24,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 52,
    borderRadius: 18,
    borderWidth: 1,
    gap: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter-Regular',
  },
  feedCard: {
    padding: 20,
    borderRadius: 24,
    marginBottom: 12,
    gap: 14,
    borderWidth: 1,
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  feedUserInfo: {
    flex: 1,
  },
  feedUserName: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: -0.2,
  },
  feedTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  feedTaskTitle: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    lineHeight: 22,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
    marginBottom: 12,
    gap: 16,
    borderWidth: 1,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: -0.2,
    marginBottom: 3,
  },
  userStats: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  followButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
    gap: 14,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: 'Inter-Bold',
    letterSpacing: -0.3,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
});
