import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, StatusBar, Linking } from 'react-native';
import { router } from 'expo-router';
import { useTripStore } from '../../src/store/tripStore';
import TrustBadge from '../../src/components/ui/TrustBadge';
import AppCard from '../../src/components/ui/AppCard';
import { STAY_AREAS } from '../../src/data/egypt';
import { Colors } from '../../src/theme/colors';
import { Typography } from '../../src/theme/typography';
import { Radii, Spacing } from '../../src/theme/spacing';

const TRUST_META = {
  sourceType: 'sample_data' as const,
  confidence: 'medium' as const,
  lastCheckedLabel: 'Sample data',
};

export default function StayScreen() {
  const { trip } = useTripStore();
  const budgetStyle = trip?.budgetStyle ?? 'balanced_experience';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        <Text style={styles.title}>Stay areas</Text>
        <Text style={styles.subtitle}>Best neighbourhoods for your budget and style.</Text>

        <TrustBadge trust={TRUST_META} />

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            📋 These are area recommendations only. We don't book hotels. Search your favourite platform for properties.
          </Text>
        </View>

        <View style={styles.list}>
          {STAY_AREAS.map((area) => {
            const isRecommended = area.budgetFit.includes(budgetStyle);
            return (
              <AppCard key={area.id} style={isRecommended ? styles.recommendedCard : undefined}>
                <View style={styles.areaHeader}>
                  <Text style={styles.areaEmoji}>{area.emoji}</Text>
                  <View style={styles.areaHeaderText}>
                    <Text style={styles.areaName}>{area.name}</Text>
                    {isRecommended && (
                      <View style={styles.recBadge}>
                        <Text style={styles.recBadgeText}>Recommended for you</Text>
                      </View>
                    )}
                  </View>
                </View>

                <Text style={styles.bestFor}>Best for: {area.bestFor}</Text>
                <Text style={styles.distanceNote}>📍 {area.distanceNote}</Text>

                <View style={styles.prosConsRow}>
                  <View style={styles.halfCol}>
                    <Text style={styles.prosConsTitle}>✅ Pros</Text>
                    {area.pros.map((p) => (
                      <Text key={p} style={styles.prosText}>• {p}</Text>
                    ))}
                  </View>
                  <View style={styles.halfCol}>
                    <Text style={styles.prosConsTitle}>⚠️ Cons</Text>
                    {area.cons.map((c) => (
                      <Text key={c} style={styles.consText}>• {c}</Text>
                    ))}
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <View style={styles.metaTag}>
                    <Text style={styles.metaLabel}>Safety</Text>
                    <Text style={styles.metaValue}>{area.safetyLevel}</Text>
                  </View>
                  <View style={styles.metaTag}>
                    <Text style={styles.metaLabel}>Comfort</Text>
                    <Text style={styles.metaValue}>{area.comfortLevel}</Text>
                  </View>
                </View>

                <Pressable style={styles.searchBtn}>
                  <Text style={styles.searchBtnText}>🔍 Search {area.name} on your booking app</Text>
                </Pressable>
              </AppCard>
            );
          })}
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
    gap: Spacing.base,
  },
  back: { paddingVertical: Spacing.xs },
  backText: { ...Typography.body, color: Colors.teal, fontWeight: '600' },
  title: { ...Typography.h1, color: Colors.text },
  subtitle: { ...Typography.body, color: Colors.muted },
  disclaimer: {
    backgroundColor: Colors.skyBlueLight,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.skyBlue + '30',
  },
  disclaimerText: { ...Typography.caption, color: Colors.skyBlue, lineHeight: 18 },
  list: { gap: Spacing.md },
  recommendedCard: { borderColor: Colors.teal },
  areaHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
  areaEmoji: { fontSize: 28 },
  areaHeaderText: { flex: 1, gap: 4 },
  areaName: { ...Typography.h3, color: Colors.text },
  recBadge: {
    backgroundColor: Colors.mint,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  recBadgeText: { ...Typography.caption, color: Colors.tealDark, fontWeight: '600' },
  bestFor: { ...Typography.bodySm, color: Colors.muted, marginBottom: 4 },
  distanceNote: { ...Typography.caption, color: Colors.textSecondary, marginBottom: Spacing.sm },
  prosConsRow: { flexDirection: 'row', gap: Spacing.base, marginBottom: Spacing.sm },
  halfCol: { flex: 1, gap: 3 },
  prosConsTitle: { ...Typography.captionBold, color: Colors.text, marginBottom: 3 },
  prosText: { ...Typography.caption, color: Colors.success, lineHeight: 18 },
  consText: { ...Typography.caption, color: Colors.warning, lineHeight: 18 },
  metaRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  metaTag: {
    backgroundColor: Colors.borderLight,
    padding: Spacing.sm,
    borderRadius: Radii.sm,
    alignItems: 'center',
    flex: 1,
  },
  metaLabel: { ...Typography.label, color: Colors.mutedLight, fontSize: 9 },
  metaValue: { ...Typography.captionBold, color: Colors.text },
  searchBtn: {
    backgroundColor: Colors.mint,
    borderRadius: Radii.full,
    paddingVertical: 10,
    paddingHorizontal: Spacing.base,
    alignItems: 'center',
  },
  searchBtnText: { ...Typography.captionBold, color: Colors.tealDark },
});
