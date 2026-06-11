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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ExternalLink } from 'lucide-react-native';
import { router } from 'expo-router';
import * as Haptics from '../../src/utils/haptics';
import { useTripStore } from '../../src/store/tripStore';
import AppButton from '../../src/components/ui/AppButton';
import AppToast from '../../src/components/ui/AppToast';
import TrustBadge from '../../src/components/ui/TrustBadge';
import { Colors } from '../../src/theme/colors';
import { Typography } from '../../src/theme/typography';
import { Radii, Spacing } from '../../src/theme/spacing';
import { Shadows } from '../../src/theme/shadows';

/* ─── Static config ────────────────────────────────────────── */

const TRUST_META = {
  sourceType: 'provider_ready' as const,
  confidence: 'high' as const,
  lastCheckedLabel: 'Sample data · Jun 2025',
};

const USAGE_PROFILES = [
  {
    label: 'Light',
    range: '3–5 GB',
    desc: 'Messaging, maps, light browsing',
    emoji: '💬',
    recommended: false,
  },
  {
    label: 'Normal',
    range: '5–10 GB',
    desc: 'Maps, messaging, social media, video calls',
    emoji: '📱',
    recommended: true,
  },
  {
    label: 'Heavy',
    range: '10 GB+',
    desc: 'Content creation, frequent calls, streaming',
    emoji: '🎬',
    recommended: false,
  },
];

interface ComparisonOption {
  id: string;
  iconEmoji: string;
  iconBg: string;
  title: string;
  badge: string;
  badgeBg: string;
  badgeColor: string;
  best: string;
  pros: string[];
  watchOuts: string[];
}

const COMPARISON: ComparisonOption[] = [
  {
    id: 'esim',
    iconEmoji: '📲',
    iconBg: '#EFF6FF',
    title: 'eSIM before travel',
    badge: 'Easiest option',
    badgeBg: '#E6FFFA',
    badgeColor: '#0F766E',
    best: 'Landing with internet already working.',
    pros: ['Buy before you fly', 'Instant activation', 'Keeps your existing number'],
    watchOuts: ['Your device must support eSIM', 'Check current plans on the provider website'],
  },
  {
    id: 'local_sim',
    iconEmoji: '🛬',
    iconBg: '#FFFBEB',
    title: 'Local SIM on arrival',
    badge: 'Good backup',
    badgeBg: '#FFFBEB',
    badgeColor: '#B45309',
    best: 'Cheaper local data after you land.',
    pros: ['Often cheaper data per GB', 'Available at airport/operator shops', 'Useful for longer trips'],
    watchOuts: ['Takes extra time at arrival', 'May require passport registration', 'Confirm pricing at the counter'],
  },
  {
    id: 'wifi',
    iconEmoji: '📶',
    iconBg: '#F1F5F9',
    title: 'Wi-Fi backup',
    badge: 'Backup only',
    badgeBg: '#F1F5F9',
    badgeColor: '#64748B',
    best: 'Hotels, cafes, and airports as secondary use.',
    pros: ['Useful backup at hotels and cafes', 'No setup cost'],
    watchOuts: ['Not reliable as your only connection', 'Not suitable for maps, transport, or emergencies'],
  },
];

const COMM_TIPS = [
  'Save your hotel address offline before departure.',
  'Keep WhatsApp ready — it\'s used by drivers, hosts, and local contacts.',
  'Download offline maps (Google Maps or Maps.me) before you fly.',
  'Do not rely only on hotel Wi-Fi.',
  'Keep emergency contacts saved and accessible without internet.',
];

interface ProviderLink {
  id: string;
  name: string;
  description: string;
  url: string;
  ctaLabel: string;
}

const ESIM_PROVIDERS: ProviderLink[] = [
  {
    id: 'airalo',
    name: 'Airalo',
    description: 'Check current Egypt eSIM plans and prices on Airalo before you travel.',
    url: 'https://www.airalo.com',
    ctaLabel: 'Open Airalo',
  },
  {
    id: 'nomad',
    name: 'Nomad',
    description: 'Check current Egypt eSIM plans and prices on Nomad before you travel.',
    url: 'https://www.getnomad.app',
    ctaLabel: 'Open Nomad',
  },
];

