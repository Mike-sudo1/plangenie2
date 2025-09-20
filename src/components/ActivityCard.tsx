import { memo, useCallback } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, Text } from 'react-native-paper';

type ActivityCardProps = {
  timeOfDay: string;
  title: string;
  description: string;
  location?: string;
  costEstimate?: number;
  mapsLink?: string;
  weatherNote?: string;
  surprise?: boolean;
};

const ActivityCard = ({
  timeOfDay,
  title,
  description,
  location,
  costEstimate,
  mapsLink,
  weatherNote,
  surprise,
}: ActivityCardProps) => {
  const openMaps = useCallback(() => {
    if (!mapsLink) {
      return;
    }

    Linking.openURL(mapsLink).catch(() => {
      // no-op: we optimistically try to open the link, but don't crash if it fails
    });
  }, [mapsLink]);

  return (
    <Card style={styles.card} mode="elevated">
      <Card.Content style={styles.content}>
        <View style={styles.headerRow}>
          <Chip compact style={styles.timeChip} textStyle={styles.timeChipText}>
            {timeOfDay}
          </Chip>
          {surprise ? (
            <Chip icon="star-four-points" compact style={styles.surpriseChip} textStyle={styles.surpriseText}>
              Surprise
            </Chip>
          ) : null}
        </View>
        <Text variant="titleMedium" style={styles.title}>
          {title}
        </Text>
        <Text variant="bodyMedium" style={styles.description}>
          {description}
        </Text>
        {location ? (
          <Text variant="bodyMedium" style={styles.meta}>
            📍 {location}
          </Text>
        ) : null}
        {weatherNote ? (
          <Text variant="bodySmall" style={styles.weather}>
            ☁️ {weatherNote}
          </Text>
        ) : null}
        {typeof costEstimate === 'number' ? (
          <Text variant="bodySmall" style={styles.meta}>
            💸 Estimated cost: {costEstimate.toFixed(0)}
          </Text>
        ) : null}
        {mapsLink ? (
          <Button mode="outlined" onPress={openMaps} style={styles.mapButton} icon="map">
            Open in Maps
          </Button>
        ) : null}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    backgroundColor: '#fff9ff',
  },
  content: {
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeChip: {
    backgroundColor: '#e8d9ff',
  },
  timeChipText: {
    color: '#5c3d8f',
    fontWeight: '600',
  },
  surpriseChip: {
    backgroundColor: '#ffe6f7',
  },
  surpriseText: {
    color: '#c2185b',
    fontWeight: '600',
  },
  title: {
    color: '#3e3061',
  },
  description: {
    color: '#574475',
  },
  meta: {
    color: '#61597d',
  },
  weather: {
    color: '#2c6b8f',
  },
  mapButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
});

export default memo(ActivityCard);
