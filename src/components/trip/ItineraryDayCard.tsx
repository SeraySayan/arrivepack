import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import * as Haptics from '../../utils/haptics';
import type { ItineraryDay } from '../../types';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Radii, Spacing } from '../../theme/spacing';
import { Shadows } from '../../theme/shadows';

interface Props {
  day: ItineraryDay;
  onPress: () => void;
  isActive?: boolean;
}

const COST_COLORS = {
  low: Colors.success,
  medium: Colors.yellow,
  high: Colors.coral,
};

const COST_LABELS = {
  low: 'Budget-friendly',
  medium: 'Moderate cost',
  high: 'Higher cost',
};

export default function ItineraryDayCard({ day, onPress, isActive = false }: Props) {
  const activities = [
    ...(day.morning ?? []),
    ...(day.afternoon ?? []),
    ...(day.evening ?? []),
  ];

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => [
        styles.card,
        isActive && styles.activeCard,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.dayBadge}>
        <Text style={styles.dayNumber}>Day {day.day}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{day.title}</Text>
        <Text style={styles.theme} numberOfLines={2}>{day.theme}</Text>

        <View style={styles.highlights}>
          {activities.slice(0, 3).map((act, i) => (
            <View key={act.id} style={styles.highlight}>
              <View style={styles.dot} />
              <Text style={styles.highlightText} numberOfLines={1}>{act.title}</Text>
            </View>
          ))}
        </View>

        {/* Chips */}
        {day.chips && day.chips.length > 0 && (
          <View style={styles.chips}>
            {day.chips.slice(0, 3).map((chip) => (
              <View key={chip} style={styles.chip}>
                <Text style={styles.chipText}>{chip}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.footer}>
          <View style={[styles.costBadge, { backgroundColor: COST_COLORS[day.estimatedCostLevel] + '20' }]}>
            <Text style={[styles.costText, { color: COST_COLORS[day.estimatedCostLevel] }]}>
              {COST_LABELS[day.estimatedCostLevel]}
            </Text>
          </View>
          <ChevronRight size={18} color={Colors.muted} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  activeCard: {
    borderColor: Colors.teal,
    ...Shadows.teal,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  dayBadge: {
    width: 60,
    backgroundColor: Colors.deepNavy,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
  },
  dayNumber: {
    ...Typography.captionBold,
    color: Colors.teal,
    textAlign: 'center',
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: Spacing.base,
    gap: Spacing.xs,
  },
  title: {
    ...Typography.h4,
    color: Colors.text,
  },
  theme: {
    ...Typography.caption,
    color: Colors.muted,
  },
  highlights: {
    gap: 3,
    marginTop: Spacing.xs,
  },
  highlight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.teal,
  },
  highlightText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    flex: 1,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 5,
  },
  chip: {
    backgroundColor: Colors.borderLight,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.muted,
    letterSpacing: 0.1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  costBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.full,
  },
  costText: {
    ...Typography.caption,
    fontWeight: '600',
  },
});
