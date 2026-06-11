import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  StatusBar,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from '../../src/utils/haptics';
import { useTripStore } from '../../src/store/tripStore';
import StatusPill from '../../src/components/ui/StatusPill';
import TrustBadge from '../../src/components/ui/TrustBadge';
import AppButton from '../../src/components/ui/AppButton';
import AppToast from '../../src/components/ui/AppToast';
import { Colors } from '../../src/theme/colors';
import { Typography } from '../../src/theme/typography';
import { Radii, Spacing } from '../../src/theme/spacing';
import { Shadows } from '../../src/theme/shadows';
import type { ReadinessStatus } from '../../src/types';

const ITEM_ID = 'emergency';

const TRUST_META = {
  sourceType: 'sample_data' as const,
  confidence: 'medium' as const,
  lastCheckedLabel: 'Sample data',
};

/* ─── Data ───────────────────────────────────────────────────── */

const EMERGENCY_NUMBERS = [
  { icon: '🚔', label: 'Police',         number: '122', helper: 'General emergency — verify before travel' },
  { icon: '🚑', label: 'Ambulance',      number: '123', helper: 'Medical emergency — verify before travel' },
  { icon: '🏛️', label: 'Tourist Police', number: '126', helper: 'Tourist-related help — verify before travel' },
  { icon: '🔥', label: 'Fire',           number: '180', helper: 'Fire emergency — verify before travel' },
];

const OFFLINE_ROWS = [
  { icon: '🏨', text: 'Hotel name and address in English' },
  { icon: '🗺️', text: 'Hotel address in Arabic (screenshot or note)' },
  { icon: '📄', text: 'Passport photo or document copy' },
  { icon: '🛡️', text: 'Travel insurance emergency number and policy number' },
  { icon: '🏛️', text: 'Embassy or consulate contact for your country' },
  { icon: '💳', text: 'Backup card or emergency cash plan' },
  { icon: '📍', text: 'Offline maps downloaded before arrival' },
];

const SCENARIOS = [
  {
    icon: '👜',
    title: 'Lost item or theft',
    steps: 'Contact your hotel or guide → Tourist Police (126) → Travel insurance if needed',
  },
  {
    icon: '😟',
    title: 'Feeling unsafe',
    steps: 'Move to a public or busy place → Contact hotel or local authority → Call emergency number',
  },
  {
    icon: '🏥',
    title: 'Medical help',
    steps: 'Hotel reception or local assistance → Ambulance (123) or clinic → Contact your travel insurer',
  },
];

const EMBASSY_ROWS = [
  { icon: '🌐', text: 'Save your country\'s embassy or consulate contact in Egypt' },
  { icon: '📋', text: 'Save your travel insurance emergency helpline' },
  { icon: '🔢', text: 'Keep your insurance policy number accessible offline' },
  { icon: '📞', text: 'Know who to contact for lost passport, serious incidents, or medical help' },
];

