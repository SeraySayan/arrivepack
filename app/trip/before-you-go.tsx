import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import * as Haptics from '../../src/utils/haptics';
import { useTripStore } from '../../src/store/tripStore';
import StatusPill from '../../src/components/ui/StatusPill';
import TrustBadge from '../../src/components/ui/TrustBadge';
import { PREPARATION_CHECKLIST } from '../../src/data/egypt';
import { READINESS_ROUTE_MAP } from '../../src/navigation/readinessRoutes';
import { Colors } from '../../src/theme/colors';
import { Typography } from '../../src/theme/typography';
import { Radii, Spacing } from '../../src/theme/spacing';
import { Shadows } from '../../src/theme/shadows';

const CATEGORY_BG: Record<string, string> = {
  entry_documents:  '#E6FFFA',
  connectivity:     '#EFF6FF',
  arrival_transport:'#FFFBEB',
  accommodation:    '#FFF1F0',
  budget:           '#F0FDF4',
  safety:           '#FEF2F2',
  packing:          '#F8FAFC',
  emergency:        '#FEF2F2',
  itinerary:        '#EFF6FF',
};

export default function BeforeYouGoScreen() {
  const { trip, updateReadinessItem } = useTripStore();
  const items = trip?.readiness.items ?? [];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        <Pressable onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        <Text style={styles.title}>Before you go</Text>
        <Text style={styles.subtitle}>Everything to prepare before your Egypt trip.</Text>

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            ⚠️ Sample data for MVP. Always confirm critical details — especially visa and entry requirements — with official government sources before departure.
          </Text>
        </View>

        <View style={styles.list}>
          {PREPARATION_CHECKLIST.map((item) => {
            const readinessItem = items.find((r) => r.id === item.id);
            const status = readinessItem?.status ?? item.status;
            const bg = CATEGORY_BG[item.category] ?? Colors.borderLight;

            return (
              <Pressable
                key={item.id}
                onPress={() => {
                  Haptics.selectionAsync();
                  const route = READINESS_ROUTE_MAP[item.id];
                  if (route) {
                    router.push(route as any);
                  } else {
                    router.push({
                      pathname: '/trip/detail',
                      params: { itemId: item.id },
                    });
                  }
                }}
                style={({ pressed }) => [styles.card, pressed && styles.pressed]}
              >
                <View style={[styles.iconBubble, { backgroundColor: bg }]}>
                  <Text style={styles.icon}>{item.icon}</Text>
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardDesc} numberOfLines={2}>{item.shortDescription}</Text>
                  <View style={styles.badgeRow}>
                    <StatusPill status={status} />
                    <TrustBadge trust={item.trust} compact />
                  </View>
                </View>

                <ChevronRight size={18} color={Colors.mutedLight} />
              </Pressable>
            );
          })}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F6FA' },
  content: {
    paddingHorizontal: Spacing.screenH,
    paddingBottom: 110,
    paddingTop: Spacing.base,
  },
  back: { paddingVertical: Spacing.xs, marginBottom: Spacing.sm },
  backText: { ...Typography.body, color: Colors.teal, fontWeight: '600' },
  title: { fontSize: 26, fontWeight: '800', color: '#0F172A', letterSpacing: -0.4, marginBottom: 4 },
  subtitle: { ...Typography.body, color: Colors.muted, marginBottom: Spacing.base },
  disclaimer: {
    backgroundColor: '#FFFBEB',
    borderRadius: Radii.lg,
    padding: Spacing.md,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.yellow + '50',
  },
  disclaimerText: { ...Typography.caption, color: '#92400E', lineHeight: 18 },
  list: { gap: Spacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.card,
    padding: Spacing.cardPad,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
    ...Shadows.xs,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  iconBubble: {
    width: 48,
    height: 48,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  icon: { fontSize: 22 },
  cardBody: { flex: 1, gap: 4 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  cardDesc: { ...Typography.caption, color: Colors.muted, lineHeight: 18 },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexWrap: 'wrap',
    marginTop: 3,
  },
});
