import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  StatusBar,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronDown } from 'lucide-react-native';
import { router } from 'expo-router';
import * as Haptics from '../../src/utils/haptics';
import { useTripStore } from '../../src/store/tripStore';
import StatusPill from '../../src/components/ui/StatusPill';
import TrustBadge from '../../src/components/ui/TrustBadge';
import AppButton from '../../src/components/ui/AppButton';
import AppToast from '../../src/components/ui/AppToast';
import ExternalLinkCard from '../../src/components/ui/ExternalLinkCard';
import { Colors } from '../../src/theme/colors';
import { Typography } from '../../src/theme/typography';
import { Radii, Spacing } from '../../src/theme/spacing';
import { Shadows } from '../../src/theme/shadows';
import type { ReadinessStatus } from '../../src/types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const animateLayout = () => {
  if (Platform.OS !== 'web') {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }
};

const ITEM_ID = 'arrival_transport';

const TRUST_META = {
  sourceType: 'estimated' as const,
  confidence: 'medium' as const,
  lastCheckedLabel: 'Estimated ranges · Sample data',
};

/* ─── Data ───────────────────────────────────────────────────── */

const BEST_CHOICE = [
  'Pre-book a transfer or use Uber / Careem',
  'Avoid unmarked taxis & airport touts',
  'Keep some EGP cash for tips',
];

const TRANSFER_OPTIONS = [
  {
    id: 'uber_careem',
    icon: '📱',
    title: 'Uber / Careem',
    bestFor: 'Most travellers',
    cost: '200–400 EGP',
    pros: ['Tracked rides', 'Fixed pricing', '24/7'],
    watchOut: 'Surge at peak hours; follow in-app pickup point.',
    recommended: true,
  },
  {
    id: 'private_transfer',
    icon: '🚐',
    title: 'Pre-arranged transfer',
    bestFor: 'Zero-stress arrival',
    cost: '40–80 USD',
    pros: ['Meets you at arrivals', 'Fixed price', 'No navigation stress'],
    watchOut: 'Pricier; book via hotel or a reputable provider.',
    recommended: false,
  },
  {
    id: 'airport_taxi',
    icon: '🚕',
    title: 'Official airport taxi',
    bestFor: 'Budget, willing to haggle',
    cost: '250–500 EGP',
    pros: ['Available immediately', 'Can be cheaper'],
    watchOut: 'Agree the fare firmly first; avoid unofficial drivers.',
    recommended: false,
  },
  {
    id: 'metro',
    icon: '🚇',
    title: 'Cairo Metro',
    bestFor: 'Central trips, not arrival',
    cost: '5–10 EGP',
    pros: ['Very cheap', 'Avoids traffic', 'Air-conditioned'],
    watchOut: 'No airport link; impractical with luggage on arrival.',
    recommended: false,
  },
];

const CITY_TRANSPORT = [
  { icon: '📱', title: 'Uber / Careem', note: 'Safe, tracked, transparent pricing' },
  { icon: '🚕', title: 'White taxi', note: 'Short trips — agree fare first' },
  { icon: '🚇', title: 'Cairo Metro', note: 'Tahrir, Coptic Cairo, central routes' },
  { icon: '🚶', title: 'Walking', note: 'Zamalek & downtown markets' },
  { icon: '🚗', title: 'Private driver', note: 'Day trips — agree price upfront' },
];

const ARRIVAL_CHECKLIST = [
  'Confirm your destination address',
  'Save hotel address offline',
  'Use official pickup or an app ride',
  'Confirm price / route before leaving',
  'Keep small cash available',
];

const SOURCE_LINKS = [
  {
    id: 'uber-cairo',
    title: 'Uber Egypt',
    description: 'Check ride availability and current prices for Egypt.',
    url: 'https://www.uber.com/eg/en',
    sourceType: 'provider_ready' as const,
    confidence: 'high' as const,
    isExternal: true,
    isPlaceholder: false,
  },
  {
    id: 'careem-cairo',
    title: 'Careem — Cairo',
    description: 'Check ride-hailing options and current prices in Cairo.',
    url: 'https://www.careem.com',
    sourceType: 'provider_ready' as const,
    confidence: 'high' as const,
    isExternal: true,
    isPlaceholder: false,
  },
];

/* ─── Reusable presentational components ─────────────────────── */

