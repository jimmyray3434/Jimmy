import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Surface,
  Text,
  IconButton,
} from 'react-native-paper';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RootState } from '../../store/store';
import { theme } from '../../theme/theme';

interface DashboardStats {
  totalClients: number;
  activeAds: number;
  totalRevenue: number;
  conversionRate: number;
}

const DashboardScreen: React.FC = () => {
  const [refreshing, setRefreshing] = React.useState(false);
  const [stats, setStats] = React.useState<DashboardStats>({
    totalClients: 0,
    activeAds: 0,
    totalRevenue: 0,
    conversionRate: 0,
  });

  const { user } = useSelector((state: RootState) => state.auth);
  const navigation = useNavigation();
  
  // Function to calculate days remaining in trial
  const calculateTrialDaysRemaining = (trialEndDate?: string) => {
    if (!trialEndDate) return 7; // Default to 7 days if no end date
    
    const endDate = new Date(trialEndDate);
    const today = new Date();
    
    // Calculate difference in days
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };

  const fetchDashboardData = async () => {
    try {
      // In a real app, this would be an API call
      // For now, we'll simulate a delay and use mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate some random data for demo purposes
      const totalClients = Math.floor(Math.random() * 20) + 15;
      const activeAds = Math.floor(Math.random() * 10) + 5;
      const totalRevenue = Math.floor(Math.random() * 3000) + 3000;
      const conversionRate = (Math.random() * 2 + 2).toFixed(1);
      
      setStats({
        totalClients,
        activeAds,
        totalRevenue,
        conversionRate: parseFloat(conversionRate),
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchDashboardData().finally(() => {
      setRefreshing(false);
    });
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const StatCard = ({ title, value, icon, color, subtitle }: {
    title: string;
    value: string | number;
    icon: string;
    color: string;
    subtitle?: string;
  }) => (
    <Card style={[styles.statCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
      <Card.Content style={styles.statCardContent}>
        <View style={styles.statCardHeader}>
          <IconButton icon={icon} iconColor={color} size={24} />
          <Text style={[styles.statValue, { color }]}>{value}</Text>
        </View>
        <Text style={styles.statTitle}>{title}</Text>
        {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
      </Card.Content>
    </Card>
  );

  const QuickAction = ({ title, description, icon, onPress, color }: {
    title: string;
    description: string;
    icon: string;
    onPress: () => void;
    color: string;
  }) => (
    <Surface style={styles.quickActionCard} elevation={2}>
      <View style={styles.quickActionContent}>
        <IconButton icon={icon} iconColor={color} size={32} />
        <View style={styles.quickActionText}>
          <Text style={styles.quickActionTitle}>{title}</Text>
          <Text style={styles.quickActionDescription}>{description}</Text>
        </View>
        <IconButton icon="chevron-right" iconColor={theme.colors.textSecondary} />
      </View>
    </Surface>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Welcome Section */}
        <Card style={styles.welcomeCard}>
          <Card.Content>
            <Title style={styles.welcomeTitle}>
              Welcome back, {user?.name || 'User'}! 👋
            </Title>
            <Paragraph style={styles.welcomeText}>
              Here's what's happening with your advertising campaigns today.
            </Paragraph>
            {user?.subscription?.status === 'trial' && (
              <View style={styles.trialBanner}>
                <Text style={styles.trialText}>
                  🎉 Free Trial Active - {calculateTrialDaysRemaining(user?.subscription?.trialEndDate)} days remaining
                </Text>
                <Button 
                  mode="outlined" 
                  compact 
                  onPress={() => navigation.navigate('Subscription')}
                >
                  Upgrade Now
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <StatCard
              title="Total Clients"
              value={stats.totalClients}
              icon="account-group"
              color={theme.colors.primary}
              subtitle="+3 this week"
            />
            <StatCard
              title="Active Ads"
              value={stats.activeAds}
              icon="megaphone"
              color={theme.colors.success}
              subtitle="2 pending review"
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              title="Revenue"
              value={`$${stats.totalRevenue.toLocaleString()}`}
              icon="currency-usd"
              color={theme.colors.tertiary}
              subtitle="This month"
            />
            <StatCard
              title="Conversion Rate"
              value={`${stats.conversionRate}%`}
              icon="trending-up"
              color={theme.colors.secondary}
              subtitle="+0.5% vs last month"
            />
          </View>
        </View>

        {/* Quick Actions */}
        <Card style={styles.quickActionsCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Quick Actions</Title>
            
            <QuickAction
              title="Create New Ad"
              description="Launch a new advertising campaign"
              icon="plus-circle"
              color={theme.colors.primary}
              onPress={() => {}}
            />
            
            <QuickAction
              title="Add Client"
              description="Add a new client to your CRM"
              icon="account-plus"
              color={theme.colors.success}
              onPress={() => {}}
            />
            
            <QuickAction
              title="View Analytics"
              description="Check your campaign performance"
              icon="chart-line"
              color={theme.colors.tertiary}
              onPress={() => {}}
            />
            
            <QuickAction
              title="AI Optimization"
              description="Let AI optimize your campaigns"
              icon="robot"
              color={theme.colors.secondary}
              onPress={() => {}}
            />
          </Card.Content>
        </Card>

        {/* Recent Activity */}
        <Card style={styles.activityCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Recent Activity</Title>
            
            <View style={styles.activityItem}>
              <IconButton icon="check-circle" iconColor={theme.colors.success} size={20} />
              <View style={styles.activityText}>
                <Text style={styles.activityTitle}>Campaign "Summer Sale" approved</Text>
                <Text style={styles.activityTime}>2 hours ago</Text>
              </View>
            </View>
            
            <View style={styles.activityItem}>
              <IconButton icon="account-plus" iconColor={theme.colors.primary} size={20} />
              <View style={styles.activityText}>
                <Text style={styles.activityTitle}>New client "Tech Startup Inc" added</Text>
                <Text style={styles.activityTime}>5 hours ago</Text>
              </View>
            </View>
            
            <View style={styles.activityItem}>
              <IconButton icon="trending-up" iconColor={theme.colors.tertiary} size={20} />
              <View style={styles.activityText}>
                <Text style={styles.activityTitle}>Campaign performance improved by 15%</Text>
                <Text style={styles.activityTime}>1 day ago</Text>
              </View>
            </View>
            
            <Button mode="text" onPress={() => {}}>
              View All Activity
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
    padding: theme.spacing.md,
  },
  welcomeCard: {
    marginBottom: theme.spacing.lg,
    ...theme.shadows.medium,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  welcomeText: {
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
  },
  trialBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.secondary + '20',
    borderRadius: theme.borderRadius.md,
  },
  trialText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  statsContainer: {
    marginBottom: theme.spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
    ...theme.shadows.small,
  },
  statCardContent: {
    paddingVertical: theme.spacing.md,
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statTitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  statSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  quickActionsCard: {
    marginBottom: theme.spacing.lg,
    ...theme.shadows.medium,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: theme.spacing.md,
    color: theme.colors.text,
  },
  quickActionCard: {
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  quickActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  quickActionText: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  quickActionDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  activityCard: {
    marginBottom: theme.spacing.lg,
    ...theme.shadows.medium,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  activityText: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  activityTitle: {
    fontSize: 14,
    color: theme.colors.text,
  },
  activityTime: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
});

export default DashboardScreen;
