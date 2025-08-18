import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * ErrorMessage component for displaying error states
 * @param {object} props - Component props
 * @param {string} props.message - Error message to display
 * @param {function} props.onRetry - Function to call when retry button is pressed
 * @param {object} props.style - Additional style for the container
 */
const ErrorMessage = ({ message, onRetry, style }) => {
  const theme = useTheme();
  
  return (
    <View style={[styles.container, style]}>
      <MaterialCommunityIcons 
        name="alert-circle-outline" 
        size={48} 
        color={theme.colors.error} 
        style={styles.icon}
      />
      <Text style={[styles.title, { color: theme.colors.error }]}>
        Something went wrong
      </Text>
      <Text style={styles.message}>
        {message || 'An error occurred. Please try again.'}
      </Text>
      {onRetry && (
        <Button 
          mode="contained" 
          onPress={onRetry}
          style={styles.button}
        >
          Try Again
        </Button>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.7,
  },
  button: {
    marginTop: 8,
  },
});

export default ErrorMessage;

