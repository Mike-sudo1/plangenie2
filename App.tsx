import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MD3LightTheme, Provider as PaperProvider } from 'react-native-paper';

import LoadingOverlay from './src/components/LoadingOverlay';
import { ItineraryProvider, useItinerary } from './src/context/ItineraryContext';
import { RootStackParamList } from './src/navigation/types';
import HomeScreen from './src/screens/HomeScreen';
import PlanScreen from './src/screens/PlanScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6d5bd0',
    background: '#f7f2ff',
    card: '#fdf9ff',
    text: '#3e2d68',
    border: '#d7cfff',
  },
};

const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6d5bd0',
    secondary: '#d7cfff',
    tertiary: '#f28fb5',
    background: '#f7f2ff',
    surface: '#ffffff',
    surfaceVariant: '#f6edff',
    outline: '#c6bde8',
  },
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const Navigator = () => {
  const { isLoading } = useItinerary();

  return (
    <>
      <NavigationContainer theme={navigationTheme}>
        <Stack.Navigator>
          <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
          <Stack.Screen
            name="Plan"
            component={PlanScreen}
            options={{
              title: 'Your plan',
            }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              title: 'Settings',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      <LoadingOverlay visible={isLoading} />
    </>
  );
};

const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={paperTheme}>
        <ItineraryProvider>
          <StatusBar style="dark" />
          <Navigator />
        </ItineraryProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
};

export default App;
