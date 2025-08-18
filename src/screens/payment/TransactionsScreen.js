import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Title, Chip, Searchbar, Menu, Button, Divider, useTheme } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { fetchTransactions } from '../../store/slices/paymentSlice';
import TransactionItem from '../../components/payment/TransactionItem';
import LoadingScreen from '../../components/common/LoadingScreen';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';

const TransactionsScreen = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { transactions, loading, error } = useSelector(state => state.payment);
  
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, [typeFilter, statusFilter]);

  const loadTransactions = async (reset = true) => {
    if (reset) {
      setPage(1);
      setHasMorePages(true);
    }
    
    const params = {
      page: reset ? 1 : page,
      limit: 20,
      ...(typeFilter !== 'all' && { type: typeFilter }),
      ...(statusFilter !== 'all' && { status: statusFilter }),
      ...(searchQuery && { search: searchQuery })
    };
    
    try {
      const result = await dispatch(fetchTransactions(params)).unwrap();
      
      if (result.pagination) {
        setHasMorePages(result.pagination.page < result.pagination.pages);
      } else {
        setHasMorePages(false);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const loadMoreTransactions = async () => {
    if (!hasMorePages || loadingMore) return;
    
    setLoadingMore(true);
    setPage(prevPage => prevPage + 1);
    
    try {
      await loadTransactions(false);
    } finally {
      setLoadingMore(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const handleSearch = () => {
    loadTransactions();
  };

  const clearFilters = () => {
    setTypeFilter('all');
    setStatusFilter('all');
    setSearchQuery('');
    loadTransactions();
  };

  const renderTypeMenu = () => (
    <Menu
      visible={showTypeMenu}
      onDismiss={() => setShowTypeMenu(false)}
      anchor={
        <Chip 
          icon="filter-variant" 
          onPress={() => setShowTypeMenu(true)}
          selected={typeFilter !== 'all'}
          style={styles.filterChip}
        >
          Type: {typeFilter === 'all' ? 'All' : typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1)}
        </Chip>
      }
    >
      <Menu.Item onPress={() => { setTypeFilter('all'); setShowTypeMenu(false); }} title="All" />
      <Menu.Item onPress={() => { setTypeFilter('revenue'); setShowTypeMenu(false); }} title="Revenue" />
      <Menu.Item onPress={() => { setTypeFilter('withdrawal'); setShowTypeMenu(false); }} title="Withdrawal" />
      <Menu.Item onPress={() => { setTypeFilter('refund'); setShowTypeMenu(false); }} title="Refund" />
      <Menu.Item onPress={() => { setTypeFilter('fee'); setShowTypeMenu(false); }} title="Fee" />
    </Menu>
  );

  const renderStatusMenu = () => (
    <Menu
      visible={showStatusMenu}
      onDismiss={() => setShowStatusMenu(false)}
      anchor={
        <Chip 
          icon="filter-variant" 
          onPress={() => setShowStatusMenu(true)}
          selected={statusFilter !== 'all'}
          style={styles.filterChip}
        >
          Status: {statusFilter === 'all' ? 'All' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
        </Chip>
      }
    >
      <Menu.Item onPress={() => { setStatusFilter('all'); setShowStatusMenu(false); }} title="All" />
      <Menu.Item onPress={() => { setStatusFilter('completed'); setShowStatusMenu(false); }} title="Completed" />
      <Menu.Item onPress={() => { setStatusFilter('pending'); setShowStatusMenu(false); }} title="Pending" />
      <Menu.Item onPress={() => { setStatusFilter('failed'); setShowStatusMenu(false); }} title="Failed" />
      <Menu.Item onPress={() => { setStatusFilter('cancelled'); setShowStatusMenu(false); }} title="Cancelled" />
    </Menu>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <LoadingScreen size="small" />
      </View>
    );
  };

  if (loading && !refreshing && !loadingMore) {
    return <LoadingScreen />;
  }

  if (error && !refreshing && !loadingMore) {
    return <ErrorMessage message={error} onRetry={loadTransactions} />;
  }

  const filteredTransactions = transactions || [];

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search transactions..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        onSubmitEditing={handleSearch}
        style={styles.searchBar}
      />
      
      <View style={styles.filtersContainer}>
        {renderTypeMenu()}
        {renderStatusMenu()}
        
        {(typeFilter !== 'all' || statusFilter !== 'all' || searchQuery) && (
          <Chip 
            icon="close" 
            onPress={clearFilters}
            style={styles.clearChip}
          >
            Clear Filters
          </Chip>
        )}
      </View>
      
      {filteredTransactions.length === 0 ? (
        <EmptyState 
          icon="cash-multiple" 
          message="No transactions found" 
          suggestion={
            typeFilter !== 'all' || statusFilter !== 'all' || searchQuery
              ? "Try changing your filters"
              : "Your transaction history will appear here"
          }
        />
      ) : (
        <FlatList
          data={filteredTransactions}
          renderItem={({ item }) => <TransactionItem transaction={item} />}
          keyExtractor={item => item._id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReached={loadMoreTransactions}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  searchBar: {
    marginBottom: 16,
  },
  filtersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  filterChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  clearChip: {
    marginBottom: 8,
  },
  listContent: {
    paddingBottom: 16,
  },
  footerLoader: {
    paddingVertical: 16,
  },
});

export default TransactionsScreen;

