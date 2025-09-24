import React, { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { differenceInCalendarDays, format } from 'date-fns';
import {
  ActivityIndicator,
  Button,
  Dialog,
  IconButton,
  List,
  Portal,
  Surface,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';

import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';
import { SavedItineraryRecord, TripItinerary } from '../types/plans';
import PlanPreview from '../components/PlanPreview';

const currencySymbols: Record<string, string> = {
  USD: '$',
  EUR: '\u20ac',
  MXN: '$',
  GBP: '\u00a3',
  CAD: '$',
  JPY: '\u00a5',
};

const SavedPlansScreen = () => {
  const theme = useTheme();
  const { user } = useAuth();

  const [trips, setTrips] = useState<SavedItineraryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  const [renamingTrip, setRenamingTrip] = useState<SavedItineraryRecord | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<TripItinerary | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  const fetchTrips = useCallback(async () => {
    if (!user) return;
    setError(null);
    setLoading(true);
    const { data, error: dbError } = await supabase
      .from('itineraries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (dbError) {
      setError(dbError.message);
    } else {
      setTrips((data ?? []) as SavedItineraryRecord[]);
    }
    setLoading(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void fetchTrips();
    }, [fetchTrips]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTrips();
    setRefreshing(false);
  }, [fetchTrips]);

  const handleDelete = useCallback(
    async (tripId: string) => {
      setDeletingId(tripId);
      const { error: deleteError } = await supabase
        .from('itineraries')
        .delete()
        .eq('id', tripId);
      if (deleteError) {
        setError(deleteError.message);
      } else {
        setTrips((prev) => prev.filter((plan) => plan.id !== tripId));
        if (selectedTripId === tripId) {
          setSelectedTrip(null);
          setSelectedTripId(null);
        }
      }
      setDeletingId(null);
      setConfirmingDelete(null);
    },
    [selectedTripId],
  );

  const openRename = useCallback((trip: SavedItineraryRecord) => {
    setRenamingTrip(trip);
    setRenameValue(trip.trip_name);
  }, []);

  const handleRename = useCallback(async () => {
    if (!renamingTrip) return;
    const newName = renameValue.trim();
    if (newName.length === 0) return;

    setRenaming(true);
    setError(null);

    try {
      const itineraryData = renamingTrip.itinerary_data as TripItinerary;
      const updatedData: TripItinerary = {
        ...itineraryData,
        trip_name: newName,
      };

      const { error: dbError } = await supabase
        .from('itineraries')
        .update({ trip_name: newName, itinerary_data: updatedData })
        .eq('id', renamingTrip.id);

      if (dbError) {
        throw dbError;
      }

      setTrips((prev) =>
        prev.map((record) =>
          record.id === renamingTrip.id
            ? { ...record, trip_name: newName, itinerary_data: updatedData }
            : record,
        ),
      );

      if (selectedTripId === renamingTrip.id) {
        setSelectedTrip(updatedData);
      }

      setRenamingTrip(null);
    } catch (caught) {
      const message =
        caught instanceof Error
          ? caught.message
          : 'We could not rename this trip right now.';
      setError(message);
    } finally {
      setRenaming(false);
    }
  }, [renamingTrip, renameValue, selectedTripId]);

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContent}>
          <ActivityIndicator animating />
          <Text style={styles.centerText}>Loading your saved itineraries...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContent}>
          <Text style={[styles.centerText, { color: theme.colors.error }]}>{error}</Text>
          <Button onPress={() => fetchTrips()} style={{ marginTop: 8 }}>
            Try again
          </Button>
        </View>
      );
    }

    if (trips.length === 0) {
      return (
        <View style={styles.centerContent}>
          <Text style={styles.centerText}>
            No itineraries yet. Generate your first multi-day adventure!
          </Text>
        </View>
      );
    }

    return (
      <List.Section>
        {trips.map((trip) => {
          const itineraryData = trip.itinerary_data as TripItinerary | null;
          const durationDays =
            differenceInCalendarDays(new Date(trip.end_date), new Date(trip.start_date)) +
            1;
          const currency = itineraryData?.currency ?? 'USD';
          const symbol = currencySymbols[currency] ?? '$';
          const totalBudget =
            itineraryData?.budget_converted ?? itineraryData?.budget_usd ?? null;
          const dailyBudget =
            itineraryData?.daily_budget_converted ??
            itineraryData?.daily_budget_usd ??
            (totalBudget != null
              ? totalBudget / Math.max(durationDays, 1)
              : null);
          const budgetLabel =
            dailyBudget != null
              ? `${symbol}${dailyBudget.toFixed(0)} per day`
              : 'Flexible budget';

          return (
            <Surface key={trip.id} style={styles.tripCard} elevation={1}>
              <List.Accordion
                title={trip.trip_name}
                description={`${trip.destination} • ${durationDays} days • ${budgetLabel}`}
                left={(props) => <List.Icon {...props} icon="calendar" />}
                right={(props) => (
                  <View style={styles.cardActions}>
                    <IconButton
                      {...props}
                      icon="pencil"
                      onPress={() => openRename(trip)}
                      disabled={deletingId === trip.id}
                    />
                    <IconButton
                      {...props}
                      icon="delete"
                      onPress={() => setConfirmingDelete(trip.id)}
                      disabled={deletingId === trip.id}
                    />
                  </View>
                )}
              >
                <List.Item
                  title="Trip snapshot"
                  description={`${format(new Date(trip.start_date), 'LLL d, yyyy')} -> ${format(
                    new Date(trip.end_date),
                    'LLL d, yyyy',
                  )}`}
                  left={(props) => <List.Icon {...props} icon="timeline" />}
                />
                <Button
                  mode="contained-tonal"
                  icon="eye"
                  onPress={() => {
                    if (itineraryData) {
                      setSelectedTrip(itineraryData);
                      setSelectedTripId(trip.id);
                    }
                  }}
                  style={styles.viewButton}
                >
                  View itinerary
                </Button>
              </List.Accordion>
            </Surface>
          );
        })}
      </List.Section>
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text variant="titleLarge" style={styles.title}>
        Saved itineraries
      </Text>
      {renderContent()}
      {selectedTrip ? (
        <View style={styles.previewContainer}>
          <PlanPreview itinerary={selectedTrip} saving={false} />
        </View>
      ) : null}

      <Portal>
        <Dialog visible={!!confirmingDelete} onDismiss={() => setConfirmingDelete(null)}>
          <Dialog.Title>Delete itinerary?</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to delete this saved trip?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmingDelete(null)}>Cancel</Button>
            <Button
              onPress={() => {
                if (confirmingDelete) {
                  void handleDelete(confirmingDelete);
                }
              }}
              loading={deletingId === confirmingDelete}
            >
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={!!renamingTrip} onDismiss={() => setRenamingTrip(null)}>
          <Dialog.Title>Rename trip</Dialog.Title>
          <Dialog.Content>
            <TextInput
              mode="outlined"
              label="Trip name"
              value={renameValue}
              onChangeText={setRenameValue}
              autoFocus
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setRenamingTrip(null)}>Cancel</Button>
            <Button onPress={handleRename} loading={renaming} disabled={renaming}>
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
  content: {
    padding: 16,
    gap: 16,
  },
  title: {
    fontWeight: '700',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  centerText: {
    marginTop: 8,
    textAlign: 'center',
  },
  tripCard: {
    borderRadius: 16,
  },
  viewButton: {
    alignSelf: 'flex-start',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  previewContainer: {
    marginTop: 8,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default SavedPlansScreen;
