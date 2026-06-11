import { Stack } from 'expo-router';

export default function TripLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="before-you-go" />
      <Stack.Screen name="entry_documents" />
      <Stack.Screen name="detail" />
      <Stack.Screen name="itinerary" />
      <Stack.Screen name="day" />
      <Stack.Screen name="transport" />
      <Stack.Screen name="accommodation" />
      <Stack.Screen name="money" />
      <Stack.Screen name="safety" />
      <Stack.Screen name="packing" />
      <Stack.Screen name="emergency" />
      <Stack.Screen name="stay" />
      <Stack.Screen name="esim" />
    </Stack>
  );
}
