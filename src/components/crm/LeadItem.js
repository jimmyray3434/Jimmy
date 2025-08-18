import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Surface, Text, Badge, Avatar, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const LeadItem = ({ lead, onPress }) => {
  const theme = useTheme();
  
  const getStatusColor = () => {
    switch (lead.status) {
      case 'new':
        return theme.colors.notification;
      case 'qualified':
        return theme.colors.success;
      case 'disqualified':
        return theme.colors.error;
      case 'converted':
        return theme.colors.primary;
      default:
        return theme.colors.text;
    }
  };
  
  const getSourceIcon = () => {
    switch (lead.source) {
      case 'website':
        return 'web';
      case 'social':
        return 'account-group';
      case 'referral':
        return 'account-arrow-right';
      case 'email':
        return 'email';
      case 'ad':
        return 'bullhorn';
      default:
        return 'information';
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <TouchableOpacity onPress={onPress}>
      <Surface style={styles.container}>
        <View style={styles.avatarContainer}>
          <Avatar.Text 
            size={40} 
            label={getInitials(lead.name)} 
            backgroundColor={theme.colors.primary}
          />
        </View>
        
        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.name} numberOfLines={1}>{lead.name}</Text>
            <Badge style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
              {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
            </Badge>
          </View>
          
          <View style={styles.detailsRow}>
            <Text style={styles.email} numberOfLines={1}>{lead.email}</Text>
            {lead.phone && (
              <Text style={styles.phone} numberOfLines={1}>{lead.phone}</Text>
            )}
          </View>
          
          <View style={styles.footerRow}>
            <View style={styles.sourceContainer}>
              <MaterialCommunityIcons 
                name={getSourceIcon()} 
                size={14} 
                color={theme.colors.primary} 
                style={styles.sourceIcon}
              />
              <Text style={styles.source}>
                {lead.source.charAt(0).toUpperCase() + lead.source.slice(1)}
              </Text>
            </View>
            
            <Text style={styles.date}>
              {formatDate(lead.createdAt)}
            </Text>
          </View>
        </View>
      </Surface>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    elevation: 1,
  },
  avatarContainer: {
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
  },
  detailsRow: {
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    opacity: 0.8,
  },
  phone: {
    fontSize: 14,
    opacity: 0.8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sourceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sourceIcon: {
    marginRight: 4,
  },
  source: {
    fontSize: 12,
    opacity: 0.7,
  },
  date: {
    fontSize: 12,
    opacity: 0.7,
  },
});

export default LeadItem;

