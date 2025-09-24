import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { HomeStackParamList } from './HomeStack.types';
import HomeScreen from '../screens/HomeScreen';
import DayPlannerScreen from '../screens/DayPlannerScreen';
import PlanDetailsScreen from '../screens/PlanDetailsScreen';

const Stack = createNativeStackNavigator<HomeStackParamList>();

const HomeStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="DayPlanner"
        component={DayPlannerScreen}
        options={{ title: 'Plan Your Day' }}
      />
      <Stack.Screen
        name="PlanDetails"
        component={PlanDetailsScreen}
        options={{ title: 'Plan Details' }}
      />
    </Stack.Navigator>
  );
};

export default HomeStack;
