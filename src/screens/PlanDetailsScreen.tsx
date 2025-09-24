import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Divider, Text, useTheme } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { HomeStackParamList } from '@/navigation/HomeStack.types';

type Props = NativeStackScreenProps<HomeStackParamList, 'PlanDetails'>;

const PlanDetailsScreen = ({ route }: Props) => {
  const theme = useTheme();
  const { itinerary } = route.params;

  const stopsCount =
    itinerary.days?.reduce((acc, day) => {
      if (!day?.stops) return acc;
      return acc + day.stops.length;
    }, 0) ?? 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text
        variant="headlineSmall"
        style={[styles.title, { color: theme.colors.onBackground }]}
      >
        {itinerary.trip_name}
      </Text>
      <Text
        variant="bodyMedium"
        style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
      >
        {itinerary.destination} | {stopsCount} planned stop{stopsCount === 1 ? '' : 's'}
      </Text>
      <Divider style={styles.divider} />
      <Text
        variant="bodyMedium"
        style={[styles.placeholder, { color: theme.colors.onSurfaceVariant }]}
      >
        Detailed plan breakdown coming soon. You'll be able to review activities, timing, and tips here.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  title: {
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 16,
  },
  divider: {
    marginBottom: 16,
  },
  placeholder: {
    lineHeight: 22,
  },
});

export default PlanDetailsScreen;


