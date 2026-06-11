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

const ITEM_ID = 'safety';

const TRUST_META = {
  sourceType: 'sample_data' as const,
  confidence: 'medium' as const,
  lastCheckedLabel: 'Sample data',
};

/* ─── Data ───────────────────────────────────────────────────── */

const SNAPSHOT_ROWS = [
  { icon: '🏛️', label: 'Tourist areas', note: 'Stay aware in busy tourist places' },
  { icon: '🚗', label: 'Transport',     note: 'Prefer official apps or arranged transfers' },
  { icon: '🛍️', label: 'Vendors',       note: 'Be polite, firm, and agree prices first' },
  { icon: '📋', label: 'Official advice', note: 'Check your government travel advisory' },
];

const FRICTION_ROWS = [
  { icon: '🗣️', text: 'Persistent vendors near major sights like the Pyramids and Khan el-Khalili' },
  { icon: '🚕', text: 'Taxi price confusion if fare is not agreed before starting the ride' },
  { icon: '🏙️', text: 'Crowded markets and busy streets, especially in central Cairo' },
  { icon: '🕌', text: 'Dress expectations at mosques and religious sites' },
  { icon: '🤝', text: 'People offering "free" help and then expecting payment' },
];

const TRANSPORT_PREFER = [
  'Uber or Careem (ride-hailing apps)',
  'Hotel-arranged transfer or tour transport',
  'Official airport taxi from designated counters',
  'Licensed tour or group transport',
];

const TRANSPORT_AVOID = [
  'Unmarked or unofficial taxis where possible',
  'Starting a ride without agreeing destination and payment',
  'Accepting unsolicited help with luggage or transport',
  'Sharing your hotel room number with strangers',
];

const ETIQUETTE_ROWS = [
  { icon: '👗', text: 'Dress modestly at mosques and religious sites — cover shoulders and knees' },
  { icon: '📸', text: 'Ask before photographing people' },
  { icon: '🚫', text: 'Avoid photographing police, military, or government buildings' },
  { icon: '🙏', text: 'Be respectful during prayer times and at religious occasions' },
  { icon: '🤲', text: 'A small nod or greeting goes a long way with locals' },
];

const SCAM_DO = [
  'Agree price before accepting any service',
  'Keep small cash separate from main wallet',
  'Say "no thank you" firmly and keep walking',
  'Use official entrances and ticket counters',
  'Ask your hotel or guide if something feels off',
];

const SCAM_AVOID = [
  '"Free" gifts or help that later becomes paid',
  'Following strangers away from tourist areas',
  'Showing large amounts of cash in public',
  'Paying before the price is clearly confirmed',
  'Letting vendor pressure rush your decision',
];

const EMERGENCY_ITEMS = [
  { icon: '🚔', text: 'Tourist Police: 126 (verify before travel)', highlight: true },
  { icon: '🏛️', text: 'Save your embassy or consulate contact for Egypt' },
  { icon: '📄', text: 'Keep a passport photo copy stored offline' },
  { icon: '🗺️', text: 'Save your hotel address in English and Arabic' },
  { icon: '💳', text: 'Keep a backup card or cash stored separately' },
  { icon: '📅', text: 'Share your itinerary with someone you trust at home' },
];

