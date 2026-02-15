import { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Calendar,
  Clock,
} from 'lucide-react-native';

interface DateTimePickerProps {
  visible: boolean;
  value: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function DateTimePicker({
  visible,
  value,
  onConfirm,
  onCancel,
}: DateTimePickerProps) {
  const { colors } = useTheme();
  const [tab, setTab] = useState<'date' | 'time'>('date');
  const [selectedDate, setSelectedDate] = useState(value);
  const [viewYear, setViewYear] = useState(value.getFullYear());
  const [viewMonth, setViewMonth] = useState(value.getMonth());
  const [hours, setHours] = useState(value.getHours());
  const [minutes, setMinutes] = useState(value.getMinutes());

  useEffect(() => {
    if (visible) {
      setSelectedDate(value);
      setViewYear(value.getFullYear());
      setViewMonth(value.getMonth());
      setHours(value.getHours());
      setMinutes(value.getMinutes());
      setTab('date');
    }
  }, [visible]);

  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewYear, viewMonth]);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const selectDay = (day: number) => {
    setSelectedDate(new Date(viewYear, viewMonth, day));
  };

  const isSelected = (day: number) =>
    selectedDate.getDate() === day &&
    selectedDate.getMonth() === viewMonth &&
    selectedDate.getFullYear() === viewYear;

  const isToday = (day: number) => {
    const now = new Date();
    return (
      now.getDate() === day &&
      now.getMonth() === viewMonth &&
      now.getFullYear() === viewYear
    );
  };

  const handleConfirm = () => {
    const result = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      hours,
      minutes
    );
    onConfirm(result);
  };

  const pad = (n: number) => n.toString().padStart(2, '0');

  const formatAmPm = () => {
    const h = hours % 12 || 12;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    return `${h}:${pad(minutes)} ${ampm}`;
  };

  const previewText = `${MONTHS[selectedDate.getMonth()].slice(0, 3)} ${selectedDate.getDate()}, ${selectedDate.getFullYear()}  ·  ${formatAmPm()}`;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onCancel} accessibilityRole="button" accessibilityLabel="Close date picker">
        <Pressable
          style={[
            styles.sheet,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={(e) => e.stopPropagation()}
          accessibilityViewIsModal
          accessibilityLabel="Date and time picker"
        >
          <View style={styles.handle}>
            <View style={[styles.handleBar, { backgroundColor: colors.border }]} />
          </View>

          <Text style={[styles.preview, { color: colors.text }]}>
            {previewText}
          </Text>

          <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              style={[
                styles.tabBtn,
                tab === 'date' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
              ]}
              onPress={() => setTab('date')}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === 'date' }}
              accessibilityLabel="Date picker"
            >
              <Calendar size={16} color={tab === 'date' ? colors.primary : colors.textTertiary} />
              <Text
                style={[
                  styles.tabLabel,
                  { color: tab === 'date' ? colors.primary : colors.textTertiary },
                ]}
              >
                Date
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabBtn,
                tab === 'time' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
              ]}
              onPress={() => setTab('time')}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === 'time' }}
              accessibilityLabel="Time picker"
            >
              <Clock size={16} color={tab === 'time' ? colors.primary : colors.textTertiary} />
              <Text
                style={[
                  styles.tabLabel,
                  { color: tab === 'time' ? colors.primary : colors.textTertiary },
                ]}
              >
                Time
              </Text>
            </TouchableOpacity>
          </View>

          {tab === 'date' ? (
            <View style={styles.calendarSection}>
              <View style={styles.monthNav}>
                <TouchableOpacity
                  onPress={prevMonth}
                  style={[styles.navBtn, { backgroundColor: colors.surfaceLight }]}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Previous month"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <ChevronLeft size={18} color={colors.textSecondary} />
                </TouchableOpacity>
                <Text style={[styles.monthYear, { color: colors.text }]} accessibilityRole="header">
                  {MONTHS[viewMonth]} {viewYear}
                </Text>
                <TouchableOpacity
                  onPress={nextMonth}
                  style={[styles.navBtn, { backgroundColor: colors.surfaceLight }]}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Next month"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <ChevronRight size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.weekRow}>
                {WEEKDAYS.map((d) => (
                  <View key={d} style={styles.cell}>
                    <Text style={[styles.weekLabel, { color: colors.textTertiary }]}>
                      {d}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.grid}>
                {calendarDays.map((day, i) => (
                  <View key={i} style={styles.cell}>
                    {day ? (
                      <TouchableOpacity
                        style={[
                          styles.dayBtn,
                          isSelected(day) && { backgroundColor: colors.primary },
                          isToday(day) && !isSelected(day) && {
                            borderColor: colors.primary,
                            borderWidth: 1,
                          },
                        ]}
                        onPress={() => selectDay(day)}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel={`${MONTHS[viewMonth]} ${day}${isToday(day) ? ', today' : ''}${isSelected(day) ? ', selected' : ''}`}
                        accessibilityState={{ selected: isSelected(day) }}
                        hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            { color: isSelected(day) ? colors.white : colors.text },
                            isToday(day) && !isSelected(day) && { color: colors.primary },
                          ]}
                        >
                          {day}
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.timeSection}>
              <View style={styles.timeRow}>
                <View style={styles.timeUnit}>
                  <Text style={[styles.timeUnitLabel, { color: colors.textTertiary }]}>
                    HOUR
                  </Text>
                  <TouchableOpacity
                    onPress={() => setHours((h) => (h + 1) % 24)}
                    style={[styles.timeArrow, { backgroundColor: colors.surfaceLight }]}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Increase hour"
                  >
                    <ChevronUp size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <View style={[styles.timeDisplay, { backgroundColor: colors.background }]} accessibilityLabel={`Hour: ${pad(hours)}`}>
                    <Text style={[styles.timeValue, { color: colors.text }]}>
                      {pad(hours)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setHours((h) => (h - 1 + 24) % 24)}
                    style={[styles.timeArrow, { backgroundColor: colors.surfaceLight }]}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Decrease hour"
                  >
                    <ChevronDown size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.colon, { color: colors.textTertiary }]}>:</Text>

                <View style={styles.timeUnit}>
                  <Text style={[styles.timeUnitLabel, { color: colors.textTertiary }]}>
                    MINUTE
                  </Text>
                  <TouchableOpacity
                    onPress={() => setMinutes((m) => (m + 5) % 60)}
                    style={[styles.timeArrow, { backgroundColor: colors.surfaceLight }]}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Increase minutes"
                  >
                    <ChevronUp size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <View style={[styles.timeDisplay, { backgroundColor: colors.background }]} accessibilityLabel={`Minutes: ${pad(minutes)}`}>
                    <Text style={[styles.timeValue, { color: colors.text }]}>
                      {pad(minutes)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setMinutes((m) => (m - 5 + 60) % 60)}
                    style={[styles.timeArrow, { backgroundColor: colors.surfaceLight }]}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Decrease minutes"
                  >
                    <ChevronDown size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={[styles.timePreview, { color: colors.textSecondary }]}>
                {formatAmPm()}
              </Text>
            </View>
          )}

          <View style={[styles.actions, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              onPress={onCancel}
              style={[styles.cancelBtn, { backgroundColor: colors.surfaceLight }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleConfirm}
              style={[styles.confirmBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.confirmText, { color: colors.white }]}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingBottom: 36,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 20,
  },
  handle: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 6,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  preview: {
    fontSize: 17,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
    paddingVertical: 16,
    letterSpacing: -0.2,
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginHorizontal: 24,
    marginBottom: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  tabLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  calendarSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  monthYear: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: -0.2,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  cell: {
    width: '14.28%' as any,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 3,
  },
  weekLabel: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  timeSection: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  timeUnit: {
    alignItems: 'center',
    gap: 10,
  },
  timeUnitLabel: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 1,
    marginBottom: 2,
  },
  timeArrow: {
    width: 56,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeDisplay: {
    width: 72,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeValue: {
    fontSize: 30,
    fontFamily: 'Inter-Bold',
    letterSpacing: -0.5,
  },
  colon: {
    fontSize: 30,
    fontFamily: 'Inter-Bold',
    marginTop: 24,
  },
  timePreview: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    marginTop: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    paddingTop: 20,
    paddingHorizontal: 24,
    borderTopWidth: 1,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
  },
  confirmBtn: {
    flex: 1.5,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  confirmText: {
    fontSize: 15,
    fontFamily: 'Inter-Bold',
  },
});
