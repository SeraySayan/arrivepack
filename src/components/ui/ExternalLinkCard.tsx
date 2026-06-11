import React from 'react';
import { View, Text, StyleSheet, Pressable, Linking, Alert } from 'react-native';
import { ExternalLink } from 'lucide-react-native';
import * as Haptics from '../../utils/haptics';
import type { SourceLink } from '../../types';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Radii, Spacing } from '../../theme/spacing';
import { Shadows } from '../../theme/shadows';

interface Props {
  link: SourceLink;
}

const SOURCE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  official_recommended: { label: 'Official source', color: Colors.teal,    bg: Colors.mint        },
  provider_ready:       { label: 'Provider ready', color: Colors.skyBlue,  bg: Colors.skyBlueLight },
  estimated:            { label: 'Estimated',       color: Colors.warning,  bg: Colors.yellowLight  },
  sample_data:          { label: 'Sample data',     color: Colors.muted,    bg: Colors.borderLight  },
};

export default function ExternalLinkCard({ link }: Props) {
  const cfg = SOURCE_CONFIG[link.sourceType] ?? SOURCE_CONFIG.sample_data;

  const handlePress = async () => {
    Haptics.selectionAsync();

    if (link.isPlaceholder || !link.url) {
      Alert.alert(
        'Link coming soon',
        'This source link will be connected in a future update. For now, search for this resource directly.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      const supported = await Linking.canOpenURL(link.url);
      if (supported) {
        await Linking.openURL(link.url);
      } else {
        Alert.alert('Cannot open link', 'This link could not be opened on your device.');
      }
    } catch {
      Alert.alert('Error', 'Unable to open this link.');
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.left}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{link.title}</Text>
          {link.isPlaceholder && (
            <View style={styles.placeholderBadge}>
              <Text style={styles.placeholderText}>Coming soon</Text>
            </View>
          )}
        </View>
        <Text style={styles.description} numberOfLines={2}>{link.description}</Text>
        <View style={styles.badgeRow}>
          <View style={[styles.sourceBadge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.sourceLabel, { color: cfg.color }]}>
              {link.badgeLabel ?? cfg.label}
            </Text>
          </View>
          {link.badgeLabel && (
            <View style={styles.externalToolBadge}>
              <Text style={styles.externalToolLabel}>External tool</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.iconWrap}>
        <ExternalLink size={16} color={link.isPlaceholder ? Colors.mutedLight : Colors.teal} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.card,
    padding: Spacing.cardPad,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
    ...Shadows.xs,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  left: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  title: {
    ...Typography.h4,
    color: Colors.text,
    flex: 1,
  },
  placeholderBadge: {
    backgroundColor: Colors.borderLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  placeholderText: {
    ...Typography.caption,
    color: Colors.mutedLight,
    fontSize: 10,
    fontWeight: '600',
  },
  description: {
    ...Typography.caption,
    color: Colors.muted,
    lineHeight: 18,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
    flexWrap: 'wrap',
  },
  sourceBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  sourceLabel: {
    ...Typography.caption,
    fontWeight: '600',
    fontSize: 10,
  },
  externalToolBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: Colors.borderLight,
  },
  externalToolLabel: {
    ...Typography.caption,
    fontWeight: '600',
    fontSize: 10,
    color: Colors.mutedLight,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: Radii.sm,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