const OFFICIAL_LINKS = [
  {
    id: 'fcdo-egypt',
    title: 'UK FCDO — Egypt travel advice',
    description: 'UK government travel advice for Egypt. Check before departure.',
    url: 'https://www.gov.uk/foreign-travel-advice/egypt',
    sourceType: 'official_recommended' as const,
    confidence: 'high' as const,
    isExternal: true,
    isPlaceholder: false,
    badgeLabel: 'Official source',
  },
  {
    id: 'state-dept-egypt',
    title: 'US State Department — Egypt',
    description: 'US government travel advisory for Egypt.',
    url: 'https://travel.state.gov/content/travel/en/international-travel/International-Travel-Country-Information-Pages/Egypt.html',
    sourceType: 'official_recommended' as const,
    confidence: 'high' as const,
    isExternal: true,
    isPlaceholder: false,
    badgeLabel: 'Official source',
  },
  {
    id: 'smartraveller-egypt',
    title: 'Smartraveller — Egypt (Australia)',
    description: 'Australian government travel advice for Egypt.',
    url: 'https://www.smartraveller.gov.au/destinations/africa/egypt',
    sourceType: 'official_recommended' as const,
    confidence: 'high' as const,
    isExternal: true,
    isPlaceholder: false,
    badgeLabel: 'Official source',
  },
  {
    id: 'canada-egypt',
    title: 'Canada — Egypt travel advice',
    description: 'Government of Canada travel advice and advisories for Egypt.',
    url: 'https://travel.gc.ca/destinations/egypt',
    sourceType: 'official_recommended' as const,
    confidence: 'high' as const,
    isExternal: true,
    isPlaceholder: false,
    badgeLabel: 'Official source',
  },
];

