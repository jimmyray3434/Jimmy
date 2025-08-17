import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Title, Paragraph, Switch, Button, RadioButton, TextInput, Divider, useTheme } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { fetchPaymentAccount, updateWithdrawalSettings } from '../../store/slices/paymentSlice';
import LoadingScreen from '../../components/common/LoadingScreen';
import ErrorMessage from '../../components/common/ErrorMessage';

const WithdrawalSettingsScreen = ({ navigation }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { paymentAccount, loading, error } = useSelector(state => state.payment);
  
  const [autoWithdrawalEnabled, setAutoWithdrawalEnabled] = useState(false);
  const [minAmount, setMinAmount] = useState('50');
  const [frequency, setFrequency] = useState('monthly');
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [dayOfWeek, setDayOfWeek] = useState('1');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchPaymentAccount('paypal'));
  }, []);

  useEffect(() => {
    if (paymentAccount && paymentAccount.withdrawalSettings) {
      const settings = paymentAccount.withdrawalSettings;
      setAutoWithdrawalEnabled(settings.isAutoWithdrawalEnabled || false);
      setMinAmount(settings.minAmount ? settings.minAmount.toString() : '50');
      setFrequency(settings.frequency || 'monthly');
      setDayOfMonth(settings.dayOfMonth ? settings.dayOfMonth.toString() : '1');
      setDayOfWeek(settings.dayOfWeek ? settings.dayOfWeek.toString() : '1');
    }
  }, [paymentAccount]);

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const settings = {
        minAmount: parseFloat(minAmount),
        frequency,
        dayOfMonth: parseInt(dayOfMonth, 10),
        dayOfWeek: parseInt(dayOfWeek, 10),
        isAutoWithdrawalEnabled: autoWithdrawalEnabled
      };
      
      await dispatch(updateWithdrawalSettings({
        provider: 'paypal',
        settings
      })).unwrap();
      
      navigation.goBack();
    } catch (error) {
      console.error('Error updating withdrawal settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading && !isSaving) {
    return <LoadingScreen />;
  }

  if (error && !isSaving) {
    return <ErrorMessage message={error} onRetry={() => dispatch(fetchPaymentAccount('paypal'))} />;
  }

  const isConnected = paymentAccount && paymentAccount.isConnected;

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Withdrawal Settings</Title>
          
          {!isConnected ? (
            <>
              <Paragraph style={styles.paragraph}>
                You need to connect a payment account before configuring withdrawal settings.
              </Paragraph>
              <Button 
                mode="contained" 
                onPress={() => navigation.navigate('PayPalSetupScreen')}
                style={styles.connectButton}
              >
                Connect PayPal Account
              </Button>
            </>
          ) : (
            <>
              <View style={styles.settingItem}>
                <View style={styles.settingLabelContainer}>
                  <Text style={styles.settingLabel}>Automatic Withdrawals</Text>
                  <Text style={styles.settingDescription}>
                    Automatically withdraw your earnings based on your settings
                  </Text>
                </View>
                <Switch
                  value={autoWithdrawalEnabled}
                  onValueChange={setAutoWithdrawalEnabled}
                  color={theme.colors.primary}
                />
              </View>
              
              <Divider style={styles.divider} />
              
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Minimum Withdrawal Amount</Text>
                <TextInput
                  value={minAmount}
                  onChangeText={setMinAmount}
                  keyboardType="numeric"
                  style={styles.amountInput}
                  disabled={!autoWithdrawalEnabled}
                  left={<TextInput.Affix text="$" />}
                />
              </View>
              
              <Divider style={styles.divider} />
              
              <Text style={styles.sectionTitle}>Withdrawal Frequency</Text>
              
              <RadioButton.Group onValueChange={value => setFrequency(value)} value={frequency}>
                <View style={styles.radioItem}>
                  <RadioButton.Android 
                    value="monthly" 
                    disabled={!autoWithdrawalEnabled}
                    color={theme.colors.primary}
                  />
                  <Text style={[
                    styles.radioLabel,
                    !autoWithdrawalEnabled && styles.disabledText
                  ]}>Monthly</Text>
                </View>
                
                {frequency === 'monthly' && autoWithdrawalEnabled && (
                  <View style={styles.subSetting}>
                    <Text style={styles.subSettingLabel}>Day of month:</Text>
                    <TextInput
                      value={dayOfMonth}
                      onChangeText={setDayOfMonth}
                      keyboardType="numeric"
                      style={styles.dayInput}
                    />
                  </View>
                )}
                
                <View style={styles.radioItem}>
                  <RadioButton.Android 
                    value="weekly" 
                    disabled={!autoWithdrawalEnabled}
                    color={theme.colors.primary}
                  />
                  <Text style={[
                    styles.radioLabel,
                    !autoWithdrawalEnabled && styles.disabledText
                  ]}>Weekly</Text>
                </View>
                
                {frequency === 'weekly' && autoWithdrawalEnabled && (
                  <View style={styles.subSetting}>
                    <Text style={styles.subSettingLabel}>Day of week:</Text>
                    <View style={styles.weekdayContainer}>
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                        <Button
                          key={index}
                          mode={dayOfWeek === index.toString() ? 'contained' : 'outlined'}
                          compact
                          style={styles.weekdayButton}
                          onPress={() => setDayOfWeek(index.toString())}
                        >
                          {day}
                        </Button>
                      ))}
                    </View>
                  </View>
                )}
                
                <View style={styles.radioItem}>
                  <RadioButton.Android 
                    value="daily" 
                    disabled={!autoWithdrawalEnabled}
                    color={theme.colors.primary}
                  />
                  <Text style={[
                    styles.radioLabel,
                    !autoWithdrawalEnabled && styles.disabledText
                  ]}>Daily</Text>
                </View>
              </RadioButton.Group>
              
              <Divider style={styles.divider} />
              
              <View style={styles.buttonContainer}>
                <Button 
                  mode="outlined" 
                  onPress={() => navigation.goBack()}
                  style={styles.cancelButton}
                >
                  Cancel
                </Button>
                <Button 
                  mode="contained" 
                  onPress={saveSettings}
                  loading={isSaving}
                  disabled={isSaving}
                  style={styles.saveButton}
                >
                  Save Settings
                </Button>
              </View>
            </>
          )}
        </Card.Content>
      </Card>
      
      <Card style={styles.infoCard}>
        <Card.Content>
          <Title style={styles.infoTitle}>About Automatic Withdrawals</Title>
          
          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="information-outline" size={24} color={theme.colors.primary} style={styles.infoIcon} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoItemText}>
                Automatic withdrawals will only occur when your balance exceeds the minimum withdrawal amount.
              </Text>
            </View>
          </View>
          
          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="calendar-clock" size={24} color={theme.colors.primary} style={styles.infoIcon} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoItemText}>
                For monthly withdrawals, payments are processed on the specified day of each month. If the day doesn't exist in a month (e.g., 31st), the withdrawal will occur on the last day of the month.
              </Text>
            </View>
          </View>
          
          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="cash-lock" size={24} color={theme.colors.primary} style={styles.infoIcon} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoItemText}>
                You can manually withdraw your earnings at any time, regardless of your automatic withdrawal settings.
              </Text>
            </View>
          </View>
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
  card: {
    marginBottom: 16,
  },
  paragraph: {
    marginBottom: 16,
  },
  connectButton: {
    marginTop: 8,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  settingLabelContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
  },
  settingDescription: {
    fontSize: 12,
    opacity: 0.7,
  },
  divider: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  radioLabel: {
    fontSize: 16,
    marginLeft: 8,
  },
  disabledText: {
    opacity: 0.5,
  },
  subSetting: {
    marginLeft: 32,
    marginTop: 8,
    marginBottom: 16,
  },
  subSettingLabel: {
    marginBottom: 8,
  },
  dayInput: {
    width: 80,
  },
  amountInput: {
    width: 120,
  },
  weekdayContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  weekdayButton: {
    margin: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  cancelButton: {
    marginRight: 8,
  },
  saveButton: {
    minWidth: 120,
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
  infoItemText: {
    opacity: 0.7,
  },
});

export default WithdrawalSettingsScreen;

