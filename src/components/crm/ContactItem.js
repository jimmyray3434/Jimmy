import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Surface, Text, Badge, Avatar, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatCurrency } from '../../utils/formatters';

const ContactItem = ({ contact, onPress }) => {
  const theme = useTheme();
  
  const getStatusColor = () => {
    switch (contact.status) {
      case 'active':
        return theme.colors.success;
      case 'inactive':
        return theme.colors.disabled;
      case 'customer':
        return theme.colors.primary;
      case 'prospect':
        return theme.colors.notification;
      default:
        return theme.colors.text;
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
  
  const getCustomerSince = () => {
    if (!contact.customerSince) return null;
    return `Customer since ${formatDate(contact.customerSince)}`;
  };

  return (
    <TouchableOpacity onPress={onPress}>
      <Surface style={styles.container}>
        <View style={styles.avatarContainer}>
          <Avatar.Text 
            size={40} 
            label={getInitials(contact.name)} 
            backgroundColor={contact.status === 'customer' ? theme.colors.primary : theme.colors.accent}
          />
        </View>
        
        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.name} numberOfLines={1}>{contact.name}</Text>
            <Badge style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
              {contact.status.charAt(0).toUpperCase() + contact.status.slice(1)}
            </Badge>
          </View>
          
          <View style={styles.detailsRow}>
            <Text style={styles.email} numberOfLines={1}>{contact.email}</Text>
            {contact.phone && (
              <Text style={styles.phone} numberOfLines={1}>{contact.phone}</Text>
            )}
          </View>
          
          <View style={styles.footerRow}>
            {contact.status === 'customer' ? (
              <View style={styles.customerInfo}>
                <MaterialCommunityIcons 
                  name="cash-multiple" 
                  size={14} 
                  color={theme.colors.primary} 
                  style={styles.infoIcon}
                />
                <Text style={styles.infoText}>
                  {formatCurrency(contact.totalSpent || 0)}
                </Text>
                <Text style={styles.infoText}> • </Text>
                <Text style={styles.infoText}>
                  {contact.totalPurchases || 0} purchases
                </Text>
              </View>
            ) : (
              <View style={styles.sourceContainer}>
                <MaterialCommunityIcons 
                  name="tag" 
                  size={14} 
                  color={theme.colors.primary} 
                  style={styles.sourceIcon}
                />
                <Text style={styles.source}>
                  {contact.leadSource ? (contact.leadSource.charAt(0).toUpperCase() + contact.leadSource.slice(1)) : 'Direct'}
                </Text>
              </View>
            )}
            
            <Text style={styles.date}>
              {getCustomerSince() || formatDate(contact.createdAt)}
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
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: 4,
  },
  infoText: {
    fontSize: 12,
    opacity: 0.7,
  },
  date: {
    fontSize: 12,
    opacity: 0.7,
  },
});

export default ContactItem;

