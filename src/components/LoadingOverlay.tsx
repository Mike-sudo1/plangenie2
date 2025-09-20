import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Portal, Surface, Text } from 'react-native-paper';

type LoadingOverlayProps = {
  visible: boolean;
  message?: string;
};

const LoadingOverlay = ({ visible, message = 'Generating your itinerary…' }: LoadingOverlayProps) => {
  if (!visible) {
    return null;
  }

  return (
    <Portal>
      <View style={styles.backdrop} pointerEvents="none">
        <Surface style={styles.surface} elevation={4}>
          <ActivityIndicator animating size="large" color="#7b5cd6" />
          <Text variant="titleMedium" style={styles.message}>
            {message}
          </Text>
        </Surface>
      </View>
    </Portal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(32, 17, 63, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  surface: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    gap: 12,
  },
  message: {
    textAlign: 'center',
    color: '#51367a',
  },
});

export default LoadingOverlay;
