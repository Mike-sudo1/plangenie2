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
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';

import ExploreScreen from './src/screens/ExploreScreen';
import PlanScreen from './src/screens/PlanScreen';
import ProfileScreen from './src/screens/ProfileScreen';

type TabParamList = {
  Plan: undefined;
  Explore: undefined;
  Profile: undefined;
};

type TabRouteName = keyof TabParamList;

type FeatherIconName = keyof typeof Feather.glyphMap;

const TAB_ICONS: Record<TabRouteName, FeatherIconName> = {
  Plan: 'calendar',
  Explore: 'compass',
  Profile: 'user',
};

const pastelTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#f7f5ff',
    card: '#fcefee',
    border: '#e8def8',
    text: '#4a4a68',
  },
};

const Tab = createBottomTabNavigator<TabParamList>();

const App = () => {
  return (
    <NavigationContainer theme={pastelTheme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: '#6d597a',
          tabBarInactiveTintColor: '#a09db5',
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
          tabBarStyle: {
            backgroundColor: '#fcefee',
            borderTopColor: '#e8def8',
            height: 64,
            paddingVertical: 8,
          },
          tabBarIcon: ({ color, size }) => {
            const iconName = TAB_ICONS[route.name as TabRouteName];
            return <Feather name={iconName} size={size} color={color} />;
          },
          sceneContainerStyle: {
            backgroundColor: '#f7f5ff',
          },
        })}
      >
        <Tab.Screen name="Plan" component={PlanScreen} />
        <Tab.Screen name="Explore" component={ExploreScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default App;
