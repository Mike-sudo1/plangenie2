import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { DatePickerModal, registerTranslation, enGB } from 'react-native-paper-dates';
import {
  Button,
  Chip,
  Dialog,
  Divider,
  HelperText,
  Portal,
  ProgressBar,
  Surface,
  Switch,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { addDays, differenceInCalendarDays, format } from 'date-fns';

import { PreferenceOption } from '../types/plans';
import usePlanner from '../hooks/usePlanner';
import PlanPreview from '../components/PlanPreview';
import { TabParamList } from '../navigation/MainTabs';
import { RouteProp, useFocusEffect, useRoute } from '@react-navigation/native';
registerTranslation('en', enGB);

const preferenceOptions: PreferenceOption[] = [
  'Museums',
  'Nature',
  'Food',
  'Shopping',
  'Nightlife',
  'Culture',
  'Relaxation',
  'Family',
];

type PlannerRoute = RouteProp<TabParamList, 'Planner'>;

const serialiseParams = (params: PlannerRoute['params']) => {
  if (!params) return '';
  try {
    return JSON.stringify(params);
  } catch (error) {
    return '';
  }
};

const PlannerScreen = () => {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const route = useRoute<PlannerRoute>();

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showTripNameDialog, setShowTripNameDialog] = useState(false);
  const [tripNameInput, setTripNameInput] = useState('');
  const [progress, setProgress] = useState(0);
  const [progressVisible, setProgressVisible] = useState(false);
  const [paramsHydratedKey, setParamsHydratedKey] = useState<string | null>(null);

  const {
    form,
    updateField,
    togglePreference,
    submit,
    canSubmit,
    loading,
    error,
    itinerary,
    saveItinerary,
    saving,
    successMessage,
    removeStop,
    replaceStop,
    mutatingStop,
  } = usePlanner();

  const formattedStart = useMemo(() => format(form.startDate, 'PPP'), [form.startDate]);
  const formattedEnd = useMemo(() => format(form.endDate, 'PPP'), [form.endDate]);
  const tripLength = useMemo(
    () => differenceInCalendarDays(form.endDate, form.startDate) + 1,
    [form.startDate, form.endDate],
  );
  const invalidRange = tripLength < 1;

  const handleToggleDayPlan = useCallback(
    (value: boolean) => {
      updateField('isDayPlan', value);
      if (value) {
        updateField('endDate', form.startDate);
      } else if (form.endDate <= form.startDate) {
        updateField('endDate', addDays(form.startDate, 1));
      }
    },
    [form.endDate, form.startDate, updateField],
  );

  useEffect(() => {
    if (form.isDayPlan && showEndPicker) {
      setShowEndPicker(false);
    }
  }, [form.isDayPlan, showEndPicker]);

  useEffect(() => {
    if (form.isDayPlan && form.endDate.getTime() !== form.startDate.getTime()) {
      updateField('endDate', form.startDate);
    }
  }, [form.endDate, form.isDayPlan, form.startDate, updateField]);

  const paramsKey = useMemo(() => serialiseParams(route.params), [route.params]);
  useFocusEffect(
    React.useCallback(() => {
      if (!route.params) {
        setParamsHydratedKey(null);
        return;
      }

      if (paramsHydratedKey === paramsKey) {
        return;
      }

      const { destination, startDate, endDate, mode } = route.params;

      if (destination && destination !== form.city) {
        updateField('city', destination);
      }

      const parsedStart = startDate ? new Date(startDate) : null;
      const normalizedStart =
        parsedStart && !Number.isNaN(parsedStart.getTime()) ? parsedStart : null;

      const parsedEnd = endDate ? new Date(endDate) : null;
      const normalizedEndParam =
        parsedEnd && !Number.isNaN(parsedEnd.getTime()) ? parsedEnd : null;

      if (mode === 'day') {
        if (!form.isDayPlan) {
          updateField('isDayPlan', true);
        }
        const targetStart = normalizedStart ?? form.startDate;
        if (targetStart.getTime() !== form.startDate.getTime()) {
          updateField('startDate', targetStart);
        }
        if (form.endDate.getTime() !== targetStart.getTime()) {
          updateField('endDate', targetStart);
        }
      } else {
        if (mode === 'trip' && form.isDayPlan) {
          updateField('isDayPlan', false);
        }
        if (normalizedStart) {
          if (normalizedStart.getTime() !== form.startDate.getTime()) {
            updateField('startDate', normalizedStart);
          }
          if (normalizedStart > form.endDate) {
            updateField('endDate', addDays(normalizedStart, 1));
          }
        }
        if (normalizedEndParam) {
          const normalizedEnd =
            normalizedEndParam >= form.startDate
              ? normalizedEndParam
              : addDays(form.startDate, 1);
          if (normalizedEnd.getTime() !== form.endDate.getTime()) {
            updateField('endDate', normalizedEnd);
          }
        }
      }

      setParamsHydratedKey(paramsKey);
    }, [form.city, form.endDate, form.isDayPlan, form.startDate, paramsHydratedKey, paramsKey, route.params, updateField]),
  );



  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    let timeout: NodeJS.Timeout | undefined;

    if (loading) {
      setProgressVisible(true);
      setProgress(0.1);
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 0.9) return prev;
          return Number((prev + 0.07).toFixed(2));
        });
      }, 400);
    } else if (progressVisible) {
      setProgress(1);
      timeout = setTimeout(() => {
        setProgressVisible(false);
        setProgress(0);
      }, 300);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (timeout) clearTimeout(timeout);
    };
  }, [loading, progressVisible]);

  const onDateChange = (
    key: 'startDate' | 'endDate',
    setVisible: (value: boolean) => void,
    selectedDate?: Date,
  ) => {
    if (Platform.OS !== 'ios') {
      setVisible(false);
    }
    if (selectedDate) {
      if (key === 'startDate') {
        if (form.isDayPlan) {
          updateField('endDate', selectedDate);
        } else if (selectedDate > form.endDate) {
          updateField('endDate', addDays(selectedDate, 1));
        }
      }
      if (key === 'endDate' && selectedDate < form.startDate) {
        updateField('startDate', selectedDate);
      }
      updateField(key, selectedDate);
    }
  };

  const handleSavePress = () => {
    if (!itinerary) return;
    setTripNameInput(itinerary.trip_name ?? `${form.city} Escape`);
    setShowTripNameDialog(true);
  };

  const handleConfirmSave = async () => {
    const nameToSave = tripNameInput.trim() || `${form.city} Escape`;
    await saveItinerary(nameToSave);
    setShowTripNameDialog(false);
  };

  const renderProgress = () => {
    if (!progressVisible) return null;
    return (
      <View style={styles.progressContainer}>
        <ProgressBar progress={progress} style={styles.progressBar} />
        <Text variant="bodySmall" style={styles.progressLabel}>
          Generating your personalized plan...
        </Text>
      </View>
    );
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Surface style={styles.formSurface} elevation={1}>
        <Text variant="titleLarge" style={styles.heading}>
          Craft your perfect escape
        </Text>
        <Text variant="bodyMedium" style={styles.description}>
          Set your dates, share what you love, and PlanGenie will curate each day with
          budget-aware stops and thoughtful pacing.
        </Text>

        <TextInput
          label="Destination"
          placeholder="e.g., Mexico City"
          value={form.city}
          onChangeText={(value) => updateField('city', value)}
          mode="outlined"
          style={styles.input}
        />

        <View style={styles.dayPlanToggleRow}>
          <Text variant="bodyMedium" style={styles.dayPlanToggleLabel}>
            Plan just one day?
          </Text>
          <Switch value={form.isDayPlan} onValueChange={handleToggleDayPlan} />
        </View>

        <View style={styles.datesRow}>
          <TouchableOpacity
            style={styles.dateColumn}
            onPress={() => setShowStartPicker(true)}
          >
            <TextInput
              label="Arrive"
              value={formattedStart}
              editable={false}
              pointerEvents="none"
              mode="outlined"
              right={<TextInput.Icon icon="calendar" />}
            />
          </TouchableOpacity>
          {!form.isDayPlan ? (
            <TouchableOpacity
              style={styles.dateColumn}
              onPress={() => setShowEndPicker(true)}
            >
              <TextInput
                label="Depart"
                value={formattedEnd}
                editable={false}
                pointerEvents="none"
                mode="outlined"
                right={<TextInput.Icon icon="calendar" />}
              />
            </TouchableOpacity>
          ) : null}
        </View>
        <Text variant="bodySmall" style={styles.helperCopy}>
          {tripLength > 0
            ? `${tripLength} day${tripLength > 1 ? 's' : ''} of curated experiences`
            : 'End date must be on or after arrival date.'}
        </Text>

        <TextInput
          label="Daily budget (USD)"
          placeholder="200"
          keyboardType="numeric"
          value={form.budgetUsd != null ? String(form.budgetUsd) : ''}
          onChangeText={(value) => {
            const numeric = Number(value.replace(/[^0-9.]/g, ''));
            updateField('budgetUsd', Number.isFinite(numeric) ? numeric : undefined);
          }}
          mode="outlined"
          style={styles.input}
          right={<TextInput.Affix text="USD" />}
        />
        <Text variant="bodySmall" style={styles.helperCopy}>
          Leave blank for a flexible itinerary. We balance meals, experiences, and
          downtime.
        </Text>

        <View style={styles.preferencesContainer}>
          <Text variant="titleMedium" style={styles.sectionLabel}>
            Preferences
          </Text>
          <Text variant="bodySmall" style={styles.sectionHint}>
            Tap to add or remove. We will balance each day to match your vibe.
          </Text>
          <View style={styles.preferencesGrid}>
            {preferenceOptions.map((option) => {
              const selected = form.preferences.includes(option);
              return (
                <Chip
                  key={option}
                  mode={selected ? 'flat' : 'outlined'}
                  selected={selected}
                  style={[
                    styles.preferenceChip,
                    selected && { backgroundColor: theme.colors.primaryContainer },
                  ]}
                  onPress={() => togglePreference(option)}
                  icon={selected ? 'check' : undefined}
                >
                  {option}
                </Chip>
              );
            })}
          </View>
        </View>

        {error && (
          <HelperText type="error" visible>
            {error}
          </HelperText>
        )}

        {successMessage && (
          <HelperText type="info" visible>
            {successMessage}
          </HelperText>
        )}

        <Button
          mode="contained"
          icon="calendar-month"
          onPress={submit}
          loading={loading}
          disabled={!canSubmit || loading || invalidRange}
          style={styles.submitButton}
        >
          Generate itinerary
        </Button>
        {renderProgress()}
      </Surface>

      {itinerary && (
        <View style={[styles.resultsContainer, { width: width - 32 }]}>
          <PlanPreview
            itinerary={itinerary}
            onSave={handleSavePress}
            saving={saving}
            loading={loading}
            onRemoveStop={removeStop}
            onReplaceStop={replaceStop}
            mutatingStop={mutatingStop}
          />
        </View>
      )}

      {!itinerary && !loading && (
        <View style={styles.helperContainer}>
          <Divider style={{ width: '80%' }} />
          <Text variant="bodySmall" style={styles.helperText}>
            Tip: Mix culture, nature, and foodie stops for a balanced trip.
          </Text>
        </View>
      )}

      <Portal>
         <DatePickerModal
           visible={showStartPicker}
           mode="single"
           date={form.startDate}
           onDismiss={() => setShowStartPicker(false)}
           onConfirm={({ date }) => {
             setShowStartPicker(false);
             if (date) {
               updateField('startDate', date);
               if (date > form.endDate) {
                 updateField('endDate', addDays(date, 1));
               }
             }
           }}
           validRange={{ startDate: new Date() }}
           locale={navigator.language || 'en-US'}
         />
        <DatePickerModal
          visible={!form.isDayPlan && showEndPicker}
          mode="single"
          date={form.endDate}
          onDismiss={() => setShowEndPicker(false)}
          onConfirm={({ date }) => {
            setShowEndPicker(false);
            if (date) {
              if (date < form.startDate) {
                updateField('startDate', date);
              }
              updateField('endDate', date);
            }
          }}
          validRange={{ startDate: form.startDate }}
          locale={navigator.language || 'en-US'}
        />

        <Dialog
          visible={showTripNameDialog}
          onDismiss={() => setShowTripNameDialog(false)}
        >
          <Dialog.Title>Name your trip</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Trip name"
              mode="outlined"
              value={tripNameInput}
              onChangeText={setTripNameInput}
              autoFocus
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowTripNameDialog(false)}>Cancel</Button>
            <Button onPress={handleConfirmSave} loading={saving} disabled={saving}>
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  formSurface: {
    borderRadius: 18,
    padding: 18,
    gap: 12,
  },
  heading: {
    fontWeight: '700',
  },
  description: {
    marginBottom: 4,
  },
  input: {
    marginTop: 4,
  },
  helperCopy: {
    color: '#64748b',
  },
  dayPlanToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  dayPlanToggleLabel: {
    fontWeight: '600',
  },
  datesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dateColumn: {
    flex: 1,
  },
  preferencesContainer: {
    marginTop: 8,
  },
  sectionLabel: {
    fontWeight: '600',
  },
  sectionHint: {
    marginTop: 4,
  },
  preferencesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  preferenceChip: {
    borderRadius: 20,
  },
  submitButton: {
    marginTop: 12,
  },
  resultsContainer: {
    marginTop: 24,
    alignSelf: 'center',
  },
  helperContainer: {
    marginTop: 32,
    alignItems: 'center',
  },
  helperText: {
    marginTop: 12,
    textAlign: 'center',
  },
  progressContainer: {
    marginTop: 16,
    gap: 8,
  },
  progressBar: {
    borderRadius: 8,
    height: 8,
  },
  progressLabel: {
    color: '#475569',
  },
});

export default PlannerScreen;