/* ─── ProviderLinkCard ─────────────────────────────────────── */

function ProviderLinkCard({ provider }: { provider: ProviderLink }) {
  const handleOpen = async () => {
    Haptics.selectionAsync();
    try {
      const canOpen = await Linking.canOpenURL(provider.url);
      if (canOpen) {
        await Linking.openURL(provider.url);
      } else {
        Alert.alert('Cannot open link', 'This link could not be opened on your device.');
      }
    } catch {
      Alert.alert('Error', 'Unable to open this link.');
    }
  };

  return (
    <Pressable
      onPress={handleOpen}
      style={({ pressed }) => [provStyles.card, pressed && provStyles.pressed]}
    >
      <View style={provStyles.left}>
        <Text style={provStyles.name}>{provider.name}</Text>
        <Text style={provStyles.desc}>{provider.description}</Text>
        <View style={provStyles.badges}>
          <View style={provStyles.badge}>
            <Text style={provStyles.badgeText}>External provider</Text>
          </View>
          <View style={[provStyles.badge, provStyles.badgeWarn]}>
            <Text style={[provStyles.badgeText, provStyles.badgeWarnText]}>Confirm pricing before purchase</Text>
          </View>
        </View>
      </View>
      <View style={provStyles.ctaCol}>
        <View style={provStyles.ctaBtn}>
          <ExternalLink size={13} color={Colors.teal} />
          <Text style={provStyles.ctaBtnText}>{provider.ctaLabel}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const provStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.card,
    padding: Spacing.cardPad,
    borderWidth: 1.5,
    borderColor: Colors.teal + '28',
    gap: Spacing.md,
    ...Shadows.xs,
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  left: { flex: 1, gap: 4 },
  name: { fontSize: 15, fontWeight: '700', color: Colors.text },
  desc: { ...Typography.caption, color: Colors.muted, lineHeight: 18 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 2 },
  badge: {
    backgroundColor: Colors.skyBlueLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgeText: { fontSize: 10, fontWeight: '600', color: Colors.skyBlue },
  badgeWarn: { backgroundColor: Colors.yellowLight },
  badgeWarnText: { color: Colors.warning },
  ctaCol: { flexShrink: 0 },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.mint,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.teal + '40',
  },
  ctaBtnText: { fontSize: 12, fontWeight: '700', color: Colors.tealDark },
});

/* ─── ComparisonCard — full-width stacked ──────────────────── */

