import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
  TouchableOpacity,
} from 'react-native';
import { Button, HelperText, Text, TextInput, useTheme } from 'react-native-paper';

import { useAuth } from '../../providers/AuthProvider';

const AuthScreen = () => {
  const theme = useTheme();
  const { signIn, signUp } = useAuth();
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const onSubmit = async () => {
    setErrorMessage(null);
    setInfoMessage(null);

    if (!email || !password) {
      setErrorMessage('Please enter your email and password to continue.');
      return;
    }

    if (isCreatingAccount && password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      if (isCreatingAccount) {
        const data = await signUp(email.trim().toLowerCase(), password);
        if (!data.session) {
          setInfoMessage('Check your inbox to confirm your email before signing in.');
        }
      } else {
        await signIn(email.trim().toLowerCase(), password);
      }
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text variant="headlineMedium" style={styles.title}>
          {isCreatingAccount ? 'Join PlanGenie' : 'Welcome back'}
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          {isCreatingAccount
            ? 'Craft smart itineraries in minutes. Create your free account to get started!'
            : 'Sign in to access your personalized travel plans and insights.'}
        </Text>

        <TextInput
          label="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          style={styles.input}
        />
        <TextInput
          label="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          mode="outlined"
          style={styles.input}
        />
        {isCreatingAccount && (
          <TextInput
            label="Confirm password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            mode="outlined"
            style={styles.input}
          />
        )}

        {errorMessage && (
          <HelperText type="error" visible>
            {errorMessage}
          </HelperText>
        )}

        {infoMessage && (
          <HelperText type="info" visible>
            {infoMessage}
          </HelperText>
        )}

        <Button
          mode="contained"
          onPress={onSubmit}
          loading={loading}
          disabled={loading}
          style={styles.submit}
        >
          {isCreatingAccount ? 'Create account' : 'Sign in'}
        </Button>

        <TouchableOpacity
          onPress={() => {
            setErrorMessage(null);
            setInfoMessage(null);
            setIsCreatingAccount((prev) => !prev);
          }}
          style={styles.switcher}
        >
          <Text style={{ color: theme.colors.primary }}>
            {isCreatingAccount
              ? 'Already have an account? Sign in'
              : "New here? Let's create your account"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    gap: 12,
  },
  title: {
    fontWeight: '700',
  },
  subtitle: {
    marginBottom: 8,
  },
  input: {
    marginTop: 4,
  },
  submit: {
    marginTop: 12,
  },
  switcher: {
    marginTop: 8,
    alignItems: 'center',
  },
});

export default AuthScreen;
