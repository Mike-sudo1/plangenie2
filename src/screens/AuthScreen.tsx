import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAuth } from '../context/AuthContext';

const AuthScreen = () => {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        await signUp(email, password);
        setMessage('Account created! Check your inbox to confirm your email.');
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.header}>PlanGenie</Text>
        <Text style={styles.title}>{isSignUp ? 'Create an account' : 'Welcome back'}</Text>
        <Text style={styles.subtitle}>
          {isSignUp
            ? 'Start planning unforgettable days by creating your PlanGenie profile.'
            : 'Sign in to access your personalized itineraries.'}
        </Text>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor="#8c82c8"
          />
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            placeholder="At least 6 characters"
            placeholderTextColor="#8c82c8"
          />
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {message ? <Text style={styles.message}>{message}</Text> : null}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>{isSignUp ? 'Create account' : 'Sign in'}</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsSignUp((prev) => !prev)} style={styles.switcher}>
          <Text style={styles.switcherText}>
            {isSignUp ? 'Already have an account? Sign in' : "New here? Create an account"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 100,
    paddingBottom: 60,
    backgroundColor: '#f5f3ff',
  },
  header: {
    fontSize: 32,
    fontWeight: '700',
    color: '#443a78',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#5a4db2',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6a61a3',
    marginBottom: 32,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4d438f',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 16,
    color: '#211b3a',
    borderWidth: 1,
    borderColor: '#ded7ff',
  },
  error: {
    color: '#c84f66',
    marginBottom: 16,
    fontSize: 14,
  },
  message: {
    color: '#4f9f8c',
    marginBottom: 16,
    fontSize: 14,
  },
  button: {
    backgroundColor: '#6b5fd6',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    shadowColor: '#1d163a',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  switcher: {
    marginTop: 20,
    alignItems: 'center',
  },
  switcherText: {
    color: '#4d438f',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default AuthScreen;
