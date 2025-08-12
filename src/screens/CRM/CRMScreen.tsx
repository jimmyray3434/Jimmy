import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Searchbar,
  Chip,
  Text,
  IconButton,
  FAB,
  Menu,
  Divider,
  Surface,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RootState, AppDispatch } from '../../store/store';
import { fetchClients, setFilters, clearFilters, deleteClient } from '../../store/slices/crmSlice';
import { theme } from '../../theme/theme';
import { Client } from '../../store/slices/crmSlice';

interface Props {
  navigation: any;
}

const CRMScreen: React.FC<Props> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [menuVisible, setMenuVisible] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const { clients, isLoading, error, pagination, filters } = useSelector(
    (state: RootState) => state.crm
  );

  useEffect(() => {
    loadClients();
  }, [filters]);

  const loadClients = async () => {
    try {
      await dispatch(fetchClients({
        page: 1,
        limit: 20,
        ...filters
      })).unwrap();
    } catch (error) {
      console.error('Failed to load clients:', error);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadClients();
    setRefreshing(false);
  }, [filters]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length > 2 || query.length === 0) {
      dispatch(setFilters({ search: query || undefined }));
    }
  };

  const handleStatusFilter = (status: string) => {
    const newStatus = status === selectedStatus ? '' : status;
    setSelectedStatus(newStatus);
    dispatch(setFilters({ status: newStatus || undefined }));
    setMenuVisible(false);
  };

  const handleDeleteClient = (client: Client) => {
    Alert.alert(
      'Delete Client',
      `Are you sure you want to delete ${client.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteClient(client._id)).unwrap();
              Alert.alert('Success', 'Client deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete client');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'lead': return theme.colors.info;
      case 'prospect': return theme.colors.warning;
      case 'active': return theme.colors.success;
      case 'inactive': return theme.colors.textSecondary;
      case 'lost': return theme.colors.error;
      default: return theme.colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'lead': return 'account-plus';
      case 'prospect': return 'account-clock';
      case 'active': return 'account-check';
      case 'inactive': return 'account-minus';
      case 'lost': return 'account-remove';
      default: return 'account';
    }
  };

  const ClientCard = ({ client }: { client: Client }) => (
    <Card style={styles.clientCard}>
      <Card.Content>
        <View style={styles.clientHeader}>
          <View style={styles.clientInfo}>
            <Title style={styles.clientName}>{client.name}</Title>
            {client.company && (
              <Paragraph style={styles.clientCompany}>{client.company}</Paragraph>
            )}
            <Text style={styles.clientEmail}>{client.email}</Text>
          </View>
          <View style={styles.clientActions}>
            <Chip
              icon={getStatusIcon(client.status)}
              style={[styles.statusChip, { backgroundColor: getStatusColor(client.status) + '20' }]}
              textStyle={{ color: getStatusColor(client.status) }}
            >
              {client.status.toUpperCase()}
            </Chip>
          </View>
        </View>

        <View style={styles.clientMetrics}>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>${client.totalSpent.toLocaleString()}</Text>
            <Text style={styles.metricLabel}>Total Spent</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{client.engagementScore}</Text>
            <Text style={styles.metricLabel}>Engagement</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{client.communications?.length || 0}</Text>
            <Text style={styles.metricLabel}>Communications</Text>
          </View>
        </View>

        {client.nextFollowUpDate && (
          <View style={styles.followUpContainer}>
            <IconButton icon="calendar-clock" size={16} />
            <Text style={styles.followUpText}>
              Follow up: {new Date(client.nextFollowUpDate).toLocaleDateString()}
            </Text>
          </View>
        )}

        <View style={styles.cardActions}>
          <Button
            mode="outlined"
            compact
            onPress={() => navigation.navigate('ClientDetails', { clientId: client._id })}
          >
            View Details
          </Button>
          <Button
            mode="text"
            compact
            onPress={() => navigation.navigate('EditClient', { client })}
          >
            Edit
          </Button>
          <IconButton
            icon="delete"
            size={20}
            onPress={() => handleDeleteClient(client)}
          />
        </View>
      </Card.Content>
    </Card>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <IconButton icon="account-group" size={64} iconColor={theme.colors.textSecondary} />
      <Title style={styles.emptyTitle}>No Clients Found</Title>
      <Paragraph style={styles.emptyText}>
        {filters.search || filters.status
          ? 'Try adjusting your filters or search terms'
          : 'Start building your client base by adding your first client'}
      </Paragraph>
      <Button
        mode="contained"
        onPress={() => navigation.navigate('AddClient')}
        style={styles.emptyButton}
      >
        Add First Client
      </Button>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Search and Filters */}
      <Surface style={styles.header}>
        <Searchbar
          placeholder="Search clients..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchbar}
        />
        
        <View style={styles.filterRow}>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                compact
                onPress={() => setMenuVisible(true)}
                icon="filter"
              >
                {selectedStatus || 'All Status'}
              </Button>
            }
          >
            <Menu.Item onPress={() => handleStatusFilter('')} title="All Status" />
            <Divider />
            <Menu.Item onPress={() => handleStatusFilter('lead')} title="Lead" />
            <Menu.Item onPress={() => handleStatusFilter('prospect')} title="Prospect" />
            <Menu.Item onPress={() => handleStatusFilter('active')} title="Active" />
            <Menu.Item onPress={() => handleStatusFilter('inactive')} title="Inactive" />
            <Menu.Item onPress={() => handleStatusFilter('lost')} title="Lost" />
          </Menu>

          {(filters.search || filters.status) && (
            <Button
              mode="text"
              compact
              onPress={() => {
                dispatch(clearFilters());
                setSearchQuery('');
                setSelectedStatus('');
              }}
            >
              Clear Filters
            </Button>
          )}
        </View>
      </Surface>

      {/* Client List */}
      <FlatList
        data={clients}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <ClientCard client={item} />}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={!isLoading ? <EmptyState /> : null}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Action Button */}
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('AddClient')}
        label="Add Client"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.md,
    elevation: 2,
  },
  searchbar: {
    marginBottom: theme.spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listContainer: {
    padding: theme.spacing.md,
    paddingBottom: 100, // Space for FAB
  },
  clientCard: {
    marginBottom: theme.spacing.md,
    ...theme.shadows.medium,
  },
  clientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
  },
  clientCompany: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  clientEmail: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  clientActions: {
    alignItems: 'flex-end',
  },
  statusChip: {
    marginBottom: theme.spacing.sm,
  },
  clientMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
  },
  metric: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  metricLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  followUpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.warning + '20',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  followUpText: {
    fontSize: 14,
    color: theme.colors.warning,
    marginLeft: theme.spacing.sm,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
    color: theme.colors.textSecondary,
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  emptyButton: {
    marginTop: theme.spacing.md,
  },
  fab: {
    position: 'absolute',
    margin: theme.spacing.md,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
});

export default CRMScreen;

