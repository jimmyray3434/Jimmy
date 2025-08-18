import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, Card, Title, Paragraph, Chip, HelperText, Divider, ActivityIndicator, Portal, Dialog, Snackbar } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { generateContent, createContent, clearGeneratedContent, reset } from '../../store/slices/contentSlice';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import { CONTENT_TYPES } from '../../config';

const ContentGenerateScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { generatedContent, isGenerating, isLoading, isSuccess, isError, message } = useSelector((state) => state.content);
  
  const [topic, setTopic] = useState('');
  const [contentType, setContentType] = useState(CONTENT_TYPES.BLOG_POST);
  const [keywords, setKeywords] = useState('');
  const [tone, setTone] = useState('informative');
  const [targetAudience, setTargetAudience] = useState('');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  
  const [topicError, setTopicError] = useState('');
  const [keywordsError, setKeywordsError] = useState('');
  
  const [showPreview, setShowPreview] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    return () => {
      dispatch(clearGeneratedContent());
      dispatch(reset());
    };
  }, [dispatch]);

  useEffect(() => {
    if (isError && message) {
      setSnackbarMessage(message);
      setSnackbarVisible(true);
    }
  }, [isError, message]);

  const validateForm = () => {
    let isValid = true;
    
    if (!topic.trim()) {
      setTopicError('Topic is required');
      isValid = false;
    } else {
      setTopicError('');
    }
    
    if (!keywords.trim()) {
      setKeywordsError('Keywords are required');
      isValid = false;
    } else {
      setKeywordsError('');
    }
    
    return isValid;
  };

  const handleGenerate = () => {
    if (!validateForm()) return;
    
    const generationParams = {
      topic,
      type: contentType,
      keywords: keywords.split(',').map(k => k.trim()),
      tone,
      targetAudience: targetAudience.trim() || undefined,
      additionalInstructions: additionalInstructions.trim() || undefined,
    };
    
    dispatch(generateContent(generationParams));
  };

  const handleSave = () => {
    if (!generatedContent) return;
    
    const contentData = {
      title: generatedContent.title,
      content: generatedContent.content,
      description: generatedContent.description || generatedContent.content.substring(0, 150) + '...',
      type: contentType,
      keywords: keywords.split(',').map(k => k.trim()),
      status: 'draft',
    };
    
    dispatch(createContent(contentData));
    setShowPreview(false);
    
    // Show success message
    setSnackbarMessage('Content saved successfully!');
    setSnackbarVisible(true);
    
    // Navigate to content list after a short delay
    setTimeout(() => {
      navigation.navigate('ContentList');
    }, 1500);
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

  const renderToneChips = () => {
    const tones = ['informative', 'conversational', 'professional', 'persuasive', 'humorous'];
    
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
        {tones.map((t) => (
          <Chip
            key={t}
            selected={tone === t}
            onPress={() => setTone(t)}
            style={[
              styles.chip,
              tone === t && { backgroundColor: colors.primary }
            ]}
            textStyle={tone === t ? { color: 'white' } : {}}
          >
            {t}
          </Chip>
        ))}
      </ScrollView>
    );
  };

  const renderPreviewDialog = () => (
    <Portal>
      <Dialog visible={showPreview} onDismiss={() => setShowPreview(false)} style={styles.dialog}>
        <Dialog.Title>Content Preview</Dialog.Title>
        <Dialog.ScrollArea style={styles.dialogScrollArea}>
          <ScrollView>
            <Title style={styles.previewTitle}>{generatedContent?.title}</Title>
            <Paragraph style={styles.previewDescription}>
              {generatedContent?.description || generatedContent?.content.substring(0, 150) + '...'}
            </Paragraph>
            <Divider style={styles.divider} />
            <Paragraph style={styles.previewContent}>{generatedContent?.content}</Paragraph>
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={() => setShowPreview(false)}>Cancel</Button>
          <Button onPress={handleSave} mode="contained">Save Content</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Generate AI Content</Title>
            <Paragraph style={styles.cardDescription}>
              Fill in the details below to generate content using AI
            </Paragraph>
            
            <Text style={styles.label}>Content Type</Text>
            {renderContentTypeChips()}
            
            <Text style={styles.label}>Topic</Text>
            <TextInput
              mode="outlined"
              placeholder="Enter the main topic"
              value={topic}
              onChangeText={setTopic}
              error={!!topicError}
              style={styles.input}
            />
            {topicError ? <HelperText type="error">{topicError}</HelperText> : null}
            
            <Text style={styles.label}>Keywords</Text>
            <TextInput
              mode="outlined"
              placeholder="Enter keywords separated by commas"
              value={keywords}
              onChangeText={setKeywords}
              error={!!keywordsError}
              style={styles.input}
            />
            {keywordsError ? <HelperText type="error">{keywordsError}</HelperText> : null}
            
            <Text style={styles.label}>Tone</Text>
            {renderToneChips()}
            
            <Text style={styles.label}>Target Audience (Optional)</Text>
            <TextInput
              mode="outlined"
              placeholder="Describe your target audience"
              value={targetAudience}
              onChangeText={setTargetAudience}
              style={styles.input}
            />
            
            <Text style={styles.label}>Additional Instructions (Optional)</Text>
            <TextInput
              mode="outlined"
              placeholder="Any specific instructions for the AI"
              value={additionalInstructions}
              onChangeText={setAdditionalInstructions}
              multiline
              numberOfLines={3}
              style={styles.textArea}
            />
            
            <Button
              mode="contained"
              onPress={handleGenerate}
              loading={isGenerating}
              disabled={isGenerating}
              style={styles.generateButton}
              icon="robot"
            >
              Generate Content
            </Button>
          </Card.Content>
        </Card>
        
        {isGenerating && (
          <Card style={styles.loadingCard}>
            <Card.Content style={styles.loadingContent}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Generating content...</Text>
              <Text style={styles.loadingSubtext}>This may take a few moments</Text>
            </Card.Content>
          </Card>
        )}
        
        {generatedContent && !isGenerating && (
          <Card style={styles.resultCard}>
            <Card.Content>
              <View style={styles.resultHeader}>
                <Title style={styles.resultTitle}>Generated Content</Title>
                <MaterialCommunityIcons name="check-circle" size={24} color={colors.success} />
              </View>
              
              <Title style={styles.contentTitle}>{generatedContent.title}</Title>
              <Paragraph style={styles.contentDescription}>
                {generatedContent.description || generatedContent.content.substring(0, 150) + '...'}
              </Paragraph>
              
              <View style={styles.resultActions}>
                <Button
                  mode="outlined"
                  onPress={() => setShowPreview(true)}
                  style={styles.actionButton}
                  icon="eye"
                >
                  Preview
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSave}
                  style={styles.actionButton}
                  icon="content-save"
                >
                  Save Content
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}
      </ScrollView>
      
      {renderPreviewDialog()}
      
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
    paddingBottom: spacing.xl * 2,
  },
  card: {
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: 20,
    marginBottom: spacing.xs,
  },
  cardDescription: {
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
    marginBottom: spacing.md,
  },
  chipsContainer: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  chip: {
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  generateButton: {
    marginTop: spacing.md,
  },
  loadingCard: {
    marginBottom: spacing.md,
  },
  loadingContent: {
    alignItems: 'center',
    padding: spacing.md,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: spacing.md,
  },
  loadingSubtext: {
    fontSize: 14,
    color: colors.placeholder,
    marginTop: spacing.xs,
  },
  resultCard: {
    marginBottom: spacing.md,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  resultTitle: {
    fontSize: 18,
  },
  contentTitle: {
    fontSize: 16,
    marginBottom: spacing.xs,
  },
  contentDescription: {
    marginBottom: spacing.md,
  },
  resultActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  dialog: {
    maxHeight: '80%',
  },
  dialogScrollArea: {
    maxHeight: 400,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  previewDescription: {
    fontStyle: 'italic',
    marginBottom: spacing.md,
  },
  divider: {
    marginVertical: spacing.md,
  },
  previewContent: {
    lineHeight: 22,
  },
});

export default ContentGenerateScreen;

