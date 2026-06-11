import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
  SafeAreaView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ChevronRight, Settings2, ArrowRight } from 'lucide-react-native';
import * as Haptics from '../../src/utils/haptics';
import { useTripStore } from '../../src/store/tripStore';
import FadeInView from '../../src/components/ui/FadeInView';
import { Colors } from '../../src/theme/colors';
import { Typography } from '../../src/theme/typography';
import { Radii, Spacing } from '../../src/theme/spacing';
import { Shadows } from '../../src/theme/shadows';
import { formatBudgetStyle, formatTravelStyle } from '../../src/utils/formatters';
import { READINESS_ROUTE_MAP, READINESS_ORDER } from '../../src/navigation/readinessRoutes';
import type { ReadinessStatus } from '../../src/types';

/* ─── Config ─────────────────────────────────────────────────── */

const COMPACT_CATEGORIES = [
  { id: 'entry_documents',  label: 'Entry & Docs'  },
  { id: 'connectivity',     label: 'Phone & Internet' },
  { id: 'arrival_transport',label: 'Arrival'        },
  { id: 'accommodation',    label: 'Accommodation' },
];

const STATUS_DOT: Record<ReadinessStatus, { color: string; short: string }> = {
  ready:        { color: '#10B981', short: 'Ready'     },
  needs_review: { color: '#F59E0B', short: 'Review'    },
  not_set:      { color: '#FF6B5E', short: 'Missing'   },
  suggested:    { color: '#3B82F6', short: 'Suggested' },
};

/**
 * Display metadata for each readiness step shown on the Home screen.
 * Routes come from READINESS_ROUTE_MAP — single source of truth.
 * Order matches READINESS_ORDER (canonical checklist order).
 */
const READINESS_STEPS: {
  id: string;
  title: string;
  sub: string;
  route: string;
}[] = [
  {
    id: 'entry_documents',
    title: 'Review entry documents',
    sub: 'Confirm passport validity, visa, and what to carry to Egypt.',
    route: READINESS_ROUTE_MAP.entry_documents,
  },
  {
    id: 'connectivity',
    title: 'Set up phone & internet',
    sub: 'Compare eSIM, local SIM, WhatsApp, and Wi-Fi options before you arrive.',
    route: READINESS_ROUTE_MAP.connectivity,
  },
  {
    id: 'arrival_transport',
    title: 'Plan arrival transport',
    sub: 'See airport transfer and city transport options.',
    route: READINESS_ROUTE_MAP.arrival_transport,
  },
  {
    id: 'accommodation',
    title: 'Choose accommodation area',
    sub: 'Find the right stay type and neighbourhood for your trip style.',
    route: READINESS_ROUTE_MAP.accommodation,
  },
  {
    id: 'budget',
    title: 'Prepare money & payments',
    sub: 'Know when to use cash, cards, ATMs, and tipping in Egypt.',
    route: READINESS_ROUTE_MAP.budget,
  },
  {
    id: 'safety',
    title: 'Review safety & local tips',
    sub: 'Understand local customs, scams to avoid, and emergency prep.',
    route: READINESS_ROUTE_MAP.safety,
  },
  {
    id: 'packing',
    title: 'Check your packing list',
    sub: 'Make sure you have everything you need for an Egypt trip.',
    route: READINESS_ROUTE_MAP.packing,
  },
  {
    id: 'emergency',
    title: 'Set emergency info',
    sub: 'Save key numbers and what to do if something goes wrong.',
    route: READINESS_ROUTE_MAP.emergency,
  },
  {
    id: 'itinerary',
    title: 'Review your itinerary',
    sub: 'Confirm your trip plan and first arrival day.',
    route: READINESS_ROUTE_MAP.itinerary,
  },
];

/** IDs of the 8 preparation items that drive the Home readiness percentage.
 *  Itinerary is intentionally excluded — it does not count toward readiness %. */
const PREP_IDS = [
  'entry_documents',
  'connectivity',
  'arrival_transport',
  'accommodation',
  'budget',
  'safety',
  'packing',
  'emergency',
] as const;

