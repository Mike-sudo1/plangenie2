import React, { useMemo, useState } from 'react';
import { Image, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Button,
  Chip,
  Divider,
  IconButton,
  Menu,
  ProgressBar,
  Surface,
  Text,
} from 'react-native-paper';

import { ItineraryStop, TripItinerary } from '../types/plans';

type PlanPreviewProps = {
  itinerary: TripItinerary;
  saving: boolean;
  loading?: boolean;
  onSave?: () => void;
  onRemoveStop?: (dayIndex: number, stopIndex: number) => void;
  onReplaceStop?: (dayIndex: number, stopIndex: number) => Promise<void>;
  mutatingStop?: { dayIndex: number; stopIndex: number } | null;
};

type ExpandedState = Record<number, Set<number>>;

type MenuTarget = { dayIndex: number; stopIndex: number } | null;

const palette = {
  sand: '#F5E6C8',
  sea: '#99D5C9',
  sky: '#BFD9FF',
  coral: '#FFB4A2',
  slate: '#475569',
};

const currencySymbols: Record<string, string> = {
  USD: '$',
  EUR: '\u20ac',
  MXN: '$',
  GBP: '\u00a3',
  CAD: '$',
  JPY: '\u00a5',
};

const categoryIcon: Record<
  ItineraryStop['category'],
  keyof typeof MaterialCommunityIcons.glyphMap
> = {
  food: 'silverware-fork-knife',
  activity: 'map-marker-star',
  transport: 'train-car',
  break: 'coffee',
  misc: 'compass-outline',
};

const categoryLabel: Record<ItineraryStop['category'], string> = {
  food: 'Food',
  activity: 'Activity',
  transport: 'Transport',
  break: 'Break',
  misc: 'Extra',
};

const priceBadgeColor = (priceSymbol: string) => {
  if (priceSymbol.includes('$$$')) return palette.coral;
  if (priceSymbol.includes('$$')) return palette.sea;
  return palette.sky;
};

const openUrl = (url?: string) => {
  if (!url) return;
  Linking.openURL(url).catch(() => undefined);
};

