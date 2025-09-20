import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Header from '../components/Header';

const ProfileScreen = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <Header />
      <View style={styles.content}>
        <Text style={styles.text}>User settings</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7f5ff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  text: {
    fontSize: 18,
    color: '#4a4a68',
    textAlign: 'center',
  },
});

export default ProfileScreen;
