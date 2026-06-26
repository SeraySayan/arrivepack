import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  StatusBar,
  Linking,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import { Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Ellipse, Polygon, Rect, Line } from 'react-native-svg';
import { router } from 'expo-router';
import * as Haptics from '../../src/utils/haptics';
import { useTripStore } from '../../src/store/tripStore';
import StatusPill from '../../src/components/ui/StatusPill';
import TrustBadge from '../../src/components/ui/TrustBadge';
import AppButton from '../../src/components/ui/AppButton';
import AppToast from '../../src/components/ui/AppToast';
import ExternalLinkCard from '../../src/components/ui/ExternalLinkCard';
import { PREPARATION_CHECKLIST } from '../../src/data/egypt';
import { Colors } from '../../src/theme/colors';
import { Typography } from '../../src/theme/typography';
import { Radii, Spacing } from '../../src/theme/spacing';
import { Shadows } from '../../src/theme/shadows';
import type { ReadinessStatus } from '../../src/types';

const ITEM_ID = 'accommodation';

const STAY_AREA_DISPLAY_NAMES: Record<string, string> = {
  zamalek: 'Zamalek',
  downtown: 'Downtown Cairo',
  garden_city: 'Garden City',
  giza: 'Giza',
  new_cairo: 'New Cairo',
};

const TRUST_META = {
  sourceType: 'sample_data' as const,
  confidence: 'medium' as const,
  lastCheckedLabel: 'Sample data',
};

/* ── Area enrichment (display layer — does not modify egypt.ts source) ── */

const AREA_META: Record<string, {
  subtitle: string;
  description: string;
  badge: string;
  badgeStyle: 'teal' | 'blue' | 'yellow' | 'green' | 'mint';
  searchLabel: string;
  searchQuery: string;
}> = {
  zamalek: {
    subtitle: 'Comfortable central Cairo area',
    description: 'An upscale area on a Nile island in central Cairo. Good for first-time travellers who want restaurants, cafes, comfortable hotels, and easier city movement.',
    badge: 'Best first-time base',
    badgeStyle: 'teal',
    searchLabel: 'Search hotels in Zamalek',
    searchQuery: 'Zamalek Cairo hotels',
  },
  downtown: {
    subtitle: 'Busy city centre',
    description: 'A busy central city area close to the Egyptian Museum. Good for budget and central access, but can feel noisy and chaotic — especially for first-time visitors.',
    badge: 'Budget central',
    badgeStyle: 'blue',
    searchLabel: 'Search hotels in Downtown Cairo',
    searchQuery: 'Downtown Cairo hotels',
  },
  giza: {
    subtitle: 'The pyramids area',
    description: 'The area near the Giza Pyramids, west of central Cairo. Good for pyramid views and early pyramid access, but less convenient for general city movement.',
    badge: 'Pyramids access',
    badgeStyle: 'yellow',
    searchLabel: 'Search stays near the Giza Pyramids',
    searchQuery: 'Giza Pyramids hotels Cairo',
  },
  new_cairo: {
    subtitle: 'Modern comfort district',
    description: 'A newer, modern district to the east of central Cairo. Good for comfort, malls, and quieter streets, but farther from historic Cairo and the pyramids.',
    badge: 'Modern & calmer',
    badgeStyle: 'green',
    searchLabel: 'Search hotels in New Cairo',
    searchQuery: 'New Cairo hotels Egypt',
  },
  garden_city: {
    subtitle: 'Quiet upscale central area',
    description: 'A quieter upscale area near the Nile in central Cairo. Good for a calmer stay with premium hotels, but dining and walking options are more limited than Zamalek.',
    badge: 'Quiet upscale',
    badgeStyle: 'mint',
    searchLabel: 'Search hotels in Garden City',
    searchQuery: 'Garden City Cairo hotels',
  },
};

const BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  teal:   { bg: Colors.teal + '20',   text: Colors.tealDark },
  blue:   { bg: Colors.skyBlue + '18', text: '#1D4ED8' },
  yellow: { bg: Colors.yellow + '25', text: '#92400E' },
  green:  { bg: Colors.success + '18', text: '#065F46' },
  mint:   { bg: Colors.mint,           text: Colors.tealDark },
};

/* ── Quick decision guide ── */

const DECISION_GUIDE = [
  { want: 'Comfort + easy first trip', area: 'Zamalek' },
  { want: 'Quiet upscale central stay', area: 'Garden City' },
  { want: 'Pyramid proximity', area: 'Giza' },
  { want: 'Modern hotels, calmer streets', area: 'New Cairo' },
  { want: 'Cheaper central access', area: 'Downtown Cairo' },
];

/* ── Stay types (screen-local, curated copy) ── */

const STAY_TYPES = [
  {
    id: 'hotel',
    icon: '🏨',
    title: 'Hotel',
    bestFor: 'Easiest for most first-timers',
    estimatedCost: '$30–200+/night',
  },
  {
    id: 'apartment',
    icon: '🏠',
    title: 'Apartment / Airbnb',
    bestFor: 'Families, groups, longer stays',
    estimatedCost: '$40–150/night',
  },
  {
    id: 'hostel',
    icon: '🛏️',
    title: 'Hostel',
    bestFor: 'Budget & solo travellers',
    estimatedCost: '$10–25/night',
  },
];

/* ── Before you book checklist (curated) ── */

