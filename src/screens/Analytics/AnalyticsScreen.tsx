import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Text,
  IconButton,
  Surface,
  SegmentedButtons,
} from 'react-native-paper';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '../../theme/theme';

const screenWidth = Dimensions.get('window').width;

const AnalyticsScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('7d');

  // Sample data - replace with real data from your analytics service
  const [analyticsData, setAnalyticsData] = useState({
    revenue: {
      current: 12450,
      previous: 10200,
      change: 22.1
    },
    impressions: {
      current: 145000,
      previous: 120000,
      change: 20.8
    },
    clicks: {
      current: 3200,
      previous: 2800,
      change: 14.3
    },
    conversions: {
      current: 156,
      previous: 134,
      change: 16.4
    }
  });

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // TODO: Fetch latest analytics data
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  // Sample chart data
  const revenueChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        data: [1200, 1800, 1500, 2200, 1900, 2400, 2100],
        color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };

  const performanceData = {
    labels: ['Impressions', 'Clicks', 'Conversions'],
    datasets: [
      {
        data: [145000, 3200, 156],
      },
    ],
  };

  const campaignData = [
    {
      name: 'Summer Sale',
      population: 35,
      color: theme.colors.primary,
      legendFontColor: theme.colors.text,
      legendFontSize: 12,
    },
    {
      name: 'Product Launch',
      population: 28,
      color: theme.colors.secondary,
      legendFontColor: theme.colors.text,
      legendFontSize: 12,
    },
    {
      name: 'Brand Awareness',
      population: 22,
      color: theme.colors.tertiary,
      legendFontColor: theme.colors.text,
      legendFontSize: 12,
    },
    {
      name: 'Retargeting',
      population: 15,
      color: theme.colors.success,
      legendFontColor: theme.colors.text,
      legendFontSize: 12,
    },
  ];

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(117, 117, 117, ${opacity})`,
    style: {
      borderRadius: theme.borderRadius.md,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: theme.colors.primary,
    },
  };

  const MetricCard = ({ title, value, previousValue, change, icon, color }: {
    title: string;
    value: number | string;
    previousValue?: number;
    change?: number;
    icon: string;
    color: string;
  }) => (
    <Card style={styles.metricCard}>
      <Card.Content>
        <View style={styles.metricHeader}>
          <IconButton icon={icon} iconColor={color} size={24} />
          {change !== undefined && (
            <View style={[styles.changeIndicator, { 
              backgroundColor: change >= 0 ? theme.colors.success + '20' : theme.colors.error + '20' 
            }]}>
              <IconButton 
                icon={change >= 0 ? 'trending-up' : 'trending-down'} 
                iconColor={change >= 0 ? theme.colors.success : theme.colors.error}
                size={16}
              />
              <Text style={[styles.changeText, { 
                color: change >= 0 ? theme.colors.success : theme.colors.error 
              }]}>
                {Math.abs(change).toFixed(1)}%
              </Text>
            </View>
          )}
        </View>
        <Text style={[styles.metricValue, { color }]}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </Text>
        <Text style={styles.metricTitle}>{title}</Text>
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Time Range Selector */}
        <Surface style={styles.timeRangeContainer}>
          <SegmentedButtons
            value={timeRange}
            onValueChange={setTimeRange}
            buttons={[
              { value: '7d', label: '7D' },
              { value: '30d', label: '30D' },
              { value: '90d', label: '90D' },
              { value: '1y', label: '1Y' },
            ]}
          />
        </Surface>

        {/* Key Metrics */}
        <View style={styles.metricsGrid}>
          <MetricCard
            title="Revenue"
            value={`$${analyticsData.revenue.current.toLocaleString()}`}
            change={analyticsData.revenue.change}
            icon="currency-usd"
            color={theme.colors.success}
          />
          <MetricCard
            title="Impressions"
            value={analyticsData.impressions.current}
            change={analyticsData.impressions.change}
            icon="eye"
            color={theme.colors.primary}
          />
          <MetricCard
            title="Clicks"
            value={analyticsData.clicks.current}
            change={analyticsData.clicks.change}
            icon="cursor-pointer"
            color={theme.colors.tertiary}
          />
          <MetricCard
            title="Conversions"
            value={analyticsData.conversions.current}
            change={analyticsData.conversions.change}
            icon="target"
            color={theme.colors.secondary}
          />
        </View>

        {/* Revenue Chart */}
        <Card style={styles.chartCard}>
          <Card.Content>
            <Title style={styles.chartTitle}>Revenue Trend</Title>
            <LineChart
              data={revenueChartData}
              width={screenWidth - 64}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </Card.Content>
        </Card>

        {/* Performance Chart */}
        <Card style={styles.chartCard}>
          <Card.Content>
            <Title style={styles.chartTitle}>Campaign Performance</Title>
            <BarChart
              data={performanceData}
              width={screenWidth - 64}
              height={220}
              chartConfig={chartConfig}
              style={styles.chart}
              yAxisLabel=""
              yAxisSuffix=""
            />
          </Card.Content>
        </Card>

        {/* Campaign Distribution */}
        <Card style={styles.chartCard}>
          <Card.Content>
            <Title style={styles.chartTitle}>Campaign Distribution</Title>
            <PieChart
              data={campaignData}
              width={screenWidth - 64}
              height={220}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              style={styles.chart}
            />
          </Card.Content>
        </Card>

        {/* AI Insights */}
        <Card style={styles.insightsCard}>
          <Card.Content>
            <View style={styles.insightsHeader}>
              <IconButton icon="robot" iconColor={theme.colors.secondary} size={32} />
              <Title style={styles.insightsTitle}>AI Insights</Title>
            </View>
            <View style={styles.insight}>
              <Text style={styles.insightText}>
                🎯 Your "Summer Sale" campaign is performing 23% better than average. Consider increasing its budget.
              </Text>
            </View>
            <View style={styles.insight}>
              <Text style={styles.insightText}>
                📈 Conversion rates are highest on Tuesdays and Thursdays. Optimize your ad scheduling accordingly.
              </Text>
            </View>
            <View style={styles.insight}>
              <Text style={styles.insightText}>
                💡 Mobile users show 35% higher engagement. Consider mobile-first ad creatives.
              </Text>
            </View>
            <Button mode="outlined" onPress={() => {}}>
              View All Insights
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
  timeRangeContainer: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  metricCard: {
    width: '48%',
    marginBottom: theme.spacing.md,
    ...theme.shadows.small,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.xs,
  },
  changeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
  },
  metricTitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  chartCard: {
    marginBottom: theme.spacing.lg,
    ...theme.shadows.medium,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: theme.spacing.md,
    color: theme.colors.text,
  },
  chart: {
    borderRadius: theme.borderRadius.md,
  },
  insightsCard: {
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.secondary + '10',
    borderColor: theme.colors.secondary,
    borderWidth: 1,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginLeft: theme.spacing.sm,
  },
  insight: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
  },
  insightText: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
});

export default AnalyticsScreen;

