import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Share, Alert } from 'react-native';
import { Text, Card, Title, Paragraph, Button, Chip, Divider, Menu, ActivityIndicator, Portal, Dialog, Snackbar, FAB } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { getContentById, deleteContent, publishContent, scheduleContent, reset } from '../../store/slices/contentSlice';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import { CONTENT_STATUSES } from '../../config';

const ContentDetailScreen = ({ route, navigation }) => {
  const { contentId } = route.params;
  const dispatch = useDispatch();
  const { currentContent, isLoading, isSuccess, isError, message } = useSelector((state) => state.content);
  
  const [menuVisible, setMenuVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [publishDialogVisible, setPublishDialogVisible] = useState(false);
  const [scheduleDialogVisible, setScheduleDialogVisible] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [scheduledDate, setScheduledDate] = useState(new Date());

  useEffect(() => {
    dispatch(getContentById(contentId));
    
    return () => {
      dispatch(reset());
    };
  }, [dispatch, contentId]);

  useEffect(() => {
    if (isError && message) {
      setSnackbarMessage(message);
      setSnackbarVisible(true);
    }
  }, [isError, message]);

  const handleEdit = () => {
    navigation.navigate('ContentEdit', { contentId });
    setMenuVisible(false);
  };

  const handleDelete = () => {
    setDeleteDialogVisible(false);
    dispatch(deleteContent(contentId));
    
    // Show success message
    setSnackbarMessage('Content deleted successfully');
    setSnackbarVisible(true);
    
    // Navigate back after a short delay
    setTimeout(() => {
      navigation.goBack();
    }, 1500);
  };

  const handlePublish = () => {
    setPublishDialogVisible(false);
    dispatch(publishContent({ id: contentId, publishData: { status: CONTENT_STATUSES.PUBLISHED } }));
    
    // Show success message
    setSnackbarMessage('Content published successfully');
    setSnackbarVisible(true);
  };

  const handleSchedule = () => {
    setScheduleDialogVisible(false);
    dispatch(scheduleContent({ 
      id: contentId, 
      scheduleData: { 
        status: CONTENT_STATUSES.SCHEDULED,
        publishDate: scheduledDate.toISOString()
      } 
    }));
    
    // Show success message
    setSnackbarMessage(`Content scheduled for ${scheduledDate.toLocaleString()}`);
    setSnackbarVisible(true);
  };

  const handleShare = async () => {
    if (!currentContent) return;
    
    try {
      await Share.share({
        message: `${currentContent.title}\n\n${currentContent.description || ''}\n\n${currentContent.content}`,
        title: currentContent.title,
      });
    } catch (error) {
      setSnackbarMessage('Error sharing content');
      setSnackbarVisible(true);
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

  if (isLoading || !currentContent) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading content...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Title style={styles.title}>{currentContent.title}</Title>
            <Chip 
              style={[styles.statusChip, { backgroundColor: getStatusColor(currentContent.status) }]}
              textStyle={styles.statusText}
            >
              {currentContent.status}
            </Chip>
          </View>
          
          <TouchableOpacity onPress={() => setMenuVisible(true)}>
            <MaterialCommunityIcons name="dots-vertical" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={{ x: 0, y: 0 }}
            style={styles.menu}
          >
            <Menu.Item 
              onPress={handleEdit} 
              title="Edit" 
              icon="pencil"
            />
            <Menu.Item 
              onPress={() => {
                setMenuVisible(false);
                setPublishDialogVisible(true);
              }} 
              title="Publish" 
              icon="publish"
              disabled={currentContent.status === CONTENT_STATUSES.PUBLISHED}
            />
            <Menu.Item 
              onPress={() => {
                setMenuVisible(false);
                setScheduleDialogVisible(true);
              }} 
              title="Schedule" 
              icon="calendar"
              disabled={currentContent.status === CONTENT_STATUSES.PUBLISHED}
            />
            <Menu.Item 
              onPress={handleShare} 
              title="Share" 
              icon="share-variant"
            />
            <Divider />
            <Menu.Item 
              onPress={() => {
                setMenuVisible(false);
                setDeleteDialogVisible(true);
              }} 
              title="Delete" 
              icon="delete"
              titleStyle={{ color: colors.error }}
            />
          </Menu>
        </View>
        
        {currentContent.description && (
          <Card style={styles.card}>
            <Card.Content>
              <Paragraph style={styles.description}>{currentContent.description}</Paragraph>
            </Card.Content>
          </Card>
        )}
        
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.metadataContainer}>
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>Type</Text>
                <Text style={styles.metadataValue}>{currentContent.type.replace('-', ' ')}</Text>
              </View>
              
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>Created</Text>
                <Text style={styles.metadataValue}>
                  {new Date(currentContent.createdAt).toLocaleDateString()}
                </Text>
              </View>
              
              {currentContent.publishDate && (
                <View style={styles.metadataItem}>
                  <Text style={styles.metadataLabel}>Publish Date</Text>
                  <Text style={styles.metadataValue}>
                    {new Date(currentContent.publishDate).toLocaleString()}
                  </Text>
                </View>
              )}
            </View>
            
            {currentContent.keywords && currentContent.keywords.length > 0 && (
              <View style={styles.keywordsContainer}>
                <Text style={styles.keywordsLabel}>Keywords:</Text>
                <View style={styles.keywordChips}>
                  {currentContent.keywords.map((keyword, index) => (
                    <Chip key={index} style={styles.keywordChip}>
                      {keyword}
                    </Chip>
                  ))}
                </View>
              </View>
            )}
          </Card.Content>
        </Card>
        
        <Card style={styles.contentCard}>
          <Card.Content>
            <Title style={styles.contentTitle}>Content</Title>
            <Divider style={styles.divider} />
            <Paragraph style={styles.content}>{currentContent.content}</Paragraph>
          </Card.Content>
        </Card>
        
        {currentContent.performance && (
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.performanceTitle}>Performance</Title>
              <Divider style={styles.divider} />
              
              <View style={styles.performanceContainer}>
                <View style={styles.performanceItem}>
                  <MaterialCommunityIcons name="eye" size={24} color={colors.primary} />
                  <Text style={styles.performanceValue}>{currentContent.performance.views || 0}</Text>
                  <Text style={styles.performanceLabel}>Views</Text>
                </View>
                
                <View style={styles.performanceItem}>
                  <MaterialCommunityIcons name="share" size={24} color={colors.primary} />
                  <Text style={styles.performanceValue}>{currentContent.performance.shares || 0}</Text>
                  <Text style={styles.performanceLabel}>Shares</Text>
                </View>
                
                <View style={styles.performanceItem}>
                  <MaterialCommunityIcons name="comment" size={24} color={colors.primary} />
                  <Text style={styles.performanceValue}>{currentContent.performance.comments || 0}</Text>
                  <Text style={styles.performanceLabel}>Comments</Text>
                </View>
                
                {currentContent.performance.revenue > 0 && (
                  <View style={styles.performanceItem}>
                    <MaterialCommunityIcons name="currency-usd" size={24} color={colors.primary} />
                    <Text style={styles.performanceValue}>${currentContent.performance.revenue.toFixed(2)}</Text>
                    <Text style={styles.performanceLabel}>Revenue</Text>
                  </View>
                )}
              </View>
            </Card.Content>
          </Card>
        )}
        
        {currentContent.platforms && currentContent.platforms.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.platformsTitle}>Publishing Platforms</Title>
              <Divider style={styles.divider} />
              
              {currentContent.platforms.map((platform, index) => (
                <View key={index} style={styles.platformItem}>
                  <View style={styles.platformInfo}>
                    <MaterialCommunityIcons 
                      name={getPlatformIcon(platform.name)} 
                      size={24} 
                      color={colors.primary} 
                    />
                    <Text style={styles.platformName}>{platform.name}</Text>
                  </View>
                  
                  <Chip 
                    style={[styles.platformStatus, { backgroundColor: getPlatformStatusColor(platform.status) }]}
                    textStyle={styles.platformStatusText}
                  >
                    {platform.status}
                  </Chip>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}
      </ScrollView>
      
      <FAB
        style={styles.fab}
        icon="pencil"
        onPress={handleEdit}
        color="white"
      />
      
      {/* Delete Confirmation Dialog */}
      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>Delete Content</Dialog.Title>
          <Dialog.Content>
            <Paragraph>Are you sure you want to delete this content? This action cannot be undone.</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleDelete} color={colors.error}>Delete</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      
      {/* Publish Confirmation Dialog */}
      <Portal>
        <Dialog visible={publishDialogVisible} onDismiss={() => setPublishDialogVisible(false)}>
          <Dialog.Title>Publish Content</Dialog.Title>
          <Dialog.Content>
            <Paragraph>Are you sure you want to publish this content? It will be immediately visible to your audience.</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setPublishDialogVisible(false)}>Cancel</Button>
            <Button onPress={handlePublish} mode="contained">Publish</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      
      {/* Schedule Dialog */}
      <Portal>
        <Dialog visible={scheduleDialogVisible} onDismiss={() => setScheduleDialogVisible(false)}>
          <Dialog.Title>Schedule Content</Dialog.Title>
          <Dialog.Content>
            <Paragraph>Select a date and time to publish this content:</Paragraph>
            {/* In a real app, you would use a DateTimePicker here */}
            <Text style={styles.scheduledDate}>
              {scheduledDate.toLocaleString()}
            </Text>
            <Button 
              mode="outlined" 
              onPress={() => {
                // In a real app, this would open a date picker
                const newDate = new Date();
                newDate.setDate(newDate.getDate() + 1);
                setScheduledDate(newDate);
              }}
              style={styles.datePickerButton}
            >
              Change Date/Time
            </Button>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setScheduleDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleSchedule} mode="contained">Schedule</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'OK',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
};

