import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * EmptyState component for displaying when no data is available
 * @param {object} props - Component props
 * @param {string} props.icon - MaterialCommunityIcons icon name
 * @param {string} props.message - Main message to display
 * @param {string} props.suggestion - Suggestion text to display
 * @param {object} props.style - Additional style for the container
 */
const EmptyState = ({ icon, message, suggestion, style }) => {
  const theme = useTheme();
  
  return (
    <View style={[styles.container, style]}>
      <MaterialCommunityIcons 
        name={icon || 'information-outline'} 
        size={48} 
        color={theme.colors.disabled} 
        style={styles.icon}
      />
      <Text style={[styles.message, { color: theme.colors.text }]}>
        {message || 'No data available'}
      </Text>
      {suggestion && (
        <Text style={[styles.suggestion, { color: theme.colors.placeholder }]}>
          {suggestion}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  icon: {
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  suggestion: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
});

export default EmptyState;

