import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
  Platform
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Button, Divider, Badge, List, Switch, Dialog, Portal } from 'react-native-paper';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { RootState, AppDispatch } from '../../store/store';
import {
  fetchCurrentSubscription,
  createSubscription,
  cancelSubscription,
  changePlan,
  clearPayPalApprovalUrl
} from '../../store/slices/subscriptionSlice';
import { theme } from '../../theme/theme';

const SubscriptionScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { subscription, isLoading, error, paypalApprovalUrl } = useSelector(
    (state: RootState) => state.subscription
  );
  
  const [cancelDialogVisible, setCancelDialogVisible] = useState(false);
  const [changePlanDialogVisible, setChangePlanDialogVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('monthly');
  const [cancelImmediately, setCancelImmediately] = useState(false);
  
  useEffect(() => {
    dispatch(fetchCurrentSubscription());
  }, [dispatch]);
  
  useEffect(() => {
    if (paypalApprovalUrl) {
      Linking.openURL(paypalApprovalUrl);
    }
  }, [paypalApprovalUrl]);
  
  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
    }
  }, [error]);
  
  const handleSubscribe = (plan: 'monthly' | 'annual') => {
    const baseUrl = 'https://aiadplatform.com'; // Replace with your actual domain
    
    dispatch(createSubscription({
      plan,
      returnUrl: `${baseUrl}/subscription/success`,
      cancelUrl: `${baseUrl}/subscription/cancel`
    }));
  };
  
  const handleCancelSubscription = () => {
    dispatch(cancelSubscription({ cancelImmediately }));
    setCancelDialogVisible(false);
  };
  
  const handleChangePlan = () => {
    dispatch(changePlan({ plan: selectedPlan }));
    setChangePlanDialogVisible(false);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const renderSubscriptionStatus = () => {
    if (!subscription) return null;
    
    let statusColor = '';
    let statusText = '';
    
    switch (subscription.status) {
      case 'trial':
        statusColor = theme.colors.warning;
        statusText = 'Trial';
        break;
      case 'active':
        statusColor = theme.colors.success;
        statusText = 'Active';
        break;
      case 'cancelled':
        statusColor = theme.colors.error;
        statusText = 'Cancelled';
        break;
      case 'expired':
        statusColor = theme.colors.error;
        statusText = 'Expired';
        break;
      case 'past_due':
        statusColor = theme.colors.error;
        statusText = 'Past Due';
        break;
      default:
        statusColor = theme.colors.primary;
        statusText = subscription.status;
    }
    
    return (
      <Badge style={[styles.statusBadge, { backgroundColor: statusColor }]}>
        {statusText}
      </Badge>
    );
  };
  
  const renderTrialInfo = () => {
    if (!subscription || subscription.status !== 'trial') return null;
    
    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.trialInfoContainer}>
            <MaterialIcons name="access-time" size={24} color={theme.colors.warning} />
            <View style={styles.trialTextContainer}>
              <Text style={styles.trialTitle}>Trial Period</Text>
              <Text style={styles.trialText}>
                {subscription.trialDaysLeft > 0
                  ? `${subscription.trialDaysLeft} days left in your trial`
                  : 'Your trial has ended'}
              </Text>
              <Text style={styles.trialEndDate}>
                Ends on {formatDate(subscription.trialEndDate)}
              </Text>
            </View>
          </View>
          
          <Button
            mode="contained"
            style={styles.subscribeButton}
            onPress={() => handleSubscribe('monthly')}
            disabled={isLoading}
          >
            Subscribe Now
          </Button>
        </Card.Content>
      </Card>
    );
  };
  
  const renderSubscriptionDetails = () => {
    if (!subscription || subscription.status === 'trial') return null;
    
    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.subscriptionHeader}>
            <View>
              <Text style={styles.planTitle}>
                {subscription.plan === 'monthly' ? 'Monthly' : 'Annual'} Plan
              </Text>
              <Text style={styles.planPrice}>
                ${subscription.price.toFixed(2)}/{subscription.plan === 'monthly' ? 'month' : 'year'}
              </Text>
            </View>
            {renderSubscriptionStatus()}
          </View>
          
          <Divider style={styles.divider} />
          
          <List.Item
            title="Current Period"
            description={`${formatDate(subscription.currentPeriodStart)} - ${formatDate(subscription.currentPeriodEnd)}`}
            left={props => <List.Icon {...props} icon="calendar" />}
          />
          
          <List.Item
            title="Payment Method"
            description={subscription.paymentMethod === 'paypal' ? 'PayPal' : 'None'}
            left={props => (
              <List.Icon
                {...props}
                icon={({ size, color }) => (
                  <FontAwesome5
                    name={subscription.paymentMethod === 'paypal' ? 'paypal' : 'credit-card'}
                    size={size}
                    color={color}
                  />
                )}
              />
            )}
          />
          
          {subscription.cancelAtPeriodEnd && (
            <View style={styles.cancelNotice}>
              <MaterialIcons name="info" size={20} color={theme.colors.error} />
              <Text style={styles.cancelNoticeText}>
                Your subscription will be cancelled on {formatDate(subscription.currentPeriodEnd)}
              </Text>
            </View>
          )}
          
          <View style={styles.actionButtons}>
            <Button
              mode="outlined"
              style={[styles.actionButton, styles.changePlanButton]}
              onPress={() => {
                setSelectedPlan(subscription.plan);
                setChangePlanDialogVisible(true);
              }}
              disabled={isLoading || subscription.status === 'cancelled'}
            >
              Change Plan
            </Button>
            
            <Button
              mode="outlined"
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => setCancelDialogVisible(true)}
              disabled={isLoading || subscription.status === 'cancelled'}
            >
              Cancel
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };
  
  const renderPaymentHistory = () => {
    if (!subscription || !subscription.paymentHistory || subscription.paymentHistory.length === 0) {
      return null;
    }
    
    return (
      <Card style={styles.card}>
        <Card.Title title="Payment History" />
        <Card.Content>
          {subscription.paymentHistory.map((payment, index) => (
            <View key={index} style={styles.paymentItem}>
              <View style={styles.paymentDetails}>
                <Text style={styles.paymentDate}>{formatDate(payment.date)}</Text>
                <Text style={styles.paymentAmount}>
                  ${payment.amount.toFixed(2)} {payment.currency}
                </Text>
              </View>
              <Badge
                style={[
                  styles.paymentStatus,
                  {
                    backgroundColor:
                      payment.status === 'completed'
                        ? theme.colors.success
                        : payment.status === 'pending'
                        ? theme.colors.warning
                        : theme.colors.error
                  }
                ]}
              >
                {payment.status}
              </Badge>
            </View>
          ))}
        </Card.Content>
      </Card>
    );
  };
  
  const renderPricingPlans = () => {
    if (subscription && subscription.status !== 'expired' && subscription.status !== 'cancelled') {
      return null;
    }
    
    return (
      <Card style={styles.card}>
        <Card.Title title="Subscription Plans" />
        <Card.Content>
          <View style={styles.planContainer}>
            <Card style={styles.planCard}>
              <Card.Content>
                <Text style={styles.planCardTitle}>Monthly</Text>
                <Text style={styles.planCardPrice}>$30/month</Text>
                <Text style={styles.planCardDescription}>
                  Full access to all features
                </Text>
                <Text style={styles.planCardDescription}>
                  Billed monthly
                </Text>
                <Button
                  mode="contained"
                  style={styles.planCardButton}
                  onPress={() => handleSubscribe('monthly')}
                  disabled={isLoading}
                >
                  Subscribe
                </Button>
              </Card.Content>
            </Card>
            
            <Card style={[styles.planCard, styles.annualPlanCard]}>
              <Card.Content>
                <View style={styles.saveBadgeContainer}>
                  <Badge style={styles.saveBadge}>Save $60</Badge>
                </View>
                <Text style={styles.planCardTitle}>Annual</Text>
                <Text style={styles.planCardPrice}>$300/year</Text>
                <Text style={styles.planCardDescription}>
                  Full access to all features
                </Text>
                <Text style={styles.planCardDescription}>
                  Billed annually
                </Text>
                <Button
                  mode="contained"
                  style={styles.planCardButton}
                  onPress={() => handleSubscribe('annual')}
                  disabled={isLoading}
                >
                  Subscribe
                </Button>
              </Card.Content>
            </Card>
          </View>
        </Card.Content>
      </Card>
    );
  };
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Subscription</Text>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading subscription details...</Text>
          </View>
        ) : (
          <>
            {renderTrialInfo()}
            {renderSubscriptionDetails()}
            {renderPaymentHistory()}
            {renderPricingPlans()}
          </>
        )}
      </View>
      
      {/* Cancel Subscription Dialog */}
      <Portal>
        <Dialog visible={cancelDialogVisible} onDismiss={() => setCancelDialogVisible(false)}>
          <Dialog.Title>Cancel Subscription</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogText}>
              Are you sure you want to cancel your subscription?
            </Text>
            <View style={styles.switchContainer}>
              <Text>Cancel immediately</Text>
              <Switch
                value={cancelImmediately}
                onValueChange={setCancelImmediately}
                color={theme.colors.primary}
              />
            </View>
            <Text style={styles.dialogNote}>
              {cancelImmediately
                ? 'Your subscription will be cancelled immediately and you will lose access to premium features.'
                : 'Your subscription will be cancelled at the end of the current billing period.'}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCancelDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleCancelSubscription}>Confirm</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      
      {/* Change Plan Dialog */}
      <Portal>
        <Dialog visible={changePlanDialogVisible} onDismiss={() => setChangePlanDialogVisible(false)}>
          <Dialog.Title>Change Subscription Plan</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogText}>
              Select your new subscription plan:
            </Text>
            <TouchableOpacity
              style={[
                styles.planOption,
                selectedPlan === 'monthly' && styles.selectedPlan
              ]}
              onPress={() => setSelectedPlan('monthly')}
            >
              <Text style={styles.planOptionTitle}>Monthly Plan</Text>
              <Text style={styles.planOptionPrice}>$30/month</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.planOption,
                selectedPlan === 'annual' && styles.selectedPlan
              ]}
              onPress={() => setSelectedPlan('annual')}
            >
              <Text style={styles.planOptionTitle}>Annual Plan</Text>
              <Text style={styles.planOptionPrice}>$300/year (Save $60)</Text>
            </TouchableOpacity>
            <Text style={styles.dialogNote}>
              Your plan will be updated immediately. If you're switching from monthly to annual,
              you'll be charged the annual rate. If you're switching from annual to monthly,
              the change will take effect at your next renewal date.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setChangePlanDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleChangePlan}>Confirm</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: theme.colors.text,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    color: theme.colors.text,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  planPrice: {
    fontSize: 16,
    color: theme.colors.text,
    marginTop: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
  },
  divider: {
    marginVertical: 16,
  },
  trialInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  trialTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  trialTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  trialText: {
    fontSize: 14,
    color: theme.colors.text,
    marginTop: 4,
  },
  trialEndDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  subscribeButton: {
    marginTop: 16,
  },
  cancelNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.errorBackground,
    padding: 12,
    borderRadius: 4,
    marginVertical: 16,
  },
  cancelNoticeText: {
    marginLeft: 8,
    color: theme.colors.error,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
  },
  changePlanButton: {
    marginRight: 8,
  },
  cancelButton: {
    marginLeft: 8,
    borderColor: theme.colors.error,
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  paymentDetails: {
    flex: 1,
  },
  paymentDate: {
    fontSize: 14,
    color: theme.colors.text,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 4,
  },
  paymentStatus: {
    marginLeft: 8,
  },
  planContainer: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    justifyContent: 'space-between',
  },
  planCard: {
    flex: Platform.OS === 'web' ? 1 : undefined,
    marginBottom: 16,
    marginRight: Platform.OS === 'web' ? 8 : 0,
    elevation: 2,
  },
  annualPlanCard: {
    marginLeft: Platform.OS === 'web' ? 8 : 0,
    marginRight: 0,
    backgroundColor: theme.colors.primaryLight,
  },
  planCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  planCardPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginVertical: 8,
  },
  planCardDescription: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 4,
  },
  planCardButton: {
    marginTop: 16,
  },
  saveBadgeContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  saveBadge: {
    backgroundColor: theme.colors.success,
  },
  dialogText: {
    marginBottom: 16,
  },
  dialogNote: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  planOption: {
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 4,
    marginBottom: 8,
  },
  selectedPlan: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  planOptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  planOptionPrice: {
    fontSize: 14,
    color: theme.colors.text,
    marginTop: 4,
  },
});

export default SubscriptionScreen;

