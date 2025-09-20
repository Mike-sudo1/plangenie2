import { Share, ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Button, Card, Chip, ProgressBar, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMemo } from 'react';

import ActivityCard from '../components/ActivityCard';
import { useItinerary } from '../context/ItineraryContext';
import { RootStackParamList } from '../navigation/types';

const PlanScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { plan, resetPlan } = useItinerary();

  const metrics = useMemo(() => {
    if (!plan) {
      return { totalCost: 0, remaining: 0, progress: 0 };
    }
    const total = plan.estimatedTotalCost
      ?? plan.days.reduce(
        (sum, day) => sum + day.activities.reduce((acc, activity) => acc + (activity.costEstimate ?? 0), 0),
        0,
      );
    const remaining = Math.max(plan.budget - total, 0);
    const progress = plan.budget > 0 ? Math.min(total / plan.budget, 1) : 0;
    return { totalCost: total, remaining, progress };
  }, [plan]);

  const handleShare = async () => {
    if (!plan) {
      return;
    }

    const summary = plan.days
      .map((day) => {
        const activities = day.activities
          .map((activity) => `• ${activity.timeOfDay.toUpperCase()}: ${activity.title} – ${activity.description}`)
          .join('\n');
        return `${day.date} – ${day.summary}\n${activities}`;
      })
      .join('\n\n');

    await Share.share({
      title: `PlanGenie itinerary for ${plan.destination}`,
      message: `PlanGenie itinerary for ${plan.destination}\nBudget: ${plan.budget} ${plan.currency}\n\n${summary}`,
    });
  };

  if (!plan) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyState}>
          <Text variant="titleLarge" style={styles.emptyTitle}>
            No itinerary yet
          </Text>
          <Text variant="bodyMedium" style={styles.emptyCopy}>
            Start on the Home tab to dream up your next escape.
          </Text>
          <Button mode="contained" onPress={() => navigation.navigate('Home')}>
            Go to Home
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text variant="headlineMedium" style={styles.destination}>
          {plan.destination}
        </Text>
        <Text variant="bodyMedium" style={styles.dates}>
          {plan.startDate} → {plan.endDate}
        </Text>

        <Card style={styles.summaryCard}>
          <Card.Content style={styles.summaryContent}>
            <View>
              <Text variant="titleMedium" style={styles.summaryLabel}>
                Budget meter
              </Text>
              <ProgressBar progress={metrics.progress} color="#6d5bd0" style={styles.progress} />
              <Text variant="bodyMedium" style={styles.summaryText}>
                Estimated spend {metrics.totalCost.toFixed(0)} {plan.currency} • Remaining {metrics.remaining.toFixed(0)} {plan.currency}
              </Text>
            </View>
            <Chip icon="star-four-points" selected={plan.surpriseMode}>
              {plan.surpriseMode ? 'Surprise mode' : 'Chill mode'}
            </Chip>
          </Card.Content>
        </Card>

        <View style={styles.actionsRow}>
          <Button mode="contained-tonal" icon="share-variant" onPress={handleShare}>
            Share plan
          </Button>
          <Button
            mode="outlined"
            icon="pencil"
            onPress={() => {
              resetPlan();
              navigation.navigate('Home');
            }}
          >
            New request
          </Button>
        </View>

        {plan.days.map((day) => (
          <Card key={day.date} style={styles.dayCard}>
            <Card.Content>
              <View style={styles.dayHeader}>
                <View>
                  <Text variant="titleLarge" style={styles.dayTitle}>
                    {day.date}
                  </Text>
                  {day.summary ? (
                    <Text variant="bodyMedium" style={styles.daySummary}>
                      {day.summary}
                    </Text>
                  ) : null}
                </View>
                {day.weather ? (
                  <Chip icon="weather-partly-cloudy" style={styles.weatherChip}>
                    {day.weather}
                  </Chip>
                ) : null}
              </View>
              <View style={styles.activities}>
                {day.activities.map((activity) => (
                  <ActivityCard key={activity.id} {...activity} />
                ))}
              </View>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Header from '../components/Header';

const PlanScreen = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <Header />
      <View style={styles.content}>
        <Text style={styles.text}>Plan your day here</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f1ff',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 80,
  },
  destination: {
    color: '#3e2d68',
  },
  dates: {
    color: '#6d5ca6',
    marginBottom: 16,
  },
  summaryCard: {
    marginBottom: 16,
    backgroundColor: '#fff8ff',
  },
  summaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  summaryLabel: {
    color: '#4b3784',
    marginBottom: 8,
  },
  summaryText: {
    color: '#5f4b94',
  },
  progress: {
    height: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  dayCard: {
    marginBottom: 24,
    backgroundColor: '#ffffff',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dayTitle: {
    color: '#3f2f6b',
  },
  daySummary: {
    color: '#5c4a8f',
    marginTop: 4,
  },
  weatherChip: {
    backgroundColor: '#e3f2fd',
  },
  activities: {
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  emptyTitle: {
    color: '#3f2f6b',
  },
  emptyCopy: {
    color: '#5f4b94',
    backgroundColor: '#f7f5ff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  text: {
    fontSize: 18,
    color: '#4a4a68',
    textAlign: 'center',
  },
});

export default PlanScreen;
