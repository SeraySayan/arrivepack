import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Activity } from '../../types';
import AppCard from '../ui/AppCard';
import TrustBadge from '../ui/TrustBadge';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';

interface Props {
  activity: Activity;
  timeLabel?: string;
  onPress?: () => void;
}

const COST_EMOJIS = { low: '💚', medium: '🟡', high: '🔴' };

export default function ActivityCard({ activity, timeLabel, onPress }: Props) {
  return (
    <AppCard onPress={onPress} style={styles.card}>
      <View style={styles.header}>
        {timeLabel && (
          <View style={styles.timeBadge}>
            <Text style={styles.timeLabel}>{timeLabel}</Text>
          </View>
        )}
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{activity.category}</Text>
        </View>
      </View>

      <Text style={styles.title}>{activity.title}</Text>
      <Text style={styles.description}>{activity.description}</Text>

      <View style={styles.meta}>
        <View style={styles.metaItem}>
          <Text style={styles.metaIcon}>⏱</Text>
          <Text style={styles.metaText}>{activity.estimatedDuration}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaIcon}>{COST_EMOJIS[activity.estimatedCostLevel]}</Text>
          <Text style={styles.metaText}>
            {activity.estimatedCostLevel === 'low' ? 'Budget-friendly' : activity.estimatedCostLevel === 'medium' ? 'Moderate' : 'Higher cost'}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaIcon}>🚗</Text>
          <Text style={styles.metaText} numberOfLines={1}>{activity.transportNote}</Text>
        </View>
      </View>

      {activity.whyItFits && (
        <View style={styles.whyBlock}>
          <Text style={styles.whyText}>✦ {activity.whyItFits}</Text>
        </View>
      )}

      <View style={styles.trust}>
        <TrustBadge trust={activity.trust} compact />
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  timeBadge: {
    backgroundColor: Colors.deepNavy,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  timeLabel: {
    ...Typography.caption,
    color: Colors.teal,
    fontWeight: '700',
  },
  categoryBadge: {
    backgroundColor: Colors.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  categoryText: {
    ...Typography.caption,
    color: Colors.muted,
    fontWeight: '600',
  },
  title: {
    ...Typography.h4,
    color: Colors.text,
  },
  description: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  meta: {
    gap: 4,
    marginTop: Spacing.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaIcon: {
    fontSize: 13,
    width: 20,
  },
  metaText: {
    ...Typography.caption,
    color: Colors.muted,
    flex: 1,
  },
  whyBlock: {
    backgroundColor: Colors.mint,
    padding: Spacing.sm,
    borderRadius: 8,
    marginTop: Spacing.xs,
  },
  whyText: {
    ...Typography.caption,
    color: Colors.tealDark,
    fontWeight: '500',
  },
  trust: {
    marginTop: Spacing.xs,
  },
});
