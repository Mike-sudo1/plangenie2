import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { useMemo } from 'react';

import ExploreScreen from '../screens/ExploreScreen';
import PlanScreen from '../screens/PlanScreen';
import SettingsScreen from '../screens/SettingsScreen';

export type RootTabParamList = {
  Explore: undefined;
  Plan: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export const pastelPalette = {
  background: '#f5f3ff',
  active: '#6b5fd6',
  inactive: '#978fd1',
  border: '#d4cef6',
};

const BottomTabs = () => {
  const screenOptions = useMemo(
    () => ({
      headerShown: false,
      tabBarActiveTintColor: pastelPalette.active,
      tabBarInactiveTintColor: pastelPalette.inactive,
      tabBarStyle: {
        backgroundColor: pastelPalette.background,
        borderTopColor: pastelPalette.border,
        height: 72,
        paddingBottom: 12,
        paddingTop: 8,
      },
    }),
    []
  );

  return (
    <Tab.Navigator screenOptions={screenOptions} initialRouteName="Plan">
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{
          tabBarLabel: 'Explore',
          tabBarIcon: ({ color, size }) => <Feather name="compass" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Plan"
        component={PlanScreen}
        options={{
          tabBarLabel: 'Plan',
          tabBarIcon: ({ color, size }) => <Feather name="calendar" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <Feather name="user" color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
};

export default BottomTabs;
