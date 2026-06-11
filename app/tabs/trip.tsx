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
import { ChevronRight, ArrowRight } from 'lucide-react-native';
import { useTripStore } from '../../src/store/tripStore';
import FadeInView from '../../src/components/ui/FadeInView';
import { Colors } from '../../src/theme/colors';
import { Typography } from '../../src/theme/typography';
import { Radii, Spacing } from '../../src/theme/spacing';
import { Shadows } from '../../src/theme/shadows';
import { formatBudgetStyle, formatTravelStyle } from '../../src/utils/formatters';

const TRIP_SECTIONS = [
  {
    id: 'before',
    emoji: '✅',
    title: 'Before you go',
    desc: 'Checklist, documents, eSIM, safety & more',
    route: '/trip/before-you-go',
    color: Colors.teal,
    bg: Colors.mint,
    gradient: ['#14B8A6', '#0D9488'] as const,
  },
  {
    id: 'itinerary',
    emoji: '🗓️',
    title: 'Smart itinerary',
    desc: 'Day-by-day plan tailored to your style',
    route: '/trip/itinerary',
    color: Colors.skyBlue,
    bg: Colors.skyBlueLight,
    gradient: ['#3B82F6', '#2563EB'] as const,
  },
  {
    id: 'transport',
    emoji: '🚗',
    title: 'Transport guide',
    desc: 'Airport transfer, city transport, ride tips',
    route: '/trip/transport',
    color: Colors.yellow,
    bg: Colors.yellowLight,
    gradient: ['#FBBF24', '#F59E0B'] as const,
  },
  {
    id: 'stay',
    emoji: '🏨',
    title: 'Stay areas',
    desc: 'Best neighbourhoods for your budget',
    route: '/trip/stay',
    color: Colors.coral,
    bg: Colors.coralLight,
    gradient: ['#FF6B5E', '#F97316'] as const,
  },
  {
    id: 'esim',
    emoji: '📶',
    title: 'eSIM & connectivity',
    desc: 'Stay connected throughout Egypt',
    route: '/trip/esim',
    color: Colors.teal,
    bg: Colors.mint,
    gradient: ['#2DD4BF', '#14B8A6'] as const,
  },
];

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

  const score = trip.readiness.score;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* ── Gradient hero header ── */}
        <FadeInView>
          <LinearGradient
            colors={['#0F172A', '#0F2E2B', '#0D3340']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroGlow} />
            <View style={styles.heroGlowCoral} />

            <View style={styles.heroFlag}>
              <Text style={styles.heroFlagEmoji}>🇪🇬</Text>
            </View>
            <Text style={styles.heroTitle}>{trip.destinationName}</Text>
            <Text style={styles.heroMeta}>
              {trip.durationDays} days · {formatBudgetStyle(trip.budgetStyle)}
            </Text>
            <View style={styles.heroStylePill}>
              <Text style={styles.heroStyleText}>{formatTravelStyle(trip.travelStyle)}</Text>
            </View>

            {/* Readiness mini */}
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                router.push('/tabs/home');
              }}
              style={({ pressed }) => [styles.readinessMini, pressed && styles.pressed]}
            >
              <View style={styles.readinessMiniTop}>
                <Text style={styles.readinessMiniLabel}>Trip readiness</Text>
                <View style={styles.readinessMiniRight}>
                  <Text style={styles.readinessMiniScore}>{score}% ready</Text>
                  <ArrowRight size={14} color={Colors.tealLight} strokeWidth={2.5} />
                </View>
              </View>
              <View style={styles.readinessMiniBar}>
                <LinearGradient
                  colors={['#2DD4BF', '#14B8A6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.readinessMiniProgress, { width: `${score}%` }]}
                />
              </View>
            </Pressable>
          </LinearGradient>
        </FadeInView>

        {/* ── Modules ── */}
        <Text style={styles.sectionTitle}>Trip modules</Text>

        <View style={styles.sections}>
          {TRIP_SECTIONS.map((sec, i) => (
            <FadeInView key={sec.id} delay={80 + i * 70}>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  router.push(sec.route as any);
                }}
                style={({ pressed }) => [styles.sectionCard, pressed && styles.pressed]}
              >
                <LinearGradient
                  colors={sec.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.sectionIcon}
                >
                  <Text style={styles.sectionEmoji}>{sec.emoji}</Text>
                </LinearGradient>
                <View style={styles.sectionContent}>
                  <Text style={styles.sectionCardTitle}>{sec.title}</Text>
                  <Text style={styles.sectionDesc}>{sec.desc}</Text>
                </View>
                <View style={styles.chevronCircle}>
                  <ChevronRight size={18} color={sec.color} strokeWidth={2.5} />
                </View>
              </Pressable>
            </FadeInView>
          ))}
        </View>

        {/* Reset option */}
        <Pressable onPress={() => router.replace('/onboarding')} style={styles.resetBtn}>
          <Text style={styles.resetText}>Start a new trip</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F6FA' },
  content: { paddingBottom: 130 },
  pressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },

  /* Hero */
  hero: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  heroGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#14B8A6',
    opacity: 0.14,
    top: -70,
    right: -50,
  },
  heroGlowCoral: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#3B82F6',
    opacity: 0.1,
    bottom: -40,
    left: -40,
  },
  heroFlag: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  heroFlagEmoji: { fontSize: 28 },
  heroTitle: { ...Typography.displayMd, color: '#FFFFFF', letterSpacing: -0.4 },
  heroMeta: { ...Typography.body, color: 'rgba(255,255,255,0.65)', marginTop: 4 },
  heroStylePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(20,184,166,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(45,212,191,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    marginTop: 10,
  },
  heroStyleText: { ...Typography.captionBold, color: Colors.tealLight },

  readinessMini: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 18,
    padding: 14,
    gap: 10,
    marginTop: 20,
  },
  readinessMiniTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  readinessMiniLabel: { ...Typography.caption, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  readinessMiniRight: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  readinessMiniScore: { ...Typography.captionBold, color: '#FFFFFF', fontWeight: '800' },
  readinessMiniBar: {
    height: 7,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  readinessMiniProgress: { height: '100%', borderRadius: 4 },

  /* Section */
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 14,
    paddingHorizontal: Spacing.screenH,
  },
  sections: { gap: 12, paddingHorizontal: Spacing.screenH },
  sectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardWhite,
    borderRadius: 20,
    padding: 14,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  sectionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionEmoji: { fontSize: 24 },
  sectionContent: { flex: 1, gap: 3 },
  sectionCardTitle: { ...Typography.h4, color: Colors.text, fontWeight: '700' },
  sectionDesc: { ...Typography.caption, color: Colors.muted, lineHeight: 17 },
  chevronCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  resetBtn: { marginTop: Spacing.xl, paddingVertical: Spacing.md, alignItems: 'center' },
  resetText: { ...Typography.body, color: Colors.mutedLight },

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
