import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, Card, Title, Paragraph, Chip, HelperText, Divider, ActivityIndicator, Portal, Dialog, Snackbar } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { getContentById, updateContent, reset } from '../../store/slices/contentSlice';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import { CONTENT_TYPES } from '../../config';

const ContentEditScreen = ({ route, navigation }) => {
  const { contentId } = route.params;
  const dispatch = useDispatch();
  const { currentContent, isLoading, isSuccess, isError, message } = useSelector((state) => state.content);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [contentType, setContentType] = useState('');
  const [keywordsString, setKeywordsString] = useState('');
  
  const [titleError, setTitleError] = useState('');
  const [contentError, setContentError] = useState('');
  
  const [discardDialogVisible, setDiscardDialogVisible] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    dispatch(getContentById(contentId));
    
    return () => {
      dispatch(reset());
    };
  }, [dispatch, contentId]);

  useEffect(() => {
    if (currentContent) {
      setTitle(currentContent.title || '');
      setDescription(currentContent.description || '');
      setContent(currentContent.content || '');
      setContentType(currentContent.type || CONTENT_TYPES.BLOG_POST);
      setKeywordsString(currentContent.keywords ? currentContent.keywords.join(', ') : '');
    }
  }, [currentContent]);

  useEffect(() => {
    if (isError && message) {
      setSnackbarMessage(message);
      setSnackbarVisible(true);
    }
  }, [isError, message]);

  useEffect(() => {
    // Check for unsaved changes
    if (
      currentContent &&
      (title !== currentContent.title ||
        description !== currentContent.description ||
        content !== currentContent.content ||
        contentType !== currentContent.type ||
        keywordsString !== (currentContent.keywords ? currentContent.keywords.join(', ') : ''))
    ) {
      setHasUnsavedChanges(true);
    } else {
      setHasUnsavedChanges(false);
    }
  }, [title, description, content, contentType, keywordsString, currentContent]);

  const validateForm = () => {
    let isValid = true;
    
    if (!title.trim()) {
      setTitleError('Title is required');
      isValid = false;
    } else {
      setTitleError('');
    }
    
    if (!content.trim()) {
      setContentError('Content is required');
      isValid = false;
    } else {
      setContentError('');
    }
    
    return isValid;
  };

  const handleSave = () => {
    if (!validateForm()) return;
    
    const contentData = {
      title,
      description,
      content,
      type: contentType,
      keywords: keywordsString.split(',').map(k => k.trim()).filter(k => k),
    };
    
    dispatch(updateContent({ id: contentId, contentData }));
    
    // Show success message
    setSnackbarMessage('Content updated successfully');
    setSnackbarVisible(true);
    
    // Navigate back after a short delay
    setTimeout(() => {
      navigation.goBack();
    }, 1500);
  };

  const handleDiscard = () => {
    setDiscardDialogVisible(false);
    navigation.goBack();
  };

  const renderContentTypeChips = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
      {Object.values(CONTENT_TYPES).map((type) => (
        <Chip
          key={type}
          selected={contentType === type}
          onPress={() => setContentType(type)}
          style={[
            styles.chip,
            contentType === type && { backgroundColor: colors.primary }
          ]}
          textStyle={contentType === type ? { color: 'white' } : {}}
        >
          {type.replace('-', ' ')}
        </Chip>
      ))}
    </ScrollView>
  );

  if (isLoading && !currentContent) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading content...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Edit Content</Title>
            
            <Text style={styles.label}>Title</Text>
            <TextInput
              mode="outlined"
              placeholder="Enter title"
              value={title}
              onChangeText={setTitle}
              error={!!titleError}
              style={styles.input}
            />
            {titleError ? <HelperText type="error">{titleError}</HelperText> : null}
            
            <Text style={styles.label}>Content Type</Text>
            {renderContentTypeChips()}
            
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              mode="outlined"
              placeholder="Enter a brief description"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              style={styles.textArea}
            />
            
            <Text style={styles.label}>Keywords (Comma separated)</Text>
            <TextInput
              mode="outlined"
              placeholder="Enter keywords separated by commas"
              value={keywordsString}
              onChangeText={setKeywordsString}
              style={styles.input}
            />
            
            <Text style={styles.label}>Content</Text>
            <TextInput
              mode="outlined"
              placeholder="Enter your content here"
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={10}
              style={styles.contentInput}
              error={!!contentError}
            />
            {contentError ? <HelperText type="error">{contentError}</HelperText> : null}
            
            <View style={styles.buttonContainer}>
              <Button
                mode="outlined"
                onPress={() => {
                  if (hasUnsavedChanges) {
                    setDiscardDialogVisible(true);
                  } else {
                    navigation.goBack();
                  }
                }}
                style={styles.button}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSave}
                loading={isLoading}
                disabled={isLoading}
                style={styles.button}
              >
                Save Changes
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
      
      {/* Discard Changes Dialog */}
      <Portal>
        <Dialog visible={discardDialogVisible} onDismiss={() => setDiscardDialogVisible(false)}>
          <Dialog.Title>Discard Changes</Dialog.Title>
          <Dialog.Content>
            <Paragraph>You have unsaved changes. Are you sure you want to discard them?</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDiscardDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleDiscard} color={colors.error}>Discard</Button>
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
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
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
  card: {
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: 20,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  input: {
    marginBottom: spacing.sm,
  },
  textArea: {
    marginBottom: spacing.sm,
    minHeight: 80,
  },
  contentInput: {
    marginBottom: spacing.sm,
    minHeight: 200,
  },
  chipsContainer: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  chip: {
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  button: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
});

export default ContentEditScreen;

