import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { RatingModal } from './src/Components/RatingModal';
import theme from './src/utils/Theme';

export default function AppSimple() {
  const [modalVisible, setModalVisible] = useState(false);
  const [ratingInput, setRatingInput] = useState('');
  
  const sampleMovie = {
    id: 1,
    title: "Sample Movie",
    poster_path: "/sample.jpg",
    vote_average: 7.5,
    genre_ids: [28, 12]
  };

  const genres = {
    28: "Action",
    12: "Adventure"
  };

  const colors = theme.movie.light;

  const handleSubmit = () => {
    console.log('Rating submitted:', ratingInput);
    setModalVisible(false);
    setRatingInput('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Rating Modal Test</Text>
        <Text style={styles.subtitle}>Test the fixed rating button positioning</Text>
        
        <TouchableOpacity 
          style={styles.testButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.buttonText}>Test Rating Modal</Text>
        </TouchableOpacity>
      </View>

      <RatingModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmit}
        movie={sampleMovie}
        ratingInput={ratingInput}
        setRatingInput={setRatingInput}
        slideAnim={0}
        mediaType="movie"
        isDarkMode={false}
        theme={theme}
        genres={genres}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  testButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});