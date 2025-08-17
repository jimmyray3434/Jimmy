import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Title, Paragraph, Button, ActivityIndicator, Divider } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../../config';
import { colors, spacing } from '../../theme';

const DashboardScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);

  const { token, user } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      // Fetch dashboard data
      const response = await axios.get(`${API_URL}/api/analytics/dashboard`, config);

      if (response.data.success) {
        setDashboardData(response.data.data);
      } else {
        setError(response.data.error || 'Failed to fetch dashboard data');
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Something went wrong');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (isLoading && !dashboardData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  // Use mock data if dashboardData is null
  const data = dashboardData || {
    totalRevenue: 0,
    contentMetrics: {
      totalContent: 0,
      publishedContent: 0,
      scheduledContent: 0,
      totalViews: 0,
    },
    affiliateMetrics: {
      totalProducts: 0,
      activeProducts: 0,
      totalClicks: 0,
      totalConversions: 0,
      revenue: 0,
    },
    productMetrics: {
      totalProducts: 0,
      publishedProducts: 0,
      totalSales: 0,
      revenue: 0,
    },
    recentContent: [],
    topAffiliateProducts: [],
    topDigitalProducts: [],
    pendingTasks: 0,
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
      }
    >
      {error && (
        <Card style={[styles.card, styles.errorCard]}>
          <Card.Content>
            <Text style={styles.errorText}>{error}</Text>
            <Button mode="contained" onPress={fetchDashboardData} style={styles.retryButton}>
              Retry
            </Button>
          </Card.Content>
        </Card>
      )}

      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>Welcome back, {user?.name || 'User'}!</Text>
        <Text style={styles.dateText}>{new Date().toDateString()}</Text>
      </View>

      <View style={styles.statsContainer}>
        <Card style={[styles.statCard, { backgroundColor: colors.primary }]}>
          <Card.Content>
            <MaterialCommunityIcons name="currency-usd" size={24} color="white" />
            <Title style={styles.statTitle}>${data.totalRevenue.toFixed(2)}</Title>
            <Paragraph style={styles.statSubtitle}>Total Revenue</Paragraph>
          </Card.Content>
        </Card>

        <Card style={[styles.statCard, { backgroundColor: colors.secondary }]}>
          <Card.Content>
            <MaterialCommunityIcons name="file-document-multiple" size={24} color="white" />
            <Title style={styles.statTitle}>{data.contentMetrics.totalContent}</Title>
            <Paragraph style={styles.statSubtitle}>Content Pieces</Paragraph>
          </Card.Content>
        </Card>

        <Card style={[styles.statCard, { backgroundColor: colors.accent }]}>
          <Card.Content>
            <MaterialCommunityIcons name="tag-multiple" size={24} color="white" />
            <Title style={styles.statTitle}>{data.affiliateMetrics.totalProducts}</Title>
            <Paragraph style={styles.statSubtitle}>Affiliate Products</Paragraph>
          </Card.Content>
        </Card>

        <Card style={[styles.statCard, { backgroundColor: colors.info }]}>
          <Card.Content>
            <MaterialCommunityIcons name="shopping" size={24} color="white" />
            <Title style={styles.statTitle}>{data.productMetrics.totalProducts}</Title>
            <Paragraph style={styles.statSubtitle}>Digital Products</Paragraph>
          </Card.Content>
        </Card>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Title style={styles.cardTitle}>Content Performance</Title>
            <Button
              mode="text"
              onPress={() => navigation.navigate('Content')}
              labelStyle={styles.viewAllButton}
            >
              View All
            </Button>
          </View>
          <Divider style={styles.divider} />

          <View style={styles.metricsContainer}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{data.contentMetrics.publishedContent}</Text>
              <Text style={styles.metricLabel}>Published</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{data.contentMetrics.scheduledContent}</Text>
              <Text style={styles.metricLabel}>Scheduled</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{data.contentMetrics.totalViews}</Text>
              <Text style={styles.metricLabel}>Total Views</Text>
            </View>
          </View>

          <Button
            mode="contained"
            icon="plus"
            onPress={() => navigation.navigate('ContentGenerate')}
            style={styles.actionButton}
          >
            Generate Content
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Title style={styles.cardTitle}>Affiliate Marketing</Title>
            <Button
              mode="text"
              onPress={() => navigation.navigate('Affiliate')}
              labelStyle={styles.viewAllButton}
            >
              View All
            </Button>
          </View>
          <Divider style={styles.divider} />

          <View style={styles.metricsContainer}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{data.affiliateMetrics.activeProducts}</Text>
              <Text style={styles.metricLabel}>Active Products</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{data.affiliateMetrics.totalClicks}</Text>
              <Text style={styles.metricLabel}>Clicks</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>${data.affiliateMetrics.revenue.toFixed(2)}</Text>
              <Text style={styles.metricLabel}>Revenue</Text>
            </View>
          </View>

          <Button
            mode="contained"
            icon="magnify"
            onPress={() => navigation.navigate('AffiliateAdd')}
            style={styles.actionButton}
          >
            Find Products
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Title style={styles.cardTitle}>Digital Products</Title>
            <Button
              mode="text"
              onPress={() => navigation.navigate('Products')}
              labelStyle={styles.viewAllButton}
            >
              View All
            </Button>
          </View>
          <Divider style={styles.divider} />

          <View style={styles.metricsContainer}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{data.productMetrics.publishedProducts}</Text>
              <Text style={styles.metricLabel}>Published</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{data.productMetrics.totalSales}</Text>
              <Text style={styles.metricLabel}>Sales</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>${data.productMetrics.revenue.toFixed(2)}</Text>
              <Text style={styles.metricLabel}>Revenue</Text>
            </View>
          </View>

          <Button
            mode="contained"
            icon="book-plus"
            onPress={() => navigation.navigate('ProductCreate')}
            style={styles.actionButton}
          >
            Create Product
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Title style={styles.cardTitle}>Automation</Title>
            <Button
              mode="text"
              onPress={() => navigation.navigate('TaskList')}
              labelStyle={styles.viewAllButton}
            >
              View Tasks
            </Button>
          </View>
          <Divider style={styles.divider} />

          <View style={styles.automationContainer}>
            <Text style={styles.automationText}>
              You have <Text style={styles.pendingTasks}>{data.pendingTasks}</Text> pending tasks
            </Text>
            <Button
              mode="contained"
              icon="robot"
              onPress={() => navigation.navigate('Automation')}
              style={styles.actionButton}
            >
              Manage Automation
            </Button>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: 16,
    color: colors.text,
  },
  welcomeSection: {
    marginBottom: spacing.md,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  dateText: {
    fontSize: 14,
    color: colors.placeholder,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  statCard: {
    width: '48%',
    marginBottom: spacing.sm,
    elevation: 2,
  },
  statTitle: {
    color: 'white',
    marginTop: spacing.xs,
  },
  statSubtitle: {
    color: 'white',
    opacity: 0.8,
  },
  card: {
    marginBottom: spacing.md,
    elevation: 2,
  },
  errorCard: {
    backgroundColor: '#FFEBEE',
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.error,
    marginBottom: spacing.sm,
  },
  retryButton: {
    marginTop: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontSize: 18,
  },
  viewAllButton: {
    color: colors.primary,
  },
  divider: {
    marginBottom: spacing.md,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.placeholder,
    marginTop: spacing.xs,
  },
  actionButton: {
    marginTop: spacing.sm,
  },
  automationContainer: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  automationText: {
    fontSize: 16,
    marginBottom: spacing.md,
  },
  pendingTasks: {
    fontWeight: 'bold',
    color: colors.primary,
  },
});

export default DashboardScreen;

