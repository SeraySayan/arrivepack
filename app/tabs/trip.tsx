import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from '../../src/utils/haptics';
import {
  ChevronRight,
  CalendarDays,
  CheckSquare,
  MapPin,
  Car,
  Wifi,
} from 'lucide-react-native';
import { useTripStore } from '../../src/store/tripStore';
import FadeInView from '../../src/components/ui/FadeInView';
import { Colors } from '../../src/theme/colors';
import { Typography } from '../../src/theme/typography';
import { Radii, Spacing } from '../../src/theme/spacing';
import { Shadows } from '../../src/theme/shadows';
import { formatBudgetStyle, formatTravelStyle } from '../../src/utils/formatters';

/** The 8 preparation items that drive the readiness %. Mirrors home.tsx. */
const PREP_IDS = [
  'entry_documents', 'connectivity', 'arrival_transport', 'accommodation',
  'budget', 'safety', 'packing', 'emergency',
] as const;

const MODULES = [
  {
    id: 'itinerary',
    Icon: CalendarDays,
    title: 'Itinerary',
    subtitle: 'Your 7-day Egypt plan',
    route: '/trip/itinerary',
    accent: '#3B82F6',
    bg: '#EFF6FF',
  },
  {
    id: 'before',
    Icon: CheckSquare,
    title: 'Before you go',
    subtitle: 'Documents, money, safety, packing',
    route: '/trip/before-you-go',
    accent: Colors.teal,
    bg: Colors.mint,
  },
  {
    id: 'stay',
    Icon: MapPin,
    title: 'Stay areas',
    subtitle: 'Choose the best Cairo base',
    route: '/trip/accommodation',
    accent: '#F97316',
    bg: '#FFF7ED',
  },
  {
    id: 'transport',
    Icon: Car,
    title: 'Arrival & Transport',
    subtitle: 'Airport transfer and city movement',
    route: '/trip/transport',
    accent: '#EAB308',
    bg: '#FEFCE8',
  },
  {
    id: 'esim',
    Icon: Wifi,
    title: 'Phone & Internet',
    subtitle: 'eSIM, SIM, WhatsApp, and Wi-Fi',
    route: '/trip/esim',
    accent: '#2DD4BF',
    bg: '#F0FDFA',
  },
] as const;

