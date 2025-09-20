import { StyleSheet } from 'react-native';
import { Banner } from 'react-native-paper';

type ErrorBannerProps = {
  message?: string | null;
  onDismiss?: () => void;
};

const ErrorBanner = ({ message, onDismiss }: ErrorBannerProps) => {
  return (
    <Banner
      visible={Boolean(message)}
      icon="alert-circle"
      actions={onDismiss ? [{ label: 'Dismiss', onPress: onDismiss }] : []}
      style={styles.banner}
    >
      {message}
    </Banner>
  );
};

const styles = StyleSheet.create({
  banner: {
    marginBottom: 16,
    backgroundColor: '#ffe8ec',
  },
});

export default ErrorBanner;