const CHECKLIST = [
  'I checked my government\'s Egypt travel advisory',
  'I saved Tourist Police and local emergency contacts',
  'I saved my hotel address offline',
  'I saved embassy or consulate contact details',
  'I downloaded offline maps before arrival',
  'I know how I\'ll handle taxis and airport transfers',
  'I will keep backup card or cash stored separately',
  'I know not to photograph sensitive or military sites',
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

export default function SafetyScreen() {
  const { trip, updateReadinessItem } = useTripStore();
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const readinessItem = trip?.readiness.items.find((i) => i.id === ITEM_ID);
  const status: ReadinessStatus = readinessItem?.status ?? 'suggested';
  const isReady = status === 'ready';

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  };

  const handleToggleReady = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const next: ReadinessStatus = isReady ? 'suggested' : 'ready';
    updateReadinessItem(ITEM_ID, next);
    showToast(isReady ? 'Status updated' : 'Safety & Local Tips marked as ready ✅');
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
          <Text style={styles.heroIcon}>🛡️</Text>
          <Text style={styles.heroTitle}>Safety & Local Tips</Text>
          <Text style={styles.heroSub}>
            Stay aware, avoid common tourist friction, and travel more confidently in Egypt.
          </Text>
          <View style={styles.heroBadges}>
            <StatusPill status={status} />
            <TrustBadge trust={TRUST_META} compact />
          </View>
        </LinearGradient>

        {/* ── 2. Safety snapshot ── */}
        <View style={styles.section}>
          <SectionHeader title="Safety snapshot" />
          <View style={styles.snapshotCard}>
            {SNAPSHOT_ROWS.map((row, i) => (
              <View key={i} style={[styles.snapshotRow, i < SNAPSHOT_ROWS.length - 1 && styles.snapshotRowBorder]}>
                <Text style={styles.snapshotIcon}>{row.icon}</Text>
                <View style={styles.snapshotText}>
                  <Text style={styles.snapshotLabel}>{row.label}</Text>
                  <Text style={styles.snapshotNote}>{row.note}</Text>
                </View>
              </View>
            ))}
            <View style={styles.snapshotFooter}>
              <Text style={styles.snapshotFooterText}>
                Popular tourist areas often have strong tourism infrastructure, but conditions can change. Always check official advice before departure.
              </Text>
            </View>
          </View>
        </View>

        {/* ── 3. Common tourist friction ── */}
        <View style={styles.section}>
          <SectionHeader title="What may feel different" />
          <View style={styles.infoCard}>
            {FRICTION_ROWS.map((row, i) => (
              <View key={i} style={[styles.iconRow, i < FRICTION_ROWS.length - 1 && styles.iconRowBorder]}>
                <Text style={styles.iconRowEmoji}>{row.icon}</Text>
                <Text style={styles.iconRowText}>{row.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── 4. Transport safety ── */}
        <View style={styles.section}>
          <SectionHeader title="Transport safety" />
          <View style={styles.compareWrap}>
            <View style={[styles.compareCol, styles.compareColLeft]}>
              <View style={styles.compareHeader}>
                <Text style={styles.compareHeaderIcon}>✅</Text>
                <Text style={styles.compareHeaderLabel}>Prefer</Text>
              </View>
              {TRANSPORT_PREFER.map((item, i) => (
                <View key={i} style={styles.compareRow}>
                  <Text style={styles.compareCheck}>✓</Text>
                  <Text style={styles.compareItem}>{item}</Text>
                </View>
              ))}
            </View>
            <View style={styles.compareDivider} />
            <View style={[styles.compareCol, styles.compareColRight]}>
              <View style={styles.compareHeader}>
                <Text style={styles.compareHeaderIcon}>⚠️</Text>
                <Text style={styles.compareHeaderLabel}>Avoid</Text>
              </View>
              {TRANSPORT_AVOID.map((item, i) => (
                <View key={i} style={styles.compareRow}>
                  <Text style={styles.avoidX}>✗</Text>
                  <Text style={styles.compareItem}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.transportNote}>
            <Text style={styles.transportNoteIcon}>💡</Text>
            <Text style={styles.transportNoteText}>
              Before getting in, confirm the destination and payment method.
            </Text>
          </View>
        </View>

        {/* ── 5. Local etiquette & dress ── */}
        <View style={styles.section}>
          <SectionHeader title="Local etiquette" />
          <View style={styles.infoCard}>
            {ETIQUETTE_ROWS.map((row, i) => (
              <View key={i} style={[styles.iconRow, i < ETIQUETTE_ROWS.length - 1 && styles.iconRowBorder]}>
                <Text style={styles.iconRowEmoji}>{row.icon}</Text>
                <Text style={styles.iconRowText}>{row.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── 6. Scams / vendor pressure ── */}
        <View style={styles.section}>
          <SectionHeader title="Tourist scams & pressure" />
          <View style={styles.infoCard}>
            <View style={styles.doAvoidRow}>
              <View style={styles.doAvoidCol}>
                <Text style={[styles.doAvoidTitle, { color: Colors.success }]}>Do</Text>
                {SCAM_DO.map((item, i) => (
                  <View key={i} style={styles.doAvoidItem}>
                    <Text style={styles.doCheck}>✓</Text>
                    <Text style={styles.doText}>{item}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.doAvoidDivider} />
              <View style={styles.doAvoidCol}>
                <Text style={[styles.doAvoidTitle, { color: Colors.warning }]}>Avoid</Text>
                {SCAM_AVOID.map((item, i) => (
                  <View key={i} style={styles.doAvoidItem}>
                    <Text style={styles.avoidXSmall}>✗</Text>
                    <Text style={styles.avoidText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* ── 7. Emergency essentials ── */}
        <View style={styles.section}>
          <SectionHeader title="Emergency essentials" />
          <View style={styles.emergencyCard}>
            {EMERGENCY_ITEMS.map((item, i) => (
              <View
                key={i}
                style={[
                  styles.emergencyRow,
                  item.highlight && styles.emergencyRowHighlight,
                  i < EMERGENCY_ITEMS.length - 1 && styles.emergencyRowBorder,
                ]}
              >
                <Text style={styles.emergencyIcon}>{item.icon}</Text>
                <Text style={[styles.emergencyText, item.highlight && styles.emergencyTextHighlight]}>
                  {item.text}
                </Text>
              </View>
            ))}
          </View>
          <Text style={styles.emergencyNote}>
            Verify emergency numbers and contacts with official sources before departure.
          </Text>
        </View>

        {/* ── 8. Official advice links ── */}
        <View style={styles.section}>
          <SectionHeader title="Official safety sources" />
          <Text style={styles.linksNote}>
            Check the advisory from your own country before departure. Rules, regional risks, and advice can change.
          </Text>
          <View style={styles.linksList}>
            {OFFICIAL_LINKS.map((link) => (
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
            Safety conditions, local rules, and regional advice can change. This page is practical travel guidance, not live safety monitoring. Always check official government travel advice before departure and follow local authority guidance.
          </Text>
        </View>

        {/* ── 11. CTA ── */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaHelper}>
            {isReady
              ? 'Safety & Local Tips is marked ready. Tap to undo.'
              : 'Once you understand the key safety, transport, and local etiquette tips, mark this as ready.'}
          </Text>
          <AppButton
            label={isReady ? '✓ I reviewed safety & local tips — tap to undo' : 'I reviewed safety & local tips'}
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

  /* Snapshot card */
  snapshotCard: {
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.card,
    borderWidth: 1.5,
    borderColor: Colors.teal + '30',
    overflow: 'hidden',
    ...Shadows.sm,
  },
  snapshotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 12,
    paddingHorizontal: Spacing.base,
  },
  snapshotRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  snapshotIcon: { fontSize: 20, width: 26, textAlign: 'center', flexShrink: 0 },
  snapshotText: { flex: 1, gap: 2 },
  snapshotLabel: { fontSize: 13, fontWeight: '700', color: Colors.text },
  snapshotNote: { ...Typography.caption, color: Colors.textSecondary, lineHeight: 17 },
  snapshotFooter: {
    backgroundColor: Colors.mint,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  snapshotFooterText: { ...Typography.caption, color: Colors.tealDark, lineHeight: 18 },

  /* Generic info card */
  infoCard: {
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadows.xs,
  },

  /* Icon rows */
  iconRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingVertical: 12,
    paddingHorizontal: Spacing.base,
  },
  iconRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  iconRowEmoji: { fontSize: 17, width: 24, textAlign: 'center', flexShrink: 0, marginTop: 1 },
  iconRowText: { ...Typography.body, color: Colors.textSecondary, flex: 1, lineHeight: 21 },

  /* Compare (transport) */
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
  compareHeaderIcon: { fontSize: 13 },
  compareHeaderLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.1,
  },
  compareRow: { flexDirection: 'row', gap: 5, alignItems: 'flex-start' },
  compareCheck: { fontSize: 10, color: Colors.success, marginTop: 3, flexShrink: 0 },
  avoidX: { fontSize: 10, color: Colors.warning, marginTop: 3, flexShrink: 0 },
  compareItem: { ...Typography.caption, color: Colors.textSecondary, flex: 1, lineHeight: 17 },
  transportNote: {
    flexDirection: 'row',
    gap: Spacing.xs,
    backgroundColor: Colors.borderLight,
    borderRadius: Radii.sm,
    padding: Spacing.sm,
    alignItems: 'flex-start',
  },
  transportNoteIcon: { fontSize: 12, flexShrink: 0, marginTop: 1 },
  transportNoteText: { ...Typography.caption, color: Colors.muted, flex: 1, lineHeight: 17 },

  /* Do / Avoid */
  doAvoidRow: { flexDirection: 'row', padding: Spacing.md, gap: Spacing.sm },
  doAvoidCol: { flex: 1, gap: 7 },
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
  avoidXSmall: { fontSize: 10, color: Colors.warning, marginTop: 3, flexShrink: 0 },
  avoidText: { ...Typography.caption, color: Colors.textSecondary, flex: 1, lineHeight: 17 },

  /* Emergency card */
  emergencyCard: {
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadows.xs,
  },
  emergencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 12,
    paddingHorizontal: Spacing.base,
  },
  emergencyRowHighlight: {
    backgroundColor: Colors.mint,
  },
  emergencyRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  emergencyIcon: { fontSize: 17, width: 24, textAlign: 'center', flexShrink: 0 },
  emergencyText: { ...Typography.body, color: Colors.textSecondary, flex: 1, lineHeight: 21 },
  emergencyTextHighlight: { color: Colors.tealDark, fontWeight: '600' },
  emergencyNote: {
    ...Typography.caption,
    color: Colors.mutedLight,
    lineHeight: 17,
    paddingHorizontal: 2,
  },

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
