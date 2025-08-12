import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, Title, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../theme/theme';

const AdsScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>🚀 Ads Management</Title>
            <Text style={styles.description}>
              Create and manage your advertising campaigns with AI-powered optimization.
            </Text>
            <Text style={styles.comingSoon}>Coming Soon!</Text>
            <Button mode="contained" onPress={() => {}} style={styles.button}>
              Create First Campaign
            </Button>
          </Card.Content>
        </Card>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
    justifyContent: 'center',
  },
  card: {
    ...theme.shadows.medium,
  },
  title: {
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    color: theme.colors.primary,
  },
  description: {
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    color: theme.colors.textSecondary,
  },
  comingSoon: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.tertiary,
    marginBottom: theme.spacing.lg,
  },
  button: {
    marginTop: theme.spacing.md,
  },
});

export default AdsScreen;

