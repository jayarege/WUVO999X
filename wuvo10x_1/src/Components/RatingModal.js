import React from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  KeyboardAvoidingView, 
  Platform,
  Animated 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getModalStyles } from '../Styles/modalStyles';
import { getRatingStyles } from '../Styles/ratingStyles';

const RatingModal = ({
  visible,
  onClose,
  onSubmit,
  movie,
  ratingInput,
  setRatingInput,
  slideAnim,
  mediaType,
  isDarkMode,
  theme,
  genres
}) => {
  const modalStyles = getModalStyles(mediaType, isDarkMode ? 'dark' : 'light', theme);
  const ratingStyles = getRatingStyles(mediaType, isDarkMode ? 'dark' : 'light', theme);
  const colors = theme[mediaType][isDarkMode ? 'dark' : 'light'];

  const handleTextChange = (text) => {
    if (text === '' || text === '.' || text === '10' || text === '10.0') {
      setRatingInput(text);
    } else {
      const value = parseFloat(text);
      if (!isNaN(value) && value >= 1 && value <= 10) {
        if (text.includes('.')) {
          const parts = text.split('.');
          if (parts[1].length > 1) {
            setRatingInput(parts[0] + '.' + parts[1].substring(0, 1));
          } else {
            setRatingInput(text);
          }
        } else {
          setRatingInput(text);
        }
      }
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={modalStyles.modalOverlay}>
          <Animated.View
            style={[
              modalStyles.modalContent,
              { 
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <LinearGradient
              colors={colors.primaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ flex: 1, borderRadius: 20, justifyContent: 'space-between' }}
            >
              <View style={ratingStyles.modalContentContainer}>
                <View style={modalStyles.modalHandle} />
                
                {/* Movie Info */}
                <View style={ratingStyles.modalMovieInfo}>
                  <Image 
                    source={{ uri: `https://image.tmdb.org/t/p/w500${movie?.poster_path}` }} 
                    style={ratingStyles.modalPoster}
                    resizeMode="cover"
                  />
                  <View style={ratingStyles.modalMovieDetails}>
                    <Text style={ratingStyles.modalMovieTitle}>
                      {movie?.title || movie?.name}
                    </Text>
                    
                    <View style={ratingStyles.genreTextContainer}>
                      <Text style={[ratingStyles.modalGenres, { color: '#FFFFFF' }]}>
                        {movie?.genre_ids?.length > 0 ? genres[movie.genre_ids[0]] || '' : ''}
                      </Text>
                    </View>
                    
                    <View style={ratingStyles.ratingDisplay}>
                      <Ionicons name="star" size={16} color={colors.accent} />
                      <Text style={{ color: colors.accent, marginLeft: 4 }}>
                        TMDb: {movie?.vote_average?.toFixed(1) || '0.0'}
                      </Text>
                    </View>
                  </View>
                </View>
                
                {/* Rating input */}
                <TextInput
                  style={[ratingStyles.ratingInput, { marginTop: 20, marginBottom: 10 }]}
                  value={ratingInput}
                  onChangeText={handleTextChange}
                  keyboardType="decimal-pad"
                  placeholder="Enter rating"
                  placeholderTextColor={colors.subText}
                  maxLength={4}
                  autoFocus={true}
                  selectTextOnFocus={true}
                  blurOnSubmit={false}
                />
                
                <Text style={[ratingStyles.ratingLabel, { marginBottom: 20 }]}>
                  Your Rating (1.0-10.0):
                </Text>
              </View>
              
              {/* Modal buttons */}
              <View style={ratingStyles.fixedButtonsContainer}>
                <TouchableOpacity
                  style={[modalStyles.modalButton, { backgroundColor: colors.accent }]}
                  onPress={onSubmit}
                >
                  <Text style={[
                    modalStyles.modalButtonText,
                    { color: colors.background, fontWeight: '600' }
                  ]}>
                    Submit
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[modalStyles.modalButton, modalStyles.cancelButton]}
                  onPress={onClose}
                >
                  <Text style={[modalStyles.modalButtonText, { color: colors.text }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export { RatingModal };