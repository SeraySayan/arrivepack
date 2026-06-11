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
import ItineraryDayCard from '../../src/components/trip/ItineraryDayCard';
import EmptyState from '../../src/components/ui/EmptyState';
import { Colors } from '../../src/theme/colors';
import { Typography } from '../../src/theme/typography';
import { Radii, Spacing } from '../../src/theme/spacing';
import { formatBudgetStyle, formatTravelStyle } from '../../src/utils/formatters';

export default function ItineraryScreen() {
  const { trip } = useTripStore();

  if (!trip || trip.itinerary.length === 0) {
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
          <Text style={styles.trustText}>
            📋 Sample itinerary — personalised based on your selections. Adapt freely as needed.
          </Text>
        </View>

        <View style={styles.list}>
          {trip.itinerary.map((day, i) => (
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
    backgroundColor: Colors.borderLight,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  trustText: { ...Typography.caption, color: Colors.muted, lineHeight: 18 },
  list: { gap: Spacing.sm },
});
