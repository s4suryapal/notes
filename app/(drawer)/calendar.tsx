import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { useNotes } from '@/lib/NotesContext';
import { NoteCard } from '@/components';

export default function CalendarScreen() {
  const { notes } = useNotes();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Get notes for selected date
  const notesForSelectedDate = useMemo(() => {
    const dateStr = selectedDate.toDateString();
    return notes.filter(note => {
      if (note.is_deleted || note.is_archived) return false;
      const noteDate = new Date(note.created_at).toDateString();
      return noteDate === dateStr;
    });
  }, [notes, selectedDate]);

  // Get notes count per day for current month
  const notesCountByDate = useMemo(() => {
    const counts: Record<string, number> = {};
    notes.forEach(note => {
      if (note.is_deleted || note.is_archived) return;
      const noteDate = new Date(note.created_at);
      if (
        noteDate.getMonth() === currentMonth.getMonth() &&
        noteDate.getFullYear() === currentMonth.getFullYear()
      ) {
        const dateStr = noteDate.toDateString();
        counts[dateStr] = (counts[dateStr] || 0) + 1;
      }
    });
    return counts;
  }, [notes, currentMonth]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay(); // 0 = Sunday

    const days: Array<Date | null> = [];

    // Add padding for previous month
    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }

    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }, [currentMonth]);

  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDatePress = (date: Date) => {
    setSelectedDate(date);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const monthYear = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calendar</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Calendar Header */}
      <View style={styles.calendarHeader}>
        <TouchableOpacity onPress={handlePreviousMonth} style={styles.monthButton}>
          <ChevronLeft size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.monthYear}>{monthYear}</Text>
        <TouchableOpacity onPress={handleNextMonth} style={styles.monthButton}>
          <ChevronRight size={24} color={Colors.light.text} />
        </TouchableOpacity>
      </View>

      {/* Weekday Headers */}
      <View style={styles.weekdayHeader}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <Text key={day} style={styles.weekdayText}>
            {day}
          </Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <ScrollView style={styles.calendarScroll}>
        <View style={styles.calendarGrid}>
          {calendarDays.map((day, index) => {
            if (!day) {
              return <View key={`empty-${index}`} style={styles.dayCell} />;
            }

            const noteCount = notesCountByDate[day.toDateString()] || 0;
            const today = isToday(day);
            const selected = isSelected(day);

            return (
              <TouchableOpacity
                key={day.toDateString()}
                style={[
                  styles.dayCell,
                  today && styles.dayCellToday,
                  selected && styles.dayCellSelected,
                ]}
                onPress={() => handleDatePress(day)}
              >
                <Text
                  style={[
                    styles.dayNumber,
                    today && styles.dayNumberToday,
                    selected && styles.dayNumberSelected,
                  ]}
                >
                  {day.getDate()}
                </Text>
                {noteCount > 0 && (
                  <View style={styles.noteIndicator}>
                    <Text style={styles.noteCount}>{noteCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Notes for Selected Date */}
        <View style={styles.notesSection}>
          <Text style={styles.notesSectionTitle}>
            Notes for {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </Text>
          {notesForSelectedDate.length === 0 ? (
            <Text style={styles.emptyText}>No notes on this day</Text>
          ) : (
            <FlatList
              data={notesForSelectedDate}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <NoteCard
                  note={item}
                  onPress={() => router.push(`/note/${item.id}`)}
                  onMenuPress={() => {}}
                />
              )}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.light.text,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.light.surface,
  },
  monthButton: {
    padding: Spacing.xs,
  },
  monthYear: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.light.text,
  },
  weekdayHeader: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.light.textSecondary,
  },
  calendarScroll: {
    flex: 1,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.xs,
    paddingTop: Spacing.xs,
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: Spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dayCellToday: {
    backgroundColor: Colors.light.primaryLight,
    borderRadius: BorderRadius.md,
  },
  dayCellSelected: {
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.md,
  },
  dayNumber: {
    fontSize: Typography.fontSize.base,
    color: Colors.light.text,
    fontWeight: Typography.fontWeight.medium,
  },
  dayNumberToday: {
    color: Colors.light.primary,
    fontWeight: Typography.fontWeight.bold,
  },
  dayNumberSelected: {
    color: Colors.light.surface,
    fontWeight: Typography.fontWeight.bold,
  },
  noteIndicator: {
    position: 'absolute',
    bottom: 4,
    backgroundColor: Colors.light.accent,
    borderRadius: BorderRadius.round,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  noteCount: {
    fontSize: Typography.fontSize.xs,
    color: Colors.light.surface,
    fontWeight: Typography.fontWeight.bold,
  },
  notesSection: {
    padding: Spacing.base,
    marginTop: Spacing.md,
  },
  notesSectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.light.text,
    marginBottom: Spacing.base,
  },
  emptyText: {
    fontSize: Typography.fontSize.base,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    paddingVertical: Spacing.xl,
  },
});
