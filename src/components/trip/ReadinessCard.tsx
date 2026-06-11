import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ProgressRing from '../ui/ProgressRing';
import StatusPill from '../ui/StatusPill';
import type { ReadinessState } from '../../types';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Radii, Spacing } from '../../theme/spacing';
import { getReadinessLabel } from '../../services/readinessEngine';

interface Props {
  readiness: ReadinessState;
}

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

export default function ReadinessCard({ readiness }: Props) {
  const label = getReadinessLabel(readiness.score);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.deepNavy, '#134E4A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.top}>
          <View style={styles.textBlock}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.title}>Your Egypt trip is</Text>
            <Text style={styles.scoreText}>{readiness.score}% ready</Text>
            <Text style={styles.subtitle}>Complete the remaining items to feel fully prepared.</Text>
          </View>
          <ProgressRing score={readiness.score} size={100} strokeWidth={9} />
        </View>

        <View style={styles.divider} />

        <View style={styles.grid}>
          {readiness.items.map((item) => (
            <View key={item.id} style={styles.statusItem}>
              <Text style={styles.statusIcon}>{CATEGORY_ICONS[item.category] ?? '📌'}</Text>
              <View style={styles.statusText}>
                <Text style={styles.statusTitle} numberOfLines={1}>{item.title}</Text>
                <StatusPill status={item.status} />
              </View>
            </View>
          ))}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radii.cardLg,
    overflow: 'hidden',
  },
  gradient: {
    padding: Spacing.cardPadLg,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  textBlock: {
    flex: 1,
    marginRight: Spacing.base,
  },
  label: {
    ...Typography.label,
    color: Colors.teal,
    marginBottom: Spacing.xs,
  },
  title: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.7)',
  },
  scoreText: {
    ...Typography.displayLg,
    color: '#FFFFFF',
    marginVertical: 4,
  },
  subtitle: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: Spacing.base,
  },
  grid: {
    gap: Spacing.sm,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusIcon: {
    fontSize: 18,
    width: 28,
    textAlign: 'center',
  },
  statusText: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  statusTitle: {
    ...Typography.bodySm,
    color: 'rgba(255,255,255,0.85)',
    flex: 1,
  },
});
