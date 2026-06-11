import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Home, Map, Zap, BookOpen } from 'lucide-react-native';
import { Colors } from '../../src/theme/colors';

const TABS = [
  { name: 'home', label: 'Home', icon: Home },
  { name: 'trip', label: 'Trip', icon: Map },
  { name: 'live', label: 'Live', icon: Zap },
  { name: 'diary', label: 'Diary', icon: BookOpen },
] as const;

function TabItem({
  focused,
  icon: Icon,
  label,
}: {
  focused: boolean;
  icon: any;
  label: string;
}) {
  return (
    <View style={styles.item}>
      <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
        <Icon
          size={20}
          color={focused ? '#FFFFFF' : Colors.mutedLight}
          strokeWidth={focused ? 2.4 : 1.9}
        />
      </View>
      <Text style={[styles.label, focused && styles.labelActive]}>{label}</Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarItemStyle: styles.tabItem,
        tabBarBackground: () => <View style={styles.tabBarBg} />,
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.label,
            tabBarIcon: ({ focused }) => (
              <TabItem focused={focused} icon={tab.icon} label={tab.label} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: Platform.OS === 'ios' ? 28 : 18,
    height: 68,
    borderTopWidth: 0,
    borderRadius: 28,
    backgroundColor: 'rgba(15,23,42,0.96)',
    paddingHorizontal: 8,
    elevation: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.32,
    shadowRadius: 24,
  },
  tabBarBg: {
    flex: 1,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tabItem: {
    height: 68,
    paddingTop: 12,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    width: 64,
  },
  iconWrapper: {
    width: 42,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
  },
  iconWrapperActive: {
    backgroundColor: Colors.teal,
    shadowColor: Colors.teal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  label: {
    fontSize: 10.5,
    fontWeight: '600',
    color: Colors.mutedLight,
    letterSpacing: 0.2,
  },
  labelActive: {
    color: Colors.tealLight,
    fontWeight: '700',
  },
});
