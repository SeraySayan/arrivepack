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

const ITEM_ID = 'budget';

const TRUST_META = {
  sourceType: 'estimated' as const,
  confidence: 'medium' as const,
  lastCheckedLabel: 'Estimated · Sample data',
};

/* ─── Data ───────────────────────────────────────────────────── */

const SETUP_ITEMS = [
  { icon: '💳', text: 'Main travel card (Visa or Mastercard)' },
  { icon: '💳', text: 'Backup card kept separately' },
  { icon: '💵', text: 'Egyptian Pound (EGP) cash for day-to-day' },
  { icon: '🪙', text: 'Small notes for tips and minor purchases' },
  { icon: '🔒', text: 'Emergency cash stored separately from main wallet' },
  { icon: '🏧', text: 'ATM / exchange plan ready for arrival day' },
];

const CARD_USE = [
  'Hotels and larger restaurants',
  'Malls and bigger stores',
  'Online bookings and some tour providers',
  'Ride-hailing apps (Uber, Careem) when card is enabled',
];

const CASH_USE = [
  'Tips and small services',
  'Markets and souvenir shops',
  'Small vendors and local cafes',
  'Bathrooms, luggage help, and small local services',
  'Some taxis or local minibus transport',
];

const ATM_TIPS = [
  'Prefer ATMs inside banks, malls, airports, or hotels',
  'Check the fee summary screen before confirming the withdrawal',
  'Keep your card and cash discreet after withdrawing',
  'Decline help from strangers at or near ATMs',
];

const EXCHANGE_TIPS = [
  'Use banks, licensed exchange offices, or trusted providers',
  'Airport exchange is convenient for a small arrival amount',
  'City exchange offices may offer better rates — always verify',
  'Avoid random street exchange offers',
];

const TIPPING_CONTEXTS = [
  'Hotel porter or housekeeper',
  'Tour guide or driver',
  'Restaurant service (if not included)',
  'Luggage helpers and small services',
  'Bathroom attendants',
];

const MARKET_DO = [
  'Confirm the price before accepting goods or services',
  'Confirm the currency (EGP vs USD)',
  'Keep small notes so you can pay exact amounts',
  'Walk away politely if you are unsure',
];

const MARKET_AVOID = [
  'Accepting unclear "free" offers without a price agreed',
  'Paying before the price is settled',
  'Showing large amounts of cash in public',
  'Assuming every shop expects bargaining',
];

const SAFETY_ROWS = [
  { icon: '🔒', text: 'Keep backup card separate from your main wallet' },
  { icon: '👁️', text: 'Do not show large amounts of cash in public' },
  { icon: '🧾', text: 'Count change before walking away from a transaction' },
  { icon: '📞', text: 'Save your bank card support number before travelling' },
  { icon: '❄️', text: 'Use your bank\'s card lock/freeze feature if available' },
  { icon: '💼', text: 'Keep emergency cash stored separately' },
  { icon: '❓', text: 'Ask whether card is accepted before ordering or consuming' },
];

const CHECKLIST = [
  'I have a main travel card and a backup card',
  'I checked international card usage and fees with my bank',
  'I know which situations require cash in Egypt',
  'I plan to get some EGP after arrival',
  'I will keep small notes for tips and small payments',
  'I checked current exchange rates before departure',
  'I saved my bank and card support contact details',
  'I will not rely on card-only payments in Egypt',
];

