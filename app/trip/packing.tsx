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
import StatusPill from '../../src/components/ui/StatusPill';
import TrustBadge from '../../src/components/ui/TrustBadge';
import AppButton from '../../src/components/ui/AppButton';
import AppToast from '../../src/components/ui/AppToast';
import { Colors } from '../../src/theme/colors';
import { Typography } from '../../src/theme/typography';
import { Radii, Spacing } from '../../src/theme/spacing';
import { Shadows } from '../../src/theme/shadows';
import type { ReadinessStatus } from '../../src/types';

const ITEM_ID = 'packing';

const TRUST_META = {
  sourceType: 'sample_data' as const,
  confidence: 'medium' as const,
  lastCheckedLabel: 'Sample data',
};

const WEATHER_URL = 'https://www.google.com/search?q=Cairo+Egypt+weather';

/* ─── Data ───────────────────────────────────────────────────── */

const FOCUS_CHIPS = [
  { icon: '☀️', label: 'Heat & sun' },
  { icon: '🚶', label: 'Long walking days' },
  { icon: '🕌', label: 'Modest site visits' },
  { icon: '🔋', label: 'Phone & day-trip essentials' },
];

const WEATHER_ROWS = [
  { icon: '🌞', place: 'Cairo & Giza',  note: 'Usually dry, sunny, and warm to hot' },
  { icon: '🔥', place: 'Apr – Oct',     note: 'Stronger heat and sun — pack accordingly' },
  { icon: '🧥', place: 'Nov – Mar',     note: 'Milder days, cooler evenings' },
  { icon: '🌡️', place: 'Luxor / Aswan', note: 'Often hotter than Cairo' },
  { icon: '🏖️', place: 'Red Sea',       note: 'Sunny, windy, beach-ready' },
];

const MUST_PACK = [
  { icon: '☀️', item: 'High-SPF sunscreen' },
  { icon: '🧢', item: 'Hat or cap' },
  { icon: '🕶️', item: 'Sunglasses' },
  { icon: '👟', item: 'Comfortable walking shoes' },
  { icon: '👕', item: 'Breathable cotton or linen clothes' },
  { icon: '🔋', item: 'Power bank' },
  { icon: '🧣', item: 'Light scarf or cover-up' },
  { icon: '💊', item: 'Basic medication' },
];

const MODEST_KIT = [
  { icon: '🧣', item: 'Light cover-up or scarf' },
  { icon: '👕', item: 'Top with shoulders covered' },
  { icon: '👖', item: 'Trousers or skirt covering knees' },
  { icon: '👟', item: 'Easy shoes for site visits' },
];

const WALKING_KIT = [
  { icon: '🎒', item: 'Small day bag' },
  { icon: '💧', item: 'Reusable water bottle' },
  { icon: '🧻', item: 'Tissues / wet wipes' },
  { icon: '🧴', item: 'Hand sanitiser' },
  { icon: '💵', item: 'Small cash for tips and small vendors' },
];

const TECH_KIT = [
  { icon: '🔋', item: 'Power bank (fully charged)' },
  { icon: '🔌', item: 'Travel adapter (Egypt uses Type C/F)' },
  { icon: '📍', item: 'Offline maps downloaded before arrival' },
  { icon: '📱', item: 'eSIM or local SIM plan ready' },
  { icon: '🏨', item: 'Hotel address saved offline' },
];

const HEALTH_KIT = [
  { icon: '💊', item: 'Pain relief' },
  { icon: '🤧', item: 'Antihistamine' },
  { icon: '🚻', item: 'Anti-diarrhoea medicine' },
  { icon: '🩹', item: 'Plasters and blister patches' },
  { icon: '🧴', item: 'Sunscreen refill' },
];

const SKIP_ITEMS = [
  { icon: '🧥', item: 'Heavy jackets (for most Cairo-focused trips)' },
  { icon: '👞', item: 'Uncomfortable or brand-new shoes' },
  { icon: '☔', item: 'Large rain gear (dry-season trips)' },
  { icon: '👗', item: 'Too many formal outfits' },
];

const CHECKLIST = [
  'I packed breathable clothes for heat',
  'I packed sun protection (sunscreen, hat, sunglasses)',
  'I packed comfortable walking shoes',
  'I packed a modest-site cover-up or scarf',
  'I packed power bank and travel adapter',
  'I packed basic medication and health items',
  'I saved offline maps and hotel address',
  'I checked live weather before departure',
];

