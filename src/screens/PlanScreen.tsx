import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Header from '../components/Header';

const PlanScreen = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <Header />
      <View style={styles.content}>
        <Text style={styles.text}>Plan your day here</Text>
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

export default PlanScreen;