const PlanPreview: React.FC<PlanPreviewProps> = ({
  itinerary,
  saving,
  loading,
  onSave,
  onRemoveStop,
  onReplaceStop,
  mutatingStop,
}) => {
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [expandedStops, setExpandedStops] = useState<ExpandedState>({ 0: new Set([0]) });
  const [menuTarget, setMenuTarget] = useState<MenuTarget>(null);

  const currencySymbol = useMemo(
    () => currencySymbols[itinerary.currency] ?? '$',
    [itinerary.currency],
  );

  const totalBudget = useMemo(() => {
    if (itinerary.budget_converted != null) return itinerary.budget_converted;
    if (itinerary.budget_usd != null) return itinerary.budget_usd;
    if (itinerary.daily_budget_converted != null) {
      return itinerary.daily_budget_converted * itinerary.days.length;
    }
    if (itinerary.daily_budget_usd != null) {
      return itinerary.daily_budget_usd * itinerary.days.length;
    }
    return 0;
  }, [
    itinerary.budget_converted,
    itinerary.budget_usd,
    itinerary.daily_budget_converted,
    itinerary.daily_budget_usd,
    itinerary.days.length,
  ]);

  const dailyBudget = useMemo(() => {
    if (itinerary.daily_budget_converted != null) {
      return itinerary.daily_budget_converted;
    }
    if (itinerary.daily_budget_usd != null) {
      return itinerary.daily_budget_usd;
    }
    if (totalBudget && itinerary.days.length > 0) {
      return totalBudget / itinerary.days.length;
    }
    return null;
  }, [
    itinerary.daily_budget_converted,
    itinerary.daily_budget_usd,
    itinerary.days.length,
    totalBudget,
  ]);

  const budgetProgress = useMemo(() => {
    if (!totalBudget || totalBudget <= 0) return null;
    return Math.min(itinerary.total_estimated_cost / totalBudget, 1.2);
  }, [totalBudget, itinerary.total_estimated_cost]);

  const remainingBudget = useMemo(() => {
    if (!totalBudget) return null;
    return totalBudget - itinerary.total_estimated_cost;
  }, [totalBudget, itinerary.total_estimated_cost]);

  const highlights = Array.isArray(itinerary.highlights) ? itinerary.highlights : [];
  const activeDay = itinerary.days[activeDayIndex];
  if (!activeDay) return null;

  const isStopExpanded = (dayIdx: number, stopIdx: number) => {
    const set = expandedStops[dayIdx];
    return set ? set.has(stopIdx) : false;
  };

  const toggleStop = (dayIdx: number, stopIdx: number) => {
    setExpandedStops((prev) => {
      const currentSet = new Set(prev[dayIdx] ?? []);
      if (currentSet.has(stopIdx)) {
        currentSet.delete(stopIdx);
      } else {
        currentSet.add(stopIdx);
      }
      return {
        ...prev,
        [dayIdx]: currentSet,
      };
    });
  };

  const handleDayChange = (index: number) => {
    setActiveDayIndex(index);
    setExpandedStops((prev) => ({
      ...prev,
      [index]: prev[index] ?? new Set([0]),
    }));
  };

  return (
    <View style={styles.wrapper}>
      <Surface
        style={[styles.summaryCard, { backgroundColor: palette.sand }]}
        elevation={3}
      >
        <View style={styles.summaryHeader}>
          <View>
            <Text variant="titleLarge" style={styles.summaryTitle}>
              {itinerary.trip_name}
            </Text>
            <Text variant="bodyMedium" style={styles.summarySubtitle}>
              {itinerary.destination} - {itinerary.start_date} to {itinerary.end_date}
            </Text>
            <Text variant="bodySmall" style={styles.summaryMeta}>
              {itinerary.days.length} days - {currencySymbol}
              {itinerary.total_estimated_cost.toFixed(0)} estimated total
            </Text>
          </View>
          {onSave ? (
            <IconButton
              icon="content-save"
              mode="contained"
              size={28}
              onPress={onSave}
              loading={saving}
              disabled={saving}
              accessibilityLabel="Save trip"
            />
          ) : null}
        </View>
        {itinerary.weatherSummary ? (
          <Chip icon="weather-partly-cloudy" style={styles.weatherChip}>
            {itinerary.weatherSummary}
          </Chip>
        ) : null}
        {highlights.length > 0 ? (
          <View style={styles.highlightRow}>
            {highlights.slice(0, 4).map((highlight) => (
              <Chip key={highlight} style={styles.highlightChip} icon="star" compact>
                {highlight}
              </Chip>
            ))}
          </View>
        ) : null}

        {budgetProgress != null ? (
          <View style={styles.budgetSection}>
            <View style={styles.budgetRow}>
              <Text variant="titleMedium" style={styles.budgetLabel}>
                Budget tracker
              </Text>
              <View style={styles.budgetValueColumn}>
                <Text variant="titleMedium" style={styles.budgetValue}>
                  {currencySymbol}
                  {itinerary.total_estimated_cost.toFixed(0)} / {currencySymbol}
                  {totalBudget.toFixed(0)}
                </Text>
                {dailyBudget != null ? (
                  <Text variant="bodySmall" style={styles.dailyBudgetText}>
                    ≈ {currencySymbol}
                    {dailyBudget.toFixed(0)} per day
                  </Text>
                ) : null}
              </View>
            </View>
            <ProgressBar
              progress={Math.min(budgetProgress, 1)}
              color={budgetProgress > 1 ? palette.coral : palette.sea}
              style={styles.progressBar}
            />
            {remainingBudget != null ? (
              <Text variant="bodySmall" style={styles.remainingText}>
                {remainingBudget >= 0
                  ? `About ${currencySymbol}${Math.abs(remainingBudget).toFixed(0)} remaining.`
                  : `Over budget by ~${currencySymbol}${Math.abs(remainingBudget).toFixed(0)}.`}
              </Text>
            ) : null}
          </View>
        ) : (
          <View style={styles.estimatedSpend}>
            <Text variant="titleMedium" style={styles.budgetLabel}>
              Estimated spend
            </Text>
            <Text variant="headlineSmall" style={styles.budgetValue}>
              {currencySymbol}
              {itinerary.total_estimated_cost.toFixed(0)}
            </Text>
          </View>
        )}
      </Surface>

      <Surface style={styles.timelineCard} elevation={2}>
        <View style={styles.daySelectorHeader}>
          <Text variant="titleMedium" style={styles.timelineTitle}>
            Daily breakdown
          </Text>
          {loading ? (
            <Chip icon="progress-clock" style={styles.loadingChip}>
              Building itinerary...
            </Chip>
          ) : null}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.daySelector}
        >
          {itinerary.days.map((day, index) => {
            const isActive = index === activeDayIndex;
            return (
              <Chip
                key={day.date}
                onPress={() => handleDayChange(index)}
                selected={isActive}
                style={[styles.dayChip, isActive && { backgroundColor: palette.sea }]}
                textStyle={isActive ? styles.dayChipTextActive : styles.dayChipText}
              >
                {day.date}
              </Chip>
            );
          })}
        </ScrollView>

        <View style={styles.daySummary}>
          <Text variant="titleMedium" style={styles.daySummaryTitle}>
            {activeDay.date}
          </Text>
          <Text variant="bodySmall" style={styles.daySummarySubtitle}>
            {activeDay.summary.totalTime} - {activeDay.summary.pace}
          </Text>
          <Text variant="bodySmall" style={styles.daySummaryDetails}>
            {activeDay.summary.stopsCount} stops - {currencySymbol}
            {activeDay.summary.estimatedSpend.toFixed(0)}
          </Text>
          <Text variant="bodySmall" style={styles.daySummaryNotes}>
            {activeDay.summary.notes}
          </Text>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.stopList}>
          {activeDay.stops.map((stop, index) => {
            const expanded = isStopExpanded(activeDayIndex, index);
            const menuVisible =
              menuTarget?.dayIndex === activeDayIndex && menuTarget.stopIndex === index;
            const isMutating =
              mutatingStop?.dayIndex === activeDayIndex &&
              mutatingStop.stopIndex === index;

            return (
              <Surface
                key={`${stop.title}-${index}`}
                style={styles.stopCard}
                elevation={1}
              >
                <View style={styles.stopHeader}>
                  {stop.photo_url ? (
                    <Image source={{ uri: stop.photo_url }} style={styles.stopImage} />
                  ) : (
                    <View
                      style={[
                        styles.stopImage,
                        styles.stopImageFallback,
                        { backgroundColor: palette.sky },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={categoryIcon[stop.category]}
                        size={28}
                        color={'#1F2937'}
                      />
                    </View>
                  )}
                  <Pressable
                    style={styles.stopHeaderContent}
                    onPress={() => toggleStop(activeDayIndex, index)}
                    disabled={!!mutatingStop}
                  >
                    <View style={styles.stopTitleRow}>
                      <Text
                        variant="titleMedium"
                        style={styles.stopTitle}
                        numberOfLines={2}
                      >
                        {stop.title}
                      </Text>
                      <MaterialCommunityIcons
                        name={expanded ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color={palette.slate}
                      />
                    </View>
                    <Text variant="bodySmall" style={styles.stopTime}>
                      {stop.time_block || 'Flexible start'} -{' '}
                      {stop.travel_time_from_previous || 'Travel TBD'}
                    </Text>
                    <View style={styles.stopBadgesRow}>
                      <Chip
                        compact
                        style={[
                          styles.badgeChip,
                          { backgroundColor: priceBadgeColor(stop.estimated_cost) },
                        ]}
                        textStyle={styles.badgeText}
                      >
                        {`${stop.estimated_cost} - ${currencySymbol}${stop.estimated_price_usd.toFixed(0)}`}
                      </Chip>
                      <Chip compact style={styles.badgeChip} textStyle={styles.badgeText}>
                        {stop.duration}
                      </Chip>
                      <Chip compact style={styles.badgeChip} textStyle={styles.badgeText}>
                        {categoryLabel[stop.category]}
                      </Chip>
                    </View>
                  </Pressable>
                  {(onRemoveStop || onReplaceStop) && (
                    <Menu
                      visible={menuVisible}
                      onDismiss={() => setMenuTarget(null)}
                      anchor={
                        isMutating ? (
                          <ActivityIndicator size="small" color={palette.slate} />
                        ) : (
                          <IconButton
                            icon="dots-vertical"
                            disabled={!!mutatingStop}
                            onPress={() =>
                              setMenuTarget({
                                dayIndex: activeDayIndex,
                                stopIndex: index,
                              })
                            }
                          />
                        )
                      }
                    >
                      {onReplaceStop ? (
                        <Menu.Item
                          leadingIcon="autorenew"
                          title="Replace this stop"
                          disabled={!!mutatingStop}
                          onPress={async () => {
                            setMenuTarget(null);
                            if (!onReplaceStop) return;
                            try {
                              await onReplaceStop(activeDayIndex, index);
                            } catch (error) {
                              console.warn('Failed to replace stop', error);
                            }
                          }}
                        />
                      ) : null}
                      {onRemoveStop ? (
                        <Menu.Item
                          leadingIcon="delete"
                          title="Remove this stop"
                          disabled={!!mutatingStop}
                          onPress={() => {
                            setMenuTarget(null);
                            if (!onRemoveStop) return;
                            try {
                              onRemoveStop(activeDayIndex, index);
                            } catch (error) {
                              console.warn('Failed to remove stop', error);
                            }
                          }}
                        />
                      ) : null}
                    </Menu>
                  )}
                </View>
                {expanded ? (
                  <View style={styles.stopBody}>
                    <Text variant="bodyMedium" style={styles.stopDescription}>
                      {stop.description || 'Details coming soon.'}
                    </Text>
                    <View style={styles.stopActions}>
                      <Button
                        mode="contained"
                        icon="map-marker"
                        onPress={() => openUrl(stop.google_maps_url)}
                      >
                        View on map
                      </Button>
                      {stop.website_url ? (
                        <Button
                          mode="outlined"
                          icon="web"
                          onPress={() => openUrl(stop.website_url)}
                        >
                          Visit website
                        </Button>
                      ) : null}
                    </View>
                  </View>
                ) : null}
              </Surface>
            );
          })}
        </View>
      </Surface>

      {onSave ? (
        <Button
          mode="contained-tonal"
          icon="content-save"
          onPress={onSave}
          loading={saving}
          disabled={saving}
          style={styles.bottomSave}
        >
          Save trip
        </Button>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    gap: 16,
    paddingBottom: 24,
  },
  summaryCard: {
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTitle: {
    fontWeight: '700',
  },
  summarySubtitle: {
    color: palette.slate,
  },
  summaryMeta: {
    color: '#334155',
  },
  weatherChip: {
    alignSelf: 'flex-start',
  },
  highlightRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  highlightChip: {
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  budgetSection: {
    marginTop: 4,
    gap: 6,
  },
  estimatedSpend: {
    marginTop: 4,
    gap: 4,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetValueColumn: {
    alignItems: 'flex-end',
  },
  budgetLabel: {
    fontWeight: '600',
  },
  budgetValue: {
    fontWeight: '600',
  },
  dailyBudgetText: {
    color: palette.slate,
    marginTop: 2,
  },
  progressBar: {
    height: 10,
    borderRadius: 8,
  },
  remainingText: {
    color: palette.slate,
  },
  timelineCard: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#ffffff',
    gap: 16,
  },
  daySelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loadingChip: {
    backgroundColor: '#E0F2FE',
  },
  daySelector: {
    flexGrow: 0,
  },
  dayChip: {
    marginRight: 8,
    backgroundColor: '#E2E8F0',
  },
  dayChipText: {
    color: '#1F2937',
  },
  dayChipTextActive: {
    color: '#0F172A',
    fontWeight: '600',
  },
  daySummary: {
    gap: 4,
  },
  daySummaryTitle: {
    fontWeight: '700',
  },
  daySummarySubtitle: {
    color: palette.slate,
  },
  daySummaryDetails: {
    color: '#1F2937',
  },
  daySummaryNotes: {
    color: '#334155',
  },
  divider: {
    marginVertical: 4,
  },
  stopList: {
    gap: 12,
  },
  stopCard: {
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
  },
  stopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  stopHeaderContent: {
    flex: 1,
    gap: 8,
  },
  stopTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stopTitle: {
    flex: 1,
    fontWeight: '600',
  },
  stopImage: {
    width: 72,
    height: 72,
    borderRadius: 14,
  },
  stopImageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopTime: {
    color: palette.slate,
  },
  stopBadgesRow: {
    flexDirection: 'row',
    gap: 6,
  },
  badgeChip: {
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
  },
  badgeText: {
    fontSize: 12,
  },
  stopBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  stopDescription: {
    color: '#1E293B',
  },
  stopActions: {
    flexDirection: 'row',
    gap: 12,
  },
  bottomSave: {
    alignSelf: 'flex-end',
  },
});

export default PlanPreview;