// Helper function to get platform icon
const getPlatformIcon = (platform) => {
  switch (platform.toLowerCase()) {
    case 'facebook':
      return 'facebook';
    case 'twitter':
      return 'twitter';
    case 'instagram':
      return 'instagram';
    case 'linkedin':
      return 'linkedin';
    case 'pinterest':
      return 'pinterest';
    case 'medium':
      return 'medium';
    default:
      return 'web';
  }
};

// Helper function to get platform status color
const getPlatformStatusColor = (status) => {
  switch (status) {
    case 'published':
      return colors.success;
    case 'scheduled':
      return colors.info;
    case 'draft':
      return colors.warning;
    case 'failed':
      return colors.error;
    default:
      return colors.placeholder;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: 16,
    color: colors.text,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  titleContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  title: {
    fontSize: 22,
    marginBottom: spacing.xs,
  },
  statusChip: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  statusText: {
    color: 'white',
  },
  menu: {
    marginTop: 40,
  },
  card: {
    marginBottom: spacing.md,
  },
  description: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  metadataContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  metadataItem: {
    marginRight: spacing.lg,
    marginBottom: spacing.sm,
  },
  metadataLabel: {
    fontSize: 12,
    color: colors.placeholder,
    marginBottom: 2,
  },
  metadataValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  keywordsContainer: {
    marginTop: spacing.sm,
  },
  keywordsLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  keywordChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  keywordChip: {
    margin: 2,
  },
  contentCard: {
    marginBottom: spacing.md,
  },
  contentTitle: {
    fontSize: 18,
    marginBottom: spacing.xs,
  },
  divider: {
    marginBottom: spacing.md,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
  },
  performanceTitle: {
    fontSize: 18,
    marginBottom: spacing.xs,
  },
  performanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  performanceItem: {
    alignItems: 'center',
    marginVertical: spacing.sm,
    minWidth: '22%',
  },
  performanceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: spacing.xs,
  },
  performanceLabel: {
    fontSize: 12,
    color: colors.placeholder,
  },
  platformsTitle: {
    fontSize: 18,
    marginBottom: spacing.xs,
  },
  platformItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  platformInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  platformName: {
    marginLeft: spacing.sm,
    fontSize: 16,
  },
  platformStatus: {
    height: 24,
  },
  platformStatusText: {
    fontSize: 10,
    color: 'white',
  },
  fab: {
    position: 'absolute',
    margin: spacing.md,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
  },
  scheduledDate: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: spacing.md,
  },
  datePickerButton: {
    marginTop: spacing.sm,
  },
});

export default ContentDetailScreen;

