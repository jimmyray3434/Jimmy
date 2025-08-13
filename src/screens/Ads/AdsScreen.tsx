import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Title, Button, Divider, List, Chip, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createStackNavigator } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

import AIFeaturesScreen from './AIFeatures/AIFeaturesScreen';
import { theme } from '../../theme/theme';

const Stack = createStackNavigator();

const AdsHomeScreen: React.FC = () => {
  const navigation = useNavigation();
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.title}>🚀 Ads Management</Title>
              <Text style={styles.description}>
                Create and manage your advertising campaigns with AI-powered optimization.
              </Text>
              
              <Divider style={styles.divider} />
              
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>0</Text>
                  <Text style={styles.statLabel}>Active Campaigns</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>0</Text>
                  <Text style={styles.statLabel}>Total Impressions</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>$0</Text>
                  <Text style={styles.statLabel}>Total Spend</Text>
                </View>
              </View>
              
              <Button 
                mode="contained" 
                onPress={() => {}} 
                style={styles.button}
                icon="plus"
              >
                Create Campaign
              </Button>
            </Card.Content>
          </Card>
          
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.aiHeaderContainer}>
                <Title style={styles.aiTitle}>🤖 AI-Powered Features</Title>
                <Chip mode="outlined" style={styles.premiumChip}>Premium</Chip>
              </View>
              
              <Text style={styles.description}>
                Leverage artificial intelligence to optimize your ads and reach your target audience more effectively.
              </Text>
              
              <List.Item
                title="AI Ad Copy Generator"
                description="Create compelling ad copy with AI assistance"
                left={props => <List.Icon {...props} icon="text-box-outline" color={theme.colors.primary} />}
                right={props => <MaterialIcons {...props} name="chevron-right" size={24} color={theme.colors.primary} />}
                onPress={() => navigation.navigate('AIFeatures' as never)}
                style={styles.listItem}
              />
              
              <List.Item
                title="Audience Targeting Recommendations"
                description="Get AI-powered audience targeting suggestions"
                left={props => <List.Icon {...props} icon="account-group" color={theme.colors.primary} />}
                right={props => <MaterialIcons {...props} name="chevron-right" size={24} color={theme.colors.primary} />}
                onPress={() => navigation.navigate('AIFeatures' as never)}
                style={styles.listItem}
              />
              
              <List.Item
                title="Creative Content Ideas"
                description="Generate creative content ideas for your campaigns"
                left={props => <List.Icon {...props} icon="lightbulb-outline" color={theme.colors.primary} />}
                right={props => <MaterialIcons {...props} name="chevron-right" size={24} color={theme.colors.primary} />}
                onPress={() => navigation.navigate('AIFeatures' as never)}
                style={styles.listItem}
              />
              
              <Button 
                mode="outlined" 
                onPress={() => navigation.navigate('AIFeatures' as never)} 
                style={styles.aiButton}
                icon="robot"
              >
                Explore AI Features
              </Button>
            </Card.Content>
          </Card>
          
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.resourcesTitle}>📚 Resources</Title>
              <Text style={styles.description}>
                Learn how to create effective ad campaigns and maximize your ROI.
              </Text>
              
              <List.Item
                title="Advertising Best Practices"
                description="Tips and tricks for effective advertising"
                left={props => <List.Icon {...props} icon="star-outline" color={theme.colors.tertiary} />}
                style={styles.listItem}
              />
              
              <List.Item
                title="Targeting Guide"
                description="How to reach your ideal audience"
                left={props => <List.Icon {...props} icon="target" color={theme.colors.tertiary} />}
                style={styles.listItem}
              />
              
              <List.Item
                title="Ad Performance Metrics"
                description="Understanding key performance indicators"
                left={props => <List.Icon {...props} icon="chart-line" color={theme.colors.tertiary} />}
                style={styles.listItem}
              />
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const AdsScreen: React.FC = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="AdsHome" 
        component={AdsHomeScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="AIFeatures" 
        component={AIFeaturesScreen}
        options={{ 
          title: 'AI Features',
          headerStyle: {
            backgroundColor: theme.colors.primary,
          },
          headerTintColor: '#fff',
        }}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.md,
  },
  card: {
    ...theme.shadows.medium,
    marginBottom: theme.spacing.md,
  },
  title: {
    marginBottom: theme.spacing.sm,
    color: theme.colors.primary,
  },
  description: {
    marginBottom: theme.spacing.md,
    color: theme.colors.textSecondary,
  },
  divider: {
    marginVertical: theme.spacing.md,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  button: {
    marginTop: theme.spacing.sm,
  },
  aiHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  aiTitle: {
    color: theme.colors.primary,
  },
  premiumChip: {
    backgroundColor: theme.colors.primaryLight,
  },
  listItem: {
    paddingLeft: 0,
  },
  aiButton: {
    marginTop: theme.spacing.md,
  },
  resourcesTitle: {
    color: theme.colors.tertiary,
    marginBottom: theme.spacing.sm,
  },
});

export default AdsScreen;
