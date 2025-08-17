import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Surface, Text, Badge, ProgressBar, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const CampaignItem = ({ campaign, onPress }) => {
  const theme = useTheme();
  
  const getStatusColor = () => {
    switch (campaign.status) {
      case 'active':
        return theme.colors.success;
      case 'paused':
        return theme.colors.warning;
      case 'completed':
        return theme.colors.primary;
      case 'failed':
        return theme.colors.error;
      default:
        return theme.colors.text;
    }
  };
  
  const getContentTypeIcon = () => {
    switch (campaign.contentType) {
      case 'blog-post':
        return 'post';
      case 'article':
        return 'file-document';
      case 'social-post':
        return 'account-group';
      case 'product-review':
        return 'star';
      case 'email':
        return 'email';
      case 'landing-page':
        return 'web';
      default:
        return 'file';
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  const getChannelBadges = () => {
    const badges = [];
    
    if (campaign.channels) {
      if (campaign.channels.social && campaign.channels.social.enabled) {
        badges.push({ name: 'Social', icon: 'account-group', color: theme.colors.primary });
      }
      
      if (campaign.channels.seo && campaign.channels.seo.enabled) {
        badges.push({ name: 'SEO', icon: 'magnify', color: theme.colors.accent });
      }
      
      if (campaign.channels.email && campaign.channels.email.enabled) {
        badges.push({ name: 'Email', icon: 'email', color: theme.colors.notification });
      }
      
      if (campaign.channels.backlinks && campaign.channels.backlinks.enabled) {
        badges.push({ name: 'Backlinks', icon: 'link', color: theme.colors.error });
      }
    }
    
    return badges;
  };
  
  const calculateProgress = () => {
    if (!campaign.performance) return 0;
    
    // For backlinks, calculate progress based on target
    if (campaign.channels.backlinks && campaign.channels.backlinks.enabled && campaign.channels.backlinks.target) {
      const backlinksGenerated = campaign.performance.totalTraffic / 50; // Rough estimate
      return Math.min(backlinksGenerated / campaign.channels.backlinks.target, 1);
    }
    
    // For other campaigns, base progress on run count
    if (campaign.runCount) {
      return Math.min(campaign.runCount / 10, 1); // Assume 10 runs is 100%
    }
    
    return 0.1; // Default minimal progress
  };

  return (
    <TouchableOpacity onPress={onPress}>
      <Surface style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <MaterialCommunityIcons 
              name={getContentTypeIcon()} 
              size={20} 
              color={theme.colors.primary} 
              style={styles.typeIcon}
            />
            <Text style={styles.title} numberOfLines={1}>{campaign.title}</Text>
          </View>
          <Badge style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
            {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
          </Badge>
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {campaign.performance?.totalTraffic?.toLocaleString() || '0'}
            </Text>
            <Text style={styles.statLabel}>Traffic</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {campaign.performance?.totalClicks?.toLocaleString() || '0'}
            </Text>
            <Text style={styles.statLabel}>Clicks</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {campaign.performance?.conversionRate?.toFixed(1) || '0.0'}%
            </Text>
            <Text style={styles.statLabel}>Conv. Rate</Text>
          </View>
        </View>
        
        <View style={styles.progressContainer}>
          <ProgressBar 
            progress={calculateProgress()} 
            color={theme.colors.primary}
            style={styles.progressBar}
          />
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>Progress</Text>
            <Text style={styles.progressValue}>{(calculateProgress() * 100).toFixed(0)}%</Text>
          </View>
        </View>
        
        <View style={styles.footer}>
          <View style={styles.channelsContainer}>
            {getChannelBadges().map((badge, index) => (
              <View key={index} style={[styles.channelBadge, { backgroundColor: badge.color }]}>
                <MaterialCommunityIcons name={badge.icon} size={12} color="white" />
                <Text style={styles.channelText}>{badge.name}</Text>
              </View>
            ))}
          </View>
          
          <Text style={styles.lastRun}>
            Last run: {formatDate(campaign.lastRun)}
          </Text>
        </View>
      </Surface>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typeIcon: {
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  statusBadge: {
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  progressLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  progressValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  channelsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  channelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
  },
  channelText: {
    color: 'white',
    fontSize: 10,
    marginLeft: 4,
  },
  lastRun: {
    fontSize: 12,
    opacity: 0.7,
  },
});

export default CampaignItem;