const EXTERNAL_LINKS = [
  {
    id: 'xe-egp',
    title: 'XE.com — USD to EGP',
    description: 'Check current USD to Egyptian Pound exchange rates. Confirm rates with your bank before travel.',
    url: 'https://www.xe.com/currencyconverter/convert/?Amount=1&From=USD&To=EGP',
    sourceType: 'estimated' as const,
    confidence: 'high' as const,
    isExternal: true,
    isPlaceholder: false,
    badgeLabel: 'Rate checker',
  },
  {
    id: 'wise',
    title: 'Wise',
    description: 'Travel money and international transfer tool. Check current rates and fees.',
    url: 'https://wise.com/',
    sourceType: 'estimated' as const,
    confidence: 'medium' as const,
    isExternal: true,
    isPlaceholder: false,
    badgeLabel: 'Money tool',
  },
  {
    id: 'visa-atm',
    title: 'Visa ATM locator',
    description: 'Find Visa-compatible ATMs near your location. Availability may vary.',
    url: 'https://www.visa.com/locator/atm',
    sourceType: 'provider_ready' as const,
    confidence: 'high' as const,
    isExternal: true,
    isPlaceholder: false,
    badgeLabel: 'ATM locator',
  },
  {
    id: 'mastercard-atm',
    title: 'Mastercard ATM locator',
    description: 'Find Mastercard-compatible ATMs near your location. Availability may vary.',
    url: 'https://www.mastercard.com/global/en/personal/get-support/atm-near-me.html',
    sourceType: 'provider_ready' as const,
    confidence: 'high' as const,
    isExternal: true,
    isPlaceholder: false,
    badgeLabel: 'ATM locator',
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

export default function MoneyScreen() {
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
    showToast(isReady ? 'Status updated' : 'Money & Payments marked as ready ✅');
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
          <Text style={styles.heroIcon}>💳</Text>
          <Text style={styles.heroTitle}>Money & Payments</Text>
          <Text style={styles.heroSub}>
            Prepare cash, cards, ATMs, tipping, and exchange before you arrive.
          </Text>
          <View style={styles.heroBadges}>
            <StatusPill status={status} />
            <TrustBadge trust={TRUST_META} compact />
          </View>
        </LinearGradient>

        {/* ── 2. Recommended setup ── */}
        <View style={styles.section}>
          <SectionHeader title="Recommended setup for Egypt" />
          <View style={styles.setupCard}>
            {SETUP_ITEMS.map((item, i) => (
              <View key={i} style={[styles.setupRow, i < SETUP_ITEMS.length - 1 && styles.setupRowBorder]}>
                <Text style={styles.setupIcon}>{item.icon}</Text>
                <Text style={styles.setupText}>{item.text}</Text>
              </View>
            ))}
            <View style={styles.setupNote}>
              <Text style={styles.setupNoteText}>
                Egypt is not card-only. Cards work in many hotels, malls, and larger restaurants, but cash remains important for tips, markets, local transport, and small services.
              </Text>
            </View>
          </View>
        </View>

        {/* ── 3. Cash vs card ── */}
        <View style={styles.section}>
          <SectionHeader title="Cash vs card" />
          <View style={styles.compareWrap}>
            {/* Card column */}
            <View style={[styles.compareCol, styles.compareColLeft]}>
              <View style={styles.compareHeader}>
                <Text style={styles.compareHeaderIcon}>💳</Text>
                <Text style={styles.compareHeaderLabel}>Use card for</Text>
              </View>
              {CARD_USE.map((item, i) => (
                <View key={i} style={styles.compareRow}>
                  <Text style={styles.compareCheck}>✓</Text>
                  <Text style={styles.compareItem}>{item}</Text>
                </View>
              ))}
            </View>
            {/* Divider */}
            <View style={styles.compareDivider} />
            {/* Cash column */}
            <View style={[styles.compareCol, styles.compareColRight]}>
              <View style={styles.compareHeader}>
                <Text style={styles.compareHeaderIcon}>💵</Text>
                <Text style={styles.compareHeaderLabel}>Use cash for</Text>
              </View>
              {CASH_USE.map((item, i) => (
                <View key={i} style={styles.compareRow}>
                  <Text style={styles.compareCheck}>✓</Text>
                  <Text style={styles.compareItem}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
          <Text style={styles.compareNote}>
            Payment acceptance varies by provider and area. Always ask before relying on card-only payments.
          </Text>
        </View>

        {/* ── 4. Currency basics ── */}
        <View style={styles.section}>
          <SectionHeader title="Currency basics" />
          <View style={styles.infoCard}>
            <View style={styles.currencyRow}>
              <View style={styles.currencyTag}>
                <Text style={styles.currencyCode}>EGP</Text>
                <Text style={styles.currencyName}>Egyptian Pound</Text>
              </View>
              <Text style={styles.currencyNote}>Local currency</Text>
            </View>
            <View style={styles.infoDivider} />
            <Text style={styles.infoBody}>
              Exchange rates change daily — check your bank, card provider, or a trusted exchange source before travel. Smaller notes are useful for tips, small shops, and quick payments where change may be limited.
            </Text>
            <View style={styles.infoRateNote}>
              <Text style={styles.infoRateIcon}>ℹ️</Text>
              <Text style={styles.infoRateText}>
                ArrivePack does not show live exchange rates. Use the external links below to check current rates.
              </Text>
            </View>
          </View>
        </View>

        {/* ── 5. ATM & exchange tips ── */}
        <View style={styles.section}>
          <SectionHeader title="ATM & exchange tips" />
          <View style={styles.tipsCard}>
            {/* ATM */}
            <View style={styles.tipsGroup}>
              <View style={styles.tipsGroupHeader}>
                <Text style={styles.tipsGroupIcon}>🏧</Text>
                <Text style={styles.tipsGroupTitle}>ATM tips</Text>
              </View>
              {ATM_TIPS.map((tip, i) => (
                <View key={i} style={styles.tipRow}>
                  <View style={styles.tipDot} />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
            <View style={styles.infoDivider} />
            {/* Exchange */}
            <View style={styles.tipsGroup}>
              <View style={styles.tipsGroupHeader}>
                <Text style={styles.tipsGroupIcon}>🏦</Text>
                <Text style={styles.tipsGroupTitle}>Exchange tips</Text>
              </View>
              {EXCHANGE_TIPS.map((tip, i) => (
                <View key={i} style={styles.tipRow}>
                  <View style={styles.tipDot} />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ── 6. Tipping & small cash ── */}
        <View style={styles.section}>
          <SectionHeader title="Tipping & small cash" />
          <View style={styles.infoCard}>
            <Text style={styles.infoBody}>
              Tipping (known as baksheesh) is common in many travel situations in Egypt. Keeping small EGP notes makes daily travel noticeably smoother.
            </Text>
            <View style={styles.infoDivider} />
            <Text style={styles.tipsGroupTitle}>Common situations</Text>
            <View style={styles.tipsList}>
              {TIPPING_CONTEXTS.map((ctx, i) => (
                <View key={i} style={styles.tipRow}>
                  <View style={styles.tipDot} />
                  <Text style={styles.tipText}>{ctx}</Text>
                </View>
              ))}
            </View>
            <View style={styles.infoRateNote}>
              <Text style={styles.infoRateIcon}>ℹ️</Text>
              <Text style={styles.infoRateText}>
                Tip expectations vary by situation and provider. Ask your hotel or tour provider for current guidance.
              </Text>
            </View>
          </View>
        </View>

        {/* ── 7. Markets & bargaining ── */}
        <View style={styles.section}>
          <SectionHeader title="Markets & bargaining" />
          <View style={styles.infoCard}>
            <Text style={styles.infoBody}>
              In tourist markets and souvenir shops, bargaining may be expected. Agree on the final price before accepting any product or service.
            </Text>
            <View style={styles.infoDivider} />
            <View style={styles.doAvoidRow}>
              {/* Do */}
              <View style={styles.doAvoidCol}>
                <Text style={[styles.doAvoidTitle, { color: Colors.success }]}>Do</Text>
                {MARKET_DO.map((item, i) => (
                  <View key={i} style={styles.doAvoidItem}>
                    <Text style={styles.doCheck}>✓</Text>
                    <Text style={styles.doText}>{item}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.doAvoidDivider} />
              {/* Avoid */}
              <View style={styles.doAvoidCol}>
                <Text style={[styles.doAvoidTitle, { color: Colors.warning }]}>Avoid</Text>
                {MARKET_AVOID.map((item, i) => (
                  <View key={i} style={styles.doAvoidItem}>
                    <Text style={styles.avoidX}>✗</Text>
                    <Text style={styles.avoidText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.infoDivider} />
            <Text style={styles.marketNote}>
              Fixed-price stores, malls, restaurants, and official providers do not require bargaining.
            </Text>
          </View>
        </View>

        {/* ── 8. Payment safety ── */}
        <View style={styles.section}>
          <SectionHeader title="Payment safety" />
          <View style={styles.safetyCard}>
            {SAFETY_ROWS.map((row, i) => (
              <View key={i} style={[styles.safetyRow, i < SAFETY_ROWS.length - 1 && styles.safetyRowBorder]}>
                <Text style={styles.safetyIcon}>{row.icon}</Text>
                <Text style={styles.safetyText}>{row.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── External links ── */}
        <View style={styles.section}>
          <SectionHeader title="Rate & ATM tools" />
          <Text style={styles.linksNote}>
            External platforms. Always confirm rates and fees directly with your bank or provider.
          </Text>
          <View style={styles.linksList}>
            {EXTERNAL_LINKS.map((link) => (
              <ExternalLinkCard key={link.id} link={link} />
            ))}
          </View>
        </View>

        {/* ── 9. Before you go checklist ── */}
        <View style={styles.section}>
          <SectionHeader title="Before you go" />
          <View style={styles.checklistCard}>
            {CHECKLIST.map((item, i) => (
              <CheckRow key={i} text={item} last={i === CHECKLIST.length - 1} />
            ))}
          </View>
        </View>

        {/* ── 10. Warning ── */}
        <View style={styles.warningCard}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningText}>
            Payment acceptance, exchange rates, ATM fees, and tip expectations can change. This page is estimated travel guidance, not live financial advice. Always confirm current rates and fees with your bank, card provider, exchange office, or booking platform.
          </Text>
        </View>

        {/* ── 11. CTA ── */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaHelper}>
            {isReady
              ? 'Money & Payments is marked ready. Tap to undo.'
              : 'Once you understand your cash, card, and exchange plan, mark this as ready.'}
          </Text>
          <AppButton
            label={isReady ? '✓ I reviewed money & payments — tap to undo' : 'I reviewed money & payments'}
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

  /* Setup card */
  setupCard: {
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.card,
    borderWidth: 1.5,
    borderColor: Colors.teal + '30',
    overflow: 'hidden',
    ...Shadows.sm,
  },
  setupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 12,
    paddingHorizontal: Spacing.base,
  },
  setupRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  setupIcon: { fontSize: 18, width: 24, textAlign: 'center', flexShrink: 0 },
  setupText: { ...Typography.body, color: Colors.textSecondary, flex: 1, lineHeight: 21 },
  setupNote: {
    backgroundColor: Colors.mint,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  setupNoteText: {
    ...Typography.caption,
    color: Colors.tealDark,
    lineHeight: 18,
  },

  /* Cash vs card */
  compareWrap: {
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    overflow: 'hidden',
    ...Shadows.xs,
  },
  compareCol: { flex: 1, padding: Spacing.md, gap: Spacing.xs },
  compareColLeft: { paddingRight: Spacing.sm },
  compareColRight: { paddingLeft: Spacing.sm },
  compareDivider: { width: 1, backgroundColor: Colors.borderLight },
  compareHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  compareHeaderIcon: { fontSize: 14 },
  compareHeaderLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.1,
  },
  compareRow: { flexDirection: 'row', gap: 5, alignItems: 'flex-start' },
  compareCheck: { fontSize: 10, color: Colors.teal, marginTop: 3, flexShrink: 0 },
  compareItem: { ...Typography.caption, color: Colors.textSecondary, flex: 1, lineHeight: 17 },
  compareNote: {
    ...Typography.caption,
    color: Colors.muted,
    lineHeight: 18,
    paddingHorizontal: 2,
  },

  /* Info card (currency, tipping, markets) */
  infoCard: {
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.cardPad,
    gap: Spacing.sm,
    ...Shadows.xs,
  },
  infoDivider: { height: 1, backgroundColor: Colors.borderLight },
  infoBody: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  infoRateNote: {
    flexDirection: 'row',
    gap: Spacing.xs,
    backgroundColor: Colors.borderLight,
    borderRadius: Radii.sm,
    padding: Spacing.sm,
    alignItems: 'flex-start',
  },
  infoRateIcon: { fontSize: 12, flexShrink: 0, marginTop: 1 },
  infoRateText: {
    ...Typography.caption,
    color: Colors.muted,
    flex: 1,
    lineHeight: 17,
  },

  /* Currency row */
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currencyTag: { gap: 2 },
  currencyCode: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.tealDark,
    letterSpacing: -0.3,
  },
  currencyName: {
    ...Typography.caption,
    color: Colors.muted,
  },
  currencyNote: {
    ...Typography.captionBold,
    color: Colors.teal,
    backgroundColor: Colors.mint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.full,
  },

  /* Tips card (ATM + exchange) */
  tipsCard: {
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.cardPad,
    gap: Spacing.md,
    ...Shadows.xs,
  },
  tipsGroup: { gap: Spacing.sm },
  tipsGroupHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  tipsGroupIcon: { fontSize: 16 },
  tipsGroupTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  tipsList: { gap: 6 },
  tipRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.teal,
    marginTop: 7,
    flexShrink: 0,
  },
  tipText: { ...Typography.body, color: Colors.textSecondary, flex: 1, lineHeight: 21 },

  /* Do / Avoid */
  doAvoidRow: { flexDirection: 'row', gap: Spacing.sm },
  doAvoidCol: { flex: 1, gap: 6 },
  doAvoidDivider: { width: 1, backgroundColor: Colors.borderLight },
  doAvoidTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  doAvoidItem: { flexDirection: 'row', gap: 5, alignItems: 'flex-start' },
  doCheck: { fontSize: 10, color: Colors.success, marginTop: 3, flexShrink: 0 },
  doText: { ...Typography.caption, color: Colors.textSecondary, flex: 1, lineHeight: 17 },
  avoidX: { fontSize: 10, color: Colors.warning, marginTop: 3, flexShrink: 0 },
  avoidText: { ...Typography.caption, color: Colors.textSecondary, flex: 1, lineHeight: 17 },
  marketNote: {
    ...Typography.caption,
    color: Colors.muted,
    fontStyle: 'italic',
    lineHeight: 17,
  },

  /* Safety card */
  safetyCard: {
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadows.xs,
  },
  safetyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 12,
    paddingHorizontal: Spacing.base,
  },
  safetyRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  safetyIcon: { fontSize: 16, width: 22, textAlign: 'center', flexShrink: 0 },
  safetyText: { ...Typography.body, color: Colors.textSecondary, flex: 1, lineHeight: 21 },

  /* Links */
  linksNote: {
    ...Typography.caption,
    color: Colors.mutedLight,
    lineHeight: 17,
  },
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
