import { useEffect } from 'react';
import { router } from 'expo-router';
import { useTripStore } from '../src/store/tripStore';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '../src/theme/colors';

export default function Index() {
  const { hasOnboarded } = useTripStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (hasOnboarded) {
        router.replace('/tabs/home');
      } else {
        router.replace('/onboarding');
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [hasOnboarded]);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.deepNavy, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={Colors.teal} size="large" />
    </View>
  );
}
