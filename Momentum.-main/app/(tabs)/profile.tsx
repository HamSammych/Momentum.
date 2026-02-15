import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { hexToRgba } from '@/constants/Colors';
import {
  User,
  Moon,
  Bell,
  Lock,
  Users,
  LogOut,
  Award,
  Target,
  Palette,
  ChevronRight,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function ProfileScreen() {
  const { user, profile, signOut } = useAuth();
  const { colors, isDark } = useTheme();
  const router = useRouter();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: signOut,
      },
    ]);
  };

  const togglePublicProfile = async () => {
    if (!user) return;

    try {
      const newValue = !profile?.is_public;
      await supabase
        .from('profiles')
        .update({ is_public: newValue })
        .eq('id', user.id);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">Profile</Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(120).springify()}
          style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <View style={[styles.avatarLarge, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarTextLarge}>
              {profile?.full_name?.[0]?.toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={[styles.profileName, { color: colors.text }]}>
            {profile?.full_name || 'User'}
          </Text>
          <Text style={[styles.profileEmail, { color: colors.textTertiary }]}>
            {profile?.email}
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(180).springify()}
          style={[styles.statsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <View style={styles.statItem}>
            <View style={[styles.statIconWrap, { backgroundColor: hexToRgba(colors.primary, 0.08) }]}>
              <Award size={20} color={colors.primary} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {profile?.total_tasks_completed || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>
              Completed
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <View style={[styles.statIconWrap, { backgroundColor: colors.primaryAlpha10 }]}>
              <Target size={20} color={colors.primary} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {profile?.current_streak || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>
              Day Streak
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(240).springify()} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
            PREFERENCES
          </Text>

          <View style={[styles.settingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => router.push('/settings/appearance')}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconWrap, { backgroundColor: hexToRgba(colors.primary, 0.1) }]}>
                  <Palette size={18} color={colors.primary} />
                </View>
                <Text style={[styles.settingText, { color: colors.text }]}>
                  Appearance
                </Text>
              </View>
              <ChevronRight size={18} color={colors.textTertiary} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.settingItem} accessibilityLabel="Dark Mode, always on" accessibilityRole="switch" accessibilityState={{ checked: isDark, disabled: true }}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconWrap, { backgroundColor: colors.surfaceLight }]}>
                  <Moon size={18} color={colors.textSecondary} />
                </View>
                <Text style={[styles.settingText, { color: colors.text }]}>
                  Dark Mode
                </Text>
              </View>
              <Switch
                value={isDark}
                disabled
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconWrap, { backgroundColor: colors.surfaceLight }]}>
                  <Bell size={18} color={colors.textSecondary} />
                </View>
                <Text style={[styles.settingText, { color: colors.textTertiary }]}>
                  Notifications
                </Text>
              </View>
              <View style={[styles.comingSoonBadge, { backgroundColor: colors.surfaceLight }]}>
                <Text style={[styles.comingSoonText, { color: colors.textTertiary }]}>Soon</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
            PRIVACY
          </Text>

          <View style={[styles.settingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.settingItem} accessibilityLabel={`Public Profile, ${profile?.is_public ? 'enabled' : 'disabled'}`} accessibilityRole="switch" accessibilityState={{ checked: profile?.is_public || false }}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconWrap, { backgroundColor: colors.surfaceLight }]}>
                  <User size={18} color={colors.textSecondary} />
                </View>
                <Text style={[styles.settingText, { color: colors.text }]}>
                  Public Profile
                </Text>
              </View>
              <Switch
                value={profile?.is_public || false}
                onValueChange={togglePublicProfile}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconWrap, { backgroundColor: colors.surfaceLight }]}>
                  <Lock size={18} color={colors.textSecondary} />
                </View>
                <Text style={[styles.settingText, { color: colors.textTertiary }]}>
                  Privacy Settings
                </Text>
              </View>
              <View style={[styles.comingSoonBadge, { backgroundColor: colors.surfaceLight }]}>
                <Text style={[styles.comingSoonText, { color: colors.textTertiary }]}>Soon</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(360).springify()} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
            SOCIAL
          </Text>

          <View style={[styles.settingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconWrap, { backgroundColor: colors.surfaceLight }]}>
                  <Users size={18} color={colors.textSecondary} />
                </View>
                <Text style={[styles.settingText, { color: colors.textTertiary }]}>
                  My Teams
                </Text>
              </View>
              <View style={[styles.comingSoonBadge, { backgroundColor: colors.surfaceLight }]}>
                <Text style={[styles.comingSoonText, { color: colors.textTertiary }]}>Soon</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(420).springify()}>
          <TouchableOpacity
            style={[styles.signOutButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
            onPress={handleSignOut}
            activeOpacity={0.7}
          >
            <LogOut size={18} color={colors.error} />
            <Text style={[styles.signOutText, { color: colors.error }]}>
              Sign Out
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
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
  profileCard: {
    padding: 36,
    marginHorizontal: 40,
    marginTop: 28,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
  },
  avatarLarge: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  avatarTextLarge: {
    color: '#FFFFFF',
    fontSize: 36,
    fontFamily: 'Inter-Bold',
  },
  profileName: {
    fontSize: 26,
    fontFamily: 'Inter-Bold',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  profileEmail: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  statsCard: {
    flexDirection: 'row',
    padding: 28,
    marginHorizontal: 40,
    marginTop: 14,
    marginBottom: 40,
    borderRadius: 24,
    borderWidth: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 10,
  },
  statIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statDivider: {
    width: 1,
    marginHorizontal: 16,
  },
  statValue: {
    fontSize: 30,
    fontFamily: 'Inter-Bold',
    letterSpacing: -0.8,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  section: {
    marginBottom: 28,
    paddingHorizontal: 40,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 1,
    marginBottom: 12,
  },
  settingCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  settingIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingText: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
  },
  divider: {
    height: 1,
    marginLeft: 76,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    marginHorizontal: 40,
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
  },
  signOutText: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
  },
  comingSoonBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  comingSoonText: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    letterSpacing: 0.3,
  },
});
