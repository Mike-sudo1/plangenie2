import { useEffect, useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, HelperText, IconButton, List, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DateTimePickerAndroid, DateTimePickerEvent } from '@react-native-community/datetimepicker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

import ErrorBanner from '../components/ErrorBanner';
import InputCard from '../components/InputCard';
import { useItinerary } from '../context/ItineraryContext';
import { RootStackParamList } from '../navigation/types';

const INTEREST_OPTIONS = [
  'Foodie adventures',
  'Museums & culture',
  'Nightlife',
  'Outdoor escapes',
  'Family fun',
  'Wellness & spa',
  'Hidden gems',
  'Local markets',
];

const formatDate = (date: Date | null) => (date ? date.toISOString().slice(0, 10) : '');

const HomeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    generateItinerary,
    history,
    error,
    clearError,
    setSurpriseMode,
    surpriseMode,
    settings,
    restoreFromHistory,
    removeFromHistory,
    clearHistory,
    isLoading,
  } = useItinerary();

  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [startPickerVisible, setStartPickerVisible] = useState(false);
  const [endPickerVisible, setEndPickerVisible] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [budget, setBudget] = useState(String(settings.defaultBudget));
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setBudget(String(settings.defaultBudget));
  }, [settings.defaultBudget]);

  const startDateString = formatDate(startDate);
  const endDateString = formatDate(endDate);

  const canSubmit = useMemo(() => {
    return Boolean(destination && startDate && endDate && Number(budget) > 0);
  }, [destination, startDate, endDate, budget]);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) => {
      if (prev.includes(interest)) {
        return prev.filter((item) => item !== interest);
      }
      return [...prev, interest];
    });
  };

  const showDatePicker = (
    current: Date | null,
    onChange: (event: DateTimePickerEvent, date?: Date) => void,
    setVisible: (value: boolean) => void,
  ) => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        mode: 'date',
        value: current ?? new Date(),
        minimumDate: new Date(),
        onChange,
      });
    } else {
      setVisible(true);
    }
  };

  const handleStartChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'ios') {
      return;
    }
    if (date) {
      setStartDate(date);
      if (!endDate || date > endDate) {
        setEndDate(date);
      }
    }
  };

  const handleEndChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'ios') {
      return;
    }
    if (date) {
      setEndDate(date);
    }
  };

  const submit = async () => {
    if (!canSubmit) {
      setFormError('Please complete destination, dates, and budget to generate a plan.');
      return;
    }

    setFormError(null);

    if (startDate && endDate && startDate > endDate) {
      setFormError('Start date must be before your end date.');
      return;
    }

    const itinerary = await generateItinerary({
      destination,
      startDate: startDateString,
      endDate: endDateString,
      budget: Number(budget),
      interests: selectedInterests,
    });

    if (itinerary) {
      navigation.navigate('Plan');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.headerRow}>
          <View>
            <Text variant="headlineMedium" style={styles.headline}>
              PlanGenie
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Dream up itineraries tailored to your vibe.
            </Text>
          </View>
          <IconButton
            icon="cog"
            size={28}
            mode="contained"
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings')}
            accessibilityLabel="Open settings"
          />
        </View>

        <ErrorBanner message={error ?? formError} onDismiss={() => {
          clearError();
          setFormError(null);
        }} />

        <InputCard title="Where to?" description="Tell PlanGenie where your adventure begins.">
          <TextInput
            mode="outlined"
            label="Destination"
            value={destination}
            onChangeText={setDestination}
            placeholder="e.g., Tokyo"
          />
        </InputCard>

        <InputCard title="When are you going?" description="Pick the start and end of your getaway.">
          <View style={styles.dateRow}>
            <Button
              mode="outlined"
              onPress={() => showDatePicker(startDate, handleStartChange, setStartPickerVisible)}
              icon="calendar"
              style={styles.dateButton}
            >
              {startDateString ? `Start: ${startDateString}` : 'Select start date'}
            </Button>
            <Button
              mode="outlined"
              onPress={() => showDatePicker(endDate, handleEndChange, setEndPickerVisible)}
              icon="calendar"
              style={styles.dateButton}
            >
              {endDateString ? `End: ${endDateString}` : 'Select end date'}
            </Button>
          </View>
          {Platform.OS === 'ios' && startPickerVisible ? (
            <DateTimePicker
              value={startDate ?? new Date()}
              onChange={(_event, date) => {
                setStartPickerVisible(false);
                if (date) {
                  setStartDate(date);
                  if (!endDate || date > endDate) {
                    setEndDate(date);
                  }
                }
              }}
              mode="date"
              minimumDate={new Date()}
              display="inline"
            />
          ) : null}
          {Platform.OS === 'ios' && endPickerVisible ? (
            <DateTimePicker
              value={endDate ?? startDate ?? new Date()}
              onChange={(_event, date) => {
                setEndPickerVisible(false);
                if (date) {
                  setEndDate(date);
                }
              }}
              mode="date"
              minimumDate={startDate ?? new Date()}
              display="inline"
            />
          ) : null}
        </InputCard>

        <InputCard title="Budget" description="We keep track so you can focus on fun.">
          <TextInput
            mode="outlined"
            label={`Total budget (${settings.currency})`}
            value={budget}
            onChangeText={setBudget}
            keyboardType="numeric"
          />
          <HelperText type="info">Default from settings: {settings.defaultBudget}</HelperText>
        </InputCard>

        <InputCard title="Interests" description="Pick a few things you love.">
          <View style={styles.chipRow}>
            {INTEREST_OPTIONS.map((interest) => (
              <Chip
                key={interest}
                selected={selectedInterests.includes(interest)}
                onPress={() => toggleInterest(interest)}
                mode={selectedInterests.includes(interest) ? 'flat' : 'outlined'}
              >
                {interest}
              </Chip>
            ))}
          </View>
        </InputCard>

        <InputCard
          title="Surprise mode"
          description="Toggle unexpected delights like rooftop sunsets or secret supper clubs."
        >
          <View style={styles.surpriseRow}>
            <Text variant="bodyLarge">{surpriseMode ? 'On' : 'Off'}</Text>
            <Chip
              icon={surpriseMode ? 'star-four-points' : 'dots-horizontal'}
              selected={surpriseMode}
              onPress={() => setSurpriseMode(!surpriseMode)}
            >
              {surpriseMode ? 'Surprise me!' : 'Keep it chill'}
            </Chip>
          </View>
        </InputCard>

        <Button
          mode="contained"
          onPress={submit}
          style={styles.generateButton}
          icon="wand"
          disabled={!canSubmit || isLoading}
        >
          ✨ Generate Itinerary
        </Button>

        <List.Section title="Recent plans" titleStyle={styles.historyTitle}>
          {history.length === 0 ? (
            <Text variant="bodyMedium" style={styles.historyEmpty}>
              Plans you generate will show up here for quick access.
            </Text>
          ) : (
            history.map((item) => (
              <List.Item
                key={item.id}
                title={`${item.destination} (${item.startDate} → ${item.endDate})`}
                description={`Budget ${item.budget} ${item.currency}`}
                onPress={() => {
                  restoreFromHistory(item.id);
                  navigation.navigate('Plan');
                }}
                right={() => (
                  <IconButton
                    icon="delete"
                    onPress={() => removeFromHistory(item.id)}
                    accessibilityLabel="Remove from history"
                  />
                )}
                style={styles.historyItem}
              />
            ))
          )}
          {history.length > 0 ? (
            <Button
              mode="text"
              onPress={clearHistory}
              style={styles.clearHistoryButton}
              disabled={isLoading}
            >
              Clear history
            </Button>
          ) : null}
        </List.Section>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7f2ff',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 48,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headline: {
    color: '#3e2d68',
  },
  subtitle: {
    color: '#5f4b94',
  },
  settingsButton: {
    backgroundColor: '#d9c8ff',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  dateButton: {
    flexGrow: 1,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  surpriseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  generateButton: {
    marginTop: 8,
    marginBottom: 24,
  },
  historyTitle: {
    color: '#4a3a79',
  },
  historyEmpty: {
    color: '#6b5a8e',
    marginLeft: 12,
  },
  historyItem: {
    backgroundColor: '#fdf9ff',
    borderRadius: 12,
    marginHorizontal: 4,
  },
  clearHistoryButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
});

export default HomeScreen;
