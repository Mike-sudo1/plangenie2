import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, List, Menu, Surface, Switch, useTheme } from 'react-native-paper';
import { TimePickerModal } from 'react-native-paper-dates';
import Constants from 'expo-constants';

import { useAuth } from '../providers/AuthProvider';
import { useAppTheme } from '../providers/ThemeProvider';
import { useCurrency, currencyOptions } from '../providers/CurrencyProvider';

const SettingsScreen = () => {
  const theme = useTheme();
  const { user, signOut } = useAuth();
  const { mode, toggleTheme } = useAppTheme();
  const { currency, setCurrency } = useCurrency();
  const [currencyMenuVisible, setCurrencyMenuVisible] = useState(false);

  const appInfo = useMemo(
    () => ({ version: Constants.expoConfig?.version ?? '1.0.0' }),
    [],
  );

  const handleCurrencySelect = async (value: string) => {
    setCurrencyMenuVisible(false);
    if (value === currency) return;
    await setCurrency(value as typeof currency);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Surface style={styles.surface} elevation={1}>
        <List.Section>
          <List.Subheader>Account</List.Subheader>
          <List.Item
            title={user?.email ?? 'Unknown user'}
            description="Signed in"
            left={(props) => <List.Icon {...props} icon="account-circle" />}
          />
        </List.Section>

        <List.Section>
          <List.Subheader>Preferences</List.Subheader>
          <List.Item
            title="Dark mode"
            description="Toggle between light and dark themes"
            right={() => <Switch value={mode === 'dark'} onValueChange={toggleTheme} />}
            left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
          />
          <Menu
            visible={currencyMenuVisible}
            onDismiss={() => setCurrencyMenuVisible(false)}
            anchor={
              <List.Item
                title="Currency"
                description={currency}
                left={(props) => <List.Icon {...props} icon="currency-usd" />}
                right={() => (
                  <Button mode="text" onPress={() => setCurrencyMenuVisible(true)}>
                    Change
                  </Button>
                )}
              />
            }
          >
            {currencyOptions.map((option) => (
              <Menu.Item
                key={option.value}
                title={option.label}
                onPress={() => handleCurrencySelect(option.value)}
              />
            ))}
          </Menu>
        </List.Section>

        <List.Section>
          <List.Subheader>About</List.Subheader>
          <List.Item
            title={`Version ${appInfo.version}`}
            description="PlanGenie2 powered by Expo"
            left={(props) => <List.Icon {...props} icon="information" />}
          />
        </List.Section>
      </Surface>

      <Button
        mode="contained-tonal"
        icon="logout"
        onPress={() => {
          void signOut();
        }}
      >
        Log out
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  surface: {
    borderRadius: 16,
    paddingVertical: 8,
  },
});

export default SettingsScreen;




