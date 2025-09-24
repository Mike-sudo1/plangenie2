import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Chip,
  Surface,
  Text,
  TouchableRipple,
  useTheme,
} from "react-native-paper";
import {
  CompositeNavigationProp,
  useNavigation,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";

import { HomeStackParamList } from "../navigation/HomeStack.types";
import { TabParamList } from "../navigation/MainTabs";
import { TripItinerary } from "../types/plans";
import { supabase } from "../lib/supabase";
import { GOOGLE_API_KEY } from "../lib/env";

const LAST_DESTINATION_KEY = "plangenie.last-destination";
const LOCATION_ERROR_MESSAGE = "Couldn't get your location. Try again later.";

type HomeScreenNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList, "Home">,
  BottomTabNavigationProp<TabParamList>
>;

type SupabaseItineraryRow = {
  id: string;
  trip_name: string;
  destination: string;
  start_date: string;
  end_date: string;
  itinerary_data: TripItinerary | null;
};

type RecommendedPlan = {
  id: string;
  itinerary: TripItinerary;
  destination: string;
  startDate: string;
  endDate: string;
};

const extractTags = (itinerary: TripItinerary) => {
  const tagSet = new Set<string>();
  itinerary.days?.forEach((day) => {
    day.stops?.forEach((stop) => {
      if (stop?.category) {
        tagSet.add(stop.category);
      }
    });
  });
  return Array.from(tagSet).slice(0, 3);
};

const parseDurationToMinutes = (value?: string | null) => {
  if (!value) return 0;
  const hourMatch = value.match(/(\d+)\s*h/);
  const minuteMatch = value.match(/(\d+)\s*m/);
  const hours = hourMatch ? Number(hourMatch[1]) : 0;
  const minutes = minuteMatch ? Number(minuteMatch[1]) : 0;
  return hours * 60 + minutes;
};

const formatDurationLabel = (minutes: number) => {
  if (!minutes) return null;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs && mins) return `${hrs}h ${mins}m`;
  if (hrs) return `${hrs}h`;
  return `${mins}m`;
};

const HomeScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const backgroundColor = theme.colors?.background ?? "#f9fafb";
  const cardColor = theme.colors?.surface ?? "#ffffff";

  const [city, setCity] = useState<string | null>(null);
  const [recommendedPlans, setRecommendedPlans] = useState<RecommendedPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const todayLabel = useMemo(() => {
    return new Intl.DateTimeFormat(undefined, {
      month: "long",
      day: "numeric",
    }).format(new Date());
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadNearbyPlans = async () => {
      if (!isMounted) return;

      setLoading(true);
      setLocationError(null);
      setRecommendedPlans([]);

      try {
        if (GOOGLE_API_KEY) {
          try {
            await Location.setGoogleApiKey(GOOGLE_API_KEY);
          } catch (err) {
            console.warn("Unable to set Google API key for Location", err);
          }
        }

        const permission = await Location.requestForegroundPermissionsAsync();
        if (!isMounted) return;

        if (permission.status !== "granted") {
          setCity(null);
          setLocationError(LOCATION_ERROR_MESSAGE);
          return;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (!isMounted) return;

        const [place] = await Location.reverseGeocodeAsync(position.coords);
        if (!isMounted) return;

        const detectedCity = place?.city || place?.subregion || null;

        if (!detectedCity) {
          setCity(null);
          setLocationError(LOCATION_ERROR_MESSAGE);
          return;
        }

        setCity(detectedCity);
        await AsyncStorage.setItem(LAST_DESTINATION_KEY, detectedCity);

        const { data, error } = await supabase
          .from("itineraries")
          .select("id, trip_name, destination, start_date, end_date, itinerary_data")
          .ilike("destination", `%${detectedCity}%`)
          .limit(10);

        if (!isMounted) return;

        if (error) {
          throw error;
        }

        const rows = (data ?? []) as SupabaseItineraryRow[];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const filtered = rows.reduce<RecommendedPlan[]>((acc, row) => {
          if (!row.itinerary_data) {
            return acc;
          }

          const start = new Date(row.start_date);
          const end = new Date(row.end_date);

          if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
            return acc;
          }

          start.setHours(0, 0, 0, 0);
          end.setHours(0, 0, 0, 0);

          if (start <= today && today <= end) {
            acc.push({
              id: row.id,
              itinerary: row.itinerary_data,
              destination: row.destination,
              startDate: row.start_date,
              endDate: row.end_date,
            });
          }

          return acc;
        }, []);

        setRecommendedPlans(filtered);
      } catch (err) {
        console.warn("Failed to load recommended plans", err);
        if (!isMounted) return;

        setLocationError(LOCATION_ERROR_MESSAGE);
        setCity(null);
        setRecommendedPlans([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadNearbyPlans();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleNavigatePlanner = (mode: "day" | "trip") => {
    const todayIso = new Date().toISOString();
    const parent = navigation.getParent<BottomTabNavigationProp<TabParamList>>();
    parent?.navigate("Planner", {
      mode,
      startDate: todayIso,
      endDate: mode === "trip" ? undefined : todayIso,
    });
  };

  const renderPlanCard = (plan: RecommendedPlan) => {
    const totalStops =
      plan.itinerary.days?.reduce((total, day) => {
        if (!day?.stops) return total;
        return total + day.stops.length;
      }, 0) ?? 0;

    const totalMinutes =
      plan.itinerary.days?.reduce((total, day) => {
        return total + parseDurationToMinutes(day?.summary?.totalTime);
      }, 0) ?? 0;

    const durationLabel = formatDurationLabel(totalMinutes) ?? "Flexible timing";
    const tags = extractTags(plan.itinerary);

    return (
      <TouchableRipple
        key={plan.id}
        onPress={() =>
          navigation.navigate("PlanDetails", {
            itinerary: plan.itinerary,
            planId: plan.id,
          })
        }
        style={styles.planTouchable}
        borderless={false}
      >
        <Surface
          style={[styles.planCard, styles.shadow, { backgroundColor: cardColor }]}
          elevation={1}
        >
          <Text variant="titleMedium" style={[styles.planTitle, { color: theme.colors.onSurface }]}>
            {plan.itinerary.trip_name}
          </Text>
          <Text
            variant="bodyMedium"
            style={[styles.planSubtitle, { color: theme.colors.onSurfaceVariant }]}
          >
            {totalStops} stops | {durationLabel}
          </Text>
          <Text
            variant="bodySmall"
            style={[styles.planDestination, { color: theme.colors.primary }]}
          >
            {plan.destination}
          </Text>
          {tags.length > 0 ? (
            <View style={styles.tagRow}>
              {tags.map((tag) => (
                <Chip key={tag} compact style={styles.tagChip}>
                  {tag}
                </Chip>
              ))}
            </View>
          ) : null}
        </Surface>
      </TouchableRipple>
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text
          variant="titleLarge"
          style={[styles.headerTitle, { color: theme.colors.onBackground }]}
        >
          Plan your next adventure
        </Text>
        <Text
          variant="bodyMedium"
          style={[styles.headerSubtitle, { color: theme.colors.onSurfaceVariant }]}
        >
          Your AI travel assistant
        </Text>
      </View>

      <Surface
        style={[styles.actionsSurface, styles.shadow, { backgroundColor: cardColor }]}
        elevation={2}
      >
        <View style={styles.actionsRow}>
          <TouchableRipple
            style={[styles.actionButton, styles.actionButtonSpacing, { backgroundColor: theme.colors.primary }]}
            onPress={() => handleNavigatePlanner("day")}
            borderless={false}
          >
            <Text style={styles.actionLabel}>Plan Your Day</Text>
          </TouchableRipple>
          <TouchableRipple
            style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => handleNavigatePlanner("trip")}
            borderless={false}
          >
            <Text style={styles.actionLabel}>Plan Your Trip</Text>
          </TouchableRipple>
        </View>
      </Surface>

      <View style={styles.recommendedHeader}>
        <Text
          variant="titleMedium"
          style={[styles.sectionTitle, { color: theme.colors.onBackground }]}
        >
          {`Recommended for Today${city ? ` in ${city}` : ""}`}
        </Text>
        <Text
          variant="bodySmall"
          style={[styles.sectionSubtitle, { color: theme.colors.onSurfaceVariant }]}
        >
          {todayLabel}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.stateIndicator} animating />
      ) : locationError ? (
        <Text
          variant="bodyMedium"
          style={[styles.stateText, { color: theme.colors.onSurfaceVariant }]}
        >
          {LOCATION_ERROR_MESSAGE}
        </Text>
      ) : recommendedPlans.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>???</Text>
          <Text
            variant="bodyMedium"
            style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}
          >
            No plans found nearby today. Try saving a location or checking back later!
          </Text>
        </View>
      ) : (
        <View style={styles.planList}>{recommendedPlans.map(renderPlanCard)}</View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 24,
    paddingBottom: 48,
    paddingHorizontal: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  headerTitle: {
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  headerSubtitle: {
    textAlign: "center",
  },
  actionsSurface: {
    borderRadius: 20,
    padding: 16,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  actionButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonSpacing: {
    marginRight: 12,
  },
  actionLabel: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 16,
  },
  recommendedHeader: {
    marginTop: 32,
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: "600",
    fontSize: 20,
  },
  sectionSubtitle: {
    marginTop: 4,
  },
  planList: {
    marginBottom: 12,
  },
  planTouchable: {
    borderRadius: 18,
    marginBottom: 12,
  },
  planCard: {
    borderRadius: 18,
    padding: 16,
  },
  planTitle: {
    fontWeight: "600",
    marginBottom: 4,
  },
  planSubtitle: {
    marginBottom: 6,
  },
  planDestination: {
    marginBottom: 12,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tagChip: {
    marginRight: 6,
    marginBottom: 6,
    backgroundColor: "#f1f5f9",
  },
  stateIndicator: {
    marginTop: 24,
  },
  stateText: {
    marginTop: 16,
    textAlign: "center",
  },
  emptyState: {
    marginTop: 32,
    alignItems: "center",
    paddingHorizontal: 12,
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  emptyText: {
    textAlign: "center",
    lineHeight: 20,
  },
  shadow: {
    elevation: 3,
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
});

export default HomeScreen;