const TRIP_SECTIONS = [
  { id: 'checklist', emoji: '✅', label: 'Before you go', sub: 'Checklist & documents', color: '#E6FFFA', route: '/trip/before-you-go' },
  { id: 'itinerary', emoji: '🗓️', label: 'Itinerary',      sub: 'Day-by-day plan',        color: '#EFF6FF', route: '/trip/itinerary'     },
  { id: 'live',      emoji: '⚡', label: 'Live help',      sub: 'Rescue mode',             color: '#FFF1F0', route: '/tabs/live'          },
  { id: 'diary',     emoji: '📖', label: 'Travel diary',   sub: 'Saved & visited places', color: '#FFFBEB', route: '/tabs/diary'         },
];

const DAY1_BULLETS = ['Airport transfer', 'Hotel check-in', 'Light dinner nearby'];

/* ─── Component ──────────────────────────────────────────────── */

export default function HomeScreen() {
  const { trip, resetTrip } = useTripStore();

  if (!trip) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyEmoji}>🧳</Text>
          <Text style={styles.emptyTitle}>No trip yet</Text>
          <Text style={styles.emptySub}>Create your first trip to get started.</Text>
          <Pressable
            onPress={() => router.replace('/onboarding')}
            style={styles.emptyBtn}
          >
            <Text style={styles.emptyBtnText}>Plan a trip</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const items = trip.readiness.items;

  /* ── Prep-only score (8 items, excludes itinerary) ── */
  const STATUS_SCORES_LOCAL: Record<string, number> = {
    ready: 100, suggested: 70, needs_review: 40, not_set: 0,
  };
  const prepItems = PREP_IDS.map((id) => items.find((i) => i.id === id));
  const prepScore = Math.round(
    prepItems.reduce((sum, item) => sum + (STATUS_SCORES_LOCAL[item?.status ?? 'not_set'] ?? 0), 0)
    / PREP_IDS.length
  );
  const allPrepReady = prepItems.every((item) => item?.status === 'ready');

  /* ── Shimmer animation (runs only when all prep items are ready) ── */
  const shimmerAnim = useRef(new Animated.Value(-1)).current;
  useEffect(() => {
    if (!allPrepReady) {
      shimmerAnim.setValue(-1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.delay(1800),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [allPrepReady]);

  /**
   * Next-step: first item in canonical READINESS_ORDER that is not 'ready'.
   * Status (needs_review / not_set / suggested) only affects badges — it does
   * NOT reorder the sequence. Itinerary is last and only surfaces after all
   * Before-you-go items are ready.
   */
  const nonReadySteps = READINESS_STEPS.filter((ns) => {
    const item = items.find((i) => i.id === ns.id);
    return item ? item.status !== 'ready' : false;
  });

  const nextStep = nonReadySteps[0] ?? READINESS_STEPS[0];
  const remainingCount = Math.max(0, nonReadySteps.length - 1);

  /* Readiness label — based on prep score only */
  const readinessLine =
    allPrepReady     ? 'All preparation complete!' :
    prepScore >= 80  ? 'You\'re almost fully prepared!' :
    prepScore >= 50  ? 'A few things left before you\'re fully ready.' :
    'Let\'s get your trip ready step by step.';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >

        {/* ── 1. Header ── */}
        <FadeInView>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Your Egypt Pack</Text>
              <Text style={styles.headerMeta}>
                {trip.durationDays} days · {formatBudgetStyle(trip.budgetStyle)} · {formatTravelStyle(trip.travelStyle)}
              </Text>
            </View>
            <Pressable style={styles.settingsBtn}>
              <Settings2 size={18} color={Colors.muted} />
            </Pressable>
          </View>
        </FadeInView>

        {/* ── 2. Hero readiness card ── */}
        <FadeInView delay={70}>
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            router.push('/trip/before-you-go');
          }}
          style={({ pressed }) => [styles.heroCardWrap, pressed && { opacity: 0.95 }]}
        >
          <LinearGradient
            colors={['#0F172A', '#0F2E2B', '#0D3340']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            {/* Ambient glow */}
            <View style={styles.heroGlow} />

            {/* Score row */}
            <View style={styles.heroTop}>
              <View style={styles.heroScoreBlock}>
                <Text style={[
                  styles.heroScoreNumber,
                  allPrepReady && styles.heroScoreNumberComplete,
                ]}>{prepScore}%</Text>
                <Text style={[
                  styles.heroScoreLabel,
                  allPrepReady && styles.heroScoreLabelComplete,
                ]}>{allPrepReady ? 'READY' : 'ready'}</Text>
              </View>
              <View style={styles.heroProgressCol}>
                <Text style={styles.heroReadinessLine}>{readinessLine}</Text>
                {/* Progress bar */}
                <View style={styles.progressTrack}>
                  <LinearGradient
                    colors={
                      allPrepReady
                        ? ['#D97706', '#F59E0B', '#FBBF24']
                        : prepScore >= 70
                          ? ['#14B8A6', '#10B981']
                          : prepScore >= 40
                            ? ['#F59E0B', '#EAB308']
                            : ['#FF6B5E', '#F97316']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.progressFill, { width: `${prepScore}%` }]}
                  />
                </View>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.heroDivider} />

            {/* Compact category dots */}
            <View style={styles.heroCategories}>
              {COMPACT_CATEGORIES.map((cat) => {
                const item = items.find((i) => i.id === cat.id);
                const cfg = STATUS_DOT[item?.status ?? 'not_set'];
                return (
                  <View key={cat.id} style={styles.heroCatItem}>
                    <View style={[styles.heroCatDot, { backgroundColor: cfg.color }]} />
                    <Text style={styles.heroCatLabel}>{cat.label}</Text>
                    <Text style={[styles.heroCatStatus, { color: cfg.color }]}>{cfg.short}</Text>
                  </View>
                );
              })}
            </View>

            {/* CTA — amber/gold complete state or standard teal */}
            {allPrepReady ? (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push('/trip/itinerary');
                }}
                style={({ pressed }) => [styles.heroCta, pressed && { opacity: 0.88 }]}
              >
                <LinearGradient
                  colors={['#92400E', '#B45309', '#D97706', '#F59E0B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.heroCtaGradient, styles.heroCtaGradientComplete]}
                >
                  {/* Shimmer sweep */}
                  <Animated.View
                    style={[
                      styles.shimmerStreak,
                      {
                        transform: [{
                          translateX: shimmerAnim.interpolate({
                            inputRange: [-1, 1],
                            outputRange: [-260, 320],
                          }),
                        }],
                      },
                    ]}
                  />
                  {/* Sparkle accents */}
                  <Text style={styles.sparkle} aria-hidden>✦</Text>
                  <Text style={styles.heroCtaTextComplete}>Your trip plan is ready ✨</Text>
                  <Text style={styles.sparkle} aria-hidden>✦</Text>
                </LinearGradient>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(nextStep.route as any);
                }}
                style={({ pressed }) => [styles.heroCta, pressed && { opacity: 0.85 }]}
              >
                <LinearGradient
                  colors={['#14B8A6', '#0D9488']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.heroCtaGradient}
                >
                  <Text style={styles.heroCtaText}>Continue planning</Text>
                  <ArrowRight size={16} color="#fff" strokeWidth={2.5} />
                </LinearGradient>
              </Pressable>
            )}
          </LinearGradient>
        </Pressable>
        </FadeInView>

        {/* ── 3. Your next step ── */}
        <FadeInView delay={140} style={styles.section}>
          <Text style={styles.sectionTitle}>Your next step</Text>

          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              router.push(nextStep.route as any);
            }}
            style={({ pressed }) => [styles.nextStepCard, pressed && styles.cardPressed]}
          >
            <View style={styles.nextStepAccent} />
            <View style={styles.nextStepBody}>
              <Text style={styles.nextStepTitle}>{nextStep.title}</Text>
              <Text style={styles.nextStepSub}>{nextStep.sub}</Text>
            </View>
            <View style={styles.nextStepChevron}>
              <ChevronRight size={18} color={Colors.teal} strokeWidth={2.5} />
            </View>
          </Pressable>

          <View style={styles.nextStepFooter}>
            {remainingCount > 0 && (
              <Text style={styles.moreTasksText}>
                {remainingCount} more task{remainingCount !== 1 ? 's' : ''} after this
              </Text>
            )}
            <Pressable onPress={() => router.push('/trip/before-you-go')}>
              <Text style={styles.seeAllLink}>See all tasks</Text>
            </Pressable>
          </View>
        </FadeInView>

        {/* ── 4. Explore your trip ── */}
        <FadeInView delay={200} style={styles.section}>
          <Text style={styles.sectionTitle}>Explore your trip</Text>
          <View style={styles.tripGrid}>
            {TRIP_SECTIONS.map((sec) => (
              <Pressable
                key={sec.id}
                onPress={() => {
                  Haptics.selectionAsync();
                  router.push(sec.route as any);
                }}
                style={({ pressed }) => [styles.tripCard, pressed && styles.cardPressed]}
              >
                <View style={[styles.tripIconBubble, { backgroundColor: sec.color }]}>
                  <Text style={styles.tripIcon}>{sec.emoji}</Text>
                </View>
                <View style={styles.tripCardText}>
                  <Text style={styles.tripCardLabel}>{sec.label}</Text>
                  <Text style={styles.tripCardSub}>{sec.sub}</Text>
                </View>
                <ChevronRight size={16} color={Colors.mutedLight} />
              </Pressable>
            ))}
          </View>
        </FadeInView>

        {/* ── 5. Day 1 preview ── */}
        <FadeInView delay={260} style={styles.section}>
          <Text style={styles.sectionTitle}>Your first day</Text>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              router.push({ pathname: '/trip/day', params: { dayIndex: 0 } });
            }}
            style={({ pressed }) => [styles.day1Card, pressed && styles.cardPressed]}
          >
            <View style={styles.day1Header}>
              <View style={styles.day1Badge}>
                <Text style={styles.day1BadgeText}>Day 1</Text>
              </View>
              <Text style={styles.day1Title}>Arrival & easy local start</Text>
            </View>
            <View style={styles.day1Bullets}>
              {DAY1_BULLETS.map((b) => (
                <View key={b} style={styles.day1BulletRow}>
                  <View style={styles.day1Dot} />
                  <Text style={styles.day1BulletText}>{b}</Text>
                </View>
              ))}
            </View>
            <View style={styles.day1Cta}>
              <Text style={styles.day1CtaText}>View day plan</Text>
              <ChevronRight size={14} color={Colors.teal} strokeWidth={2.5} />
            </View>
          </Pressable>
        </FadeInView>

        {/* ── 6. Trust card ── */}
        <View style={styles.trustCard}>
          <View style={styles.trustRow}>
            <Text style={styles.trustTitle}>Travel info freshness</Text>
            <View style={styles.trustBadges}>
              <View style={styles.trustBadge}>
                <Text style={styles.trustBadgeText}>Sample data</Text>
              </View>
              <View style={styles.trustBadge}>
                <Text style={styles.trustBadgeText}>Official sources recommended</Text>
              </View>
            </View>
          </View>
          <Text style={styles.trustBody}>
            Sample data for MVP. Confirm critical details before departure.
          </Text>
        </View>

        {/* ── 7. Reset (dev) ── */}
        <Pressable onPress={() => { resetTrip(); router.replace('/onboarding'); }} style={styles.resetBtn}>
          <Text style={styles.resetText}>Reset trip</Text>
        </Pressable>

      </ScrollView>
    </SafeAreaView>
  );
}

