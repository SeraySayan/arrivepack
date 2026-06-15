import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Platform, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Polygon, Rect, Line, Text as SvgText, G } from 'react-native-svg';
import { Heart } from 'lucide-react-native';
import type { Place } from '../../types';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';
import { Shadows } from '../../theme/shadows';

/**
 * TravelMemoryMap — premium illustrated Egypt memory map for the Diary screen.
 *
 * This is intentionally NOT a real navigation map. It is a stylised, playful,
 * editorial illustration of Egypt that visualises the user's trip story:
 *   - Saved   → light outlined dot
 *   - Visited → premium pin (animated drop-in)
 *   - Favorite→ gold star accent (gentle pulse)
 *
 * Markers are driven entirely by the existing diary/trip data model
 * (savedPlaces / visitedPlaces / isFavorite). Relative placement uses an
 * internal 0..1 layout config so it stays lightweight and is easy to extend
 * to future destinations.
 */

interface Props {
  savedPlaces: Place[];
  visitedPlaces: Place[];
}

/**
 * Map base: deep ocean navy-teal.
 * Keeps the same teal/Nile character of rgb(14,116,144) but roughly 3× darker
 * so white labels, pins, and the Nile shimmer all read crisply.
 */
const MAP_BG = '#0A2E3A';

/** Meandering Nile path in the 100×120 viewBox. */
const NILE_PATH = 'M50 -2 C43 14,59 24,50 40 C41 56,60 66,52 82 C45 96,55 106,50 122';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/* ── Flowing Nile (animated water shimmer) ── */
function FlowingNile() {
  const flow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(flow, {
        toValue: 1,
        duration: 2800,
        easing: Easing.linear,
        useNativeDriver: false, // SVG stroke props can't use the native driver
      })
    );
    loop.start();
    return () => loop.stop();
  }, []);
  const dashOffset = flow.interpolate({ inputRange: [0, 1], outputRange: [0, -32] });
  return (
    <>
      {/* Soft glow */}
      <Path d={NILE_PATH} stroke="#38BDF8" strokeWidth={10} opacity={0.18} fill="none" strokeLinecap="round" />
      {/* River body */}
      <Path d={NILE_PATH} stroke="#BAE6FD" strokeWidth={3.8} opacity={0.95} fill="none" strokeLinecap="round" />
      {/* Flowing shimmer */}
      <AnimatedPath
        d={NILE_PATH}
        stroke="#FFFFFF"
        strokeWidth={1.6}
        opacity={0.85}
        fill="none"
        strokeLinecap="round"
        strokeDasharray="5 11"
        strokeDashoffset={dashOffset}
      />
    </>
  );
}

/* ── Internal layout config (Egypt MVP) ──────────────────────────
 * x: 0 (left) → 1 (right), y: 0 (north/top) → 1 (south/bottom).
 * Greater-Cairo places cluster in the north, which is geographically
 * correct for the current Egypt trip. */
const PLACE_LAYOUT: Record<string, { x: number; y: number }> = {
  place_zamalek:          { x: 0.46, y: 0.15 },
  place_egyptian_museum:  { x: 0.54, y: 0.18 },
  place_nile_corniche:    { x: 0.45, y: 0.22 },
  place_khan_el_khalili:  { x: 0.64, y: 0.20 },
  place_al_azhar:         { x: 0.65, y: 0.245 },
  place_pyramids:         { x: 0.29, y: 0.225 },
  place_sphinx:           { x: 0.35, y: 0.26 },
  place_gec:              { x: 0.26, y: 0.285 },
  place_citadel:          { x: 0.58, y: 0.30 },
  place_coptic_cairo:     { x: 0.50, y: 0.315 },
};

/* Fallback bounding box for any future place without a curated position. */
const EGYPT_BBOX = { minLat: 22, maxLat: 31.6, minLng: 25, maxLng: 36 };

