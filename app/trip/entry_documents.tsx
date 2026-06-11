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

const ITEM_ID = 'entry_documents';

const TRUST_META = {
  sourceType: 'official_recommended' as const,
  confidence: 'medium' as const,
  lastCheckedLabel: 'Sample data · Jun 2025',
};

/* ─── Data ───────────────────────────────────────────────────── */

const SETUP_STEPS = [
  'Check your passport validity (min. 6 months beyond return date)',
  'Confirm your visa requirement from an official source',
  'Save digital copies of key documents before you fly',
];

const KEY_THINGS = [
  'Passport validity and visa rules can vary by nationality — always check yours specifically.',
  'Some travellers may be eligible for visa on arrival or an e-Visa applied for online.',
  'Keep passport, accommodation proof, and return/onward travel details accessible at border.',
  'Always confirm entry requirements with official or embassy sources before departure.',
];

const ENTRY_OPTIONS = [
  {
    id: 'visa_on_arrival',
    icon: '✈️',
    title: 'Visa on arrival',
    bestFor: 'Eligible travellers who prefer a simple arrival process',
    cost: '~$25 USD (sample estimate — confirm before travel)',
    pros: ['No advance paperwork needed', 'Available at Cairo Airport on arrival'],
    watchOut: 'Eligibility and queue times can vary — confirm yours before travelling.',
    link: {
      id: 'egypt-visa-onArrival',
      title: 'Egypt visa on arrival info',
      description: 'General visa-on-arrival eligibility and process.',
      url: 'https://www.egyptair.com',
      sourceType: 'sample_data' as const,
      confidence: 'medium' as const,
      isExternal: true,
      isPlaceholder: true,
    },
  },
  {
    id: 'evisa',
    icon: '💻',
    title: 'Egypt e-Visa',
    bestFor: 'Travellers who prefer confirming their visa before departure',
    cost: '~$25 USD + processing (sample estimate)',
    pros: ['Skip airport visa queues', 'Confirmed before you fly'],
    watchOut: 'Apply well before your travel date. Official source recommended.',
    link: {
      id: 'egypt-evisa',
      title: 'Egypt e-Visa portal',
      description: 'Official Egyptian government e-Visa application portal.',
      url: 'https://visa2egypt.gov.eg',
      sourceType: 'official_recommended' as const,
      confidence: 'medium' as const,
      isExternal: true,
      isPlaceholder: false,
    },
  },
  {
    id: 'embassy_visa',
    icon: '🏛️',
    title: 'Embassy visa / advance application',
    bestFor: 'Nationalities not eligible for visa on arrival or e-Visa',
    cost: 'Varies by nationality — confirm with your local embassy',
    pros: ['Arranged ahead of time', 'Accepted for all eligible nationalities'],
    watchOut: 'Contact your nearest Egyptian embassy early — lead times vary.',
    link: {
      id: 'egypt-embassy',
      title: 'Egyptian embassy directory',
      description: 'Find the Egyptian embassy or consulate in your country.',
      url: 'https://www.mfa.gov.eg',
      sourceType: 'official_recommended' as const,
      confidence: 'medium' as const,
      isExternal: true,
      isPlaceholder: true,
    },
  },
];

const SOURCE_LINKS = [
  {
    id: 'egypt-evisa-official',
    title: 'Egypt e-Visa official portal',
    description: 'Apply for an Egyptian e-Visa online before your trip.',
    url: 'https://visa2egypt.gov.eg',
    sourceType: 'official_recommended' as const,
    confidence: 'medium' as const,
    isExternal: true,
    isPlaceholder: false,
  },
  {
    id: 'egypt-mfa',
    title: 'Egyptian Ministry of Foreign Affairs',
    description: 'Official embassy directory and entry requirements by nationality.',
    url: 'https://www.mfa.gov.eg',
    sourceType: 'official_recommended' as const,
    confidence: 'medium' as const,
    isExternal: true,
    isPlaceholder: true,
  },
  {
    id: 'iata-travel',
    title: 'IATA Travel Centre',
    description: 'Check passport and visa requirements by nationality.',
    url: 'https://www.iata.org/en/services/travel/travel-centre',
    sourceType: 'official_recommended' as const,
    confidence: 'high' as const,
    isExternal: true,
    isPlaceholder: false,
  },
];

