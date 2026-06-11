import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { TrustMeta } from '../../types';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';

interface Props {
  trust: TrustMeta;
  compact?: boolean;
}

const SOURCE_LABELS: Record<string, string> = {
  official_recommended: 'Official recommended',
  estimated: 'Estimated',
  sample_data: 'Sample data',
  provider_ready: 'Provider ready',
};

const CONFIDENCE_COLORS: Record<string, string> = {
  high: Colors.teal,
  medium: Colors.yellow,
  low: Colors.coral,
};

export default function TrustBadge({ trust, compact = false }: Props) {
  const confidenceColor = CONFIDENCE_COLORS[trust.confidence] ?? Colors.muted;

  if (compact) {
    return (
      <View style={styles.compactRow}>
        <View style={[styles.dot, { backgroundColor: confidenceColor }]} />
        <Text style={styles.compactText}>{SOURCE_LABELS[trust.sourceType]}</Text>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <View style={styles.badge}>
        <View style={[styles.dot, { backgroundColor: confidenceColor }]} />
        <Text style={styles.badgeText}>{SOURCE_LABELS[trust.sourceType]}</Text>
      </View>
      <Text style={styles.lastChecked}>{trust.lastCheckedLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    ...Typography.caption,
    color: Colors.muted,
    fontWeight: '500',
  },
  lastChecked: {
    ...Typography.caption,
    color: Colors.mutedLight,
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compactText: {
    ...Typography.caption,
    color: Colors.mutedLight,
  },
});
