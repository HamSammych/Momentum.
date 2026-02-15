import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Check } from 'lucide-react-native';
import { categoryColors } from '@/constants/Colors';

const CATEGORY_ICONS = [
  '\u{1F4BC}', '\u{1F3E0}', '\u{1F468}\u{200D}\u{1F469}\u{200D}\u{1F467}\u{200D}\u{1F466}', '\u{2764}\u{FE0F}', '\u{1F4B0}', '\u{1F4DA}', '\u{1F3C3}', '\u{2708}\u{FE0F}', '\u{1F3A8}', '\u{1F3B5}',
  '\u{1F34E}', '\u{1F697}', '\u{1F3C6}', '\u{1F4BB}', '\u{1F3AF}', '\u{1F31F}',
];

export default function NewCategoryScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(categoryColors[0]);
  const [selectedIcon, setSelectedIcon] = useState(CATEGORY_ICONS[0]);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    if (!user) return;

    setLoading(true);

    try {
      const { error } = await supabase.from('categories').insert({
        user_id: user.id,
        name: name.trim(),
        color: selectedColor,
        icon: selectedIcon,
        is_default: false,
      });

      if (error) throw error;

      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  const canCreate = name.trim().length > 0;

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          New Category
        </Text>
        <TouchableOpacity
          style={[
            styles.createButton,
            {
              backgroundColor: canCreate ? colors.primary : colors.surfaceLight,
            },
          ]}
          onPress={handleCreate}
          disabled={loading || !canCreate}
        >
          <Text
            style={[
              styles.createButtonText,
              {
                color: canCreate ? colors.white : colors.textTertiary,
              },
            ]}
          >
            {loading ? 'Saving...' : 'Create'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.previewCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.previewIconContainer,
              { backgroundColor: `${selectedColor}10` },
            ]}
          >
            <Text style={styles.previewIcon}>{selectedIcon}</Text>
          </View>
          <Text style={[styles.previewName, { color: colors.text }]}>
            {name || 'Category Name'}
          </Text>
          <View
            style={[
              styles.previewColorStrip,
              { backgroundColor: selectedColor },
            ]}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textTertiary }]}>
            NAME
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            placeholder="Enter category name"
            placeholderTextColor={colors.textTertiary}
            value={name}
            onChangeText={setName}
            autoFocus
            accessibilityLabel="Category name"
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textTertiary }]}>
            ICON
          </Text>
          <View style={styles.iconGrid}>
            {CATEGORY_ICONS.map((icon) => (
              <TouchableOpacity
                key={icon}
                style={[
                  styles.iconButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor:
                      selectedIcon === icon ? colors.primary : colors.border,
                    borderWidth: selectedIcon === icon ? 2 : 1,
                  },
                ]}
                onPress={() => setSelectedIcon(icon)}
                accessibilityRole="radio"
                accessibilityState={{ selected: selectedIcon === icon }}
                accessibilityLabel={`Icon ${icon}`}
              >
                <Text style={styles.icon}>{icon}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textTertiary }]}>
            COLOR
          </Text>
          <View style={styles.colorGrid}>
            {categoryColors.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorButton,
                  {
                    backgroundColor: color,
                  },
                ]}
                onPress={() => setSelectedColor(color)}
              >
                {selectedColor === color && (
                  <Check size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
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
  headerTitle: {
    fontSize: 17,
    fontFamily: 'Inter-SemiBold',
  },
  createButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
  createButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
  },
  scrollContent: {
    paddingHorizontal: 40,
    paddingTop: 28,
    paddingBottom: 28,
  },
  previewCard: {
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 36,
    borderWidth: 1,
  },
  previewIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  previewIcon: {
    fontSize: 40,
  },
  previewName: {
    fontSize: 22,
    fontFamily: 'Inter-Bold',
    letterSpacing: -0.3,
    marginBottom: 16,
  },
  previewColorStrip: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  section: {
    marginBottom: 32,
  },
  label: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 1,
    marginBottom: 14,
  },
  input: {
    height: 56,
    borderRadius: 18,
    paddingHorizontal: 20,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    borderWidth: 2,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  iconButton: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 28,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  colorButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