const BEFORE_YOU_GO = [
  'Check your nationality-specific visa requirement.',
  'Confirm passport validity (min. 6 months beyond your return date).',
  'Save digital copies of passport, visa, and accommodation booking.',
  'Keep return/onward travel details accessible at border.',
  'Keep emergency and embassy contact details saved.',
  'Consider travel insurance covering medical and trip cancellation.',
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

export default function EntryDocumentsScreen() {
  const { trip, updateReadinessItem } = useTripStore();
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const readinessItem = trip?.readiness.items.find((i) => i.id === ITEM_ID);
  const status: ReadinessStatus = readinessItem?.status ?? 'needs_review';
  const isReady = status === 'ready';

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  };

  const handleToggleReady = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const next: ReadinessStatus = isReady ? 'needs_review' : 'ready';
    updateReadinessItem(ITEM_ID, next);
    showToast(isReady ? 'Status updated' : 'Entry & Documents marked as ready ✅');
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
          <Text style={styles.heroIcon}>🛂</Text>
          <Text style={styles.heroTitle}>Entry & Documents</Text>
          <Text style={styles.heroSub}>
            Confirm what you need to enter Egypt: passport validity, visa rules, and key travel documents.
          </Text>
          <View style={styles.heroBadges}>
            <StatusPill status={status} />
            <TrustBadge trust={TRUST_META} compact />
          </View>
        </LinearGradient>

        {/* ── 2. Recommended setup ── */}
        <View style={styles.section}>
          <SectionHeader title="Recommended for your trip" />
          <View style={styles.setupCard}>
            <View style={styles.setupHeader}>
              <View style={styles.setupIconBubble}>
                <Text style={styles.setupCheckIcon}>✓</Text>
              </View>
              <Text style={styles.setupTitle}>
                Confirm your nationality-specific visa rules, check passport validity, and keep your key travel documents ready before departure.
              </Text>
            </View>
            <View style={styles.setupDivider} />
            {SETUP_STEPS.map((step, i) => (
              <View key={i} style={styles.setupStepRow}>
                <View style={styles.setupStepNum}>
                  <Text style={styles.setupStepNumText}>{i + 1}</Text>
                </View>
                <Text style={styles.setupStepText}>{step}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── 3. Key things to know ── */}
        <View style={styles.section}>
          <SectionHeader title="What you need to know" />
          <View style={styles.bulletCard}>
            {KEY_THINGS.map((point, i) => (
              <View key={i} style={[styles.bulletRow, i < KEY_THINGS.length - 1 && styles.bulletRowBorder]}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>{point}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── 4. Entry options ── */}
        <View style={styles.section}>
          <SectionHeader title="Entry options" />
          <View style={styles.optionsList}>
            {ENTRY_OPTIONS.map((opt) => (
              <View key={opt.id} style={styles.optionCard}>
                <View style={styles.optionHeader}>
                  <Text style={styles.optionIcon}>{opt.icon}</Text>
                  <Text style={styles.optionTitle}>{opt.title}</Text>
                </View>
                <Text style={styles.optionBestFor}>Best for: {opt.bestFor}</Text>
                <View style={styles.costRow}>
                  <Text style={styles.costLabel}>Est. cost</Text>
                  <Text style={styles.costValue}>{opt.cost}</Text>
                </View>
                <View style={styles.prosList}>
                  {opt.pros.map((p, i) => (
                    <View key={i} style={styles.proRow}>
                      <Text style={styles.proCheck}>✓</Text>
                      <Text style={styles.proText}>{p}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.watchCard}>
                  <Text style={styles.watchIcon}>⚠</Text>
                  <Text style={styles.watchText}>{opt.watchOut}</Text>
                </View>
                <ExternalLinkCard link={opt.link} />
              </View>
            ))}
          </View>
        </View>

        {/* ── 5. Official links ── */}
        <View style={styles.section}>
          <SectionHeader title="Official sources" />
          <Text style={styles.linksNote}>
            Always verify before use. Confirm your specific rules with official government or embassy sources.
          </Text>
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
            Always confirm your specific entry requirements with official government sources or the Egyptian embassy before departure. This information is sample data and may not reflect current rules.
          </Text>
        </View>

        {/* ── CTA ── */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaHelper}>
            {isReady
              ? 'Entry & Documents is marked ready. Tap to undo.'
              : 'Mark this as ready after you confirm your visa requirement and passport validity.'}
          </Text>
          <AppButton
            label={isReady ? '✓ I checked this — tap to undo' : 'I checked this — mark as ready'}
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

  /* Setup card (recommended) */
  setupCard: {
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.card,
    borderWidth: 1.5,
    borderColor: Colors.teal + '30',
    padding: Spacing.cardPad,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  setupHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  setupIconBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  setupCheckIcon: { fontSize: 14, color: '#FFFFFF', fontWeight: '800' },
  setupTitle: { ...Typography.body, color: Colors.textSecondary, flex: 1, lineHeight: 22 },
  setupDivider: { height: 1, backgroundColor: Colors.border },
  setupStepRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  setupStepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  setupStepNumText: { fontSize: 11, fontWeight: '700', color: Colors.tealDark },
  setupStepText: { ...Typography.body, color: Colors.textSecondary, flex: 1, lineHeight: 22 },

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

  /* Option cards */
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
  optionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  optionIcon: { fontSize: 22 },
  optionTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, flex: 1 },
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

  /* Links */
  linksNote: { ...Typography.caption, color: Colors.mutedLight, lineHeight: 17 },
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
