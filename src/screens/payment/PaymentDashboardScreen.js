import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, Title, Paragraph, Divider, List, useTheme } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { fetchTransactions, fetchRevenueSummary } from '../../store/slices/paymentSlice';
import { formatCurrency } from '../../utils/formatters';
import LoadingScreen from '../../components/common/LoadingScreen';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';
import TransactionItem from '../../components/payment/TransactionItem';
import RevenueChart from '../../components/payment/RevenueChart';

const PaymentDashboardScreen = ({ navigation }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const { 
    transactions, 
    revenueSummary, 
    balance,
    loading, 
    error 
  } = useSelector(state => state.payment);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      dispatch(fetchTransactions()),
      dispatch(fetchRevenueSummary())
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (loading && !refreshing) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadData} />;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Card style={styles.balanceCard}>
        <Card.Content>
          <Title>Current Balance</Title>
          <Text style={styles.balanceText}>{formatCurrency(balance)}</Text>
          <View style={styles.buttonContainer}>
            <Button 
              mode="contained" 
              onPress={() => navigation.navigate('WithdrawalScreen')}
              style={styles.withdrawButton}
            >
              Withdraw Funds
            </Button>
            <Button 
              mode="outlined" 
              onPress={() => navigation.navigate('PaymentSettingsScreen')}
              style={styles.settingsButton}
            >
              Payment Settings
            </Button>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.revenueCard}>
        <Card.Content>
          <Title>Revenue Summary</Title>
          {revenueSummary ? (
            <>
              <RevenueChart data={revenueSummary.sources} />
              <View style={styles.revenueStats}>
                <View style={styles.revenueStat}>
                  <Text style={styles.revenueStatLabel}>Total Revenue</Text>
                  <Text style={styles.revenueStatValue}>
                    {formatCurrency(revenueSummary.totalRevenue)}
                  </Text>
                </View>
                <View style={styles.revenueStat}>
                  <Text style={styles.revenueStatLabel}>Period</Text>
                  <Text style={styles.revenueStatValue}>
                    {revenueSummary.period.charAt(0).toUpperCase() + revenueSummary.period.slice(1)}
                  </Text>
                </View>
              </View>
              <Divider style={styles.divider} />
              <Text style={styles.sourceTitle}>Revenue by Source</Text>
              {revenueSummary.sources.map((source, index) => (
                <View key={index} style={styles.sourceItem}>
                  <Text style={styles.sourceName}>{source.source.charAt(0).toUpperCase() + source.source.slice(1)}</Text>
                  <Text style={styles.sourceAmount}>{formatCurrency(source.total)}</Text>
                </View>
              ))}
            </>
          ) : (
            <EmptyState 
              icon="chart-line" 
              message="No revenue data available yet" 
              suggestion="Start generating content to earn revenue"
            />
          )}
        </Card.Content>
      </Card>

      <Card style={styles.transactionsCard}>
        <Card.Content>
          <View style={styles.transactionsHeader}>
            <Title>Recent Transactions</Title>
            <Button 
              mode="text" 
              onPress={() => navigation.navigate('TransactionsScreen')}
            >
              View All
            </Button>
          </View>
          {transactions && transactions.length > 0 ? (
            transactions.slice(0, 5).map((transaction) => (
              <TransactionItem key={transaction._id} transaction={transaction} />
            ))
          ) : (
            <EmptyState 
              icon="bank-transfer" 
              message="No transactions yet" 
              suggestion="Your transaction history will appear here"
            />
          )}
        </Card.Content>
      </Card>

      <Card style={styles.actionsCard}>
        <Card.Content>
          <Title>Quick Actions</Title>
          <List.Item
            title="Connect PayPal Account"
            description="Set up automatic withdrawals"
            left={props => <List.Icon {...props} icon="paypal" />}
            onPress={() => navigation.navigate('PayPalSetupScreen')}
            style={styles.actionItem}
          />
          <List.Item
            title="Withdrawal Settings"
            description="Configure automatic withdrawals"
            left={props => <List.Icon {...props} icon="cash-multiple" />}
            onPress={() => navigation.navigate('WithdrawalSettingsScreen')}
            style={styles.actionItem}
          />
          <List.Item
            title="Revenue Analytics"
            description="View detailed revenue reports"
            left={props => <List.Icon {...props} icon="chart-bar" />}
            onPress={() => navigation.navigate('RevenueAnalyticsScreen')}
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
  balanceCard: {
    marginBottom: 16,
  },
  balanceText: {
    fontSize: 36,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 16,
  },
  withdrawButton: {
    flex: 1,
    marginRight: 8,
  },
  settingsButton: {
    flex: 1,
    marginLeft: 8,
  },
  revenueCard: {
    marginBottom: 16,
  },
  revenueStats: {
    flexDirection: 'row',
    marginTop: 16,
  },
  revenueStat: {
    flex: 1,
  },
  revenueStatLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  revenueStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 16,
  },
  sourceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sourceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  sourceName: {
    fontSize: 14,
  },
  sourceAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  transactionsCard: {
    marginBottom: 16,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionsCard: {
    marginBottom: 16,
  },
  actionItem: {
    paddingVertical: 4,
  },
});

export default PaymentDashboardScreen;

