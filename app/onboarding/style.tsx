import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  StatusBar,
  TextInput,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from '../../src/utils/haptics';
import TravelStylePill from '../../src/components/trip/TravelStylePill';
import AppButton from '../../src/components/ui/AppButton';
import type { TravelStyle, BudgetStyle } from '../../src/types';
import { useTripStore } from '../../src/store/tripStore';
import { DESTINATIONS } from '../../src/data/egypt';
import { Colors } from '../../src/theme/colors';
import { Typography } from '../../src/theme/typography';
import { Radii, Spacing } from '../../src/theme/spacing';

export default function StyleScreen() {
  const { destinationId, durationDays, budgetStyle } = useLocalSearchParams<{
    destinationId: string;
    durationDays: string;
    budgetStyle: string;
  }>();

  const [selected, setSelected] = useState<TravelStyle | null>('explore_like_local');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const { createTrip } = useTripStore();

  const destination = DESTINATIONS.find((d) => d.id === destinationId);

  const handleCreate = async () => {
    if (!selected) return;
    setLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    createTrip({
      destinationId: destinationId ?? 'egypt',
      destinationName: destination?.name ?? 'Egypt',
      durationDays: parseInt(durationDays ?? '7', 10),
      budgetStyle: budgetStyle as BudgetStyle,
      travelStyle: selected,
      expectationNote: note.trim() || undefined,
    });

    setTimeout(() => {
      setLoading(false);
      router.replace('/tabs/home');
    }, 600);
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
            <View key={step} style={[styles.progressDot, styles.progressDotActive]} />
          ))}
        </View>
        <Text style={styles.stepLabel}>Step 4 of 4</Text>
        <Text style={styles.title}>What is your travel style?</Text>
        <Text style={styles.subtitle}>Choose one that best describes this trip.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        <TravelStylePill selected={selected} onSelect={setSelected} />

        <View style={styles.noteSection}>
          <Text style={styles.noteLabel}>Anything specific you want? (optional)</Text>
          <TextInput
            style={styles.noteInput}
            multiline
            numberOfLines={3}
            value={note}
            onChangeText={setNote}
            placeholder="Example: I want local food, history, and less touristy places."
            placeholderTextColor={Colors.mutedLight}
            textAlignVertical="top"
          />
        </View>

        {/* Trip summary card */}
        {selected && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Your trip summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryEmoji}>{destination?.emoji ?? '🇪🇬'}</Text>
              <View>
                <Text style={styles.summaryDest}>{destination?.name ?? 'Egypt'}</Text>
                <Text style={styles.summaryMeta}>
                  {durationDays} days · {budgetStyle?.replace('_', ' ')} · {selected?.replace(/_/g, ' ')}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <AppButton
          label={loading ? 'Creating your pack...' : `Create my Egypt Pack 🇪🇬`}
          onPress={handleCreate}
          disabled={!selected || loading}
          loading={loading}
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
    gap: Spacing.lg,
    paddingBottom: 120,
  },
  noteSection: { gap: Spacing.sm },
  noteLabel: { ...Typography.h4, color: Colors.text },
  noteInput: {
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.cardPad,
    ...Typography.body,
    color: Colors.text,
    minHeight: 80,
  },
  summaryCard: {
    backgroundColor: Colors.mint,
    borderRadius: Radii.card,
    padding: Spacing.cardPad,
    borderWidth: 1,
    borderColor: Colors.teal + '30',
    gap: Spacing.sm,
  },
  summaryTitle: { ...Typography.captionBold, color: Colors.tealDark },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  summaryEmoji: { fontSize: 32 },
  summaryDest: { ...Typography.h4, color: Colors.tealDark },
  summaryMeta: { ...Typography.caption, color: Colors.teal, marginTop: 2 },
  footer: { padding: Spacing.screenH, paddingBottom: Spacing.xl },
});
