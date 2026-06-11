import React from 'react';
import { View, ScrollView, StyleSheet, StatusBar, SafeAreaView, ViewStyle } from 'react-native';
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';

interface Props {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  noPadding?: boolean;
  backgroundColor?: string;
}

export default function Screen({
  children,
  scrollable = true,
  style,
  contentStyle,
  noPadding = false,
  backgroundColor = Colors.background,
}: Props) {
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor }, style]}>
      <StatusBar barStyle="dark-content" backgroundColor={backgroundColor} />
      {scrollable ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            !noPadding && styles.content,
            contentStyle,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, !noPadding && styles.content, contentStyle]}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.screenH,
    paddingBottom: 100,
  },
});
