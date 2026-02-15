import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider } from '@/contexts/AuthContext';
import { AccentProvider } from '@/contexts/AccentContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { NetworkProvider } from '@/contexts/NetworkContext';
import { OfflineBanner } from '@/components/OfflineBanner';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <NetworkProvider>
      <AccentProvider>
        <ThemeProvider>
          <AuthProvider>
            <View style={styles.root}>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen
                  name="tasks"
                  options={{ presentation: 'modal' }}
                />
                <Stack.Screen
                  name="categories"
                  options={{ presentation: 'modal' }}
                />
                <Stack.Screen
                  name="settings"
                  options={{ presentation: 'modal' }}
                />
                <Stack.Screen name="+not-found" />
              </Stack>
              <OfflineBanner />
              <StatusBar style="light" />
            </View>
          </AuthProvider>
        </ThemeProvider>
      </AccentProvider>
    </NetworkProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
