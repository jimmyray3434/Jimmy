import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Surface, Text, Badge, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatCurrency } from '../../utils/formatters';

const TransactionItem = ({ transaction }) => {
  const theme = useTheme();
  
  const getIconName = () => {
    switch (transaction.type) {
      case 'revenue':
        return 'cash-plus';
      case 'withdrawal':
        return 'cash-minus';
      case 'refund':
        return 'cash-refund';
      case 'fee':
        return 'cash-remove';
      default:
        return 'cash';
    }
  };
  
  const getIconColor = () => {
    switch (transaction.type) {
      case 'revenue':
        return theme.colors.success;
      case 'withdrawal':
        return theme.colors.primary;
      case 'refund':
        return theme.colors.warning;
      case 'fee':
        return theme.colors.error;
      default:
        return theme.colors.text;
    }
  };
  
  const getStatusColor = () => {
    switch (transaction.status) {
      case 'completed':
        return theme.colors.success;
      case 'pending':
        return theme.colors.warning;
      case 'failed':
        return theme.colors.error;
      case 'cancelled':
        return theme.colors.disabled;
      default:
        return theme.colors.text;
    }
  };
  
  const getAmountPrefix = () => {
    switch (transaction.type) {
      case 'revenue':
        return '+';
      case 'withdrawal':
      case 'fee':
        return '-';
      case 'refund':
        return '+';
      default:
        return '';
    }
  };
  
  const getSourceLabel = () => {
    if (transaction.type !== 'revenue' || !transaction.source) return null;
    
    switch (transaction.source) {
      case 'content':
        return 'Content';
      case 'affiliate':
        return 'Affiliate';
      case 'product':
        return 'Product';
      default:
        return 'Other';
    }
  };
  
  const getProviderLabel = () => {
    if (transaction.type !== 'withdrawal' || !transaction.provider) return null;
    
    switch (transaction.provider) {
      case 'paypal':
        return 'PayPal';
      case 'stripe':
        return 'Stripe';
      case 'bank':
        return 'Bank';
      default:
        return 'Other';
    }
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Surface style={styles.container}>
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons 
          name={getIconName()} 
          size={24} 
          color={getIconColor()} 
        />
      </View>
      
      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.description} numberOfLines={1}>
            {transaction.description || getTransactionTypeLabel(transaction.type)}
          </Text>
          <Text style={[
            styles.amount, 
            { color: getIconColor() }
          ]}>
            {getAmountPrefix()}{formatCurrency(transaction.amount)}
          </Text>
        </View>
        
        <View style={styles.detailsRow}>
          <View style={styles.detailsLeft}>
            <Text style={styles.date}>{formatDate(transaction.createdAt)}</Text>
            
            <View style={styles.tagsContainer}>
              {getSourceLabel() && (
                <Badge style={[styles.badge, { backgroundColor: theme.colors.primary }]}>
                  {getSourceLabel()}
                </Badge>
              )}
              
              {getProviderLabel() && (
                <Badge style={[styles.badge, { backgroundColor: theme.colors.primary }]}>
                  {getProviderLabel()}
                </Badge>
              )}
            </View>
          </View>
          
          <Badge style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
          </Badge>
        </View>
      </View>
    </Surface>
  );
};

const getTransactionTypeLabel = (type) => {
  switch (type) {
    case 'revenue':
      return 'Revenue';
    case 'withdrawal':
      return 'Withdrawal';
    case 'refund':
      return 'Refund';
    case 'fee':
      return 'Fee';
    default:
      return 'Transaction';
  }
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    elevation: 1,
  },
  iconContainer: {
    marginRight: 16,
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  detailsLeft: {
    flex: 1,
  },
  date: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  badge: {
    marginRight: 4,
  },
  statusBadge: {
    alignSelf: 'flex-end',
  },
});

export default TransactionItem;

