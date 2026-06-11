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
import { useTripStore } from '../../src/store/tripStore';
import AlternativeCard from '../../src/components/trip/AlternativeCard';
import AppToast from '../../src/components/ui/AppToast';
import EmptyState from '../../src/components/ui/EmptyState';
import { getRescueAlternatives } from '../../src/services/rescueEngine';
import { RESCUE_SCENARIOS } from '../../src/data/mockRescue';
import type { RescueScenario, AlternativeActivity } from '../../src/types';
import { Colors } from '../../src/theme/colors';
import { Typography } from '../../src/theme/typography';
import { Radii, Spacing } from '../../src/theme/spacing';

export default function AlternativesScreen() {
  const { scenario } = useLocalSearchParams<{ scenario: string }>();
  const { trip, swapActivityIntoDay } = useTripStore();
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const scenarioKey = (scenario ?? 'closed') as RescueScenario;
  const scenarioInfo = RESCUE_SCENARIOS[scenarioKey];
  const alternatives = getRescueAlternatives(scenarioKey, trip?.budgetStyle ?? 'balanced_experience');

  const handleSwap = (activity: AlternativeActivity) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (trip && trip.itinerary.length > 0) {
      swapActivityIntoDay(0, activity);
    }
    setToastMsg(`Added "${activity.title}" to today's plan`);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Back to Live Mode</Text>
        </Pressable>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.scenarioEmoji}>{scenarioInfo?.emoji ?? '⚡'}</Text>
          <View>
            <Text style={styles.title}>{scenarioInfo?.label ?? 'Plan changed'}</Text>
            <Text style={styles.subtitle}>Here are the best alternatives for your trip.</Text>
          </View>
        </View>

        <View style={styles.countBadge}>
          <Text style={styles.countText}>
            {alternatives.length} alternative{alternatives.length !== 1 ? 's' : ''} found
          </Text>
        </View>

        {alternatives.length === 0 ? (
          <EmptyState
            emoji="🔍"
            title="No alternatives found"
            description="Try a different scenario or head back to the main plan."
            actionLabel="Back to Live Mode"
            onAction={() => router.back()}
          />
        ) : (
          <View style={styles.list}>
            {alternatives.map((alt) => (
              <AlternativeCard
                key={alt.id}
                activity={alt}
                onSwap={() => handleSwap(alt)}
              />
            ))}
          </View>
        )}

        <View style={styles.trustNote}>
          <Text style={styles.trustNoteText}>
            📋 Alternatives are sample data for V1. Live location-based suggestions coming in V2.
          </Text>
        </View>
      </ScrollView>

      <AppToast message={toastMsg} visible={toastVisible} emoji="✅" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: {
    paddingHorizontal: Spacing.screenH,
    paddingBottom: 100,
    paddingTop: Spacing.base,
    gap: Spacing.base,
  },
  back: { paddingVertical: Spacing.xs },
  backText: { ...Typography.body, color: Colors.teal, fontWeight: '600' },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  scenarioEmoji: { fontSize: 40 },
  title: { ...Typography.h1, color: Colors.text },
  subtitle: { ...Typography.body, color: Colors.muted, marginTop: 2 },
  countBadge: {
    backgroundColor: Colors.mint,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    alignSelf: 'flex-start',
  },
  countText: { ...Typography.captionBold, color: Colors.tealDark },
  list: { gap: Spacing.md },
  trustNote: {
    backgroundColor: Colors.borderLight,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  trustNoteText: { ...Typography.caption, color: Colors.muted, lineHeight: 18 },
});
