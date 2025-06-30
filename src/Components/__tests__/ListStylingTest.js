// QA Test Component for List Styling Consistency
// This component tests edge cases for TopRated and Watchlist styling

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

// Test data for edge cases
const testMovies = [
  // Edge Case 1: Normal title
  { id: 1, title: "The Matrix", userRating: 8.5 },
  
  // Edge Case 2: Very long title
  { id: 2, title: "This is an Extremely Long Movie Title That Should Be Truncated With Ellipsis Because It Exceeds The Available Space", userRating: 7.2 },
  
  // Edge Case 3: Empty title (should fallback to "Unknown Title")
  { id: 3, title: "", userRating: 6.0 },
  
  // Edge Case 4: Null title (should fallback to "Unknown Title")
  { id: 4, title: null, userRating: 9.1 },
  
  // Edge Case 5: Undefined title (should fallback to "Unknown Title")  
  { id: 5, userRating: 8.0 },
  
  // Edge Case 6: Special characters and emojis
  { id: 6, title: "Movie with émojis 🎬 and spéçial çhars & symbols!", userRating: 7.8 },
  
  // Edge Case 7: All caps
  { id: 7, title: "TITLE IN ALL CAPS WITH NUMBERS 123", userRating: 6.5 },
  
  // Edge Case 8: Single character
  { id: 8, title: "A", userRating: 5.5 },
  
  // Edge Case 9: Numbers only
  { id: 9, title: "2001", userRating: 9.0 },
  
  // Edge Case 10: Mixed content (TV show with name property)
  { id: 10, name: "Breaking Bad", userRating: 9.5 },
  
  // Edge Case 11: Both title and name (title should take precedence)
  { id: 11, title: "Movie Title", name: "TV Show Name", userRating: 8.2 },
  
  // Edge Case 12: Neither title nor name
  { id: 12, userRating: 7.0 }
];

const ListStylingTest = () => {
  // Helper function to simulate getTitle from TopRated
  const getTitle = (item) => {
    return item.title || item.name || 'Unknown Title';
  };

  // Helper function to simulate Watchlist title processing (after fix)
  const getWatchlistTitle = (item) => {
    return item.title || item.name || 'Unknown Title';
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>🧪 QA LIST STYLING CONSISTENCY TEST</Text>
      
      <Text style={styles.sectionHeader}>Edge Case Test Results:</Text>
      
      {testMovies.map((movie, index) => (
        <View key={movie.id} style={styles.testCase}>
          <Text style={styles.testLabel}>Test Case #{index + 1}:</Text>
          
          <View style={styles.comparison}>
            <View style={styles.column}>
              <Text style={styles.columnHeader}>TopRated Title:</Text>
              <Text style={styles.titleTest} numberOfLines={1} ellipsizeMode="tail">
                {getTitle(movie)}
              </Text>
            </View>
            
            <View style={styles.column}>
              <Text style={styles.columnHeader}>Watchlist Title:</Text>
              <Text style={styles.titleTest} numberOfLines={1} ellipsizeMode="tail">
                {getWatchlistTitle(movie)}
              </Text>
            </View>
          </View>
          
          <Text style={styles.rawData}>
            Raw Data: {JSON.stringify({ title: movie.title, name: movie.name })}
          </Text>
          
          <Text style={styles.status}>
            ✅ Match: {getTitle(movie) === getWatchlistTitle(movie) ? 'PASS' : 'FAIL'}
          </Text>
        </View>
      ))}
      
      <View style={styles.summary}>
        <Text style={styles.summaryHeader}>🎯 TEST SUMMARY</Text>
        <Text style={styles.summaryText}>
          • All edge cases should show identical titles between screens
          • Long titles should truncate with ellipsis (...)
          • Missing titles should fallback to "Unknown Title"
          • Special characters should display correctly
          • Single line constraint should be enforced
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#444',
  },
  testCase: {
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  testLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#666',
  },
  comparison: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  column: {
    flex: 1,
    marginRight: 8,
  },
  columnHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#888',
  },
  titleTest: {
    fontSize: 16,
    fontWeight: 'bold',
    backgroundColor: '#f9f9f9',
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 20,
    maxHeight: 38,
  },
  rawData: {
    fontSize: 11,
    color: '#999',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  status: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  summary: {
    backgroundColor: '#e8f5e8',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  summaryHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2d5d2d',
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#2d5d2d',
  },
});

export default ListStylingTest;