const CHECKLIST = [
  'I saved Police (122), Ambulance (123), Tourist Police (126), and Fire (180)',
  'I saved my hotel name and address offline',
  'I saved my hotel address in Arabic',
  'I saved my embassy or consulate contact for Egypt',
  'I saved my travel insurance emergency number',
  'I saved a passport photo or document copy',
  'I downloaded offline maps before departure',
  'I shared my itinerary with someone at home',
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

export default function EmergencyScreen() {
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
    showToast(isReady ? 'Status updated' : 'Emergency Info marked as ready ✅');
  };

  const handleCallPress = (number: string, label: string) => {
    Haptics.selectionAsync();
    if (Platform.OS === 'web') {
      Alert.alert(label, `Number: ${number}\n\nVerify this number with official sources before travel.`);
      return;
    }
    Alert.alert(
      label,
      `Number: ${number}\n\nAlways verify emergency numbers with official sources before travel.\n\nOpen dial pad?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open dial pad',
          onPress: () => Linking.openURL(`tel:${number}`),
        },
      ]
    );
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
          colors={['#0F172A', '#1A0F2E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroGlow} />
          <Text style={styles.heroIcon}>🆘</Text>
          <Text style={styles.heroTitle}>Emergency Info</Text>
          <Text style={styles.heroSub}>
            Save key numbers, contacts, and offline details before you travel.
          </Text>
          <View style={styles.heroBadges}>
            <StatusPill status={status} />
            <TrustBadge trust={TRUST_META} compact />
          </View>
        </LinearGradient>

        {/* ── 2. Emergency numbers ── */}
        <View style={styles.section}>
          <SectionHeader title="Emergency numbers" />
          <View style={styles.numbersGrid}>
            {EMERGENCY_NUMBERS.map((item) => (
              <Pressable
                key={item.number}
                onPress={() => handleCallPress(item.number, item.label)}
                style={({ pressed }) => [styles.numberCard, pressed && styles.numberCardPressed]}
              >
                <Text style={styles.numberCardIcon}>{item.icon}</Text>
                <Text style={styles.numberCardLabel}>{item.label}</Text>
                <Text style={styles.numberCardNumber}>{item.number}</Text>
                <Text style={styles.numberCardHelper}>{item.helper}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.numbersNote}>
            <Text style={styles.numbersNoteIcon}>ℹ️</Text>
            <Text style={styles.numbersNoteText}>
              Tap a card to open the dial pad. Always verify emergency numbers with official sources before departure.
            </Text>
          </View>
        </View>

        {/* ── 3. Save offline before you go ── */}
        <View style={styles.section}>
          <SectionHeader title="Save offline before you go" />
          <View style={styles.offlineCard}>
            {OFFLINE_ROWS.map((row, i) => (
              <View key={i} style={[styles.offlineRow, i < OFFLINE_ROWS.length - 1 && styles.offlineRowBorder]}>
                <Text style={styles.offlineIcon}>{row.icon}</Text>
                <Text style={styles.offlineText}>{row.text}</Text>
              </View>
            ))}
            <View style={styles.offlineFooter}>
              <Text style={styles.offlineFooterText}>
                In an emergency, weak internet or language barriers can make simple saved details very useful.
              </Text>
            </View>
          </View>
        </View>

        {/* ── 4. If something happens ── */}
        <View style={styles.section}>
          <SectionHeader title="If something happens" />
          <View style={styles.scenarioCard}>
            {SCENARIOS.map((s, i) => (
              <View key={i} style={[styles.scenarioRow, i < SCENARIOS.length - 1 && styles.scenarioRowBorder]}>
                <Text style={styles.scenarioIcon}>{s.icon}</Text>
                <View style={styles.scenarioText}>
                  <Text style={styles.scenarioTitle}>{s.title}</Text>
                  <Text style={styles.scenarioSteps}>{s.steps}</Text>
                </View>
              </View>
            ))}
          </View>
          <Text style={styles.scenarioNote}>
            Practical travel guidance only — not legal or medical advice.
          </Text>
        </View>

        {/* ── 5. Embassy & insurance ── */}
        <View style={styles.section}>
          <SectionHeader title="Embassy & insurance" />
          <View style={styles.infoCard}>
            {EMBASSY_ROWS.map((row, i) => (
              <View key={i} style={[styles.iconRow, i < EMBASSY_ROWS.length - 1 && styles.iconRowBorder]}>
                <Text style={styles.iconRowEmoji}>{row.icon}</Text>
                <Text style={styles.iconRowText}>{row.text}</Text>
              </View>
            ))}
            <View style={styles.infoFooter}>
              <Text style={styles.infoFooterText}>
                Your embassy may help with lost passports, serious incidents, or emergency guidance — services vary by country.
              </Text>
            </View>
          </View>
        </View>

        {/* ── 6. Hotel address in Arabic ── */}
        <View style={styles.section}>
          <SectionHeader title="Hotel address in Arabic" />
          <View style={styles.arabicCard}>
            <Text style={styles.arabicIcon}>🗺️</Text>
            <View style={styles.arabicText}>
              <Text style={styles.arabicTitle}>Ask your hotel before arrival</Text>
              <Text style={styles.arabicBody}>
                Ask your hotel for the address written in Arabic and save a screenshot. This helps with taxis, police interactions, finding your way back, and situations where internet or translation is not available.
              </Text>
            </View>
          </View>
        </View>

        {/* ── 7. Before you go checklist ── */}
        <View style={styles.section}>
          <SectionHeader title="Before you go" />
          <View style={styles.checklistCard}>
            {CHECKLIST.map((item, i) => (
              <CheckRow key={i} text={item} last={i === CHECKLIST.length - 1} />
            ))}
          </View>
        </View>

        {/* ── 8. Warning ── */}
        <View style={styles.warningCard}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningText}>
            Emergency numbers, embassy contacts, and local procedures can change. This page is sample travel guidance, not live emergency monitoring. Always verify emergency contacts with official sources before departure.
          </Text>
        </View>

        {/* ── 9. CTA ── */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaHelper}>
            {isReady
              ? 'Emergency Info is marked ready. Tap to undo.'
              : 'Once you have saved key numbers and offline details, mark this as ready.'}
          </Text>
          <AppButton
            label={isReady ? '✓ I saved my emergency info — tap to undo' : 'I saved my emergency info'}
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
    backgroundColor: '#7C3AED',
    opacity: 0.1,
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

  /* Emergency number cards */
  numbersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  numberCard: {
    width: '47.5%',
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.cardPad,
    gap: 4,
    ...Shadows.xs,
  },
  numberCardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  numberCardIcon: { fontSize: 22, marginBottom: 2 },
  numberCardLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  numberCardNumber: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.tealDark,
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  numberCardHelper: {
    ...Typography.caption,
    color: Colors.mutedLight,
    lineHeight: 16,
    marginTop: 2,
  },
  numbersNote: {
    flexDirection: 'row',
    gap: Spacing.xs,
    backgroundColor: Colors.borderLight,
    borderRadius: Radii.sm,
    padding: Spacing.sm,
    alignItems: 'flex-start',
  },
  numbersNoteIcon: { fontSize: 12, flexShrink: 0, marginTop: 1 },
  numbersNoteText: { ...Typography.caption, color: Colors.muted, flex: 1, lineHeight: 17 },

  /* Offline card */
  offlineCard: {
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.card,
    borderWidth: 1.5,
    borderColor: Colors.teal + '30',
    overflow: 'hidden',
    ...Shadows.sm,
  },
  offlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 11,
    paddingHorizontal: Spacing.base,
  },
  offlineRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  offlineIcon: { fontSize: 17, width: 24, textAlign: 'center', flexShrink: 0 },
  offlineText: { ...Typography.body, color: Colors.textSecondary, flex: 1, lineHeight: 21 },
  offlineFooter: {
    backgroundColor: Colors.mint,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  offlineFooterText: { ...Typography.caption, color: Colors.tealDark, lineHeight: 18 },

  /* Scenario card */
  scenarioCard: {
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadows.xs,
  },
  scenarioRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingVertical: 13,
    paddingHorizontal: Spacing.base,
  },
  scenarioRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  scenarioIcon: { fontSize: 18, width: 26, textAlign: 'center', flexShrink: 0, marginTop: 1 },
  scenarioText: { flex: 1, gap: 4 },
  scenarioTitle: { fontSize: 13, fontWeight: '700', color: Colors.text },
  scenarioSteps: { ...Typography.caption, color: Colors.textSecondary, lineHeight: 18 },
  scenarioNote: {
    ...Typography.caption,
    color: Colors.mutedLight,
    lineHeight: 17,
    paddingHorizontal: 2,
  },

  /* Generic info card */
  infoCard: {
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadows.xs,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingVertical: 11,
    paddingHorizontal: Spacing.base,
  },
  iconRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  iconRowEmoji: { fontSize: 16, width: 22, textAlign: 'center', flexShrink: 0, marginTop: 2 },
  iconRowText: { ...Typography.body, color: Colors.textSecondary, flex: 1, lineHeight: 21 },
  infoFooter: {
    backgroundColor: Colors.borderLight,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  infoFooterText: { ...Typography.caption, color: Colors.muted, lineHeight: 17 },

  /* Arabic address card */
  arabicCard: {
    flexDirection: 'row',
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.card,
    borderWidth: 1.5,
    borderColor: Colors.teal + '40',
    padding: Spacing.cardPad,
    gap: Spacing.sm,
    alignItems: 'flex-start',
    ...Shadows.sm,
  },
  arabicIcon: { fontSize: 24, flexShrink: 0, marginTop: 2 },
  arabicText: { flex: 1, gap: 5 },
  arabicTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  arabicBody: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 21,
  },

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
