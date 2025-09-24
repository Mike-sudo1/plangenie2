import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import HomeStack from './HomeStack';
import PlannerScreen from '../screens/PlannerScreen';
import SavedPlansScreen from '../screens/SavedPlansScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { useAppTheme } from '../providers/ThemeProvider';

export type TabParamList = {
  Home: undefined;
  Planner: { destination?: string; startDate?: string; endDate?: string; mode?: "day" | "trip" } | undefined;
  SavedPlans: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

const MainTabs = () => {
  const { paperTheme } = useAppTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: paperTheme.colors.primary,
        tabBarInactiveTintColor: paperTheme.colors.outline,
        tabBarStyle: {
          backgroundColor: paperTheme.colors.surface,
          borderTopColor: paperTheme.colors.surfaceVariant,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof MaterialCommunityIcons.glyphMap = 'home';

          if (route.name === 'Home') iconName = 'home-heart';
          if (route.name === 'Planner') iconName = 'map-search';
          if (route.name === 'SavedPlans') iconName = 'bookmark-multiple';
          if (route.name === 'Settings') iconName = 'cog';

          return <MaterialCommunityIcons name={iconName} color={color} size={size} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Planner" component={PlannerScreen} />
      <Tab.Screen
        name="SavedPlans"
        component={SavedPlansScreen}
        options={{ title: 'Saved Plans' }}
      />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

export default MainTabs;