function resolvePosition(place: Place): { x: number; y: number } {
  const curated = PLACE_LAYOUT[place.id];
  if (curated) return curated;
  if (place.coordinates) {
    const { latitude, longitude } = place.coordinates;
    const x = (longitude - EGYPT_BBOX.minLng) / (EGYPT_BBOX.maxLng - EGYPT_BBOX.minLng);
    const y = (EGYPT_BBOX.maxLat - latitude) / (EGYPT_BBOX.maxLat - EGYPT_BBOX.minLat);
    return { x: Math.min(0.92, Math.max(0.08, x)), y: Math.min(0.95, Math.max(0.05, y)) };
  }
  return { x: 0.5, y: 0.5 };
}

const MAP_VIEW_W = 100;
const MAP_VIEW_H = 120;

function toMapX(ratio: number) {
  return ratio * MAP_VIEW_W;
}

function toMapY(ratio: number) {
  return ratio * MAP_VIEW_H;
}

const MAP_FONT = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
});

/** Pin geometry — must match MapMarker styles for label alignment. */
const PIN_WIDTH_PX = 20;
const VISITED_PIN_HEIGHT_PX = 22;
const SAVED_DOT_SIZE_PX = 12;
const LABEL_GAP_PX = 2;
const PILL_HEIGHT_VB = 5.9;

/** Label centre in viewBox coords, anchored to the same geo point as the pin tip. */
function labelCenterFromGeo(
  geoX: number,
  geoY: number,
  mapHeight: number,
  visited: boolean,
): { x: number; y: number } {
  if (mapHeight <= 0) {
    return { x: toMapX(geoX), y: toMapY(geoY) + 5 };
  }
  const belowMarkerPx = visited
    ? LABEL_GAP_PX
    : SAVED_DOT_SIZE_PX / 2 + LABEL_GAP_PX;
  const belowMarkerVb = (belowMarkerPx / mapHeight) * MAP_VIEW_H;
  return {
    x: toMapX(geoX),
    y: toMapY(geoY) + belowMarkerVb + PILL_HEIGHT_VB / 2,
  };
}

function estimatePillWidth(text: string, fontSize: number, padH: number, maxWidth = 30): number {
  return Math.min(text.length * (fontSize * 0.56) + padH * 2, maxWidth);
}

/* ── Subtle region caption (plain map text — no pill) ── */
function RegionCaption({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <SvgText
      x={x}
      y={y}
      textAnchor="middle"
      fontSize={4.2}
      fontWeight="600"
      fontFamily={MAP_FONT}
      fill="#FFFFFF"
      fillOpacity={0.36}
    >
      {label.toUpperCase()}
    </SvgText>
  );
}

/* ── Premium pill label for saved / visited places ── */
function PlaceLabelPill({
  x,
  y,
  text,
  visited,
  wide = false,
}: {
  x: number;
  y: number;
  text: string;
  visited: boolean;
  wide?: boolean;
}) {
  const fontSize = 3.5;
  const padH = 2.2;
  const padV = 1.2;
  const width = estimatePillWidth(text, fontSize, padH, wide ? 46 : 30);
  const height = fontSize + padV * 2;

  const pillX = x - width / 2;
  const pillY = y - height / 2;
  const textX = x;

  return (
    <G>
      <Rect
        x={pillX}
        y={pillY}
        width={width}
        height={height}
        rx={height / 2}
        fill={visited ? '#0C3D4A' : '#051820'}
        fillOpacity={visited ? 0.94 : 0.82}
      />
      {visited && (
        <Rect
          x={pillX}
          y={pillY}
          width={width}
          height={height}
          rx={height / 2}
          fill="none"
          stroke="#2DD4BF"
          strokeWidth={0.3}
          strokeOpacity={0.45}
        />
      )}
      <SvgText
        x={textX}
        y={pillY + height / 2 + fontSize * 0.36}
        textAnchor="middle"
        fontSize={fontSize}
        fontWeight={visited ? 'bold' : 'normal'}
        fontFamily={MAP_FONT}
        fill="#FFFFFF"
        fillOpacity={visited ? 1 : 0.9}
      >
        {text}
      </SvgText>
    </G>
  );
}
/* Region anchor labels — positioned in open map space, away from pin clusters. */
const REGIONS: { id: string; label: string; x: number; y: number }[] = [
  { id: 'cairo', label: 'Cairo', x: 0.72, y: 0.10 },
  { id: 'giza', label: 'Giza', x: 0.12, y: 0.16 },
  { id: 'luxor', label: 'Luxor', x: 0.72, y: 0.55 },
  { id: 'aswan', label: 'Aswan', x: 0.55, y: 0.725 },
  { id: 'abu_simbel', label: 'Abu Simbel', x: 0.40, y: 0.90 },
];

