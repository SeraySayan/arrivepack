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
import { router } from 'expo-router';
import * as Haptics from '../../src/utils/haptics';
import { useTripStore } from '../../src/store/tripStore';
import { getItinerary } from '../../src/services/itineraryEngine';
import ItineraryDayCard from '../../src/components/trip/ItineraryDayCard';
import EmptyState from '../../src/components/ui/EmptyState';
import { Colors } from '../../src/theme/colors';
import { Typography } from '../../src/theme/typography';
import { Radii, Spacing } from '../../src/theme/spacing';
import { formatBudgetStyle, formatTravelStyle } from '../../src/utils/formatters';

export default function ItineraryScreen() {
  const { trip } = useTripStore();

  // Always derive from the current mock data so content updates take effect
  // without requiring the user to recreate their trip.
  const itinerary = trip
    ? getItinerary(trip.destinationId, trip.durationDays, trip.budgetStyle, trip.travelStyle)
    : [];

  if (!trip || itinerary.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <EmptyState
          emoji="🗓️"
          title="No itinerary yet"
          description="Create a trip to see your personalised day-by-day plan."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        <Text style={styles.title}>Your {trip.durationDays}-day Egypt plan</Text>
        <Text style={styles.subtitle}>
          {formatBudgetStyle(trip.budgetStyle)} · {formatTravelStyle(trip.travelStyle)}
        </Text>

        <View style={styles.trustBanner}>
          <View style={styles.trustBannerRow}>
            <Text style={styles.trustBannerTitle}>Flexible sample plan</Text>
            <View style={styles.trustBannerBadge}>
              <Text style={styles.trustBannerBadgeText}>Sample itinerary</Text>
            </View>
          </View>
          <Text style={styles.trustText}>
            Built from your travel style. Adjust days based on weather, energy, opening hours, and bookings.
          </Text>
        </View>

        <View style={styles.list}>
          {itinerary.map((day, i) => (
            <ItineraryDayCard
              key={day.day}
              day={day}
              onPress={() => {
                Haptics.selectionAsync();
                router.push({
                  pathname: '/trip/day',
                  params: { dayIndex: i },
                });
              }}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: {
    paddingHorizontal: Spacing.screenH,
    paddingBottom: 100,
    paddingTop: Spacing.base,
  },
  back: { paddingVertical: Spacing.xs, marginBottom: Spacing.sm },
  backText: { ...Typography.body, color: Colors.teal, fontWeight: '600' },
  title: { ...Typography.h1, color: Colors.text },
  subtitle: { ...Typography.body, color: Colors.muted, marginTop: 4, marginBottom: Spacing.base },
  trustBanner: {
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.card,
    padding: Spacing.cardPad,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  trustBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  trustBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  trustBannerBadge: {
    backgroundColor: Colors.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  trustBannerBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.mutedLight,
  },
  trustText: { ...Typography.caption, color: Colors.muted, lineHeight: 18 },
  list: { gap: Spacing.sm },
});
