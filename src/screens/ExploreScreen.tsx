import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Chip } from 'react-native-paper';

const categories = ['Food', 'Nature', 'History', 'Nightlife', 'Arts', 'Family'];

const ExploreScreen = () => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredCategories = useMemo(() => {
    if (!search) {
      return categories;
    }
    return categories.filter((category) =>
      category.toLowerCase().includes(search.trim().toLowerCase())
    );
  }, [search]);

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.header}>PlanGenie</Text>
      <Text style={styles.title}>Explore destinations</Text>
      <Text style={styles.description}>
        Search for inspiration or browse curated categories to jump-start your adventure.
      </Text>
      <TextInput
        placeholder="Search destinations or activities"
        placeholderTextColor="#8c82c8"
        value={search}
        onChangeText={setSearch}
        style={styles.input}
      />
      <View style={styles.categoriesContainer}>
        {filteredCategories.map((category) => (
          <Chip
            key={category}
            selected={selectedCategory === category}
            onPress={() =>
              setSelectedCategory((prev) => (prev === category ? null : category))
            }
            style={styles.chip}
            textStyle={styles.chipText}
          >
            {category}
          </Chip>
        ))}
      </View>
      {selectedCategory ? (
        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>{selectedCategory} ideas</Text>
          <Text style={styles.previewBody}>
            Discover must-visit spots, local favorites, and hidden gems focused on {selectedCategory.toLowerCase()} experiences.
          </Text>
        </View>
      ) : null}
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
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: '#6a61a3',
    marginBottom: 20,
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
    marginBottom: 24,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  chip: {
    backgroundColor: '#ebe6ff',
  },
  chipText: {
    color: '#4a3f91',
    fontWeight: '500',
  },
  previewCard: {
    marginTop: 32,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#ded7ff',
    shadowColor: '#1d163a',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 4,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#473b8b',
    marginBottom: 8,
  },
  previewBody: {
    fontSize: 15,
    lineHeight: 22,
    color: '#61579d',
  },
});

export default ExploreScreen;
