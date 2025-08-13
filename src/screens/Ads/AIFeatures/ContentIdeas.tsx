import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  Card, 
  Title, 
  TextInput, 
  Button, 
  Text, 
  Divider,
  SegmentedButtons,
  ActivityIndicator,
  HelperText,
  List,
  Chip,
  IconButton
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';

import { RootState, AppDispatch } from '../../../store/store';
import { generateContentIdeas, clearContentIdeas } from '../../../store/slices/aiSlice';
import { theme } from '../../../theme/theme';

const ContentIdeas: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { data, loading, error } = useSelector((state: RootState) => state.ai.contentIdeas);
  
  const [businessType, setBusinessType] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [campaignGoals, setCampaignGoals] = useState('');
  const [contentType, setContentType] = useState('all');
  const [provider, setProvider] = useState('openai');
  
  const handleGenerateIdeas = async () => {
    if (!businessType || !productCategory || !targetAudience || !campaignGoals) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }
    
    try {
      await dispatch(generateContentIdeas({
        businessType,
        productCategory,
        targetAudience,
        campaignGoals,
        contentType: contentType as 'all' | 'image' | 'video' | 'text',
        provider: provider as 'openai' | 'google'
      })).unwrap();
    } catch (err) {
      console.error('Failed to generate content ideas:', err);
    }
  };
  
  const handleClear = () => {
    dispatch(clearContentIdeas());
    setBusinessType('');
    setProductCategory('');
    setTargetAudience('');
    setCampaignGoals('');
    setContentType('all');
  };
  
  const handleSaveIdea = (idea: string, type: string) => {
    // In a real app, this would save the idea to the user's saved ideas
    Alert.alert('Idea Saved', `"${idea}" saved to your ${type} ideas.`);
  };
  
  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>AI Content Ideas Generator</Title>
          <Text style={styles.description}>
            Generate creative content ideas for your ad campaigns using AI.
          </Text>
          
          <Divider style={styles.divider} />
          
          <TextInput
            label="Business Type *"
            value={businessType}
            onChangeText={setBusinessType}
            mode="outlined"
            style={styles.input}
            placeholder="e.g., E-commerce, SaaS, Local Service"
          />
          
          <TextInput
            label="Product/Service Category *"
            value={productCategory}
            onChangeText={setProductCategory}
            mode="outlined"
            style={styles.input}
            placeholder="e.g., Fashion, Marketing Software, Home Repair"
          />
          
          <TextInput
            label="Target Audience *"
            value={targetAudience}
            onChangeText={setTargetAudience}
            mode="outlined"
            style={styles.input}
            placeholder="e.g., Small business owners aged 30-50"
          />
          
          <TextInput
            label="Campaign Goals *"
            value={campaignGoals}
            onChangeText={setCampaignGoals}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
            placeholder="e.g., Increase brand awareness, Generate leads, Drive sales"
          />
          
          <Text style={styles.sectionTitle}>Content Type</Text>
          <SegmentedButtons
            value={contentType}
            onValueChange={setContentType}
            buttons={[
              { value: 'all', label: 'All' },
              { value: 'image', label: 'Image' },
              { value: 'video', label: 'Video' },
              { value: 'text', label: 'Text' }
            ]}
            style={styles.segmentedButtons}
          />
          
          <Text style={styles.sectionTitle}>AI Provider</Text>
          <SegmentedButtons
            value={provider}
            onValueChange={setProvider}
            buttons={[
              { value: 'openai', label: 'OpenAI' },
              { value: 'google', label: 'Google AI' }
            ]}
            style={styles.segmentedButtons}
          />
          
          <View style={styles.buttonContainer}>
            <Button 
              mode="outlined" 
              onPress={handleClear}
              style={styles.clearButton}
            >
              Clear
            </Button>
            <Button 
              mode="contained" 
              onPress={handleGenerateIdeas}
              style={styles.generateButton}
              loading={loading}
              disabled={loading || !businessType || !productCategory || !targetAudience || !campaignGoals}
            >
              Generate Ideas
            </Button>
          </View>
          
          {error && (
            <HelperText type="error" visible={!!error}>
              {error}
            </HelperText>
          )}
        </Card.Content>
      </Card>
      
      {loading && (
        <Card style={styles.resultCard}>
          <Card.Content style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Generating content ideas...</Text>
          </Card.Content>
        </Card>
      )}
      
      {data && !loading && (
        <>
          <Card style={styles.resultCard}>
            <Card.Content>
              <Title style={styles.resultTitle}>Campaign Themes</Title>
              <Divider style={styles.divider} />
              
              {data.themes.map((theme, index) => (
                <List.Item
                  key={index}
                  title={theme}
                  left={props => <List.Icon {...props} icon="lightbulb-outline" />}
                  right={props => (
                    <IconButton
                      {...props}
                      icon="bookmark-outline"
                      onPress={() => handleSaveIdea(theme, 'theme')}
                    />
                  )}
                  titleStyle={styles.listItemTitle}
                />
              ))}
            </Card.Content>
          </Card>
          
          <Card style={styles.resultCard}>
            <Card.Content>
              <Title style={styles.resultTitle}>Headline Ideas</Title>
              <Divider style={styles.divider} />
              
              {data.headlines.map((headline, index) => (
                <List.Item
                  key={index}
                  title={headline}
                  left={props => <List.Icon {...props} icon="format-header-1" />}
                  right={props => (
                    <IconButton
                      {...props}
                      icon="bookmark-outline"
                      onPress={() => handleSaveIdea(headline, 'headline')}
                    />
                  )}
                  titleStyle={styles.listItemTitle}
                />
              ))}
            </Card.Content>
          </Card>
          
          <Card style={styles.resultCard}>
            <Card.Content>
              <Title style={styles.resultTitle}>Visual Concepts</Title>
              <Divider style={styles.divider} />
              
              {data.visualConcepts.map((concept, index) => (
                <List.Item
                  key={index}
                  title={concept}
                  left={props => <List.Icon {...props} icon="image-outline" />}
                  right={props => (
                    <IconButton
                      {...props}
                      icon="bookmark-outline"
                      onPress={() => handleSaveIdea(concept, 'visual concept')}
                    />
                  )}
                  titleStyle={styles.listItemTitle}
                />
              ))}
            </Card.Content>
          </Card>
          
          <Card style={styles.resultCard}>
            <Card.Content>
              <Title style={styles.resultTitle}>Copy Approaches</Title>
              <Divider style={styles.divider} />
              
              {data.copyApproaches.map((approach, index) => (
                <List.Item
                  key={index}
                  title={approach}
                  left={props => <List.Icon {...props} icon="text-box-outline" />}
                  right={props => (
                    <IconButton
                      {...props}
                      icon="bookmark-outline"
                      onPress={() => handleSaveIdea(approach, 'copy approach')}
                    />
                  )}
                  titleStyle={styles.listItemTitle}
                />
              ))}
            </Card.Content>
          </Card>
          
          <Card style={styles.resultCard}>
            <Card.Content>
              <Title style={styles.resultTitle}>Call to Actions</Title>
              <Divider style={styles.divider} />
              
              <View style={styles.chipsContainer}>
                {data.callToActions.map((cta, index) => (
                  <Chip 
                    key={index} 
                    style={styles.chip} 
                    mode="outlined"
                    onPress={() => handleSaveIdea(cta, 'call to action')}
                  >
                    {cta}
                  </Chip>
                ))}
              </View>
            </Card.Content>
          </Card>
          
          <Button 
            mode="contained" 
            onPress={() => {
              // In a real app, this would save all ideas to the user's campaign
              Alert.alert('Success', 'All content ideas saved to your campaign!');
            }}
            style={styles.saveAllButton}
            icon="content-save-all"
          >
            Save All Ideas
          </Button>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: theme.colors.background,
  },
  card: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    marginBottom: 16,
    color: theme.colors.textSecondary,
  },
  divider: {
    marginVertical: 16,
  },
  input: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 8,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  clearButton: {
    flex: 1,
    marginRight: 8,
  },
  generateButton: {
    flex: 2,
  },
  resultCard: {
    marginBottom: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    color: theme.colors.textSecondary,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  listItemTitle: {
    fontSize: 14,
    flex: 1,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    margin: 4,
  },
  saveAllButton: {
    marginBottom: 24,
  },
});

export default ContentIdeas;

