/**
 * Web-safe haptics wrapper.
 * On web, all calls are no-ops — expo-haptics is native only.
 */
import { Platform } from 'react-native';

let _haptics: typeof import('expo-haptics') | null = null;

async function getHaptics() {
  if (Platform.OS === 'web') return null;
  if (!_haptics) {
    _haptics = await import('expo-haptics');
  }
  return _haptics;
}

export async function selectionAsync(): Promise<void> {
  const h = await getHaptics();
  if (!h) return;
  return h.selectionAsync();
}

export async function impactAsync(
  style?: import('expo-haptics').ImpactFeedbackStyle
): Promise<void> {
  const h = await getHaptics();
  if (!h) return;
  return h.impactAsync(style ?? h.ImpactFeedbackStyle.Light);
}

export async function notificationAsync(
  type?: import('expo-haptics').NotificationFeedbackType
): Promise<void> {
  const h = await getHaptics();
  if (!h) return;
  return h.notificationAsync(type ?? h.NotificationFeedbackType.Success);
}

/* Re-export enum types for call-sites that reference them */
export { ImpactFeedbackStyle, NotificationFeedbackType } from 'expo-haptics';