function SectionHeader({ title, hint }: { title: string; hint?: string }) {
  return (
    <View style={styles.sectionTitleRow}>
      <View style={styles.sectionAccent} />
      <Text style={styles.sectionTitle}>{title}</Text>
      {hint ? <Text style={styles.sectionHint}>{hint}</Text> : null}
    </View>
  );
}

type TransferOption = (typeof TRANSFER_OPTIONS)[number];

function TransferOptionCard({
  opt,
  expanded,
  onToggle,
}: {
  opt: TransferOption;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={[styles.optionCard, opt.recommended && styles.optionCardRec]}>
      {opt.recommended && (
        <View style={styles.recRibbon}>
          <Text style={styles.recRibbonText}>RECOMMENDED</Text>
        </View>
      )}

      <Pressable onPress={onToggle} style={styles.optionTop}>
        <View style={styles.optionIconBubble}>
          <Text style={styles.optionIcon}>{opt.icon}</Text>
        </View>
        <View style={styles.optionHeaderText}>
          <Text style={styles.optionTitle}>{opt.title}</Text>
          <Text style={styles.optionBestFor} numberOfLines={1}>{opt.bestFor}</Text>
        </View>
        <View style={styles.costPill}>
          <Text style={styles.costPillText}>{opt.cost}</Text>
        </View>
        <View style={[styles.chevronWrap, expanded && styles.chevronWrapOpen]}>
          <ChevronDown
            size={18}
            color={expanded ? Colors.teal : Colors.mutedLight}
            strokeWidth={2.4}
            style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}
          />
        </View>
      </Pressable>

      {expanded && (
        <View style={styles.optionDetail}>
          <View style={styles.chipRow}>
            {opt.pros.map((p, i) => (
              <View key={i} style={styles.proChip}>
                <Text style={styles.proChipCheck}>✓</Text>
                <Text style={styles.proChipText}>{p}</Text>
              </View>
            ))}
          </View>
          <View style={styles.watchCard}>
            <Text style={styles.watchIcon}>⚠</Text>
            <Text style={styles.watchText}>{opt.watchOut}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

/* ─── Screen ─────────────────────────────────────────────────── */

export default function TransportScreen() {
  const { trip, updateReadinessItem } = useTripStore();
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>('uber_careem');

  const readinessItem = trip?.readiness.items.find((i) => i.id === ITEM_ID);
  const status: ReadinessStatus = readinessItem?.status ?? 'not_set';
  const isReady = status === 'ready';

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  };

  const handleToggleReady = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const next: ReadinessStatus = isReady ? 'not_set' : 'ready';
    updateReadinessItem(ITEM_ID, next);
    showToast(isReady ? 'Status updated' : 'Arrival & Transport marked as ready ✅');
  };

  const toggleOption = (id: string) => {
    Haptics.selectionAsync();
    animateLayout();
    setExpandedId((cur) => (cur === id ? null : id));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />

      {/* Cinematic ambient background */}
      <LinearGradient
        colors={['#EAF3F2', '#F1F5F8', '#F8FAFC']}
        locations={[0, 0.4, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 0.9 }}
        style={styles.ambientBg}
        pointerEvents="none"
      />
      <View style={styles.ambientBlob} pointerEvents="none" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Back */}
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        {/* ── 1. Hero ── */}
        <LinearGradient
          colors={['#0B1220', '#0F2E2B', '#0C3742']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroGlow} />
          <View style={styles.heroGlowWarm} />
          <Text style={styles.heroEyebrow}>AIRPORT ARRIVAL</Text>
          <Text style={styles.heroTitle}>Arrival & Transport</Text>
          <Text style={styles.heroSub}>
            Getting from Cairo Airport to your stay — the easy way.
          </Text>
          <View style={styles.heroBadges}>
            <StatusPill status={status} />
            <TrustBadge trust={TRUST_META} compact />
          </View>
        </LinearGradient>

        {/* ── 2. Best arrival choice ── */}
        <View style={styles.section}>
          <SectionHeader title="Best arrival choice" />
          <View style={styles.recCard}>
            <View style={styles.recGlow} pointerEvents="none" />
            <View style={styles.recHeader}>
              <View style={styles.recIconBubble}>
                <Text style={styles.recIconText}>✓</Text>
              </View>
              <Text style={styles.recTitle}>For most first-time travellers</Text>
            </View>
            <View style={styles.recDivider} />
            {BEST_CHOICE.map((b, i) => (
              <View key={i} style={styles.recRow}>
                <View style={styles.recDot} />
                <Text style={styles.recText}>{b}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── 3. Transport options (expandable) ── */}
        <View style={styles.section}>
          <SectionHeader title="Transport options" hint="Tap to expand" />
          <View style={styles.optionsList}>
            {TRANSFER_OPTIONS.map((opt) => (
              <TransferOptionCard
                key={opt.id}
                opt={opt}
                expanded={expandedId === opt.id}
                onToggle={() => toggleOption(opt.id)}
              />
            ))}
          </View>
        </View>

        {/* ── 4. Getting around Cairo ── */}
        <View style={styles.section}>
          <SectionHeader title="Getting around Cairo" />
          <View style={styles.cityCard}>
            {CITY_TRANSPORT.map((item, i) => (
              <View key={i} style={[styles.cityRow, i < CITY_TRANSPORT.length - 1 && styles.cityRowBorder]}>
                <View style={styles.cityIconBubble}>
                  <Text style={styles.cityIcon}>{item.icon}</Text>
                </View>
                <View style={styles.cityText}>
                  <Text style={styles.cityTitle}>{item.title}</Text>
                  <Text style={styles.cityNote}>{item.note}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── 5. Useful apps ── */}
        <View style={styles.section}>
          <SectionHeader title="Useful apps" />
          <View style={styles.linksList}>
            {SOURCE_LINKS.map((link) => (
              <ExternalLinkCard key={link.id} link={link} />
            ))}
          </View>
        </View>

        {/* ── 6. Airport arrival checklist ── */}
        <View style={styles.section}>
          <SectionHeader title="Airport arrival checklist" />
          <View style={styles.checkGrid}>
            {ARRIVAL_CHECKLIST.map((item, i) => (
              <View key={i} style={styles.checkTile}>
                <View style={styles.checkCircle}>
                  <Text style={styles.checkTick}>✓</Text>
                </View>
                <Text style={styles.checkTileText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Safety note ── */}
        <View style={styles.warningCard}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningText}>
            Prices are estimates and can change. Always agree the fare before starting any non-app taxi ride.
          </Text>
        </View>

        {/* ── CTA ── */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaHelper}>
            {isReady
              ? 'Arrival & Transport is marked ready. Tap to undo.'
              : 'Mark ready after choosing how you\'ll get from the airport and around Egypt.'}
          </Text>
          <AppButton
            label={isReady ? '✓ I planned arrival transport — tap to undo' : 'I planned arrival transport'}
            onPress={handleToggleReady}
            variant={isReady ? 'secondary' : 'primary'}
            fullWidth
          />
        </View>

      </ScrollView>

      <AppToast message={toastMsg} visible={toastVisible} emoji={isReady ? '↩️' : '✅'} />
    </SafeAreaView>
  );
}

/* ─── Styles ─────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  ambientBg: { ...StyleSheet.absoluteFillObject },
  ambientBlob: {
    position: 'absolute',
    top: -80,
    right: -70,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(20,184,166,0.09)',
  },
  content: {
    paddingHorizontal: Spacing.screenH,
    paddingBottom: 110,
    paddingTop: Spacing.base,
    gap: Spacing.lg,
  },

  backBtn: { paddingVertical: Spacing.xs },
  backText: { ...Typography.body, color: Colors.teal, fontWeight: '600' },

  /* Hero */
  heroCard: {
    borderRadius: Radii.cardLg,
    padding: Spacing.xl,
    gap: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    ...Shadows.lg,
  },
  heroGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#14B8A6',
    opacity: 0.14,
    top: -60,
    right: -45,
  },
  heroGlowWarm: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#F59E0B',
    opacity: 0.06,
    bottom: -50,
    left: -30,
  },
  heroEyebrow: {
    fontSize: 10.5,
    fontWeight: '700',
    color: 'rgba(45,212,191,0.9)',
    letterSpacing: 1.6,
    marginBottom: 2,
  },
  heroTitle: { fontSize: 25, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.4 },
  heroSub: { ...Typography.body, color: 'rgba(255,255,255,0.68)', lineHeight: 21 },
  heroBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 8,
    flexWrap: 'wrap',
  },

  /* Sections */
  section: { gap: Spacing.sm },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  sectionAccent: { width: 4, height: 16, borderRadius: 2, backgroundColor: Colors.teal },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A', letterSpacing: -0.2 },
  sectionHint: { ...Typography.caption, color: Colors.mutedLight, marginLeft: 'auto', fontWeight: '500' },

  /* Best choice rec card */
  recCard: {
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.cardLg,
    borderWidth: 1.5,
    borderColor: Colors.teal + '33',
    padding: Spacing.cardPad,
    gap: Spacing.sm,
    overflow: 'hidden',
    ...Shadows.md,
  },
  recGlow: {
    position: 'absolute',
    top: -50,
    right: -40,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(20,184,166,0.07)',
  },
  recHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  recIconBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.teal,
  },
  recIconText: { fontSize: 15, color: '#FFFFFF', fontWeight: '800' },
  recTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, flex: 1, letterSpacing: -0.2 },
  recDivider: { height: 1, backgroundColor: Colors.borderLight },
  recRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  recDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.teal, flexShrink: 0 },
  recText: { ...Typography.bodySm, color: Colors.textSecondary, flex: 1, lineHeight: 20, fontWeight: '500' },

  /* Option cards (expandable) */
  optionsList: { gap: Spacing.md },
  optionCard: {
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.cardLg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.cardPad,
    gap: Spacing.sm,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  optionCardRec: { borderColor: Colors.teal + '55', borderWidth: 1.5 },
  recRibbon: {
    position: 'absolute',
    top: 12,
    right: -32,
    backgroundColor: Colors.teal,
    paddingHorizontal: 34,
    paddingVertical: 3,
    transform: [{ rotate: '45deg' }],
  },
  recRibbonText: { fontSize: 8.5, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.6 },
  optionTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  optionIconBubble: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.04)',
  },
  optionIcon: { fontSize: 22 },
  optionHeaderText: { flex: 1, gap: 2 },
  optionTitle: { fontSize: 15.5, fontWeight: '700', color: Colors.text, letterSpacing: -0.2 },
  optionBestFor: { ...Typography.caption, color: Colors.teal, fontWeight: '600' },
  costPill: {
    backgroundColor: Colors.background,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    flexShrink: 0,
  },
  costPillText: { fontSize: 11, fontWeight: '700', color: Colors.text },
  chevronWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  chevronWrapOpen: { backgroundColor: Colors.mint },
  optionDetail: { gap: Spacing.sm, paddingTop: 2 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  proChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.successLight,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  proChipCheck: { fontSize: 11, color: Colors.success, fontWeight: '800' },
  proChipText: { ...Typography.caption, color: Colors.tealDark, fontWeight: '600' },
  watchCard: {
    flexDirection: 'row',
    gap: 7,
    backgroundColor: Colors.yellowLight,
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    alignItems: 'flex-start',
  },
  watchIcon: { fontSize: 12, color: Colors.warning, marginTop: 2, flexShrink: 0 },
  watchText: { ...Typography.caption, color: '#92400E', flex: 1, lineHeight: 18 },

  /* City transport */
  cityCard: {
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 11,
    paddingHorizontal: Spacing.base,
  },
  cityRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  cityIconBubble: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cityIcon: { fontSize: 16 },
  cityText: { flex: 1 },
  cityTitle: { fontSize: 13.5, fontWeight: '700', color: Colors.text },
  cityNote: { ...Typography.caption, color: Colors.textSecondary, lineHeight: 17, marginTop: 1 },

  /* Links */
  linksList: { gap: Spacing.sm },

  /* Check grid */
  checkGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  checkTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '47.5%',
    flexGrow: 1,
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingVertical: 11,
    paddingHorizontal: 12,
    ...Shadows.xs,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkTick: { fontSize: 11, color: Colors.tealDark, fontWeight: '800' },
  checkTileText: { ...Typography.caption, color: Colors.textSecondary, flex: 1, fontWeight: '500', lineHeight: 16 },

  /* Warning */
  warningCard: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Colors.yellowLight,
    borderRadius: Radii.card,
    padding: Spacing.cardPad,
    borderWidth: 1,
    borderColor: Colors.yellow + '50',
    alignItems: 'flex-start',
  },
  warningIcon: { fontSize: 17, flexShrink: 0 },
  warningText: { ...Typography.bodySm, color: '#92400E', flex: 1, lineHeight: 20 },

  /* CTA */
  ctaSection: { gap: Spacing.sm },
  ctaHelper: {
    ...Typography.caption,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
