import React, { useState } from 'react';
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
import * as Haptics from '../../src/utils/haptics';
import AppButton from '../../src/components/ui/AppButton';
import { Colors } from '../../src/theme/colors';
import { Typography } from '../../src/theme/typography';
import { Radii, Spacing } from '../../src/theme/spacing';
import { Shadows } from '../../src/theme/shadows';

const DURATIONS = [
  { days: 3, label: '3 days', sub: 'Quick getaway — Cairo & Giza essentials', emoji: '⚡' },
  { days: 5, label: '5 days', sub: 'Balanced — Cairo, Giza & culture', emoji: '⭐', recommended: true },
  { days: 7, label: '7 days', sub: 'The best Egypt experience', emoji: '🌟', recommended: false },
  { days: 10, label: '10 days', sub: 'Extended — Cairo + Luxor option', emoji: '🏆' },
];

export default function DurationScreen() {
  const { destinationId } = useLocalSearchParams<{ destinationId: string }>();
  const [selected, setSelected] = useState<number | null>(7);

  const handleNext = () => {
    if (!selected) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/onboarding/budget',
      params: { destinationId, durationDays: selected },
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <View style={styles.progress}>
          {[1, 2, 3, 4].map((step) => (
            <View key={step} style={[styles.progressDot, step <= 2 && styles.progressDotActive]} />
          ))}
        </View>
        <Text style={styles.stepLabel}>Step 2 of 4</Text>
        <Text style={styles.title}>How long will you stay?</Text>
        <Text style={styles.subtitle}>Choose your trip length.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {DURATIONS.map((dur) => {
          const isSelected = selected === dur.days;
          return (
            <Pressable
              key={dur.days}
              onPress={() => {
                Haptics.selectionAsync();
                setSelected(dur.days);
              }}
              style={({ pressed }) => [
                styles.card,
                isSelected && styles.cardSelected,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.emoji}>{dur.emoji}</Text>
              <View style={styles.content}>
                <View style={styles.row}>
                  <Text style={[styles.label, isSelected && styles.labelSelected]}>{dur.label}</Text>
                  {dur.recommended && (
                    <View style={styles.recBadge}>
                      <Text style={styles.recText}>Recommended</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.sub}>{dur.sub}</Text>
              </View>
              {isSelected && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </Pressable>
          );
        })}

        {/* Custom option */}
        <View style={styles.customCard}>
          <Text style={styles.customEmoji}>✏️</Text>
          <View style={styles.content}>
            <Text style={styles.customLabel}>Custom duration</Text>
            <Text style={styles.customSub}>Coming soon — contact us for custom trip planning.</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <AppButton
          label="Next: Budget style →"
          onPress={handleNext}
          disabled={!selected}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.screenH,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.base,
    gap: Spacing.xs,
  },
  backBtn: { paddingVertical: Spacing.xs, marginBottom: Spacing.xs },
  backText: { ...Typography.body, color: Colors.teal, fontWeight: '600' },
  progress: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xs },
  progressDot: { height: 4, flex: 1, borderRadius: 2, backgroundColor: Colors.border },
  progressDotActive: { backgroundColor: Colors.teal },
  stepLabel: { ...Typography.captionBold, color: Colors.teal, marginBottom: 2 },
  title: { ...Typography.h1, color: Colors.text },
  subtitle: { ...Typography.body, color: Colors.muted },
  list: {
    paddingHorizontal: Spacing.screenH,
    paddingVertical: Spacing.base,
    gap: Spacing.sm,
    paddingBottom: 100,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.card,
    padding: Spacing.cardPad,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: Spacing.md,
    ...Shadows.xs,
  },
  cardSelected: { borderColor: Colors.teal, ...Shadows.teal },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  emoji: { fontSize: 28, width: 40, textAlign: 'center' },
  content: { flex: 1, gap: 3 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flexWrap: 'wrap' },
  label: { ...Typography.h4, color: Colors.text },
  labelSelected: { color: Colors.tealDark },
  sub: { ...Typography.caption, color: Colors.muted },
  recBadge: {
    backgroundColor: Colors.yellowLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  recText: { ...Typography.label, color: Colors.warning, fontSize: 9 },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  customCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.borderLight,
    borderRadius: Radii.card,
    padding: Spacing.cardPad,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: Spacing.md,
    opacity: 0.5,
  },
  customEmoji: { fontSize: 28, width: 40, textAlign: 'center' },
  customLabel: { ...Typography.h4, color: Colors.muted },
  customSub: { ...Typography.caption, color: Colors.mutedLight },
  footer: { padding: Spacing.screenH, paddingBottom: Spacing.xl },
});
