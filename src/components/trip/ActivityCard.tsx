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
const COST_LABELS = { low: 'Budget-friendly', medium: 'Moderate', high: 'Higher cost' };

export default function ActivityCard({ activity, timeLabel, onPress }: Props) {
  const isAiActivity = activity.trust.lastCheckedLabel === 'AI adjusted';

  const hasDescription = Boolean(activity.description?.trim());
  const hasDuration = Boolean(activity.estimatedDuration?.trim());
  const hasTransport = Boolean(activity.transportNote?.trim());
  const hasWhyItFits = Boolean(activity.whyItFits?.trim());

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

      {hasDescription && (
        <Text style={styles.description}>{activity.description}</Text>
      )}

      {/* Meta rows — only rendered when non-empty */}
      {(hasDuration || hasTransport) && (
        <View style={styles.meta}>
          {hasDuration && (
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>⏱</Text>
              <Text style={styles.metaText}>{activity.estimatedDuration}</Text>
            </View>
          )}
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>{COST_EMOJIS[activity.estimatedCostLevel]}</Text>
            <Text style={styles.metaText}>{COST_LABELS[activity.estimatedCostLevel]}</Text>
          </View>
          {hasTransport && (
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>🚗</Text>
              <Text style={styles.metaText} numberOfLines={2}>{activity.transportNote}</Text>
            </View>
          )}
        </View>
      )}

      {/* Cost-only row when there is no duration or transport to show */}
      {!hasDuration && !hasTransport && (
        <View style={styles.metaSingle}>
          <Text style={styles.metaIcon}>{COST_EMOJIS[activity.estimatedCostLevel]}</Text>
          <Text style={styles.metaText}>{COST_LABELS[activity.estimatedCostLevel]}</Text>
        </View>
      )}

      {hasWhyItFits && (
        <View style={styles.whyBlock}>
          <Text style={styles.whyText}>✦ {activity.whyItFits}</Text>
        </View>
      )}

      <View style={styles.trust}>
        {isAiActivity ? (
          <View style={styles.aiTrustRow}>
            <View style={styles.aiTrustDot} />
            <Text style={styles.aiTrustText}>AI adjusted</Text>
          </View>
        ) : (
          <TrustBadge trust={activity.trust} compact />
        )}
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
    lineHeight: 20,
  },
  meta: {
    gap: 4,
    marginTop: Spacing.xs,
  },
  metaSingle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  metaIcon: {
    fontSize: 13,
    width: 20,
    marginTop: 1,
  },
  metaText: {
    ...Typography.caption,
    color: Colors.muted,
    flex: 1,
    lineHeight: 18,
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
  aiTrustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  aiTrustDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.teal,
  },
  aiTrustText: {
    ...Typography.caption,
    color: Colors.teal,
    fontWeight: '600',
  },
});