/* ─── Small reusable components ──────────────────────────────── */

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function ItemRow({ icon, item, last = false }: { icon: string; item: string; last?: boolean }) {
  return (
    <View style={[styles.itemRow, !last && styles.itemRowBorder]}>
      <Text style={styles.itemIcon}>{icon}</Text>
      <Text style={styles.itemText}>{item}</Text>
    </View>
  );
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

export default function PackingScreen() {
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
    showToast(isReady ? 'Status updated' : 'Packing List marked as ready ✅');
  };

  const handleWeatherPress = async () => {
    Haptics.selectionAsync();
    try {
      const supported = await Linking.canOpenURL(WEATHER_URL);
      if (supported) {
        await Linking.openURL(WEATHER_URL);
      } else {
        Alert.alert('Cannot open link', 'This link could not be opened on your device.');
      }
    } catch {
      Alert.alert('Error', 'Unable to open weather link.');
    }
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
          <Text style={styles.heroIcon}>🎒</Text>
          <Text style={styles.heroTitle}>Packing List</Text>
          <Text style={styles.heroSub}>Pack for heat, sun, walking, and modest sites.</Text>
          <View style={styles.heroBadges}>
            <StatusPill status={status} />
            <TrustBadge trust={TRUST_META} compact />
          </View>
        </LinearGradient>

        {/* ── 2. Smart packing focus ── */}
        <View style={styles.section}>
          <SectionHeader title="Your packing focus" />
          <View style={styles.focusCard}>
            <View style={styles.focusChips}>
              {FOCUS_CHIPS.map((chip, i) => (
                <View key={i} style={styles.focusChip}>
                  <Text style={styles.focusChipIcon}>{chip.icon}</Text>
                  <Text style={styles.focusChipLabel}>{chip.label}</Text>
                </View>
              ))}
            </View>
            <View style={styles.focusDivider} />
            <Text style={styles.focusNote}>
              Egypt packing is mostly about staying cool, protected, and comfortable while sightseeing.
            </Text>
          </View>
        </View>

        {/* ── 3. Seasonal weather card ── */}
        <View style={styles.section}>
          <SectionHeader title="Seasonal weather" />
          <View style={styles.weatherCard}>
            {WEATHER_ROWS.map((row, i) => (
              <View key={i} style={[styles.weatherRow, i < WEATHER_ROWS.length - 1 && styles.weatherRowBorder]}>
                <Text style={styles.weatherIcon}>{row.icon}</Text>
                <View style={styles.weatherText}>
                  <Text style={styles.weatherPlace}>{row.place}</Text>
                  <Text style={styles.weatherNote}>{row.note}</Text>
                </View>
              </View>
            ))}
            <Pressable
              onPress={handleWeatherPress}
              style={({ pressed }) => [styles.weatherLinkRow, pressed && styles.weatherLinkPressed]}
            >
              <View style={styles.weatherLinkLeft}>
                <Text style={styles.weatherLinkLabel}>Check live weather</Text>
                <Text style={styles.weatherLinkNote}>Seasonal estimate only · Confirm before packing</Text>
              </View>
              <View style={styles.weatherLinkIcon}>
                <ExternalLink size={14} color={Colors.teal} />
              </View>
            </Pressable>
          </View>
        </View>

        {/* ── 4. Must pack essentials ── */}
        <View style={styles.section}>
          <SectionHeader title="Must pack" />
          <View style={styles.itemCard}>
            {MUST_PACK.map((row, i) => (
              <ItemRow key={i} icon={row.icon} item={row.item} last={i === MUST_PACK.length - 1} />
            ))}
          </View>
        </View>

        {/* ── 5. Modest-site kit ── */}
        <View style={styles.section}>
          <SectionHeader title="For mosques & religious sites" />
          <View style={styles.itemCard}>
            {MODEST_KIT.map((row, i) => (
              <ItemRow key={i} icon={row.icon} item={row.item} last={i === MODEST_KIT.length - 1} />
            ))}
          </View>
          <Text style={styles.kitNote}>Dress rules vary by site. Check before visiting.</Text>
        </View>

        {/* ── 6. Walking & sightseeing kit ── */}
        <View style={styles.section}>
          <SectionHeader title="For long sightseeing days" />
          <View style={styles.itemCard}>
            {WALKING_KIT.map((row, i) => (
              <ItemRow key={i} icon={row.icon} item={row.item} last={i === WALKING_KIT.length - 1} />
            ))}
          </View>
          <Text style={styles.kitNote}>
            Pyramid and city days can involve heat, dust, queues, and uneven ground.
          </Text>
        </View>

        {/* ── 7. Tech essentials ── */}
        <View style={styles.section}>
          <SectionHeader title="Tech essentials" />
          <View style={styles.itemCard}>
            {TECH_KIT.map((row, i) => (
              <ItemRow key={i} icon={row.icon} item={row.item} last={i === TECH_KIT.length - 1} />
            ))}
          </View>
        </View>

        {/* ── 8. Health & comfort ── */}
        <View style={styles.section}>
          <SectionHeader title="Health & comfort" />
          <View style={styles.itemCard}>
            {HEALTH_KIT.map((row, i) => (
              <ItemRow key={i} icon={row.icon} item={row.item} last={i === HEALTH_KIT.length - 1} />
            ))}
          </View>
          <Text style={styles.kitNote}>
            Bring prescription medication in original packaging when relevant.
          </Text>
        </View>

        {/* ── 9. Probably skip ── */}
        <View style={styles.section}>
          <SectionHeader title="Probably skip" />
          <View style={styles.skipCard}>
            {SKIP_ITEMS.map((row, i) => (
              <View key={i} style={[styles.skipRow, i < SKIP_ITEMS.length - 1 && styles.skipRowBorder]}>
                <Text style={styles.skipIcon}>{row.icon}</Text>
                <Text style={styles.skipText}>{row.item}</Text>
              </View>
            ))}
            <View style={styles.skipFooter}>
              <Text style={styles.skipFooterText}>
                Adjust if your route, season, or personal plans are different.
              </Text>
            </View>
          </View>
        </View>

        {/* ── 10. Before you go checklist ── */}
        <View style={styles.section}>
          <SectionHeader title="Before you go" />
          <View style={styles.checklistCard}>
            {CHECKLIST.map((item, i) => (
              <CheckRow key={i} text={item} last={i === CHECKLIST.length - 1} />
            ))}
          </View>
        </View>

        {/* ── 11. Warning ── */}
        <View style={styles.warningCard}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningText}>
            Packing needs depend on season, route, and personal health needs. This is seasonal guidance, not live weather. Check the forecast before departure.
          </Text>
        </View>

        {/* ── 12. CTA ── */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaHelper}>
            {isReady
              ? 'Packing List is marked ready. Tap to undo.'
              : 'Once you\'ve reviewed your essentials, mark packing as ready.'}
          </Text>
          <AppButton
            label={isReady ? '✓ I checked my packing list — tap to undo' : 'I checked my packing list'}
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

  /* Focus card */
  focusCard: {
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.card,
    borderWidth: 1.5,
    borderColor: Colors.teal + '30',
    padding: Spacing.cardPad,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  focusChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  focusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.mint,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 7,
    borderRadius: Radii.full,
  },
  focusChipIcon: { fontSize: 14 },
  focusChipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.tealDark,
  },
  focusDivider: { height: 1, backgroundColor: Colors.borderLight },
  focusNote: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 21,
  },

  /* Weather card */
  weatherCard: {
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadows.xs,
  },
  weatherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 11,
    paddingHorizontal: Spacing.base,
  },
  weatherRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  weatherIcon: { fontSize: 16, width: 24, textAlign: 'center', flexShrink: 0 },
  weatherText: { flex: 1 },
  weatherPlace: { fontSize: 13, fontWeight: '700', color: Colors.text },
  weatherNote: { ...Typography.caption, color: Colors.textSecondary, lineHeight: 17, marginTop: 1 },
  weatherLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    backgroundColor: Colors.mint,
    borderTopWidth: 1,
    borderTopColor: Colors.teal + '20',
    gap: Spacing.sm,
  },
  weatherLinkPressed: { opacity: 0.75 },
  weatherLinkLeft: { flex: 1, gap: 2 },
  weatherLinkLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.tealDark,
  },
  weatherLinkNote: {
    ...Typography.caption,
    color: Colors.teal,
    lineHeight: 16,
  },
  weatherLinkIcon: {
    width: 30,
    height: 30,
    borderRadius: Radii.sm,
    backgroundColor: Colors.cardWhite,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  /* Generic item card */
  itemCard: {
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadows.xs,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 11,
    paddingHorizontal: Spacing.base,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  itemIcon: { fontSize: 18, width: 26, textAlign: 'center', flexShrink: 0 },
  itemText: { ...Typography.body, color: Colors.textSecondary, flex: 1, lineHeight: 21 },
  kitNote: {
    ...Typography.caption,
    color: Colors.muted,
    lineHeight: 17,
    paddingHorizontal: 2,
  },

  /* Skip card */
  skipCard: {
    backgroundColor: Colors.borderLight,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadows.xs,
  },
  skipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 11,
    paddingHorizontal: Spacing.base,
  },
  skipRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  skipIcon: { fontSize: 17, width: 24, textAlign: 'center', flexShrink: 0, opacity: 0.5 },
  skipText: {
    ...Typography.body,
    color: Colors.muted,
    flex: 1,
    lineHeight: 21,
    textDecorationLine: 'line-through',
  },
  skipFooter: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  skipFooterText: {
    ...Typography.caption,
    color: Colors.mutedLight,
    lineHeight: 17,
    fontStyle: 'italic',
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
