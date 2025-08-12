import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { 
  Card, 
  Title, 
  Paragraph, 
  Button, 
  List, 
  Divider,
  Text,
  Avatar
} from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RootState, AppDispatch } from '../../store/store';
import { logoutUser } from '../../store/slices/authSlice';
import { theme } from '../../theme/theme';

const ProfileScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Profile Header */}
        <Card style={styles.profileCard}>
          <Card.Content style={styles.profileContent}>
            <Avatar.Text 
              size={80} 
              label={user?.name?.charAt(0) || 'U'} 
              style={styles.avatar}
            />
            <Title style={styles.name}>{user?.name || 'User'}</Title>
            <Paragraph style={styles.email}>{user?.email}</Paragraph>
            
            {/* Subscription Status */}
            <View style={styles.subscriptionBadge}>
              <Text style={styles.subscriptionText}>
                {user?.subscription?.status === 'trial' ? '🎉 Free Trial' : 
                 user?.subscription?.status === 'active' ? '✅ Premium' : '❌ Inactive'}
              </Text>
              {user?.subscription?.status === 'trial' && (
                <Text style={styles.trialText}>
                  Expires: {user?.subscription?.expiresAt ? 
                    new Date(user.subscription.expiresAt).toLocaleDateString() : 'N/A'}
                </Text>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Account Settings */}
        <Card style={styles.settingsCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Account Settings</Title>
            
            <List.Item
              title="Edit Profile"
              description="Update your personal information"
              left={(props) => <List.Icon {...props} icon="account-edit" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {}}
            />
            
            <Divider />
            
            <List.Item
              title="Subscription"
              description="Manage your subscription plan"
              left={(props) => <List.Icon {...props} icon="credit-card" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {}}
            />
            
            <Divider />
            
            <List.Item
              title="Notifications"
              description="Configure notification preferences"
              left={(props) => <List.Icon {...props} icon="bell" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {}}
            />
            
            <Divider />
            
            <List.Item
              title="Privacy & Security"
              description="Manage your privacy settings"
              left={(props) => <List.Icon {...props} icon="shield-account" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {}}
            />
          </Card.Content>
        </Card>

        {/* App Settings */}
        <Card style={styles.settingsCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>App Settings</Title>
            
            <List.Item
              title="Help & Support"
              description="Get help and contact support"
              left={(props) => <List.Icon {...props} icon="help-circle" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {}}
            />
            
            <Divider />
            
            <List.Item
              title="Terms of Service"
              description="Read our terms and conditions"
              left={(props) => <List.Icon {...props} icon="file-document" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {}}
            />
            
            <Divider />
            
            <List.Item
              title="Privacy Policy"
              description="Read our privacy policy"
              left={(props) => <List.Icon {...props} icon="shield-check" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {}}
            />
            
            <Divider />
            
            <List.Item
              title="About"
              description="App version and information"
              left={(props) => <List.Icon {...props} icon="information" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {}}
            />
          </Card.Content>
        </Card>

        {/* Logout Button */}
        <Card style={styles.logoutCard}>
          <Card.Content>
            <Button
              mode="contained"
              onPress={handleLogout}
              icon="logout"
              buttonColor={theme.colors.error}
              style={styles.logoutButton}
            >
              Sign Out
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
  profileCard: {
    marginBottom: theme.spacing.lg,
    ...theme.shadows.medium,
  },
  profileContent: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  avatar: {
    backgroundColor: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
    color: theme.colors.text,
  },
  email: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  subscriptionBadge: {
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.secondary + '20',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.secondary,
  },
  subscriptionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  trialText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  settingsCard: {
    marginBottom: theme.spacing.lg,
    ...theme.shadows.medium,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: theme.spacing.md,
    color: theme.colors.text,
  },
  logoutCard: {
    marginBottom: theme.spacing.lg,
    ...theme.shadows.medium,
  },
  logoutButton: {
    paddingVertical: theme.spacing.sm,
  },
});

export default ProfileScreen;

