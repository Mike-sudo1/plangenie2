import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';

import { useAuth } from '../providers/AuthProvider';
import { useAppTheme } from '../providers/ThemeProvider';
import MainTabs from './MainTabs';
import AuthScreen from '../screens/auth/AuthScreen';

type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const { user, initializing } = useAuth();
  const { paperTheme } = useAppTheme();

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator animating color={paperTheme.colors.primary} size="large" />
        <Text style={{ marginTop: 16, color: paperTheme.colors.onBackground }}>
          Loading your experience...
        </Text>
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <Stack.Screen name="Auth" component={AuthScreen} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
