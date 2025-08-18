import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, Title, Paragraph, Divider, List, useTheme, ProgressBar } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { fetchCampaigns, fetchTrafficStats, generateTraffic } from '../../store/slices/trafficSlice';
import LoadingScreen from '../../components/common/LoadingScreen';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';
import TrafficChannelChart from '../../components/traffic/TrafficChannelChart';
import CampaignItem from '../../components/traffic/CampaignItem';

const TrafficDashboardScreen = ({ navigation }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const [generatingTraffic, setGeneratingTraffic] = useState(false);
  const { 
    campaigns, 
    trafficStats, 
    loading, 
    error 
  } = useSelector(state => state.traffic);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      dispatch(fetchCampaigns()),
      dispatch(fetchTrafficStats())
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleGenerateTraffic = async () => {
    if (!campaigns || campaigns.length === 0) {
      return;
    }
    
    setGeneratingTraffic(true);
    try {
      // Get the first active campaign
      const activeCampaign = campaigns.find(campaign => campaign.status === 'active');
      
      if (activeCampaign) {
        await dispatch(generateTraffic(activeCampaign.content)).unwrap();
      }
    } catch (error) {
      console.error('Error generating traffic:', error);
    } finally {
      setGeneratingTraffic(false);
    }
  };

  if (loading && !refreshing && !generatingTraffic) {
    return <LoadingScreen />;
  }

  if (error && !refreshing && !generatingTraffic) {
    return <ErrorMessage message={error} onRetry={loadData} />;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Card style={styles.statsCard}>
        <Card.Content>
          <Title>Traffic Overview</Title>
          
          {trafficStats ? (
            <>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{trafficStats.performance.totalTraffic.toLocaleString()}</Text>
                  <Text style={styles.statLabel}>Total Traffic</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{trafficStats.performance.totalClicks.toLocaleString()}</Text>
                  <Text style={styles.statLabel}>Total Clicks</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{trafficStats.performance.clickThroughRate.toFixed(1)}%</Text>
                  <Text style={styles.statLabel}>CTR</Text>
                </View>
              </View>
              
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{trafficStats.activeCampaigns}</Text>
                  <Text style={styles.statLabel}>Active Campaigns</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{trafficStats.totalCampaigns}</Text>
                  <Text style={styles.statLabel}>Total Campaigns</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{trafficStats.performance.conversionRate.toFixed(1)}%</Text>
                  <Text style={styles.statLabel}>Conversion Rate</Text>
                </View>
              </View>
            </>
          ) : (
            <EmptyState 
              icon="chart-line" 
              message="No traffic data available yet" 
              suggestion="Start generating traffic to see statistics"
            />
          )}
        </Card.Content>
      </Card>

      <Card style={styles.channelsCard}>
        <Card.Content>
          <Title>Traffic by Channel</Title>
          
          {trafficStats && trafficStats.trafficByChannel ? (
            <TrafficChannelChart data={trafficStats.trafficByChannel} />
          ) : (
            <EmptyState 
              icon="chart-pie" 
              message="No channel data available" 
              suggestion="Generate traffic to see channel distribution"
            />
          )}
        </Card.Content>
      </Card>

      <Card style={styles.campaignsCard}>
        <Card.Content>
          <View style={styles.campaignsHeader}>
            <Title>Active Campaigns</Title>
            <Button 
              mode="text" 
              onPress={() => navigation.navigate('CampaignsScreen')}
            >
              View All
            </Button>
          </View>
          
          {campaigns && campaigns.length > 0 ? (
            campaigns
              .filter(campaign => campaign.status === 'active')
              .slice(0, 3)
              .map((campaign) => (
                <CampaignItem 
                  key={campaign._id} 
                  campaign={campaign} 
                  onPress={() => navigation.navigate('CampaignDetailScreen', { campaignId: campaign._id })}
                />
              ))
          ) : (
            <EmptyState 
              icon="rocket-launch" 
              message="No active campaigns" 
              suggestion="Create a campaign to start generating traffic"
            />
          )}
          
          <Button 
            mode="contained" 
            onPress={() => navigation.navigate('CreateCampaignScreen')}
            style={styles.createButton}
          >
            Create New Campaign
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.actionsCard}>
        <Card.Content>
          <Title>Quick Actions</Title>
          
          <Button 
            mode="contained" 
            icon="rocket-launch" 
            onPress={handleGenerateTraffic}
            loading={generatingTraffic}
            disabled={generatingTraffic || !campaigns || campaigns.length === 0}
            style={styles.generateButton}
          >
            Generate Traffic Now
          </Button>
          
          <Divider style={styles.divider} />
          
          <List.Item
            title="Social Media Accounts"
            description="Connect your social media accounts"
            left={props => <List.Icon {...props} icon="account-group" />}
            onPress={() => navigation.navigate('SocialAccountsScreen')}
            style={styles.actionItem}
          />
          
          <List.Item
            title="Traffic Analytics"
            description="View detailed traffic reports"
            left={props => <List.Icon {...props} icon="chart-bar" />}
            onPress={() => navigation.navigate('TrafficAnalyticsScreen')}
            style={styles.actionItem}
          />
          
          <List.Item
            title="Traffic Settings"
            description="Configure traffic generation settings"
            left={props => <List.Icon {...props} icon="cog" />}
            onPress={() => navigation.navigate('TrafficSettingsScreen')}
            style={styles.actionItem}
          />
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  statsCard: {
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  channelsCard: {
    marginBottom: 16,
  },
  campaignsCard: {
    marginBottom: 16,
  },
  campaignsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  createButton: {
    marginTop: 16,
  },
  actionsCard: {
    marginBottom: 16,
  },
  generateButton: {
    marginVertical: 8,
  },
  divider: {
    marginVertical: 16,
  },
  actionItem: {
    paddingVertical: 4,
  },
});

export default TrafficDashboardScreen;

