import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Button,
  Chip,
  HelperText,
  RadioButton,
  Text,
  TextInput,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

import InputCard from '../components/InputCard';
import { useItinerary } from '../context/ItineraryContext';
import { RootStackParamList } from '../navigation/types';

const SettingsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { settings, updateSettings, surpriseMode, setSurpriseMode } = useItinerary();

  const [draftUnits, setDraftUnits] = useState(settings.units);
  const [draftBudget, setDraftBudget] = useState(String(settings.defaultBudget));
  const [draftCurrency, setDraftCurrency] = useState(settings.currency);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    setDraftUnits(settings.units);
    setDraftBudget(String(settings.defaultBudget));
    setDraftCurrency(settings.currency);
  }, [settings]);

  const savePreferences = () => {
    const parsedBudget = Number(draftBudget);
    if (Number.isNaN(parsedBudget) || parsedBudget <= 0) {
      setStatus('Enter a valid default budget.');
      return;
    }

    updateSettings({
      units: draftUnits,
      defaultBudget: parsedBudget,
      currency: draftCurrency || settings.currency,
    });

    setStatus('Preferences updated!');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text variant="headlineMedium" style={styles.title}>
          Settings
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Tune how PlanGenie builds your trips.
        </Text>

        {status ? (
          <Chip icon="check" style={styles.statusChip} onClose={() => setStatus(null)}>
            {status}
          </Chip>
        ) : null}

        <InputCard title="Units" description="Choose how temperatures and distances should display.">
          <RadioButton.Group value={draftUnits} onValueChange={(value) => setDraftUnits(value as 'metric' | 'imperial')}>
            <RadioButton.Item label="Metric (°C, km)" value="metric" />
            <RadioButton.Item label="Imperial (°F, miles)" value="imperial" />
          </RadioButton.Group>
        </InputCard>

        <InputCard title="Defaults" description="Pre-fill key details for quicker planning.">
          <TextInput
            mode="outlined"
            label="Default budget"
            keyboardType="numeric"
            value={draftBudget}
            onChangeText={setDraftBudget}
          />
          <HelperText type="info">Used on the home screen when you open the app.</HelperText>
          <TextInput
            mode="outlined"
            label="Preferred currency"
            value={draftCurrency}
            onChangeText={setDraftCurrency}
            autoCapitalize="characters"
          />
        </InputCard>

        <InputCard title="Surprise mode" description="Control whether wildcards appear by default.">
          <View style={styles.surpriseRow}>
            <Text variant="bodyLarge">Currently {surpriseMode ? 'enabled' : 'disabled'}</Text>
            <Chip
              icon={surpriseMode ? 'star-four-points' : 'power'}
              selected={surpriseMode}
              onPress={() => setSurpriseMode(!surpriseMode)}
            >
              {surpriseMode ? 'Turn off surprises' : 'Enable surprises'}
            </Chip>
          </View>
        </InputCard>

        <Button mode="contained" onPress={savePreferences} style={styles.saveButton}>
          Save preferences
        </Button>
        <Button mode="text" onPress={() => navigation.navigate('Home')}>
          Back to planner
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f6f2ff',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    color: '#3d2c66',
  },
  subtitle: {
    color: '#5a4a8b',
    marginBottom: 16,
  },
  statusChip: {
    alignSelf: 'flex-start',
    marginBottom: 12,
    backgroundColor: '#e7f8ef',
  },
  surpriseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saveButton: {
    marginBottom: 16,
  },
});

export default SettingsScreen;
