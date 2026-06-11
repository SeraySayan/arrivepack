import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import * as Haptics from '../../utils/haptics';
import type { TravelStyle } from '../../types';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Radii, Spacing } from '../../theme/spacing';

interface StyleOption {
  id: TravelStyle;
  emoji: string;
  label: string;
}

const STYLE_OPTIONS: StyleOption[] = [
  { id: 'first_time_must_sees', emoji: '🏛️', label: 'First time, show me the must-sees' },
  { id: 'explore_like_local', emoji: '🧭', label: 'Explore like a local' },
  { id: 'relaxed_safe', emoji: '🌿', label: 'Relaxed and safe trip' },
  { id: 'history_culture', emoji: '📜', label: 'History & culture' },
  { id: 'food_local', emoji: '🍽️', label: 'Food and local experiences' },
  { id: 'photo_video', emoji: '📸', label: 'Photo / video focused' },
  { id: 'romantic', emoji: '❤️', label: 'Romantic / couple trip' },
  { id: 'family_friendly', emoji: '👨‍👩‍👧', label: 'Family-friendly' },
  { id: 'adventure', emoji: '⚡', label: 'Adventure & discovery' },
];

interface Props {
  selected: TravelStyle | null;
  onSelect: (style: TravelStyle) => void;
}

export default function TravelStylePill({ selected, onSelect }: Props) {
  return (
    <View style={styles.container}>
      {STYLE_OPTIONS.map((opt) => {
        const isSelected = selected === opt.id;
        return (
          <Pressable
            key={opt.id}
            onPress={() => {
              Haptics.selectionAsync();
              onSelect(opt.id);
            }}
            style={({ pressed }) => [
              styles.pill,
              isSelected && styles.pillSelected,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.emoji}>{opt.emoji}</Text>
            <Text style={[styles.label, isSelected && styles.labelSelected]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.cardWhite,
    gap: 6,
  },
  pillSelected: {
    borderColor: Colors.teal,
    backgroundColor: Colors.mint,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  emoji: {
    fontSize: 15,
  },
  label: {
    ...Typography.bodySm,
    color: Colors.muted,
    fontWeight: '500',
  },
  labelSelected: {
    color: Colors.tealDark,
    fontWeight: '600',
  },
});
