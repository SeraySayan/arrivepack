import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  StatusBar,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTripStore } from '../../src/store/tripStore';
import ActivityCard from '../../src/components/trip/ActivityCard';
import { Colors } from '../../src/theme/colors';
import { Typography } from '../../src/theme/typography';
import { Radii, Spacing } from '../../src/theme/spacing';

const TIME_SLOTS = [
  { key: 'morning' as const, label: 'Morning', emoji: '🌅' },
  { key: 'afternoon' as const, label: 'Afternoon', emoji: '☀️' },
  { key: 'evening' as const, label: 'Evening', emoji: '🌙' },
];

export default function DayDetailScreen() {
  const { dayIndex } = useLocalSearchParams<{ dayIndex: string }>();
  const { trip } = useTripStore();

  const idx = parseInt(dayIndex ?? '0', 10);
  const day = trip?.itinerary[idx];

  if (!day) {
    return (
      <SafeAreaView style={styles.safe}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.notFound}>Day not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        {/* Day header */}
        <View style={styles.dayHeader}>
          <View style={styles.dayBadge}>
            <Text style={styles.dayBadgeText}>Day {day.day}</Text>
          </View>
          <Text style={styles.title}>{day.title}</Text>
          <Text style={styles.theme}>{day.theme}</Text>
          <Text style={styles.summary}>{day.summary}</Text>
        </View>

        {/* Meta */}
        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>🚗</Text>
            <Text style={styles.metaText}>{day.transportSuggestion}</Text>
          </View>
        </View>

        {/* Time slots */}
        {TIME_SLOTS.map((slot) => {
          const activities = day[slot.key];
          if (!activities || activities.length === 0) return null;
          return (
            <View key={slot.key} style={styles.slotSection}>
              <View style={styles.slotHeader}>
                <Text style={styles.slotEmoji}>{slot.emoji}</Text>
                <Text style={styles.slotLabel}>{slot.label}</Text>
              </View>
              {activities.map((act) => (
                <ActivityCard key={act.id} activity={act} timeLabel={slot.label} />
              ))}
            </View>
          );
        })}

        {/* Alternatives */}
        {day.alternatives && day.alternatives.length > 0 && (
          <View style={styles.altSection}>
            <View style={styles.altHeader}>
              <Text style={styles.altEmoji}>🔄</Text>
              <Text style={styles.altTitle}>Alternatives for this day</Text>
            </View>
            <Text style={styles.altSub}>If something doesn't work out, try these instead.</Text>
            {day.alternatives.map((act) => (
              <ActivityCard key={act.id} activity={act} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: {
    paddingHorizontal: Spacing.screenH,
    paddingBottom: 100,
    paddingTop: Spacing.base,
    gap: Spacing.base,
  },
  back: { paddingVertical: Spacing.xs },
  backText: { ...Typography.body, color: Colors.teal, fontWeight: '600' },
  dayHeader: { gap: Spacing.xs },
  dayBadge: {
    backgroundColor: Colors.deepNavy,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.full,
    alignSelf: 'flex-start',
  },
  dayBadgeText: { ...Typography.captionBold, color: Colors.teal },
  title: { ...Typography.h1, color: Colors.text },
  theme: { ...Typography.body, color: Colors.teal, fontWeight: '500' },
  summary: { ...Typography.body, color: Colors.muted },
  meta: { gap: Spacing.xs },
  metaItem: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  metaIcon: { fontSize: 14, marginTop: 3 },
  metaText: { ...Typography.body, color: Colors.muted, flex: 1 },
  slotSection: { gap: Spacing.sm },
  slotHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
  slotEmoji: { fontSize: 20 },
  slotLabel: { ...Typography.h3, color: Colors.text },
  altSection: { gap: Spacing.sm },
  altHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  altEmoji: { fontSize: 20 },
  altTitle: { ...Typography.h3, color: Colors.text },
  altSub: { ...Typography.body, color: Colors.muted },
  notFound: { ...Typography.body, color: Colors.muted, textAlign: 'center', marginTop: 40 },
});