const BEFORE_BOOK = [
  'Book early for Oct–Apr season',
  'Read recent reviews, not just rating',
  'Confirm the cancellation policy',
  'Ask about airport pickup',
  'Check if breakfast is included',
  'Save the address offline',
];

/* ── Recommendation logic ── */

function getRecommendation(budgetStyle: string, travelStyle: string): {
  primaryAreaId: string;
  headlineCopy: string;
  alternatives: { areaId: string; reason: string }[];
} {
  if (budgetStyle === 'premium_comfort') {
    return {
      primaryAreaId: 'zamalek',
      headlineCopy: 'Upscale Nile-island base with great dining, hotels, and easy city movement.',
      alternatives: [
        { areaId: 'garden_city', reason: 'Quieter and equally upscale — closer to the Nile.' },
        { areaId: 'giza',        reason: 'If pyramid views or early pyramid access matter most.' },
        { areaId: 'new_cairo',   reason: 'Modern comfort district — farther from historic sights.' },
        { areaId: 'downtown',    reason: 'If budget and central access matter more than quietness.' },
      ],
    };
  } else if (budgetStyle === 'balanced_experience') {
    const isFirstTime = travelStyle === 'first_time_must_sees';
    return {
      primaryAreaId: isFirstTime ? 'zamalek' : 'downtown',
      headlineCopy: isFirstTime
        ? 'A comfortable, well-connected base — without the chaos of the city centre.'
        : 'Central access, metro links, and the Egyptian Museum close by.',
      alternatives: [
        { areaId: 'downtown',    reason: 'Central and budget-friendly — good metro access.' },
        { areaId: 'garden_city', reason: 'Quieter upscale option in central Cairo.' },
        { areaId: 'giza',        reason: 'Best if pyramids are your main focus.' },
        { areaId: 'new_cairo',   reason: 'Modern comfort district — requires more travel to sights.' },
      ],
    };
  } else {
    return {
      primaryAreaId: 'downtown',
      headlineCopy: 'The most central access at the lowest price — near the museum and metro.',
      alternatives: [
        { areaId: 'giza',      reason: 'Cheaper option with direct access to the pyramids.' },
        { areaId: 'zamalek',   reason: 'More comfortable, slightly higher cost.' },
        { areaId: 'new_cairo', reason: 'Modern and quiet — but requires Uber for most sights.' },
      ],
    };
  }
}

/* ── Cairo area map ── */

const MAP_PINS = [
  { id: 'zamalek',     label: 'Zamalek',          emoji: '🌿', cx: 152, cy: 93  },
  { id: 'downtown',    label: 'Downtown',          emoji: '🏙️', cx: 212, cy: 112 },
  { id: 'garden_city', label: 'Garden City',       emoji: '🌺', cx: 198, cy: 150 },
  { id: 'giza',        label: 'Giza / Pyramids',   emoji: '🔺', cx: 80,  cy: 120 },
  { id: 'new_cairo',   label: 'New Cairo',         emoji: '🏘️', cx: 300, cy: 96  },
];

// Cairo International Airport (CAI) — Heliopolis, northeast Cairo
const AIRPORT_PIN = { label: 'Cairo Airport\n(CAI)', emoji: '✈️', cx: 258, cy: 26 };

const MAP_W = 360;
const MAP_H = 210;
const MARKER_W = 92;
const BUBBLE = 32;

/** Animated emoji marker — gentle float for all pins, radar pulse for the recommended one. */
function MapMarker({
  pin,
  isHighlight,
  index,
}: {
  pin: (typeof MAP_PINS)[number];
  isHighlight: boolean;
  index: number;
}) {
  const floatY = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, {
          toValue: 1,
          duration: 1600,
          delay: index * 220,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatY, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    float.start();

    let pulseAnim: Animated.CompositeAnimation | undefined;
    if (isHighlight) {
      pulseAnim = Animated.loop(
        Animated.timing(pulse, {
          toValue: 1,
          duration: 2200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        })
      );
      pulseAnim.start();
    }

    return () => {
      float.stop();
      pulseAnim?.stop();
    };
  }, [isHighlight, index, floatY, pulse]);

  const translateY = floatY.interpolate({ inputRange: [0, 1], outputRange: [0, -5] });
  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.7, 2.1] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.5, 0.1, 0] });

  return (
    <View
      style={[
        mapStyles.marker,
        {
          left: `${(pin.cx / MAP_W) * 100}%`,
          top: `${(pin.cy / MAP_H) * 100}%`,
        },
      ]}
      pointerEvents="none"
    >
      <Animated.View style={[mapStyles.markerInner, { transform: [{ translateY }] }]}>
        <View style={mapStyles.bubbleWrap}>
          {isHighlight && (
            <Animated.View
              style={[
                mapStyles.pulseRing,
                { transform: [{ scale: ringScale }], opacity: ringOpacity },
              ]}
            />
          )}
          <View style={[mapStyles.bubble, isHighlight && mapStyles.bubbleHighlight]}>
            <Text style={mapStyles.bubbleEmoji}>{pin.emoji}</Text>
          </View>
        </View>
        <Text style={[mapStyles.markerLabel, isHighlight && mapStyles.markerLabelHighlight]}>
          {pin.label}
        </Text>
      </Animated.View>
    </View>
  );
}