function ComparisonCard({ item }: { item: ComparisonOption }) {
  return (
    <View style={cmpStyles.card}>
      {/* Header: icon bubble + title + badge */}
      <View style={cmpStyles.header}>
        <View style={[cmpStyles.iconBubble, { backgroundColor: item.iconBg }]}>
          <Text style={cmpStyles.iconEmoji}>{item.iconEmoji}</Text>
        </View>
        <View style={cmpStyles.headerText}>
          <Text style={cmpStyles.title}>{item.title}</Text>
          <View style={[cmpStyles.badge, { backgroundColor: item.badgeBg }]}>
            <Text style={[cmpStyles.badgeText, { color: item.badgeColor }]}>{item.badge}</Text>
          </View>
        </View>
      </View>

      {/* Best for */}
      <View style={cmpStyles.bestRow}>
        <Text style={cmpStyles.bestLabel}>Best for  </Text>
        <Text style={cmpStyles.bestValue}>{item.best}</Text>
      </View>

      {/* Pros */}
      <View style={cmpStyles.prosBlock}>
        {item.pros.map((p, i) => (
          <View key={i} style={cmpStyles.proRow}>
            <Text style={cmpStyles.proCheck}>✓</Text>
            <Text style={cmpStyles.proText}>{p}</Text>
          </View>
        ))}
      </View>

      {/* Watch-outs */}
      <View style={cmpStyles.watchBlock}>
        {item.watchOuts.map((w, i) => (
          <View key={i} style={cmpStyles.watchRow}>
            <Text style={cmpStyles.watchIcon}>⚠</Text>
            <Text style={cmpStyles.watchText}>{w}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const cmpStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.card,
    padding: Spacing.cardPad,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
    ...Shadows.xs,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconEmoji: { fontSize: 22 },
  headerText: { flex: 1, gap: 5 },
  title: { fontSize: 16, fontWeight: '700', color: Colors.text, letterSpacing: -0.2 },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  bestRow: { flexDirection: 'row', alignItems: 'flex-start' },
  bestLabel: { fontSize: 13, fontWeight: '700', color: Colors.teal, flexShrink: 0 },
  bestValue: { ...Typography.body, color: Colors.textSecondary, flex: 1, lineHeight: 20 },
  prosBlock: { gap: 6 },
  proRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  proCheck: { fontSize: 13, color: Colors.success, marginTop: 1, flexShrink: 0 },
  proText: { ...Typography.body, color: Colors.textSecondary, flex: 1, lineHeight: 22 },
  watchBlock: {
    gap: 6,
    backgroundColor: Colors.yellowLight,
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  watchRow: { flexDirection: 'row', gap: 7, alignItems: 'flex-start' },
  watchIcon: { fontSize: 12, color: Colors.warning, marginTop: 3, flexShrink: 0 },
  watchText: { ...Typography.caption, color: '#92400E', flex: 1, lineHeight: 18 },
});

/* ─── Main screen ───────────────────────────────────────────── */

export default function EsimScreen() {
  const { trip, updateReadinessItem } = useTripStore();
  const [toastVisible, setToastVisible] = useState(false);
  const durationDays = trip?.durationDays ?? 7;

  const isPlanned =
    trip?.readiness.items.find((i) => i.id === 'connectivity')?.status === 'ready';

  const handleMarkPlanned = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateReadinessItem('connectivity', isPlanned ? 'needs_review' : 'ready');
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Back */}
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        {/* ── 1. Header ── */}
        <LinearGradient
          colors={['#0F172A', '#0B2D40']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroGlow} />
          <Text style={styles.heroIcon}>📱</Text>
          <Text style={styles.heroTitle}>Phone & Internet</Text>
          <Text style={styles.heroSubtitle}>
            Stay connected in Egypt with eSIM, local SIM, WhatsApp, and Wi-Fi options.
          </Text>
          <TrustBadge trust={TRUST_META} compact />
        </LinearGradient>

        {/* ── 2. Best way to stay connected ── */}
        <View style={styles.recommendCard}>
          <View style={styles.recommendHeader}>
            <View style={styles.recommendIcon}>
              <Text style={styles.recommendIconText}>✓</Text>
            </View>
            <Text style={styles.recommendTitle}>Best way to stay connected</Text>
          </View>
          <Text style={styles.recommendBody}>
            For most travelers, the easiest setup is an eSIM before arrival, WhatsApp for everyday communication, and hotel Wi-Fi as backup.
          </Text>
          <View style={styles.recommendDivider} />
          {[
            { icon: '📲', label: 'eSIM', note: 'easiest before you land' },
            { icon: '🛬', label: 'Local SIM', note: 'often cheaper, takes time at arrival' },
            { icon: '📶', label: 'Wi-Fi', note: 'useful backup, not your only plan' },
            { icon: '💬', label: 'WhatsApp', note: 'messaging, calls, hosts, drivers, local contacts' },
          ].map((item, i) => (
            <View key={i} style={styles.recommendRow}>
              <Text style={styles.recommendRowIcon}>{item.icon}</Text>
              <Text style={styles.recommendRowLabel}>{item.label}:</Text>
              <Text style={styles.recommendRowNote}>{item.note}</Text>
            </View>
          ))}
        </View>

        {/* ── 3. How much data? ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How much data do you need?</Text>
          <Text style={styles.sectionSub}>Based on a {durationDays}-day Egypt trip.</Text>
          <View style={styles.usageGrid}>
            {USAGE_PROFILES.map((p) => (
              <View key={p.label} style={[styles.usageCard, p.recommended && styles.usageCardRec]}>
                <Text style={styles.usageEmoji}>{p.emoji}</Text>
                <Text style={styles.usageLabel}>{p.label}</Text>
                <Text style={styles.usageRange}>{p.range}</Text>
                <Text style={styles.usageDesc}>{p.desc}</Text>
                {p.recommended && (
                  <View style={styles.recBadge}>
                    <Text style={styles.recText}>Recommended</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* ── 4. eSIM, local SIM, or Wi-Fi? ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>eSIM, local SIM, or Wi-Fi?</Text>
          <Text style={styles.sectionSub}>Choose what fits your trip best.</Text>
          <View style={styles.comparisonStack}>
            {COMPARISON.map((item) => (
              <ComparisonCard key={item.id} item={item} />
            ))}
          </View>
        </View>

        {/* ── 5. Communication tips ── */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Communication tips</Text>
          <Text style={styles.tipsBody}>
            Mobile data is mainly useful for maps, translation, ride-hailing, WhatsApp, and emergency access.
          </Text>
          <View style={styles.tipsDivider} />
          {COMM_TIPS.map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <View style={styles.tipDot} />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>

        {/* ── 6. Provider options ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Provider options</Text>
          <Text style={styles.sectionSub}>
            Use these as external planning links. Always check current Egypt plans and prices on the provider website.
          </Text>

          {/* eSIM providers */}
          <View style={styles.providerGroup}>
            <Text style={styles.providerGroupLabel}>eSIM before travel</Text>
            <Text style={styles.providerGroupSub}>Best if you want mobile data ready before landing.</Text>
            <View style={styles.providerList}>
              {ESIM_PROVIDERS.map((p) => (
                <ProviderLinkCard key={p.id} provider={p} />
              ))}
            </View>
          </View>

          {/* Local SIM */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Text style={styles.infoIcon}>🛬</Text>
              <Text style={styles.infoTitle}>Local SIM at Cairo Airport</Text>
            </View>
            <Text style={styles.infoDesc}>Usually a good option if you prefer buying data after arrival.</Text>
            <View style={styles.infoList}>
              {[
                'Vodafone, Orange, or Etisalat may be available at arrival areas',
                'Bring your passport — may be required for registration',
                'Carry small USD or EGP cash',
                'Confirm current pricing at the counter',
                'Allow extra time at the airport',
              ].map((item, i) => (
                <View key={i} style={styles.infoRow}>
                  <View style={styles.infoDot} />
                  <Text style={styles.infoRowText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Wi-Fi backup */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Text style={styles.infoIcon}>📶</Text>
              <Text style={styles.infoTitle}>Wi-Fi backup</Text>
            </View>
            <Text style={styles.infoDesc}>Useful at hotels, cafes, or airports — not ideal as your only connection.</Text>
            <View style={styles.infoList}>
              {[
                'Hotel, café, and airport Wi-Fi available in most areas',
                'Download offline maps before travel',
                'Keep mobile data available for transport and emergencies',
              ].map((item, i) => (
                <View key={i} style={styles.infoRow}>
                  <View style={styles.infoDot} />
                  <Text style={styles.infoRowText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ── 7. CTA ── */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaHelper}>
            {isPlanned
              ? 'Phone & Internet is marked as planned and contributes to your readiness score.'
              : 'Mark this ready after choosing your main connection plan for Egypt.'}
          </Text>
          <AppButton
            label={isPlanned ? '✓ Planned — tap to undo' : 'I planned phone & internet'}
            onPress={handleMarkPlanned}
            variant={isPlanned ? 'secondary' : 'primary'}
            fullWidth
          />
        </View>

      </ScrollView>

      <AppToast
        message={isPlanned ? 'Status updated' : 'Phone & Internet planned ✅'}
        visible={toastVisible}
        emoji="📱"
      />
    </SafeAreaView>
  );
}

/* ─── Styles ─────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: {
    paddingHorizontal: Spacing.screenH,
    paddingBottom: 110,
    paddingTop: Spacing.base,
    gap: Spacing.lg,
  },

  back: { paddingVertical: Spacing.xs },
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
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#3B82F6',
    opacity: 0.1,
    top: -40,
    right: -30,
  },
  heroIcon: { fontSize: 34, marginBottom: 2 },
  heroTitle: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3 },
  heroSubtitle: { ...Typography.body, color: 'rgba(255,255,255,0.68)', lineHeight: 22 },

  /* Recommend card */
  recommendCard: {
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.cardLg,
    padding: Spacing.cardPad,
    borderWidth: 1.5,
    borderColor: Colors.teal + '30',
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  recommendHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  recommendIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendIconText: { fontSize: 14, color: '#FFFFFF', fontWeight: '800' },
  recommendTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, flex: 1 },
  recommendBody: { ...Typography.body, color: Colors.textSecondary, lineHeight: 22 },
  recommendDivider: { height: 1, backgroundColor: Colors.border },
  recommendRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  recommendRowIcon: { fontSize: 14, width: 20, flexShrink: 0 },
  recommendRowLabel: { fontSize: 13, fontWeight: '700', color: Colors.text, flexShrink: 0 },
  recommendRowNote: { ...Typography.caption, color: Colors.muted, flex: 1, lineHeight: 18 },

  /* Sections */
  section: { gap: Spacing.sm },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.text, letterSpacing: -0.2 },
  sectionSub: { ...Typography.caption, color: Colors.muted, marginTop: -4 },

  /* Usage grid */
  usageGrid: { flexDirection: 'row', gap: Spacing.sm },
  usageCard: {
    flex: 1,
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.card,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Shadows.xs,
  },
  usageCardRec: {
    borderColor: Colors.teal,
    backgroundColor: Colors.mint,
  },
  usageEmoji: { fontSize: 20 },
  usageLabel: { ...Typography.captionBold, color: Colors.text, marginTop: 2 },
  usageRange: { fontSize: 15, fontWeight: '800', color: Colors.teal, letterSpacing: -0.3 },
  usageDesc: { ...Typography.caption, color: Colors.muted, textAlign: 'center', lineHeight: 15 },
  recBadge: {
    backgroundColor: Colors.teal,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 3,
  },
  recText: { fontSize: 9, fontWeight: '700', color: '#FFFFFF' },

  /* Comparison — stacked vertical */
  comparisonStack: { gap: Spacing.sm },

  /* Tips card */
  tipsCard: {
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.card,
    padding: Spacing.cardPad,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
    ...Shadows.xs,
  },
  tipsTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  tipsBody: { ...Typography.body, color: Colors.textSecondary, lineHeight: 22 },
  tipsDivider: { height: 1, backgroundColor: Colors.border },
  tipRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.teal,
    marginTop: 8,
    flexShrink: 0,
  },
  tipText: { ...Typography.body, color: Colors.textSecondary, flex: 1, lineHeight: 22 },

  /* Provider group */
  providerGroup: { gap: Spacing.xs },
  providerGroupLabel: { fontSize: 14, fontWeight: '700', color: Colors.text },
  providerGroupSub: { ...Typography.caption, color: Colors.muted },
  providerList: { gap: Spacing.sm, marginTop: 4 },

  /* Info cards (local SIM, Wi-Fi) */
  infoCard: {
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.card,
    padding: Spacing.cardPad,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
    ...Shadows.xs,
  },
  infoHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  infoIcon: { fontSize: 20 },
  infoTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  infoDesc: { ...Typography.caption, color: Colors.muted, lineHeight: 18 },
  infoList: { gap: 6 },
  infoRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  infoDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.mutedLight,
    marginTop: 8,
    flexShrink: 0,
  },
  infoRowText: { ...Typography.caption, color: Colors.textSecondary, flex: 1, lineHeight: 18 },

  /* CTA */
  ctaSection: { gap: Spacing.sm },
  ctaHelper: { ...Typography.caption, color: Colors.muted, textAlign: 'center', lineHeight: 18 },
});
