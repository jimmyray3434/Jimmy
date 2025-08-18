import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, Card, Title, Paragraph, Button, Chip, FAB, Searchbar, Menu, Divider, ActivityIndicator } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { getContent, setPage, reset } from '../../store/slices/contentSlice';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import { CONTENT_TYPES, CONTENT_STATUSES } from '../../config';

const ContentListScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { content, isLoading, pagination } = useSelector((state) => state.content);
  
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState(null);
  const [typeFilter, setTypeFilter] = useState(null);

  useEffect(() => {
    loadContent();
    
    return () => {
      dispatch(reset());
    };
  }, [dispatch, pagination.page, statusFilter, typeFilter]);

  const loadContent = () => {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...(statusFilter && { status: statusFilter }),
      ...(typeFilter && { type: typeFilter }),
      ...(searchQuery && { search: searchQuery }),
    };
    
    dispatch(getContent(params));
  };

  const handleRefresh = () => {
    setRefreshing(true);
    dispatch(setPage(1));
    loadContent();
    setRefreshing(false);
  };

  const handleSearch = () => {
    dispatch(setPage(1));
    loadContent();
  };

  const clearFilters = () => {
    setStatusFilter(null);
    setTypeFilter(null);
    setFilterVisible(false);
    dispatch(setPage(1));
  };

  const handleLoadMore = () => {
    if (pagination.page < pagination.totalPages && !isLoading) {
      dispatch(setPage(pagination.page + 1));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case CONTENT_STATUSES.PUBLISHED:
        return colors.success;
      case CONTENT_STATUSES.SCHEDULED:
        return colors.info;
      case CONTENT_STATUSES.DRAFT:
        return colors.warning;
      case CONTENT_STATUSES.ARCHIVED:
        return colors.disabled;
      default:
        return colors.placeholder;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case CONTENT_TYPES.BLOG_POST:
        return 'post';
      case CONTENT_TYPES.ARTICLE:
        return 'file-document-outline';
      case CONTENT_TYPES.SOCIAL_POST:
        return 'twitter';
      case CONTENT_TYPES.PRODUCT_REVIEW:
        return 'star-outline';
      case CONTENT_TYPES.EMAIL:
        return 'email-outline';
      case CONTENT_TYPES.LANDING_PAGE:
        return 'web';
      default:
        return 'file-outline';
    }
  };

  const renderContentItem = ({ item }) => (
    <Card 
      style={styles.card}
      onPress={() => navigation.navigate('ContentDetail', { contentId: item._id })}
    >
      <Card.Content>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons 
            name={getTypeIcon(item.type)} 
            size={24} 
            color={colors.primary} 
          />
          <Chip 
            style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}
            textStyle={styles.statusText}
          >
            {item.status}
          </Chip>
        </View>
        
        <Title style={styles.cardTitle} numberOfLines={2}>{item.title}</Title>
        <Paragraph style={styles.cardDescription} numberOfLines={3}>
          {item.description || 'No description provided'}
        </Paragraph>
        
        <View style={styles.cardFooter}>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="eye-outline" size={16} color={colors.placeholder} />
              <Text style={styles.statText}>{item.performance?.views || 0}</Text>
            </View>
            
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="share-variant-outline" size={16} color={colors.placeholder} />
              <Text style={styles.statText}>{item.performance?.shares || 0}</Text>
            </View>
            
            {item.performance?.revenue > 0 && (
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="currency-usd" size={16} color={colors.placeholder} />
                <Text style={styles.statText}>${item.performance?.revenue.toFixed(2)}</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.dateText}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="file-document-outline" size={64} color={colors.disabled} />
      <Text style={styles.emptyText}>No content found</Text>
      <Text style={styles.emptySubtext}>
        {searchQuery || statusFilter || typeFilter
          ? 'Try changing your search or filters'
          : 'Start by generating or creating new content'}
      </Text>
      <Button 
        mode="contained" 
        onPress={() => navigation.navigate('ContentGenerate')}
        style={styles.emptyButton}
      >
        Generate Content
      </Button>
    </View>
  );

  const renderFooter = () => {
    if (!isLoading) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.footerText}>Loading more content...</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search content..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          onSubmitEditing={handleSearch}
          style={styles.searchbar}
        />
        
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setFilterVisible(!filterVisible)}
        >
          <MaterialCommunityIcons 
            name="filter-variant" 
            size={24} 
            color={statusFilter || typeFilter ? colors.primary : colors.text} 
          />
          {(statusFilter || typeFilter) && (
            <View style={styles.filterIndicator} />
          )}
        </TouchableOpacity>
      </View>
      
      {filterVisible && (
        <View style={styles.filtersContainer}>
          <Text style={styles.filterTitle}>Status:</Text>
          <View style={styles.chipContainer}>
            {Object.values(CONTENT_STATUSES).map((status) => (
              <Chip
                key={status}
                selected={statusFilter === status}
                onPress={() => setStatusFilter(statusFilter === status ? null : status)}
                style={[
                  styles.filterChip,
                  statusFilter === status && { backgroundColor: getStatusColor(status) }
                ]}
                textStyle={statusFilter === status ? styles.selectedChipText : {}}
              >
                {status}
              </Chip>
            ))}
          </View>
          
          <Text style={styles.filterTitle}>Type:</Text>
          <View style={styles.chipContainer}>
            {Object.values(CONTENT_TYPES).map((type) => (
              <Chip
                key={type}
                selected={typeFilter === type}
                onPress={() => setTypeFilter(typeFilter === type ? null : type)}
                style={[
                  styles.filterChip,
                  typeFilter === type && { backgroundColor: colors.primary }
                ]}
                textStyle={typeFilter === type ? styles.selectedChipText : {}}
              >
                {type.replace('-', ' ')}
              </Chip>
            ))}
          </View>
          
          <Button 
            mode="text" 
            onPress={clearFilters}
            style={styles.clearButton}
          >
            Clear Filters
          </Button>
        </View>
      )}
      
      <FlatList
        data={content}
        renderItem={renderContentItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={renderEmptyList}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
      />
      
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('ContentGenerate')}
        color="white"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: spacing.sm,
    backgroundColor: colors.surface,
    elevation: 2,
  },
  searchbar: {
    flex: 1,
    marginRight: spacing.sm,
  },
  filterButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 48,
    borderRadius: 4,
  },
  filterIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  filtersContainer: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
  },
  filterChip: {
    margin: spacing.xs,
  },
  selectedChipText: {
    color: 'white',
  },
  clearButton: {
    alignSelf: 'flex-end',
  },
  listContainer: {
    padding: spacing.sm,
    paddingBottom: spacing.xl * 2,
  },
  card: {
    marginBottom: spacing.md,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statusChip: {
    height: 24,
  },
  statusText: {
    fontSize: 10,
    color: 'white',
  },
  cardTitle: {
    fontSize: 16,
    marginBottom: spacing.xs,
  },
  cardDescription: {
    fontSize: 14,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  statsContainer: {
    flexDirection: 'row',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  statText: {
    fontSize: 12,
    color: colors.placeholder,
    marginLeft: 4,
  },
  dateText: {
    fontSize: 12,
    color: colors.placeholder,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.placeholder,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  emptyButton: {
    marginTop: spacing.md,
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  footerText: {
    marginLeft: spacing.sm,
    color: colors.placeholder,
  },
  fab: {
    position: 'absolute',
    margin: spacing.md,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
  },
});

export default ContentListScreen;

