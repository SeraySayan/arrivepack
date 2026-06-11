import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import * as Haptics from '../../utils/haptics';
import StatusPill from '../ui/StatusPill';
import TrustBadge from '../ui/TrustBadge';
import type { ReadinessItem } from '../../types';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Radii, Spacing } from '../../theme/spacing';
import { Shadows } from '../../theme/shadows';

const CATEGORY_ICONS: Record<string, string> = {
  documents: '📄',
  visa: '🛂',
  internet: '📶',
  transport: '🚗',
  stay: '🏨',
  budget: '💳',
  safety: '🛡️',
  itinerary: '📅',
};

interface Props {
  item: ReadinessItem;
  onPress: () => void;
}

export default function PreparationChecklistCard({ item, onPress }: Props) {
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.left}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{CATEGORY_ICONS[item.category] ?? '📌'}</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
          <View style={styles.badges}>
            <StatusPill status={item.status} />
            <TrustBadge trust={item.trust} compact />
          </View>
        </View>
      </View>
      <ChevronRight size={20} color={Colors.mutedLight} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.card,
    padding: Spacing.cardPad,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
    ...Shadows.xs,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: Radii.md,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...Typography.h4,
    color: Colors.text,
  },
  description: {
    ...Typography.caption,
    color: Colors.muted,
    lineHeight: 18,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    flexWrap: 'wrap',
  },
});
