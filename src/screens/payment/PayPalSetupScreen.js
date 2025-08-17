import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Linking } from 'react-native';
import { Text, Button, Card, Title, Paragraph, TextInput, Switch, useTheme, Portal, Dialog } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { connectPayPalAccount, fetchPaymentAccount } from '../../store/slices/paymentSlice';
import LoadingScreen from '../../components/common/LoadingScreen';
import ErrorMessage from '../../components/common/ErrorMessage';

const PayPalSetupScreen = ({ navigation, route }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { paymentAccount, loading, error } = useSelector(state => state.payment);
  
  const [email, setEmail] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);

  useEffect(() => {
    dispatch(fetchPaymentAccount('paypal'));
    
    // Check if coming back from PayPal OAuth
    if (route.params?.authCode) {
      handlePayPalCallback(route.params.authCode);
    }
  }, [route.params]);

  useEffect(() => {
    if (paymentAccount && paymentAccount.accountEmail) {
      setEmail(paymentAccount.accountEmail);
    }
  }, [paymentAccount]);

  const handlePayPalCallback = async (authCode) => {
    setIsConnecting(true);
    try {
      await dispatch(connectPayPalAccount(authCode)).unwrap();
      setShowSuccessDialog(true);
    } catch (error) {
      console.error('Error connecting PayPal account:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const initiatePayPalConnect = () => {
    // In a real app, this would redirect to PayPal OAuth
    // For demo purposes, we'll simulate the OAuth flow
    
    // Normally, you would do something like:
    // const paypalAuthUrl = `https://www.paypal.com/connect?client_id=${CLIENT_ID}&response_type=code&scope=email%20payments&redirect_uri=${REDIRECT_URI}`;
    // Linking.openURL(paypalAuthUrl);
    
    // For demo, we'll simulate a successful connection
    const simulatedAuthCode = `AUTH-${Date.now()}`;
    handlePayPalCallback(simulatedAuthCode);
  };

  const disconnectPayPalAccount = async () => {
    try {
      // In a real app, this would call an API to disconnect the account
      // For demo purposes, we'll simulate the disconnection
      
      // Normally, you would do something like:
      // await dispatch(disconnectPaymentAccount('paypal')).unwrap();
      
      setShowDisconnectDialog(false);
      navigation.goBack();
    } catch (error) {
      console.error('Error disconnecting PayPal account:', error);
    }
  };

  if (loading && !isConnecting) {
    return <LoadingScreen />;
  }

  if (error && !isConnecting) {
    return <ErrorMessage message={error} onRetry={() => dispatch(fetchPaymentAccount('paypal'))} />;
  }

  const isConnected = paymentAccount && paymentAccount.isConnected;

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.headerContainer}>
            <MaterialCommunityIcons name="paypal" size={40} color={theme.colors.primary} />
            <Title style={styles.title}>PayPal Account Setup</Title>
          </View>
          
          {isConnected ? (
            <>
              <Paragraph style={styles.paragraph}>
                Your PayPal account is connected and ready to receive automatic withdrawals.
              </Paragraph>
              
              <View style={styles.accountInfoContainer}>
                <Text style={styles.accountInfoLabel}>Connected Account:</Text>
                <Text style={styles.accountInfoValue}>{paymentAccount.accountEmail}</Text>
              </View>
              
              <View style={styles.accountInfoContainer}>
                <Text style={styles.accountInfoLabel}>Status:</Text>
                <View style={styles.statusContainer}>
                  <View style={[styles.statusIndicator, { backgroundColor: theme.colors.primary }]} />
                  <Text style={styles.accountInfoValue}>Active</Text>
                </View>
              </View>
              
              <View style={styles.accountInfoContainer}>
                <Text style={styles.accountInfoLabel}>Connected Since:</Text>
                <Text style={styles.accountInfoValue}>
                  {new Date(paymentAccount.lastConnected).toLocaleDateString()}
                </Text>
              </View>
              
              <Button 
                mode="outlined" 
                style={styles.disconnectButton}
                onPress={() => setShowDisconnectDialog(true)}
              >
                Disconnect Account
              </Button>
            </>
          ) : (
            <>
              <Paragraph style={styles.paragraph}>
                Connect your PayPal account to receive automatic withdrawals of your earnings.
              </Paragraph>
              
              <TextInput
                label="PayPal Email"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              
              <Paragraph style={styles.infoText}>
                By connecting your PayPal account, you authorize us to send payments to this account automatically based on your withdrawal settings.
              </Paragraph>
              
              <Button 
                mode="contained" 
                style={styles.connectButton}
                loading={isConnecting}
                disabled={isConnecting || !email || !/^\S+@\S+\.\S+$/.test(email)}
                onPress={initiatePayPalConnect}
              >
                Connect PayPal Account
              </Button>
            </>
          )}
        </Card.Content>
      </Card>
      
      <Card style={styles.infoCard}>
        <Card.Content>
          <Title style={styles.infoTitle}>About PayPal Integration</Title>
          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="shield-check" size={24} color={theme.colors.primary} style={styles.infoIcon} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoItemTitle}>Secure Connection</Text>
              <Text style={styles.infoItemText}>Your PayPal account details are securely stored and encrypted.</Text>
            </View>
          </View>
          
          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="cash-fast" size={24} color={theme.colors.primary} style={styles.infoIcon} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoItemTitle}>Fast Withdrawals</Text>
              <Text style={styles.infoItemText}>Receive your earnings quickly with automatic PayPal withdrawals.</Text>
            </View>
          </View>
          
          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="cog-outline" size={24} color={theme.colors.primary} style={styles.infoIcon} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoItemTitle}>Customizable Settings</Text>
              <Text style={styles.infoItemText}>Configure minimum withdrawal amounts and frequency.</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
      
      <Portal>
        <Dialog visible={showSuccessDialog} onDismiss={() => setShowSuccessDialog(false)}>
          <Dialog.Title>Success!</Dialog.Title>
          <Dialog.Content>
            <Paragraph>Your PayPal account has been successfully connected. You can now receive automatic withdrawals.</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => {
              setShowSuccessDialog(false);
              navigation.navigate('WithdrawalSettingsScreen');
            }}>Configure Withdrawals</Button>
            <Button onPress={() => setShowSuccessDialog(false)}>Done</Button>
          </Dialog.Actions>
        </Dialog>
        
        <Dialog visible={showDisconnectDialog} onDismiss={() => setShowDisconnectDialog(false)}>
          <Dialog.Title>Disconnect PayPal?</Dialog.Title>
          <Dialog.Content>
            <Paragraph>Are you sure you want to disconnect your PayPal account? You will no longer receive automatic withdrawals.</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDisconnectDialog(false)}>Cancel</Button>
            <Button onPress={disconnectPayPalAccount}>Disconnect</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    marginLeft: 16,
  },
  paragraph: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  infoText: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 16,
  },
  connectButton: {
    marginTop: 8,
  },
  disconnectButton: {
    marginTop: 24,
  },
  accountInfoContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  accountInfoLabel: {
    flex: 1,
    opacity: 0.7,
  },
  accountInfoValue: {
    flex: 2,
    fontWeight: 'bold',
  },
  statusContainer: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  infoCard: {
    marginBottom: 16,
  },
  infoTitle: {
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  infoIcon: {
    marginRight: 16,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoItemTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  infoItemText: {
    opacity: 0.7,
  },
});

export default PayPalSetupScreen;

