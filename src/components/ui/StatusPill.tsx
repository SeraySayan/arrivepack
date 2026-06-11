import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ReadinessStatus } from '../../types';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';

interface Props {
  status: ReadinessStatus;
}

const STATUS_CONFIG: Record<ReadinessStatus, { label: string; bg: string; text: string; dot: string }> = {
  ready: { label: 'Ready', bg: Colors.readyBg, text: Colors.ready, dot: Colors.ready },
  needs_review: { label: 'Needs review', bg: Colors.needsReviewBg, text: Colors.needsReview, dot: Colors.needsReview },
  not_set: { label: 'Not set', bg: Colors.notSetBg, text: Colors.notSet, dot: Colors.notSet },
  suggested: { label: 'Suggested', bg: Colors.suggestedBg, text: Colors.suggested, dot: Colors.suggested },
};

export default function StatusPill({ status }: Props) {
  const config = STATUS_CONFIG[status];
  return (
    <View style={[styles.pill, { backgroundColor: config.bg }]}>
      <View style={[styles.dot, { backgroundColor: config.dot }]} />
      <Text style={[styles.label, { color: config.text }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 5,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    ...Typography.captionBold,
  },
});
