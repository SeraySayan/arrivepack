import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { AlternativeActivity } from '../../types';
import AppCard from '../ui/AppCard';
import AppButton from '../ui/AppButton';
import TrustBadge from '../ui/TrustBadge';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';

interface Props {
  activity: AlternativeActivity;
  onSwap: () => void;
}

const OPEN_STATUS_CONFIG = {
  open: { label: 'Open', color: Colors.success, bg: Colors.successLight },
  closed: { label: 'Closed', color: Colors.coral, bg: Colors.coralLight },
  unknown: { label: 'Status unknown', color: Colors.muted, bg: Colors.borderLight },
};

export default function AlternativeCard({ activity, onSwap }: Props) {
  const openConfig = OPEN_STATUS_CONFIG[activity.openStatus];

  return (
    <AppCard style={styles.card}>
      <View style={styles.header}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{activity.category}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: openConfig.bg }]}>
          <Text style={[styles.statusText, { color: openConfig.color }]}>{openConfig.label}</Text>
        </View>
      </View>

      <Text style={styles.title}>{activity.title}</Text>
      <Text style={styles.description}>{activity.description}</Text>

      <View style={styles.meta}>
        <View style={styles.metaItem}>
          <Text style={styles.metaIcon}>📍</Text>
          <Text style={styles.metaText}>{activity.distance}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaIcon}>⏱</Text>
          <Text style={styles.metaText}>{activity.estimatedDuration}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaIcon}>🚗</Text>
          <Text style={styles.metaText} numberOfLines={1}>{activity.transportNote}</Text>
        </View>
      </View>

      <View style={styles.reasonBlock}>
        <Text style={styles.reasonText}>💡 {activity.reason}</Text>
      </View>

      <TrustBadge trust={activity.trust} compact />

      <AppButton
        label="Swap into today"
        onPress={onSwap}
        variant="outline"
        style={styles.swapBtn}
      />
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
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusText: {
    ...Typography.caption,
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
  reasonBlock: {
    backgroundColor: Colors.skyBlueLight,
    padding: Spacing.sm,
    borderRadius: 8,
  },
  reasonText: {
    ...Typography.caption,
    color: Colors.skyBlue,
    fontWeight: '500',
  },
  swapBtn: {
    marginTop: Spacing.xs,
  },
});
