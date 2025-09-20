import { DefaultTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { MD3LightTheme, Provider as PaperProvider } from 'react-native-paper';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import BottomTabs, { pastelPalette } from './src/navigation/BottomTabs';
import AuthScreen from './src/screens/AuthScreen';

const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6b5fd6',
    secondary: '#978fd1',
    tertiary: '#f0addc',
    background: '#f5f3ff',
    surface: '#ffffff',
    surfaceVariant: '#ebe6ff',
    outline: '#d4cef6',
  },
};

const navigationTheme: Theme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    primary: pastelPalette.active,
    background: pastelPalette.background,
    card: '#ffffff',
    text: '#1f1b3d',
    border: pastelPalette.border,
    notification: pastelPalette.active,
  },
};

const RootNavigator = () => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={pastelPalette.active} />
      </View>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <BottomTabs />
    </NavigationContainer>
  );
};

const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={paperTheme}>
        <AuthProvider>
          <StatusBar style="dark" />
          <RootNavigator />
        </AuthProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: pastelPalette.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default App;
