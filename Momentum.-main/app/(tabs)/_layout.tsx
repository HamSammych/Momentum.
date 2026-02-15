import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Home,
  CheckSquare,
  FolderOpen,
  Users,
  User,
} from 'lucide-react-native';

function TabIcon({ icon: Icon, color, focused }: { icon: any; color: string; focused: boolean }) {
  return (
    <View style={styles.iconWrap}>
      <Icon size={22} color={color} strokeWidth={focused ? 2.2 : 1.5} />
      {focused && <View style={[styles.indicator, { backgroundColor: color }]} />}
    </View>
  );
}

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#050505',
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 72,
          paddingBottom: 14,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: {
          fontFamily: 'Inter-Medium',
          fontSize: 10,
          letterSpacing: 0.3,
          marginTop: 4,
        },
        tabBarShowLabel: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarAccessibilityLabel: 'Home tab',
          tabBarIcon: ({ color, focused }) => <TabIcon icon={Home} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarAccessibilityLabel: 'Tasks tab',
          tabBarIcon: ({ color, focused }) => <TabIcon icon={CheckSquare} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Categories',
          tabBarAccessibilityLabel: 'Categories tab',
          tabBarIcon: ({ color, focused }) => <TabIcon icon={FolderOpen} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: 'Social',
          tabBarAccessibilityLabel: 'Social tab',
          tabBarIcon: ({ color, focused }) => <TabIcon icon={Users} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarAccessibilityLabel: 'Profile tab',
          tabBarIcon: ({ color, focused }) => <TabIcon icon={User} color={color} focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  indicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
