import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
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
