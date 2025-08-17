import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';

/**
 * LoadingScreen component for displaying a loading indicator
 * @param {object} props - Component props
 * @param {string} props.message - Message to display
 * @param {string} props.size - Size of the activity indicator ('small' or 'large')
 * @param {object} props.style - Additional style for the container
 */
const LoadingScreen = ({ message, size = 'large', style }) => {
  const theme = useTheme();
  
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator 
        size={size} 
        color={theme.colors.primary} 
        style={styles.indicator}
      />
      {message && (
        <Text style={styles.message}>
          {message}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  indicator: {
    marginBottom: 8,
  },
  message: {
    marginTop: 8,
    textAlign: 'center',
  },
});

export default LoadingScreen;

