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
import { LinearGradient } from 'expo-linear-gradient';
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

const ITEM_ID = 'arrival_transport';

const TRUST_META = {
  sourceType: 'estimated' as const,
  confidence: 'medium' as const,
  lastCheckedLabel: 'Estimated ranges · Sample data',
};

/* ─── Data (mirrors PREPARATION_CHECKLIST arrival_transport in egypt.ts) ── */

const KEY_THINGS = [
  'Cairo Airport to central Cairo typically takes 30–60 minutes depending on traffic.',
  'Uber and Careem are widely available and the safest option for most tourists.',
  'Standard taxis exist — always agree on fare before getting in, avoid unmarked vehicles.',
  'Cairo traffic is heavy — plan extra time for morning/evening airport arrivals.',
  'The Cairo Metro is useful for some routes but not practical for first arrival with luggage.',
  'For day trips (Pyramids, Saqqara, Luxor), a private driver or tour is most convenient.',
];

const TRANSFER_OPTIONS = [
  {
    id: 'uber_careem',
    icon: '📱',
    title: 'Uber / Careem',
    bestFor: 'Most situations — Balanced and Premium travellers',
    cost: '200–400 EGP airport to central Cairo (estimated)',
    pros: ['Tracked rides with GPS', 'Transparent pricing — no negotiation', 'Available 24/7'],
    watchOut: 'Surge pricing at peak hours. Airport pick-up point can be confusing — follow in-app directions.',
    recommended: true,
  },
  {
    id: 'private_transfer',
    icon: '🚐',
    title: 'Pre-arranged private transfer',
    bestFor: 'Premium travellers, first-time visitors wanting zero stress',
    cost: '40–80 USD depending on provider (estimated)',
    pros: ['Driver meets you at arrivals', 'Fixed price agreed in advance', 'No navigation stress on arrival'],
    watchOut: 'More expensive than ride-hailing. Book in advance through hotel or reputable provider.',
    recommended: false,
  },
  {
    id: 'airport_taxi',
    icon: '🚕',
    title: 'Official airport taxi',
    bestFor: 'Budget travellers willing to negotiate',
    cost: '250–500 EGP — negotiate before entering',
    pros: ['Available immediately outside terminal', 'Can be cheaper than ride-hailing'],
    watchOut: 'Negotiate firmly before getting in. Avoid unofficial drivers approaching inside the terminal.',
    recommended: false,
  },
  {
    id: 'metro',
    icon: '🚇',
    title: 'Cairo Metro',
    bestFor: 'Budget travellers moving between central areas — not from airport',
    cost: '5–10 EGP per journey (estimated)',
    pros: ['Very cheap', 'Avoids traffic on some routes', 'Air-conditioned'],
    watchOut: 'Does not connect to Cairo Airport. Not practical for first arrival with luggage.',
    recommended: false,
  },
];

const CITY_TRANSPORT = [
  { icon: '📱', title: 'Uber / Careem', note: 'Most situations — safe, tracked, transparent pricing' },
  { icon: '🚕', title: 'White taxi', note: 'Short local trips — negotiate fare before getting in' },
  { icon: '🚇', title: 'Cairo Metro', note: 'Tahrir Square, Coptic Cairo, some central routes' },
  { icon: '🚶', title: 'Walking', note: 'Zamalek, certain downtown areas and markets' },
  { icon: '🚗', title: 'Private driver', note: 'Day trips, Giza, Saqqara — agree price upfront' },
];