export default function TripScreen() {
  const { trip } = useTripStore();

  if (!trip) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🗺️</Text>
          <Text style={styles.emptyTitle}>No trip planned yet</Text>
          <Pressable onPress={() => router.replace('/onboarding')} style={styles.emptyBtn}>
            <Text style={styles.emptyBtnText}>Plan a trip</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const items = trip.readiness.items;
  const readyCount = PREP_IDS.filter((id) => items.find((i) => i.id === id)?.status === 'ready').length;
  const allReady = readyCount === PREP_IDS.length;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* ── Compact hero ── */}
        <FadeInView>
          <LinearGradient
            colors={['#0F172A', '#0F2E2B', '#0D3340']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroGlow} />

            <View style={styles.heroTop}>
              <View style={styles.heroFlag}>
                <Text style={styles.heroFlagEmoji}>🇪🇬</Text>
              </View>
              <View style={styles.heroTextBlock}>
                <Text style={styles.heroLabel}>YOUR EGYPT PLAN</Text>
                <Text style={styles.heroTitle}>{trip.destinationName}</Text>
                <Text style={styles.heroMeta}>
                  {trip.durationDays} days · {formatBudgetStyle(trip.budgetStyle)} · {formatTravelStyle(trip.travelStyle)}
                </Text>
              </View>
            </View>

            <Text style={styles.heroHelper}>Everything for your Egypt trip, in one place.</Text>
          </LinearGradient>
        </FadeInView>

        <View style={styles.body}>
          {/* ── Preparation status card ── */}
          <FadeInView delay={60}>
            <Pressable
              style={({ pressed }) => [styles.statusCard, pressed && styles.pressed]}
              onPress={() => {
                Haptics.selectionAsync();
                router.push('/trip/before-you-go');
              }}
            >
              <View style={styles.statusLeft}>
                <View style={[styles.statusDot, allReady && styles.statusDotReady]} />
                <View>
                  <Text style={styles.statusTitle}>
                    {allReady ? 'Preparation complete' : 'Preparation in progress'}
                  </Text>
                  <Text style={styles.statusCount}>
                    {readyCount}/{PREP_IDS.length} essentials ready
                  </Text>
                </View>
              </View>
              <View style={styles.statusLink}>
                <Text style={styles.statusLinkText}>
                  {allReady ? 'Review checklist' : 'Continue checklist'}
                </Text>
                <ChevronRight size={14} color={Colors.teal} strokeWidth={2.5} />
              </View>
            </Pressable>
          </FadeInView>

          {/* ── Modules ── */}
          <Text style={styles.sectionTitle}>Trip modules</Text>

          <View style={styles.moduleList}>
            {MODULES.map((mod, i) => (
              <FadeInView key={mod.id} delay={100 + i * 55}>
                <Pressable
                  style={({ pressed }) => [styles.moduleCard, pressed && styles.pressed]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    router.push(mod.route as any);
                  }}
                >
                  <View style={[styles.moduleIcon, { backgroundColor: mod.bg }]}>
                    <mod.Icon size={22} color={mod.accent} strokeWidth={2} />
                  </View>
                  <View style={styles.moduleText}>
                    <Text style={styles.moduleTitle}>{mod.title}</Text>
                    <Text style={styles.moduleSubtitle}>{mod.subtitle}</Text>
                  </View>
                  <ChevronRight size={16} color={Colors.mutedLight} strokeWidth={2} />
                </Pressable>
              </FadeInView>
            ))}
          </View>

          {/* ── New trip ── */}
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              router.replace('/onboarding');
            }}
            style={styles.newTripBtn}
          >
            <Text style={styles.newTripText}>Start a new trip</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F6FA' },
  content: { paddingBottom: 130 },
  pressed: { opacity: 0.9, transform: [{ scale: 0.985 }] },

  /* Hero */
  hero: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    ...Shadows.md,
  },
  heroGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#14B8A6',
    opacity: 0.12,
    top: -60,
    right: -40,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  heroFlag: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  heroFlagEmoji: { fontSize: 24 },
  heroTextBlock: { flex: 1, gap: 2 },
  heroLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: Colors.tealLight,
  },
  heroTitle: { ...Typography.h2, color: '#FFFFFF', fontWeight: '800', letterSpacing: -0.3 },
  heroMeta: { ...Typography.caption, color: 'rgba(255,255,255,0.58)', marginTop: 2 },
  heroHelper: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.38)',
    marginTop: 14,
    fontStyle: 'italic',
  },

  /* Body */
  body: { paddingHorizontal: Spacing.screenH, paddingTop: Spacing.lg, gap: 0 },

  /* Status card */
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.cardWhite,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
    gap: 12,
  },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FCD34D',
  },
  statusDotReady: { backgroundColor: '#10B981' },
  statusTitle: { ...Typography.captionBold, color: Colors.text, fontWeight: '700' },
  statusCount: { ...Typography.caption, color: Colors.muted, marginTop: 1 },
  statusLink: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  statusLinkText: { ...Typography.caption, color: Colors.teal, fontWeight: '700' },

  /* Section label */
  sectionTitle: {
    ...Typography.h4,
    color: Colors.text,
    fontWeight: '700',
    marginBottom: 12,
  },

  /* Modules */
  moduleList: { gap: 10, marginBottom: Spacing.xl },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardWhite,
    borderRadius: 18,
    padding: 14,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  moduleIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleText: { flex: 1, gap: 3 },
  moduleTitle: { ...Typography.h4, color: Colors.text, fontWeight: '700' },
  moduleSubtitle: { ...Typography.caption, color: Colors.muted, lineHeight: 16 },

  /* New trip */
  newTripBtn: { alignItems: 'center', paddingVertical: Spacing.md },
  newTripText: { ...Typography.caption, color: Colors.mutedLight },

  /* Empty */
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.base },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { ...Typography.h2, color: Colors.text },
  emptyBtn: {
    backgroundColor: Colors.teal,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radii.full,
  },
  emptyBtnText: { ...Typography.h4, color: '#fff', fontWeight: '700' },
});
