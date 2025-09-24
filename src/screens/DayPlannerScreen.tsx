import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { HomeStackParamList } from '../navigation/HomeStack.types';

type Props = NativeStackScreenProps<HomeStackParamList, 'DayPlanner'>;

const DayPlannerScreen = ({ route }: Props) => {
  const theme = useTheme();
  const rawSelectedDate = route.params.selectedDate;

  const selectedDate = useMemo(() => {
    const date = new Date(rawSelectedDate);
    if (Number.isNaN(date.getTime())) {
      return new Date();
    }
    return date;
  }, [rawSelectedDate]);

  const formattedDate = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }).format(selectedDate),
    [selectedDate]
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text
        variant="headlineSmall"
        style={[styles.title, { color: theme.colors.onBackground }]}
      >
        Plan your day
      </Text>
      <Text
        variant="bodyMedium"
        style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
      >
        We'll start with {formattedDate}. Build out stops, notes, and timing to craft your perfect day.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  title: {
    fontWeight: '700',
    marginBottom: 12,
  },
  subtitle: {
    lineHeight: 22,
  },
});

export default DayPlannerScreen;
