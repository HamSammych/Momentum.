import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAccent } from '@/contexts/AccentContext';
import { hexToRgba } from '@/constants/Colors';
import { ArrowLeft, Check, Palette } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

const ACCENT_PRESETS = [
  { name: 'Indigo', color: '#6366F1' },
  { name: 'Teal', color: '#14B8A6' },
  { name: 'Rose', color: '#F43F5E' },
  { name: 'Emerald', color: '#10B981' },
  { name: 'Purple', color: '#A78BFA' },
  { name: 'Amber', color: '#FBBF24' },
  { name: 'Sky', color: '#0EA5E9' },
  { name: 'Pink', color: '#EC4899' },
  { name: 'Black', color: '#000000' },
  { name: 'White', color: '#FFFFFF' },
  { name: 'Gray', color: '#6B7280' },
];

const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;

export default function AppearanceScreen() {
  const { colors } = useTheme();
  const { accent, setAccent } = useAccent();
  const router = useRouter();
  const [hexInput, setHexInput] = useState('');
  const [hexError, setHexError] = useState(false);

  const applyHex = () => {
    const value = hexInput.startsWith('#') ? hexInput : `#${hexInput}`;
    if (HEX_REGEX.test(value)) {
      setAccent(value);
      setHexError(false);
      setHexInput('');
    } else {
      setHexError(true);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.surfaceLight }]}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Appearance
        </Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={FadeInDown.delay(60).springify()}
          style={[styles.previewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <View style={[styles.previewIcon, { backgroundColor: hexToRgba(accent, 0.1) }]}>
            <Palette size={28} color={accent} />
          </View>
          <Text style={[styles.previewTitle, { color: colors.text }]}>
            Live Preview
          </Text>
          <Text style={[styles.previewSub, { color: colors.textTertiary }]}>
            Your accent color is applied everywhere
          </Text>
          <View style={[styles.previewBtn, { backgroundColor: accent }]}>
            <Text style={styles.previewBtnText}>Sample Button</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).springify()} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
            THEME
          </Text>
          <View style={[styles.settingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Dark Mode
              </Text>
              <Switch
                value={true}
                disabled
                trackColor={{ false: colors.border, true: accent }}
                thumbColor={colors.white}
              />
            </View>
            <Text style={[styles.settingHint, { color: colors.textTertiary }]}>
              Dark mode is always on
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(180).springify()} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
            ACCENT COLOR
          </Text>

          <View style={styles.swatchGrid}>
            {ACCENT_PRESETS.map((preset) => {
              const isActive = accent === preset.color;
              const needsBorder = preset.color === '#FFFFFF' || preset.color === '#000000';
              return (
                <TouchableOpacity
                  key={preset.color}
                  style={[
                    styles.swatch,
                    { backgroundColor: preset.color },
                    needsBorder && { borderWidth: 1, borderColor: colors.border },
                    isActive && styles.swatchActive,
                  ]}
                  onPress={() => setAccent(preset.color)}
                  activeOpacity={0.7}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={`${preset.name} accent color`}
                >
                  {isActive && (
                    <Check
                      size={18}
                      color={preset.color === '#FFFFFF' || preset.color === '#FBBF24' ? '#000000' : '#FFFFFF'}
                      strokeWidth={3}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.swatchLabels}>
            {ACCENT_PRESETS.map((preset) => (
              <Text
                key={preset.color}
                style={[
                  styles.swatchLabel,
                  {
                    color: accent === preset.color ? colors.text : colors.textTertiary,
                  },
                ]}
                numberOfLines={1}
              >
                {preset.name}
              </Text>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(240).springify()} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
            CUSTOM HEX COLOR
          </Text>
          <View style={[styles.hexRow, { borderColor: hexError ? colors.error : colors.border }]}>
            <Text style={[styles.hashSign, { color: colors.textTertiary }]}>#</Text>
            <TextInput
              style={[styles.hexInput, { color: colors.text }]}
              placeholder="FF5733"
              placeholderTextColor={colors.textTertiary}
              value={hexInput.replace('#', '')}
              onChangeText={(t) => {
                setHexInput(t.replace('#', ''));
                setHexError(false);
              }}
              maxLength={6}
              autoCapitalize="characters"
              autoCorrect={false}
              accessibilityLabel="Custom hex color code"
            />
            <TouchableOpacity
              style={[styles.applyBtn, { backgroundColor: accent }]}
              onPress={applyHex}
              activeOpacity={0.7}
            >
              <Text style={styles.applyBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
          {hexError && (
            <Text style={[styles.hexErrorText, { color: colors.error }]}>
              Enter a valid 6-digit hex code
            </Text>
          )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingTop: 64,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  backBtn: {
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
    paddingTop: 28,
  },
  previewCard: {
    padding: 36,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 40,
    borderWidth: 1,
  },
  previewIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  previewTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  previewSub: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 24,
  },
  previewBtn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
  },
  previewBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  section: {
    marginBottom: 36,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 1,
    marginBottom: 16,
  },
  settingCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  settingLabel: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
  },
  settingHint: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'flex-start',
  },
  swatch: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchActive: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  swatchLabels: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 8,
  },
  swatchLabel: {
    width: 52,
    fontSize: 9,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  hexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 18,
    paddingLeft: 20,
    overflow: 'hidden',
  },
  hashSign: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    marginRight: 4,
  },
  hexInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    paddingVertical: 16,
    letterSpacing: 2,
  },
  applyBtn: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 14,
    marginRight: 4,
    marginVertical: 4,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-Bold',
  },
  hexErrorText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 8,
  },
});