/* ─── Styles ─────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F4F6FA',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 130,
    gap: 0,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerLeft: { flex: 1 },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  headerMeta: {
    ...Typography.caption,
    color: Colors.muted,
    marginTop: 3,
    fontWeight: '500',
  },
  settingsBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.xs,
  },

  /* Hero card */
  heroCardWrap: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 28,
    ...Shadows.lg,
  },
  heroCard: {
    borderRadius: 24,
    padding: 22,
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#14B8A6',
    opacity: 0.12,
    top: -60,
    right: -40,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 18,
  },
  heroScoreBlock: {
    alignItems: 'center',
  },
  heroScoreNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -2,
    lineHeight: 52,
  },
  heroScoreLabel: {
    ...Typography.captionBold,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroProgressCol: {
    flex: 1,
    paddingTop: 6,
    gap: 10,
  },
  heroReadinessLine: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.70)',
    lineHeight: 20,
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: 16,
  },
  heroCategories: {
    flexDirection: 'row',
    gap: 0,
    flexWrap: 'wrap',
    rowGap: 8,
    marginBottom: 20,
  },
  heroCatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    width: '50%',
  },
  heroCatDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  heroCatLabel: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '500',
  },
  heroCatStatus: {
    ...Typography.caption,
    fontWeight: '700',
  },
  heroCta: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  heroCtaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 999,
  },
  heroCtaText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Complete-state score */
  heroScoreNumberComplete: {
    color: '#FBBF24',
  },
  heroScoreLabelComplete: {
    color: '#FCD34D',
    fontWeight: '700',
    letterSpacing: 1,
  },

  /* Complete-state CTA */
  heroCtaGradientComplete: {
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 12,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  heroCtaTextComplete: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },
  sparkle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
  },
  shimmerStreak: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 60,
    backgroundColor: 'rgba(255,255,255,0.22)',
    transform: [{ skewX: '-18deg' }],
  },

  /* Section */
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
    marginBottom: 12,
  },

  /* Next step card */
  nextStepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  nextStepAccent: {
    width: 4,
    alignSelf: 'stretch',
    backgroundColor: Colors.teal,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  nextStepBody: {
    flex: 1,
    paddingVertical: 16,
    paddingLeft: 14,
    paddingRight: 8,
    gap: 3,
  },
  nextStepTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  nextStepSub: {
    ...Typography.caption,
    color: Colors.muted,
    lineHeight: 18,
  },
  nextStepChevron: {
    paddingRight: 16,
  },
  nextStepFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 2,
  },
  moreTasksText: {
    ...Typography.caption,
    color: Colors.mutedLight,
  },
  seeAllLink: {
    ...Typography.caption,
    color: Colors.teal,
    fontWeight: '600',
  },

  /* Trip sections grid */
  tripGrid: {
    gap: 10,
  },
  tripCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.xs,
  },
  tripIconBubble: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  tripIcon: {
    fontSize: 20,
  },
  tripCardText: {
    flex: 1,
    gap: 2,
  },
  tripCardLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  tripCardSub: {
    ...Typography.caption,
    color: Colors.muted,
  },

  /* Day 1 card */
  day1Card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
    ...Shadows.sm,
  },
  day1Header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  day1Badge: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  day1BadgeText: {
    ...Typography.captionBold,
    color: Colors.teal,
    fontWeight: '800',
  },
  day1Title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  day1Bullets: {
    gap: 6,
  },
  day1BulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  day1Dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.teal,
  },
  day1BulletText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  day1Cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  day1CtaText: {
    ...Typography.caption,
    color: Colors.teal,
    fontWeight: '700',
  },

  /* Trust card */
  trustCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
    marginBottom: 16,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    flexWrap: 'wrap',
  },
  trustTitle: {
    ...Typography.captionBold,
    color: Colors.text,
  },
  trustBadges: {
    flexDirection: 'row',
    gap: 5,
    flexWrap: 'wrap',
  },
  trustBadge: {
    backgroundColor: Colors.borderLight,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
  },
  trustBadgeText: {
    ...Typography.caption,
    color: Colors.muted,
    fontSize: 10,
  },
  trustBody: {
    ...Typography.caption,
    color: Colors.mutedLight,
    lineHeight: 18,
  },

  /* Reset */
  resetBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  resetText: {
    ...Typography.caption,
    color: Colors.mutedLight,
  },

  /* Empty state */
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
  },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptySub: {
    ...Typography.body,
    color: Colors.muted,
    textAlign: 'center',
  },
  emptyBtn: {
    marginTop: 8,
    backgroundColor: Colors.teal,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 999,
  },
  emptyBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Shared */
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
});
