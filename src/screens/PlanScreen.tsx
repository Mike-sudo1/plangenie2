import { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { generateItinerary, parseActivities } from '../utils/openai';

const PlanScreen = () => {
  const [city, setCity] = useState('Paris, France');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [activities, setActivities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await generateItinerary(city, date);
      const parsed = parseActivities(response);
      setActivities(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.header}>PlanGenie</Text>
      <Text style={styles.title}>Daily itinerary</Text>
      <Text style={styles.subtitle}>
        Generate a balanced day with curated activities, dining, and cultural gems.
      </Text>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>City</Text>
        <TextInput
          value={city}
          onChangeText={setCity}
          placeholder="Where are you exploring?"
          placeholderTextColor="#8c82c8"
          style={styles.input}
        />
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Date</Text>
        <TextInput
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#8c82c8"
          style={styles.input}
        />
      </View>
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleGenerate}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>Generate My Day</Text>}
      </TouchableOpacity>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <View style={styles.activitiesContainer}>
        {activities.map((activity, index) => (
          <View key={`${activity}-${index}`} style={styles.activityCard}>
            <Text style={styles.activityTitle}>Stop {index + 1}</Text>
            <Text style={styles.activityText}>{activity}</Text>
          </View>
        ))}
      </View>
      {!loading && activities.length === 0 && !error ? (
        <View style={styles.placeholderCard}>
          <Text style={styles.placeholderTitle}>Your day is waiting ✨</Text>
          <Text style={styles.placeholderBody}>
            Tap the button above to let PlanGenie craft a personalized itinerary for you.
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 120,
    backgroundColor: '#f5f3ff',
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    color: '#443a78',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#5a4db2',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6a61a3',
    marginBottom: 20,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4d438f',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 16,
    color: '#211b3a',
    borderWidth: 1,
    borderColor: '#ded7ff',
  },
  button: {
    backgroundColor: '#6b5fd6',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#1d163a',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    marginTop: 16,
    color: '#c84f66',
    fontSize: 14,
  },
  activitiesContainer: {
    marginTop: 24,
    gap: 16,
  },
  activityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#ded7ff',
    shadowColor: '#1d163a',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 4,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4d438f',
    marginBottom: 6,
  },
  activityText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#61579d',
  },
  placeholderCard: {
    marginTop: 32,
    backgroundColor: '#ebe6ff',
    borderRadius: 20,
    padding: 24,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#473b8b',
    marginBottom: 8,
  },
  placeholderBody: {
    fontSize: 15,
    color: '#5f559f',
    lineHeight: 22,
  },
});

export default PlanScreen;
