import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, StatusBar } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from '../../src/utils/haptics';
import BudgetPackageCard from '../../src/components/trip/BudgetPackageCard';
import AppButton from '../../src/components/ui/AppButton';
import type { BudgetStyle } from '../../src/types';
import { Colors } from '../../src/theme/colors';
import { Typography } from '../../src/theme/typography';
import { Spacing } from '../../src/theme/spacing';

export default function BudgetScreen() {
  const { destinationId, durationDays } = useLocalSearchParams<{
    destinationId: string;
    durationDays: string;
  }>();
  const [selected, setSelected] = useState<BudgetStyle | null>('balanced_experience');

  const handleNext = () => {
    if (!selected) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/onboarding/style',
      params: { destinationId, durationDays, budgetStyle: selected },
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
            <View key={step} style={[styles.progressDot, step <= 3 && styles.progressDotActive]} />
          ))}
        </View>
        <Text style={styles.stepLabel}>Step 3 of 4</Text>
        <Text style={styles.title}>What is your budget style?</Text>
        <Text style={styles.subtitle}>This shapes your recommendations, itinerary, and tips.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        <BudgetPackageCard selected={selected} onSelect={setSelected} />
      </ScrollView>

      <View style={styles.footer}>
        <AppButton
          label="Next: Travel style →"
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
    paddingBottom: 120,
  },
  footer: { padding: Spacing.screenH, paddingBottom: Spacing.xl },
});
