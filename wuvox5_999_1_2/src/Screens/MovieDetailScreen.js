import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, ActivityIndicator } from 'react-native';
import { useRoute } from '@react-navigation/native';

export default function MovieDetailScreen() {
  const { params: { movieId, movieTitle } } = useRoute();
  const [details, setDetails] = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}&language=en-US`)
      .then(r => r.json())
      .then(data => setDetails(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [movieId]);

  if (loading) return <ActivityIndicator style={{flex:1}} />;

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize:24, fontWeight:'bold' }}>{movieTitle}</Text>
      {details.poster_path && (
        <Image
          source={{ uri:`https://image.tmdb.org/t/p/w342${details.poster_path}` }}
          style={{ width:'100%', height:300, marginVertical:16 }}
        />
      )}
      <Text style={{ lineHeight:22 }}>{details.overview}</Text>
      {/* add more fields as you like */}
    </ScrollView>
  );
}