interface MarkerState {
  id: string;
  name: string;
  x: number;
  y: number;
  visited: boolean;
  favorite: boolean;
}

/* ── All map text in one SVG overlay (native-safe) ── */
function MapTextOverlay({
  markers,
  mapHeight,
  selectedMarkerId,
}: {
  markers: MarkerState[];
  mapHeight: number;
  selectedMarkerId: string | null;
}) {
  const selected = markers.find((m) => m.id === selectedMarkerId);

  return (
    <Svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${MAP_VIEW_W} ${MAP_VIEW_H}`}
      preserveAspectRatio="none"
      pointerEvents="none"
    >
      {REGIONS.map((r) => (
        <RegionCaption
          key={r.id}
          x={toMapX(r.x)}
          y={toMapY(r.y)}
          label={r.label}
        />
      ))}

      {selected && (() => {
        const { x, y } = labelCenterFromGeo(selected.x, selected.y, mapHeight, selected.visited);
        return (
          <PlaceLabelPill
            key={`label-${selected.id}`}
            x={x}
            y={y}
            text={selected.name}
            visited={selected.visited}
            wide
          />
        );
      })()}
    </Svg>
  );
}

function buildMarkers(savedPlaces: Place[], visitedPlaces: Place[]): MarkerState[] {
  const byId = new Map<string, MarkerState>();

  const upsert = (place: Place, opts: { visited?: boolean; favorite?: boolean }) => {
    const pos = resolvePosition(place);
    const existing = byId.get(place.id);
    if (existing) {
      existing.visited = existing.visited || !!opts.visited;
      existing.favorite = existing.favorite || !!opts.favorite;
      return;
    }
    byId.set(place.id, {
      id: place.id,
      name: place.name,
      x: pos.x,
      y: pos.y,
      visited: !!opts.visited,
      favorite: !!opts.favorite,
    });
  };

  savedPlaces.forEach((p) => upsert(p, { visited: p.isVisited, favorite: p.isFavorite }));
  visitedPlaces.forEach((p) => upsert(p, { visited: true, favorite: p.isFavorite }));

  return Array.from(byId.values());
}

/* ── Gold star accent (gentle pulse) ── */
function FavoriteAccent() {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.22] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });
  return (
    <Animated.View style={[styles.favAccent, { opacity, transform: [{ scale }] }]}>
      <Heart size={12} color="#F43F5E" fill="#F43F5E" strokeWidth={1} />
    </Animated.View>
  );
}

/* ── Single marker (saved dot or visited pin) ── */
function MapMarker({
  marker,
  mapWidth,
  mapHeight,
  onPress,
}: {
  marker: MarkerState;
  mapWidth: number;
  mapHeight: number;
  onPress: (id: string) => void;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (marker.visited) {
      Animated.spring(anim, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(anim, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [marker.visited]);

  if (mapWidth <= 0 || mapHeight <= 0) return null;

  const px = marker.x * mapWidth;
  const py = marker.y * mapHeight;
  const left = marker.visited ? px - PIN_WIDTH_PX / 2 : px - SAVED_DOT_SIZE_PX / 2;
  const top = marker.visited ? py - VISITED_PIN_HEIGHT_PX : py - SAVED_DOT_SIZE_PX / 2;

  const hitW = marker.visited ? PIN_WIDTH_PX : SAVED_DOT_SIZE_PX;
  const hitH = marker.visited ? VISITED_PIN_HEIGHT_PX : SAVED_DOT_SIZE_PX;

  const opacity = anim;
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [marker.visited ? -14 : -4, 0] });
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [marker.visited ? 0.55 : 0.8, 1] });

  return (
    <Pressable
      onPress={() => onPress(marker.id)}
      style={[styles.markerAnchor, { left, top, width: hitW, height: hitH }]}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={marker.name}
    >
      <Animated.View style={{ opacity, transform: [{ translateY }, { scale }], alignItems: 'center' }}>
        {marker.visited ? (
          <>
            <View style={styles.pin}>
              <View style={styles.pinInner} />
              {marker.favorite && <FavoriteAccent />}
            </View>
            <View style={styles.pinTail} />
          </>
        ) : (
          <View style={styles.savedDot}>
            {marker.favorite && <FavoriteAccent />}
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

export default function TravelMemoryMap({ savedPlaces, visitedPlaces }: Props) {
  const markers = buildMarkers(savedPlaces, visitedPlaces);
  const hasMarkers = markers.length > 0;
  const [mapSize, setMapSize] = useState({ width: 0, height: 0 });
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedMarkerId && !markers.some((m) => m.id === selectedMarkerId)) {
      setSelectedMarkerId(null);
    }
  }, [markers, selectedMarkerId]);

  const handleMarkerPress = (id: string) => {
    setSelectedMarkerId((prev) => (prev === id ? null : id));
  };

  return (
    <LinearGradient
      colors={['#0C2433', '#0A2E3A', '#0A3440']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Your Egypt map</Text>
          <Text style={styles.subtitle}>Your trip story, one pin at a time</Text>
        </View>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={styles.legendDot} />
            <Text style={styles.legendText}>Saved</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={styles.legendPin} />
            <Text style={styles.legendText}>Visited</Text>
          </View>
          <View style={styles.legendItem}>
            <Heart size={9} color="#F43F5E" fill="#F43F5E" strokeWidth={1} />
            <Text style={styles.legendText}>Loved</Text>
          </View>
        </View>
      </View>

      {/* Map area */}
      <View
        style={styles.mapArea}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setMapSize({ width, height });
        }}
      >

        {/*
         * SVG illustration — wrapped in absoluteFill so it is an explicit
         * background layer. On iOS/Android, react-native-svg creates its own
         * native stacking context and can cover sibling RN views even when it
         * comes first in JSX. Isolating it here guarantees the animated RN
         * markers and labels always render on top on every platform.
         */}
        <View style={[StyleSheet.absoluteFill, styles.mapLayerBg]} pointerEvents="none">
          <Svg width="100%" height="100%" viewBox="0 0 100 120" preserveAspectRatio="none">
            {/* Full map base */}
            <Rect x="0" y="0" width="100" height="120" fill={MAP_BG} />

            {/* Subtle desert landmasses */}
            <Path d="M0 0 L34 0 C28 30,20 70,26 120 L0 120 Z" fill="#D9C49A" opacity={0.14} />
            <Path d="M100 0 L66 0 C74 28,82 64,76 120 L100 120 Z" fill="#D9C49A" opacity={0.14} />

            {/* Faint latitude guides */}
            <Line x1="6" y1="40" x2="94" y2="40" stroke="#FFFFFF" strokeWidth={0.4} opacity={0.06} />
            <Line x1="6" y1="80" x2="94" y2="80" stroke="#FFFFFF" strokeWidth={0.4} opacity={0.06} />

            {/* Flowing Nile */}
            <FlowingNile />

            {/* ── Giza: pyramids + sphinx ── */}
            <Polygon points="14,30 21,15 28,30" fill="#EAD9B0" opacity={0.82} />
            <Polygon points="25,30 30,19 35,30" fill="#E3CE9E" opacity={0.72} />
            <Polygon points="8,30 12,22 16,30" fill="#E3CE9E" opacity={0.66} />
            <Line x1="21" y1="15" x2="21" y2="30" stroke="#C9B27E" strokeWidth={0.5} opacity={0.5} />
            <Path d="M37 30 L37 27.5 L38.5 27.5 L39 26 L40 26 L40.2 27.5 L42 27.5 L42 30 Z" fill="#EAD9B0" opacity={0.76} />

            {/* ── Luxor: temple pylons + obelisk ── */}
            <Polygon points="50,69 51.5,60 56,60 57,69" fill="#EAD9B0" opacity={0.78} />
            <Polygon points="58,69 59,60 63.5,60 65,69" fill="#EAD9B0" opacity={0.78} />
            <Rect x="57" y="63" width="1" height="6" fill="#EAD9B0" opacity={0.7} />
            <Rect x="58.4" y="63" width="1" height="6" fill="#EAD9B0" opacity={0.7} />
            <Polygon points="66.5,69 67.2,57 67.9,69" fill="#EAD9B0" opacity={0.72} />

            {/* ── Aswan: felucca ── */}
            <Polygon points="46,90 46,83 51,90" fill="#EAD9B0" opacity={0.78} />
            <Line x1="44" y1="90" x2="52" y2="90" stroke="#EAD9B0" strokeWidth={1.2} opacity={0.78} strokeLinecap="round" />

            {/* ── Abu Simbel: facade ── */}
            <Polygon points="40,110 41,101 50,101 51,110" fill="#EAD9B0" opacity={0.76} />
            <Rect x="42" y="103" width="1.6" height="7" rx="0.7" fill="#D9C49A" opacity={0.78} />
            <Rect x="44.4" y="103" width="1.6" height="7" rx="0.7" fill="#D9C49A" opacity={0.78} />
            <Rect x="46.8" y="103" width="1.6" height="7" rx="0.7" fill="#D9C49A" opacity={0.78} />
          </Svg>
        </View>

        {/* Tap empty map area to clear selected label */}
        <Pressable
          style={[StyleSheet.absoluteFill, styles.mapLayerClear]}
          onPress={() => setSelectedMarkerId(null)}
          accessibilityRole="button"
          accessibilityLabel="Clear selected place"
        />

        {/* Pins / dots — native overlay above illustration */}
        <View style={[StyleSheet.absoluteFill, styles.mapLayerMarkers]} pointerEvents="box-none">
          {markers.map((m) => (
            <MapMarker
              key={m.id}
              marker={m}
              mapWidth={mapSize.width}
              mapHeight={mapSize.height}
              onPress={handleMarkerPress}
            />
          ))}
        </View>

        {/* Region + selected place label */}
        <View style={[StyleSheet.absoluteFill, styles.mapLayerText]} pointerEvents="none">
          <MapTextOverlay
            markers={markers}
            mapHeight={mapSize.height}
            selectedMarkerId={selectedMarkerId}
          />
        </View>

        {/* Empty hint */}
        {!hasMarkers && (
          <View style={styles.emptyHint} pointerEvents="none">
            <Text style={styles.emptyHintText}>
              Save and visit places to build your Egypt map
            </Text>
          </View>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: Spacing.cardPadLg,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
    ...Shadows.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  title: { ...Typography.h4, color: '#FFFFFF', fontWeight: '800', letterSpacing: -0.2 },
  subtitle: { ...Typography.caption, color: 'rgba(255,255,255,0.55)', marginTop: 2 },

  /* Legend */
  legend: { gap: 5, alignItems: 'flex-start' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.75)',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  legendPin: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: Colors.teal,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  legendText: { fontSize: 10, color: 'rgba(255,255,255,0.65)', fontWeight: '600' },

  /* Map */
  mapArea: {
    width: '100%',
    aspectRatio: 100 / 120,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: MAP_BG,
    position: 'relative',
  },
  mapLayerBg: { zIndex: 1 },
  mapLayerClear: { zIndex: 1 },
  mapLayerMarkers: { zIndex: 2, elevation: 2 },
  mapLayerText: { zIndex: 3, elevation: 3 },

  /* Markers */
  markerAnchor: {
    position: 'absolute',
    alignItems: 'center',
  },
  savedDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  pin: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.teal,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  pinInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  pinTail: {
    width: 6,
    height: 6,
    backgroundColor: Colors.teal,
    transform: [{ rotate: '45deg' }],
    marginTop: -4,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#FFFFFF',
  },
  favAccent: {
    position: 'absolute',
    top: -7,
    right: -8,
  },

  /* Empty */
  emptyHint: {
    position: 'absolute',
    bottom: Spacing.base,
    left: Spacing.base,
    right: Spacing.base,
    alignItems: 'center',
  },
  emptyHintText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
  },
});
