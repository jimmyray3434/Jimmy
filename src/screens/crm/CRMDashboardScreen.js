import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, Title, Paragraph, Divider, List, useTheme, Avatar } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { fetchLeads, fetchContacts, fetchLeadStats } from '../../store/slices/crmSlice';
import LoadingScreen from '../../components/common/LoadingScreen';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';
import LeadItem from '../../components/crm/LeadItem';
import ContactItem from '../../components/crm/ContactItem';
import LeadStatusChart from '../../components/crm/LeadStatusChart';

const CRMDashboardScreen = ({ navigation }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const { 
    leads, 
    contacts, 
    leadStats, 
    loading, 
    error 
  } = useSelector(state => state.crm);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      dispatch(fetchLeads({ limit: 5 })),
      dispatch(fetchContacts({ limit: 5 })),
      dispatch(fetchLeadStats())
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

  if (error && !refreshing) {
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
          <Title>Lead Overview</Title>
          
          {leadStats ? (
            <>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{leadStats.leads.totalLeads}</Text>
                  <Text style={styles.statLabel}>Total Leads</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{leadStats.leads.qualifiedLeads}</Text>
                  <Text style={styles.statLabel}>Qualified</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{leadStats.leads.convertedLeads}</Text>
                  <Text style={styles.statLabel}>Converted</Text>
                </View>
              </View>
              
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{leadStats.contacts.totalContacts}</Text>
                  <Text style={styles.statLabel}>Contacts</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{leadStats.contacts.customerContacts}</Text>
                  <Text style={styles.statLabel}>Customers</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                    {leadStats.leads.conversionRate.toFixed(1)}%
                  </Text>
                  <Text style={styles.statLabel}>Conversion Rate</Text>
                </View>
              </View>
              
              {leadStats.leads.totalLeads > 0 && (
                <LeadStatusChart 
                  newLeads={leadStats.leads.newLeads}
                  qualifiedLeads={leadStats.leads.qualifiedLeads}
                  disqualifiedLeads={leadStats.leads.disqualifiedLeads}
                  convertedLeads={leadStats.leads.convertedLeads}
                />
              )}
            </>
          ) : (
            <EmptyState 
              icon="chart-line" 
              message="No lead data available yet" 
              suggestion="Start adding leads to see statistics"
            />
          )}
        </Card.Content>
      </Card>

      <Card style={styles.leadsCard}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Title>Recent Leads</Title>
            <Button 
              mode="text" 
              onPress={() => navigation.navigate('LeadsScreen')}
            >
              View All
            </Button>
          </View>
          
          {leads && leads.length > 0 ? (
            leads.map((lead) => (
              <LeadItem 
                key={lead._id} 
                lead={lead} 
                onPress={() => navigation.navigate('LeadDetailScreen', { leadId: lead._id })}
              />
            ))
          ) : (
            <EmptyState 
              icon="account-plus" 
              message="No leads yet" 
              suggestion="Add your first lead to get started"
            />
          )}
          
          <Button 
            mode="contained" 
            icon="plus" 
            onPress={() => navigation.navigate('AddLeadScreen')}
            style={styles.addButton}
          >
            Add New Lead
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.contactsCard}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Title>Recent Contacts</Title>
            <Button 
              mode="text" 
              onPress={() => navigation.navigate('ContactsScreen')}
            >
              View All
            </Button>
          </View>
          
          {contacts && contacts.length > 0 ? (
            contacts.map((contact) => (
              <ContactItem 
                key={contact._id} 
                contact={contact} 
                onPress={() => navigation.navigate('ContactDetailScreen', { contactId: contact._id })}
              />
            ))
          ) : (
            <EmptyState 
              icon="account-multiple" 
              message="No contacts yet" 
              suggestion="Convert leads to contacts or add contacts directly"
            />
          )}
          
          <Button 
            mode="outlined" 
            icon="plus" 
            onPress={() => navigation.navigate('AddContactScreen')}
            style={styles.addButton}
          >
            Add New Contact
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.actionsCard}>
        <Card.Content>
          <Title>Quick Actions</Title>
          
          <List.Item
            title="Automations"
            description="Set up lead nurturing automations"
            left={props => <List.Icon {...props} icon="robot" />}
            onPress={() => navigation.navigate('AutomationsScreen')}
            style={styles.actionItem}
          />
          
          <List.Item
            title="Email Templates"
            description="Manage your email templates"
            left={props => <List.Icon {...props} icon="email-multiple" />}
            onPress={() => navigation.navigate('EmailTemplatesScreen')}
            style={styles.actionItem}
          />
          
          <List.Item
            title="Import Leads"
            description="Import leads from CSV or other sources"
            left={props => <List.Icon {...props} icon="file-import" />}
            onPress={() => navigation.navigate('ImportLeadsScreen')}
            style={styles.actionItem}
          />
          
          <List.Item
            title="CRM Settings"
            description="Configure CRM preferences"
            left={props => <List.Icon {...props} icon="cog" />}
            onPress={() => navigation.navigate('CRMSettingsScreen')}
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  leadsCard: {
    marginBottom: 16,
  },
  contactsCard: {
    marginBottom: 16,
  },
  addButton: {
    marginTop: 16,
  },
  actionsCard: {
    marginBottom: 16,
  },
  actionItem: {
    paddingVertical: 4,
  },
});

export default CRMDashboardScreen;