const BEFORE_YOU_GO = [
  'Download Uber and Careem before departure — set up your payment method.',
  'Know your hotel\'s full address in English and Arabic for drivers.',
  'Avoid accepting rides from unmarked vehicles or men approaching inside the terminal.',
  'Allow extra time if landing during Cairo morning or evening rush hours.',
  'Have some EGP cash available on arrival for taxis or tips.',
  'For day trips, ask your hotel to recommend a trusted private driver.',
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

/* ─── Small reusable components ──────────────────────────────── */

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function CheckRow({ text, last = false }: { text: string; last?: boolean }) {
  return (
    <View style={[styles.checkRow, !last && styles.checkRowBorder]}>
      <View style={styles.checkBox}>
        <Text style={styles.checkMark}>○</Text>
      </View>
      <Text style={styles.checkText}>{text}</Text>
    </View>
  );
}

/* ─── Screen ─────────────────────────────────────────────────── */

export default function TransportScreen() {
  const { trip, updateReadinessItem } = useTripStore();
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

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

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Back */}
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        {/* ── 1. Hero ── */}
        <LinearGradient
          colors={['#0F172A', '#0F2E2B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroGlow} />
          <Text style={styles.heroIcon}>🚗</Text>
          <Text style={styles.heroTitle}>Arrival & Transport</Text>
          <Text style={styles.heroSub}>
            Plan your airport transfer and understand how to get around Cairo.
          </Text>
          <View style={styles.heroBadges}>
            <StatusPill status={status} />
            <TrustBadge trust={TRUST_META} compact />
          </View>
        </LinearGradient>

        {/* ── 2. Key things to know ── */}
        <View style={styles.section}>
          <SectionHeader title="Key things to know" />
          <View style={styles.bulletCard}>
            {KEY_THINGS.map((point, i) => (
              <View key={i} style={[styles.bulletRow, i < KEY_THINGS.length - 1 && styles.bulletRowBorder]}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>{point}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── 3. Airport transfer options ── */}
        <View style={styles.section}>
          <SectionHeader title="Airport transfer options" />
          <View style={styles.optionsList}>
            {TRANSFER_OPTIONS.map((opt) => (
              <View key={opt.id} style={[styles.optionCard, opt.recommended && styles.optionCardHighlight]}>
                {/* Header */}
                <View style={styles.optionHeader}>
                  <Text style={styles.optionIcon}>{opt.icon}</Text>
                  <View style={styles.optionHeaderText}>
                    <Text style={styles.optionTitle}>{opt.title}</Text>
                    {opt.recommended && (
                      <View style={styles.recBadge}>
                        <Text style={styles.recBadgeText}>Recommended</Text>
                      </View>
                    )}
                  </View>
                </View>
                {/* Best for */}
                <Text style={styles.optionBestFor}>Best for: {opt.bestFor}</Text>
                {/* Cost */}
                <View style={styles.costRow}>
                  <Text style={styles.costLabel}>Est. cost</Text>
                  <Text style={styles.costValue}>{opt.cost}</Text>
                </View>
                {/* Pros */}
                <View style={styles.prosList}>
                  {opt.pros.map((p, i) => (
                    <View key={i} style={styles.proRow}>
                      <Text style={styles.proCheck}>✓</Text>
                      <Text style={styles.proText}>{p}</Text>
                    </View>
                  ))}
                </View>
                {/* Watch out */}
                <View style={styles.watchCard}>
                  <Text style={styles.watchIcon}>⚠</Text>
                  <Text style={styles.watchText}>{opt.watchOut}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── 4. Getting around the city ── */}
        <View style={styles.section}>
          <SectionHeader title="Getting around Cairo" />
          <View style={styles.cityCard}>
            {CITY_TRANSPORT.map((item, i) => (
              <View key={i} style={[styles.cityRow, i < CITY_TRANSPORT.length - 1 && styles.cityRowBorder]}>
                <Text style={styles.cityIcon}>{item.icon}</Text>
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

        {/* ── 6. Before you go checklist ── */}
        <View style={styles.section}>
          <SectionHeader title="Before you go" />
          <View style={styles.checklistCard}>
            {BEFORE_YOU_GO.map((item, i) => (
              <CheckRow key={i} text={item} last={i === BEFORE_YOU_GO.length - 1} />
            ))}
          </View>
        </View>

        {/* ── Warning ── */}
        <View style={styles.warningCard}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningText}>
            Transport prices are estimated ranges only and can change significantly. Always agree on the price before starting a journey with non-app taxis.
          </Text>
        </View>

        {/* ── CTA ── */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaHelper}>
            {isReady
              ? 'Arrival & Transport is marked ready. Tap to undo.'
              : 'Mark this ready after choosing how you\'ll get from the airport and move around Egypt.'}
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
    gap: Spacing.sm,
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#14B8A6',
    opacity: 0.12,
    top: -50,
    right: -40,
  },
  heroIcon: { fontSize: 36, marginBottom: 4 },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  heroSub: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.68)',
    lineHeight: 22,
  },
  heroBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 4,
    flexWrap: 'wrap',
  },

  /* Sections */
  section: { gap: Spacing.sm },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },

  /* Bullet card */
  bulletCard: {
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadows.xs,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-start',
    paddingVertical: 11,
    paddingHorizontal: Spacing.base,
  },
  bulletRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.teal,
    marginTop: 8,
    flexShrink: 0,
  },
  bulletText: { ...Typography.body, color: Colors.textSecondary, flex: 1, lineHeight: 21 },

  /* Transfer option cards */
  optionsList: { gap: Spacing.sm },
  optionCard: {
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.cardPad,
    gap: Spacing.sm,
    ...Shadows.xs,
  },
  optionCardHighlight: {
    borderColor: Colors.teal,
    borderWidth: 1.5,
  },
  optionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  optionIcon: { fontSize: 24 },
  optionHeaderText: { flex: 1, gap: 4 },
  optionTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  recBadge: {
    backgroundColor: Colors.mint,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  recBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.tealDark },
  optionBestFor: { ...Typography.caption, color: Colors.teal, fontWeight: '600', lineHeight: 18 },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.borderLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 7,
    borderRadius: Radii.sm,
  },
  costLabel: { ...Typography.caption, color: Colors.muted },
  costValue: { ...Typography.caption, color: Colors.text, fontWeight: '600', flex: 1, textAlign: 'right' },
  prosList: { gap: 5 },
  proRow: { flexDirection: 'row', gap: 7, alignItems: 'flex-start' },
  proCheck: { fontSize: 12, color: Colors.success, marginTop: 2, flexShrink: 0 },
  proText: { ...Typography.caption, color: Colors.textSecondary, flex: 1, lineHeight: 18 },
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
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadows.xs,
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 11,
    paddingHorizontal: Spacing.base,
  },
  cityRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  cityIcon: { fontSize: 18, width: 26, textAlign: 'center', flexShrink: 0 },
  cityText: { flex: 1 },
  cityTitle: { fontSize: 13, fontWeight: '700', color: Colors.text },
  cityNote: { ...Typography.caption, color: Colors.textSecondary, lineHeight: 17, marginTop: 1 },

  /* Links */
  linksList: { gap: Spacing.sm },

  /* Checklist */
  checklistCard: {
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadows.xs,
  },
  checkRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: Spacing.base,
  },
  checkRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  checkBox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  checkMark: { fontSize: 9, color: Colors.mutedLight },
  checkText: { ...Typography.body, color: Colors.textSecondary, flex: 1, lineHeight: 21 },

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
  warningIcon: { fontSize: 18, flexShrink: 0 },
  warningText: { ...Typography.body, color: '#92400E', flex: 1, lineHeight: 22 },

  /* CTA */
  ctaSection: { gap: Spacing.sm },
  ctaHelper: {
    ...Typography.caption,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
