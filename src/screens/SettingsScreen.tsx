import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAuth } from '../context/AuthContext';

const SettingsScreen = () => {
  const { session, signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut();
    } catch (err) {
      Alert.alert('Sign out failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>PlanGenie</Text>
      <Text style={styles.title}>Settings</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account</Text>
        <Text style={styles.label}>Signed in as</Text>
        <Text style={styles.value}>{session?.user.email ?? 'Unknown user'}</Text>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSignOut}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Signing out...' : 'Log out'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 120,
    backgroundColor: '#f5f3ff',
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    color: '#443a78',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#5a4db2',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#ded7ff',
    shadowColor: '#1d163a',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#473b8b',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4d438f',
    marginBottom: 6,
  },
  value: {
    fontSize: 15,
    color: '#61579d',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#6b5fd6',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SettingsScreen;