/** Static (non-animated) airport marker. */
function AirportMarker() {
  return (
    <View
      style={[
        mapStyles.marker,
        {
          left: `${(AIRPORT_PIN.cx / MAP_W) * 100}%`,
          top: `${(AIRPORT_PIN.cy / MAP_H) * 100}%`,
        },
      ]}
      pointerEvents="none"
    >
      <View style={mapStyles.markerInner}>
        <View style={mapStyles.bubbleWrap}>
          <View style={mapStyles.airportBubble}>
            <Text style={mapStyles.bubbleEmoji}>{AIRPORT_PIN.emoji}</Text>
          </View>
        </View>
        <Text style={mapStyles.airportLabel}>{AIRPORT_PIN.label}</Text>
      </View>
    </View>
  );
}

function CairoAreaMap({ highlightId }: { highlightId: string }) {
  return (
    <View style={mapStyles.container}>
      <Svg width="100%" height={MAP_H} viewBox={`0 0 ${MAP_W} ${MAP_H}`} preserveAspectRatio="xMidYMid meet">
        {/* Background */}
        <Rect x="0" y="0" width={MAP_W} height={MAP_H} fill="#0D1B2E" rx="0" />

        {/* Subtle land zones */}
        <Rect x="175" y="0" width="185" height={MAP_H} fill="#0F2A3D" opacity="0.7" />
        <Rect x="0"   y="0" width="127" height={MAP_H} fill="#0D2035" opacity="0.6" />

        {/* Subtle grid lines */}
        {[60, 100, 140, 180].map((y) => (
          <Line key={`h${y}`} x1="0" y1={y} x2={MAP_W} y2={y} stroke="#FFFFFF" strokeWidth="0.4" opacity="0.04" />
        ))}
        {[80, 130, 180, 230, 280].map((x) => (
          <Line key={`v${x}`} x1={x} y1="0" x2={x} y2={MAP_H} stroke="#FFFFFF" strokeWidth="0.4" opacity="0.04" />
        ))}

        {/* Nile river — narrow, soft, river-like */}
        <Path
          d={`M 143 0 C 141 55, 139 110, 140 ${MAP_H} L 159 ${MAP_H} C 160 110, 158 55, 156 0 Z`}
          fill="#3B82F6"
          opacity="0.28"
        />

        {/* Pyramid shapes — grouped near Giza marker (cx=80, cy=120) */}
        <Polygon points="54,192 66,170 78,192" fill="#F59E0B" opacity="0.50" />
        <Polygon points="62,192 72,174 82,192" fill="#F59E0B" opacity="0.32" />
      </Svg>

      {/* Animated area markers */}
      {MAP_PINS.map((pin, i) => (
        <MapMarker key={pin.id} pin={pin} isHighlight={pin.id === highlightId} index={i} />
      ))}

      {/* Static airport marker */}
      <AirportMarker />

      {/* Nile label — centred over the narrower river */}
      <View style={[mapStyles.contextLabel, { left: '38%', top: '6%' }]} pointerEvents="none">
        <Text style={mapStyles.nileLabelText}>Nile</Text>
      </View>

      {/* Illustrated map disclaimer */}
      <View style={mapStyles.scalePill} pointerEvents="none">
        <Text style={mapStyles.scalePillText}>Illustrated map, not to scale</Text>
      </View>
    </View>
  );
}

const mapStyles = StyleSheet.create({
  container: {
    height: MAP_H,
    borderRadius: Radii.card,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0D1B2E',
  },

  /* Animated emoji markers */
  marker: {
    position: 'absolute',
    width: MARKER_W,
    marginLeft: -MARKER_W / 2,
    marginTop: -BUBBLE / 2,
    alignItems: 'center',
  },
  markerInner: { alignItems: 'center' },
  bubbleWrap: {
    width: BUBBLE,
    height: BUBBLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: BUBBLE,
    height: BUBBLE,
    borderRadius: BUBBLE / 2,
    backgroundColor: '#14B8A6',
  },
  bubble: {
    width: BUBBLE,
    height: BUBBLE,
    borderRadius: BUBBLE / 2,
    backgroundColor: 'rgba(15,23,42,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleHighlight: {
    backgroundColor: 'rgba(20,184,166,0.30)',
    borderColor: '#2DD4BF',
    borderWidth: 1.5,
  },
  bubbleEmoji: { fontSize: 15 },
  markerLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.1,
    marginTop: 3,
    textAlign: 'center',
  },
  markerLabelHighlight: {
    color: '#2DD4BF',
    fontWeight: '700',
    fontSize: 11,
  },

  /* Airport marker */
  airportBubble: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(15,23,42,0.80)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  airportLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.50)',
    letterSpacing: 0.1,
    marginTop: 3,
    textAlign: 'center',
    lineHeight: 12,
  },

  /* Context labels */
  contextLabel: {
    position: 'absolute',
    pointerEvents: 'none',
  },
  pyramidsLabel: {
    fontSize: 9,
    fontWeight: '500',
    color: '#F59E0B',
    opacity: 0.8,
  },
  nileLabelText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#93C5FD',
    opacity: 0.7,
    letterSpacing: 0.5,
  },

  /* Illustrated map disclaimer pill */
  scalePill: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  scalePillText: {
    fontSize: 9,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 0.2,
  },
});

/* ── Small presentational components ── */

function SectionTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <View style={styles.sectionTitleRow}>
      <View style={styles.sectionAccent} />
      <Text style={styles.sectionTitle}>{title}</Text>
      {hint ? <Text style={styles.sectionHint}>{hint}</Text> : null}
    </View>
  );
}

/* ── Main screen ── */

export default function AccommodationScreen() {
  const { trip, updateReadinessItem, setStayArea } = useTripStore();
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastEmoji, setToastEmoji] = useState('✅');
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(trip?.stayArea ?? null);

  const budgetStyle = trip?.budgetStyle ?? 'balanced_experience';
  const travelStyle = trip?.travelStyle ?? 'first_time_must_sees';

  const checklistItem = PREPARATION_CHECKLIST.find((c) => c.id === ITEM_ID);
  const readinessItem = trip?.readiness.items.find((i) => i.id === ITEM_ID);
  const status: ReadinessStatus = readinessItem?.status ?? checklistItem?.status ?? 'not_set';
  const isReady = status === 'ready';

  const rec = getRecommendation(budgetStyle, travelStyle);
  const details = checklistItem?.details;

  const showToast = (msg: string, emoji = '✅') => {
    setToastMsg(msg);
    setToastEmoji(emoji);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  };

  const handleAreaSelect = (areaId: string) => {
    Haptics.selectionAsync();
    const newId = selectedAreaId === areaId ? null : areaId;
    setSelectedAreaId(newId);
    // Defer the Zustand write to the next JS frame so the current press
    // gesture can fully complete (responder release) before this Pressable
    // is re-rendered by the store update. Calling setStayArea synchronously
    // inside onPress triggers an immediate re-render that tears down the
    // active Pressable mid-gesture, which leaves the ScrollView holding a
    // phantom touch lock and silences all subsequent interactions.
    setTimeout(() => {
      setStayArea(newId as import('../../src/types').StayAreaId | null);
    }, 0);
    // In-app toast feedback — no blocking, no readiness change.
    if (newId !== null) {
      const displayName = STAY_AREA_DISPLAY_NAMES[newId] ?? newId;
      showToast(`Using ${displayName} as your planning base.`, '📍');
    } else {
      showToast('Stay area removed. Plan uses a general Cairo base.', '↩️');
    }
  };

  const handleBack = () => {
    router.back();
  };

  const markReady = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const newStatus: ReadinessStatus = isReady ? 'needs_review' : 'ready';
    updateReadinessItem(ITEM_ID, newStatus);
    showToast(isReady ? 'Status updated' : 'Accommodation marked as ready ✅');
  };

  const handleToggleReady = () => {
    // Undo path: always allowed without any alert.
    if (isReady) {
      markReady();
      return;
    }
    // Forward path without a stay area: show helpful (non-blocking) alert.
    if (!selectedAreaId) {
      Alert.alert(
        'Choose a stay area?',
        'Your itinerary works better if ArrivePack knows your Cairo base. You can also continue without choosing.',
        [
          { text: 'Choose area', style: 'cancel' },
          {
            text: 'Continue without choosing',
            style: 'default',
            onPress: markReady,
          },
        ]
      );
      return;
    }
    // Forward path with a stay area already selected (auto-saved on tap).
    markReady();
  };

  const STAY_AREAS_DISPLAY = [
    {
      id: 'zamalek',
      name: 'Zamalek',
      emoji: '🌿',
      safetyLevel: 'High',
      comfortLevel: 'High',
      distanceNote: '30–40 min to Giza Pyramids, 15 min to Egyptian Museum',
      pros: ['Upscale and safe', 'Great restaurants and cafes', 'Easy Uber access', 'Pleasant walking'],
      cons: ['Slightly pricier', 'Island location means longer travel to some sites'],
      budgetFit: ['balanced_experience', 'premium_comfort'],
    },
    {
      id: 'garden_city',
      name: 'Garden City',
      emoji: '🌺',
      safetyLevel: 'High',
      comfortLevel: 'High',
      distanceNote: '10 min to Egyptian Museum, 40 min to pyramids',
      pros: ['Quiet and leafy', 'Close to Nile', 'Premium hotels', 'Safe and central'],
      cons: ['Limited dining walking distance', 'Slightly older area feel'],
      budgetFit: ['balanced_experience', 'premium_comfort'],
    },
    {
      id: 'giza',
      name: 'Giza',
      emoji: '🔺',
      safetyLevel: 'Medium',
      comfortLevel: 'Medium',
      distanceNote: '5–15 min walk to pyramids entrance',
      pros: ['Walk to pyramids', 'Lower prices', 'More local feel'],
      cons: ['Touristy area', 'Heavier vendor pressure near pyramids'],
      budgetFit: ['smart_budget', 'balanced_experience'],
    },
    {
      id: 'new_cairo',
      name: 'New Cairo',
      emoji: '🏘️',
      safetyLevel: 'High',
      comfortLevel: 'High',
      distanceNote: '40–60 min to historic Cairo, 60 min to pyramids',
      pros: ['Modern area', 'Malls and restaurants', 'Quieter and cleaner', 'Good hotel options'],
      cons: ['Far from historic sites', 'Car/Uber dependent', 'Less authentic feel'],
      budgetFit: ['premium_comfort'],
    },
    {
      id: 'downtown',
      name: 'Downtown Cairo',
      emoji: '🏙️',
      safetyLevel: 'Medium',
      comfortLevel: 'Medium',
      distanceNote: '5 min to Egyptian Museum, 45 min to Giza Pyramids',
      pros: ['Central location', 'Close to Egyptian Museum', 'Metro access', 'Budget-friendly'],
      cons: ['Busy and noisy', 'Less walkable at night', 'Street hassle in some areas'],
      budgetFit: ['smart_budget', 'balanced_experience'],
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />

      {/* Cinematic ambient background */}
      <LinearGradient
        colors={['#EAF3F2', '#F1F5F8', '#F4F6FA']}
        locations={[0, 0.4, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 0.9 }}
        style={styles.ambientBg}
        pointerEvents="none"
      />
      <View style={styles.ambientBlob} pointerEvents="none" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Back */}
        <Pressable onPress={handleBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        {/* ── 1. Hero card ── */}
        <LinearGradient
          colors={['#0B1220', '#0F2E2B', '#0C3742']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroGlow} />
          <View style={styles.heroGlowWarm} />
          <Text style={styles.heroEyebrow}>WHERE TO STAY</Text>
          <Text style={styles.heroTitle}>Accommodation</Text>
          <Text style={styles.heroSubtitle}>
            Choose your Cairo base — we'll tune your itinerary around it.
          </Text>
          <View style={styles.heroBadges}>
            <StatusPill status={status} />
            <TrustBadge trust={TRUST_META} compact />
          </View>
        </LinearGradient>

        {/* ── 2. Best starting point intro ── */}
        <View style={styles.startCard}>
          <View style={styles.startGlow} pointerEvents="none" />
          <View style={styles.startHeader}>
            <View style={styles.startIconBubble}>
              <Text style={styles.startIconText}>🧭</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.startTitle}>Start with your Cairo base</Text>
              <Text style={styles.startSub}>Optional — but it makes your plan smarter.</Text>
            </View>
          </View>
          <View style={styles.startChips}>
            <View style={styles.startChip}>
              <Text style={styles.startChipText}>🗺️ Tunes your itinerary</Text>
            </View>
            <View style={styles.startChip}>
              <Text style={styles.startChipText}>📍 Areas, not hotels</Text>
            </View>
            <View style={styles.startChip}>
              <Text style={styles.startChipText}>✨ Skip anytime</Text>
            </View>
          </View>
        </View>

        {/* ── 4. Top recommendation ── */}
        <View style={styles.section}>
          <SectionTitle title="Best for your trip" />        
          <LinearGradient
            colors={['#0F2E2B', '#0D3340']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.recCard}
          >
            <View style={styles.recGlow} />
            <View style={styles.recTop}>
              <Text style={styles.recAreaEmoji}>
                {STAY_AREAS_DISPLAY.find((a) => a.id === rec.primaryAreaId)?.emoji ?? '🌿'}
              </Text>
              <View style={styles.recAreaText}>
                <Text style={styles.recAreaName}>
                  {STAY_AREAS_DISPLAY.find((a) => a.id === rec.primaryAreaId)?.name ?? ''}
                </Text>
                <Text style={styles.recAreaSubtitle}>
                  {AREA_META[rec.primaryAreaId]?.subtitle ?? ''}
                </Text>
              </View>
              <View style={styles.recPrimaryBadge}>
                <Text style={styles.recPrimaryBadgeText}>Top pick</Text>
              </View>
            </View>

            <Text style={styles.recCopy}>{rec.headlineCopy}</Text>

            <View style={styles.recDivider} />

            <Text style={styles.recAltTitle}>Alternatives to consider</Text>
            {rec.alternatives.map((alt) => {
              const area = STAY_AREAS_DISPLAY.find((a) => a.id === alt.areaId);
              return (
                <View key={alt.areaId} style={styles.recAltRow}>
                  <Text style={styles.recAltEmoji}>{area?.emoji}</Text>
                  <View style={styles.recAltBody}>
                    <Text style={styles.recAltName}>{area?.name}</Text>
                    <Text style={styles.recAltReason}>{alt.reason}</Text>
                  </View>
                </View>
              );
            })}
          </LinearGradient>
        </View>

        {/* ── 5. Quick decision guide ── */}
        <View style={styles.section}>
          <SectionTitle title="Quick decision guide" />
          <View style={styles.decisionCard}>
            {DECISION_GUIDE.map((row, i) => (
              <View key={i} style={[styles.decisionRow, i < DECISION_GUIDE.length - 1 && styles.decisionRowBorder]}>
                <Text style={styles.decisionWant}>Want {row.want}?</Text>
                <View style={styles.decisionArrow}>
                  <Text style={styles.decisionArrowText}>→</Text>
                </View>
                <Text style={styles.decisionArea}>{row.area}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── 6. Cairo stay area map ── */}
        <View style={styles.section}>
          <SectionTitle title="Stay area map" />
          <Text style={styles.sectionSub}>
            Central Cairo: Zamalek, Downtown & Garden City. Giza is the pyramids side; New Cairo is the modern east.
          </Text>
          <CairoAreaMap highlightId={rec.primaryAreaId} />
          <Text style={styles.mapNote}>
            Illustrated map, not to scale. For navigation, use Google Maps or a local app.
          </Text>
        </View>

        {/* ── 7. Stay areas ── */}
        <View style={styles.section}>
          <SectionTitle title="Stay areas" hint="Tap to choose" />
          <Text style={styles.sectionSub}>
            Pick the area that fits your style — planning guidance, not live pricing.
          </Text>

          <View style={styles.areaList}>
            {STAY_AREAS_DISPLAY.map((area) => {
              const meta = AREA_META[area.id];
              const isPrimary = area.id === rec.primaryAreaId;
              const isSelected = area.id === selectedAreaId;
              const badgeColors = BADGE_COLORS[meta?.badgeStyle ?? 'teal'];
              return (
                <Pressable
                  key={area.id}
                  onPress={() => handleAreaSelect(area.id)}
                  style={({ pressed }) => [
                    styles.areaCard,
                    isPrimary && styles.areaCardPrimary,
                    isSelected && styles.areaCardSelected,
                    pressed && styles.areaCardPressed,
                  ]}
                >
                  {/* Header */}
                  <View style={styles.areaHeader}>
                    <View style={[styles.areaEmojiBubble, isSelected && styles.areaEmojiBubbleSelected]}>
                      <Text style={styles.areaEmoji}>{area.emoji}</Text>
                    </View>
                    <View style={styles.areaHeaderText}>
                      <Text style={styles.areaName}>{area.name}</Text>
                      <Text style={styles.areaSubtitle}>{meta?.subtitle}</Text>
                    </View>
                    <View style={styles.areaHeaderRight}>
                      {isSelected ? (
                        <View style={styles.selectedBadge}>
                          <Check size={11} color="#0D9488" strokeWidth={3} />
                          <Text style={styles.selectedBadgeText}>Selected</Text>
                        </View>
                      ) : (
                        <View style={[styles.areaBadge, { backgroundColor: badgeColors.bg }]}>
                          <Text style={[styles.areaBadgeText, { color: badgeColors.text }]}>
                            {meta?.badge}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Meta pills */}
                  <View style={styles.areaMetaRow}>
                    <View style={styles.areaMetaPill}>
                      <Text style={styles.areaMetaPillText}>🛡 {area.safetyLevel} safety</Text>
                    </View>
                    <View style={styles.areaMetaPill}>
                      <Text style={styles.areaMetaPillText}>✨ {area.comfortLevel} comfort</Text>
                    </View>
                  </View>

                  {/* Distance */}
                  <View style={styles.areaDistanceRow}>
                    <Text style={styles.areaDistanceIcon}>📍</Text>
                    <Text style={styles.areaDistance}>{area.distanceNote}</Text>
                  </View>

                  {/* Key points — pros as chips + one caution */}
                  <View style={styles.areaChipRow}>
                    {area.pros.slice(0, 3).map((p) => (
                      <View key={p} style={styles.proChip}>
                        <Text style={styles.proChipText}>{p}</Text>
                      </View>
                    ))}
                    {area.cons[0] ? (
                      <View style={styles.conChip}>
                        <Text style={styles.conChipText}>⚠ {area.cons[0]}</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Search button — do NOT call e.stopPropagation here.
                      React Native's nested Pressable system already ensures
                      the inner Pressable wins; calling stopPropagation on a
                      GestureResponderEvent post-gesture corrupts the responder
                      chain and leaves the ScrollView holding a phantom lock. */}
                  <Pressable
                    style={[styles.searchBtn, isPrimary && styles.searchBtnPrimary, isSelected && styles.searchBtnSelected]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      const q = encodeURIComponent(meta?.searchQuery ?? area.name + ' hotels');
                      Linking.openURL(`https://www.google.com/travel/hotels?q=${q}`);
                    }}
                  >
                    <Text style={[styles.searchBtnText, isPrimary && styles.searchBtnTextPrimary, isSelected && styles.searchBtnTextSelected]}>
                      🔍 {meta?.searchLabel ?? `Search hotels in ${area.name}`}
                    </Text>
                  </Pressable>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── 8. Stay type options ── */}
        <View style={styles.section}>
          <SectionTitle title="Stay type" />
          <View style={styles.stayTypeList}>
            {STAY_TYPES.map((st) => (
              <View key={st.id} style={styles.stayTypeCard}>
                <View style={styles.stayTypeIconBubble}>
                  <Text style={styles.stayTypeIcon}>{st.icon}</Text>
                </View>
                <View style={styles.stayTypeBody}>
                  <View style={styles.stayTypeTopRow}>
                    <Text style={styles.stayTypeTitle}>{st.title}</Text>
                    <Text style={styles.stayTypeCost}>{st.estimatedCost}</Text>
                  </View>
                  <Text style={styles.stayTypeBestFor}>{st.bestFor}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── 9. Useful booking links ── */}
        {details?.sourceLinks && details.sourceLinks.length > 0 && (
          <View style={styles.section}>
            <SectionTitle title="Where to book" />
            <View style={styles.linksList}>
              {details.sourceLinks.map((link) => (
                <ExternalLinkCard key={link.id} link={link} />
              ))}
            </View>
          </View>
        )}

        {/* ── 10. Before you book ── */}
        <View style={styles.section}>
          <SectionTitle title="Before you book" />
          <View style={styles.checkGrid}>
            {BEFORE_BOOK.map((item, i) => (
              <View key={i} style={styles.checkTile}>
                <View style={styles.checkCircle}>
                  <Text style={styles.checkTick}>✓</Text>
                </View>
                <Text style={styles.checkTileText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Optional choice note ── */}
        <View style={styles.optionalNote}>
          <Text style={styles.optionalNoteIcon}>💡</Text>
          <Text style={styles.optionalNoteText}>
            Choosing an area is optional — it just personalises your itinerary. Readiness is completed by marking accommodation planned below.
          </Text>
        </View>

        {/* ── 11. Warning ── */}
        <View style={styles.warningCard}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningText}>
            Prices, availability, and policies change. Always confirm current details on the booking platform before booking.
          </Text>
        </View>

        {/* ── 12. CTA ── */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaHelper}>
            {isReady
              ? 'Accommodation is marked ready and contributes to your readiness score.'
              : "Once you've chosen your area and stay type, mark this as ready."}
          </Text>
          <AppButton
            label={isReady ? '✓ I planned my accommodation — tap to undo' : 'I planned my accommodation'}
            onPress={handleToggleReady}
            variant={isReady ? 'secondary' : 'primary'}
            fullWidth
          />
        </View>

      </ScrollView>

      <AppToast message={toastMsg} visible={toastVisible} emoji={toastEmoji} />
    </SafeAreaView>
  );
}

/* ── Styles ── */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F6FA' },
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

  /* Hero additions */
  heroEyebrow: {
    fontSize: 10.5,
    fontWeight: '700',
    color: 'rgba(45,212,191,0.9)',
    letterSpacing: 1.6,
    marginBottom: 2,
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

  /* Section title row */
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  sectionAccent: { width: 4, height: 16, borderRadius: 2, backgroundColor: Colors.teal },
  sectionHint: { ...Typography.caption, color: Colors.mutedLight, marginLeft: 'auto', fontWeight: '500' },

  /* Best starting point intro */
  startCard: {
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.cardLg,
    borderWidth: 1,
    borderColor: Colors.teal + '22',
    padding: Spacing.cardPad,
    gap: Spacing.sm,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  startGlow: {
    position: 'absolute',
    top: -50,
    right: -40,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(20,184,166,0.06)',
  },
  startHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  startIconBubble: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: Colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  startIconText: { fontSize: 18 },
  startTitle: { fontSize: 15.5, fontWeight: '700', color: Colors.text, letterSpacing: -0.2 },
  startSub: { ...Typography.caption, color: Colors.muted, marginTop: 1 },
  startChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  startChip: {
    backgroundColor: Colors.background,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  startChipText: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '600' },

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
  heroTitle: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3 },
  heroSubtitle: { ...Typography.body, color: 'rgba(255,255,255,0.68)', lineHeight: 22 },
  heroBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 4,
    flexWrap: 'wrap',
  },

  /* Context cards */
  contextRow: { gap: Spacing.sm },
  contextCard: {
    borderRadius: Radii.card,
    padding: Spacing.base,
    borderWidth: 1,
    gap: 6,
  },
  contextCardBlue: {
    backgroundColor: Colors.skyBlueLight,
    borderColor: Colors.skyBlue + '30',
  },
  contextCardGreen: {
    backgroundColor: Colors.successLight,
    borderColor: Colors.success + '25',
  },
  contextIcon: { fontSize: 20 },
  contextTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, letterSpacing: -0.1 },
  contextBody: { ...Typography.caption, color: Colors.textSecondary, lineHeight: 18 },

  /* How this works flow */
  flowCard: {
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.card,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
    ...Shadows.xs,
  },
  flowTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  flowSteps: { gap: Spacing.sm },
  flowStep: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  flowStepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  flowStepNumText: { fontSize: 12, fontWeight: '800', color: '#FFFFFF' },
  flowStepBody: { flex: 1, gap: 2 },
  flowStepLabel: { fontSize: 13, fontWeight: '700', color: Colors.text },
  flowStepSub: { ...Typography.caption, color: Colors.muted, lineHeight: 17 },

  /* Sections */
  section: { gap: Spacing.sm },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A', letterSpacing: -0.2 },
  sectionSub: { ...Typography.caption, color: Colors.muted, lineHeight: 18 },

  /* Recommendation card */
  recCard: {
    borderRadius: Radii.cardLg,
    padding: Spacing.xl,
    gap: Spacing.md,
    overflow: 'hidden',
  },
  recGlow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#14B8A6',
    opacity: 0.10,
    top: -40,
    right: -30,
  },
  recTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  recAreaEmoji: { fontSize: 30 },
  recAreaText: { flex: 1 },
  recAreaName: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.2 },
  recAreaSubtitle: { ...Typography.caption, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  recPrimaryBadge: {
    backgroundColor: Colors.teal + '30',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.teal + '50',
  },
  recPrimaryBadgeText: { fontSize: 11, fontWeight: '700', color: '#2DD4BF' },
  recCopy: { ...Typography.body, color: 'rgba(255,255,255,0.72)', lineHeight: 22 },
  recDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  recAltTitle: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.4)', letterSpacing: 0.4, textTransform: 'uppercase' },
  recAltRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  recAltEmoji: { fontSize: 16, marginTop: 1 },
  recAltBody: { flex: 1 },
  recAltName: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.75)' },
  recAltReason: { ...Typography.caption, color: 'rgba(255,255,255,0.45)', lineHeight: 17 },

  /* Quick decision */
  decisionCard: {
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadows.xs,
  },
  decisionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
  },
  decisionRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  decisionWant: { ...Typography.caption, color: Colors.textSecondary, flex: 1, lineHeight: 17 },
  decisionArrow: {
    width: 20,
    alignItems: 'center',
  },
  decisionArrowText: { fontSize: 13, color: Colors.teal, fontWeight: '700' },
  decisionArea: { fontSize: 13, fontWeight: '700', color: Colors.tealDark, minWidth: 100, textAlign: 'right' },

  /* Map */
  mapNote: { ...Typography.caption, color: Colors.mutedLight, textAlign: 'center', marginTop: 4 },

  /* Area cards */
  areaList: { gap: Spacing.md },
  areaCard: {
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.card,
    padding: Spacing.cardPad,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
    ...Shadows.xs,
  },
  areaCardPrimary: {
    borderColor: Colors.teal,
    borderWidth: 1.5,
  },
  areaCardSelected: {
    borderColor: '#0D9488',
    borderWidth: 2,
    backgroundColor: '#F0FDFA',
  },
  areaCardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.992 }],
  },
  areaHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  areaEmojiBubble: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.04)',
  },
  areaEmojiBubbleSelected: {
    backgroundColor: '#CCFBF1',
    borderColor: '#99F6E4',
  },
  areaEmoji: { fontSize: 22 },
  areaHeaderText: { flex: 1 },

  /* Area meta pills + key-point chips */
  areaMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  areaMetaPill: {
    backgroundColor: Colors.background,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  areaMetaPillText: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },
  areaChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  proChip: {
    backgroundColor: Colors.successLight,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  proChipText: { fontSize: 11, fontWeight: '600', color: Colors.tealDark },
  conChip: {
    backgroundColor: Colors.yellowLight,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  conChipText: { fontSize: 11, fontWeight: '600', color: '#92400E' },
  areaHeaderRight: { flexShrink: 0 },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#99F6E4',
  },
  selectedBadgeText: { fontSize: 11, fontWeight: '700', color: '#0D9488' },
  areaName: { fontSize: 16, fontWeight: '700', color: Colors.text },
  areaSubtitle: { ...Typography.caption, color: Colors.muted, marginTop: 2 },
  areaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: 'flex-start',
    flexShrink: 0,
  },
  areaBadgeText: { fontSize: 11, fontWeight: '700' },
  areaDescription: { ...Typography.bodySm, color: Colors.textSecondary, lineHeight: 20 },
  areaDistanceRow: { flexDirection: 'row', gap: 5, alignItems: 'flex-start' },
  areaDistanceIcon: { fontSize: 12, marginTop: 2 },
  areaDistance: { ...Typography.caption, color: Colors.mutedLight, flex: 1, lineHeight: 17 },
  prosConsRow: { flexDirection: 'row', gap: Spacing.base },
  halfCol: { flex: 1, gap: 3 },
  prosConsTitle: { ...Typography.captionBold, color: Colors.text, marginBottom: 3 },
  prosText: { ...Typography.caption, color: Colors.success, lineHeight: 18 },
  consText: { ...Typography.caption, color: Colors.warning, lineHeight: 18 },
  metaRow: { flexDirection: 'row', gap: Spacing.sm },
  metaTag: {
    backgroundColor: Colors.borderLight,
    padding: Spacing.sm,
    borderRadius: Radii.sm,
    alignItems: 'center',
    flex: 1,
  },
  metaLabel: { ...Typography.label, color: Colors.mutedLight, fontSize: 9 },
  metaValue: { ...Typography.captionBold, color: Colors.text },
  searchBtn: {
    backgroundColor: Colors.mint,
    borderRadius: Radii.full,
    paddingVertical: 10,
    paddingHorizontal: Spacing.base,
    alignItems: 'center',
  },
  searchBtnPrimary: {
    backgroundColor: Colors.teal,
  },
  searchBtnSelected: {
    backgroundColor: '#99F6E4',
  },
  searchBtnText: { ...Typography.captionBold, color: Colors.tealDark },
  searchBtnTextPrimary: { color: '#FFFFFF' },
  searchBtnTextSelected: { color: '#0D9488' },

  /* Stay types */
  stayTypeList: { gap: Spacing.sm },
  stayTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.card,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.xs,
  },
  stayTypeIconBubble: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stayTypeIcon: { fontSize: 20 },
  stayTypeBody: { flex: 1, gap: 2 },
  stayTypeTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  stayTypeTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  stayTypeCost: { fontSize: 12, fontWeight: '700', color: Colors.tealDark },
  stayTypeBestFor: { ...Typography.caption, color: Colors.teal, fontWeight: '600' },

  /* Booking links */
  linksList: { gap: Spacing.sm },

  /* Before you book — check grid */
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

  /* Optional choice note */
  optionalNote: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Colors.skyBlueLight,
    borderRadius: Radii.card,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.skyBlue + '25',
    alignItems: 'flex-start',
  },
  optionalNoteIcon: { fontSize: 15, flexShrink: 0 },
  optionalNoteText: { ...Typography.caption, color: Colors.textSecondary, flex: 1, lineHeight: 18 },

  /* Before you book */
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
  ctaHelper: { ...Typography.caption, color: Colors.muted, textAlign: 'center', lineHeight: 18 },
});
