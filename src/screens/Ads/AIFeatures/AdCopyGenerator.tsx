import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  Card, 
  Title, 
  TextInput, 
  Button, 
  Chip, 
  Text, 
  Divider,
  SegmentedButtons,
  ActivityIndicator,
  HelperText
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialIcons } from '@expo/vector-icons';

import { RootState, AppDispatch } from '../../../store/store';
import { generateAdCopy, clearAdCopy } from '../../../store/slices/aiSlice';
import { theme } from '../../../theme/theme';

const AdCopyGenerator: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { data, loading, error } = useSelector((state: RootState) => state.ai.adCopy);
  
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [tone, setTone] = useState('professional');
  const [callToAction, setCallToAction] = useState('');
  const [keyFeature, setKeyFeature] = useState('');
  const [keyFeatures, setKeyFeatures] = useState<string[]>([]);
  const [maxLength, setMaxLength] = useState('200');
  const [provider, setProvider] = useState('openai');
  
  const handleAddFeature = () => {
    if (keyFeature.trim() && !keyFeatures.includes(keyFeature.trim())) {
      setKeyFeatures([...keyFeatures, keyFeature.trim()]);
      setKeyFeature('');
    }
  };
  
  const handleRemoveFeature = (feature: string) => {
    setKeyFeatures(keyFeatures.filter(f => f !== feature));
  };
  
  const handleGenerateAdCopy = async () => {
    if (!productName || !productDescription || !targetAudience) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }
    
    try {
      await dispatch(generateAdCopy({
        productName,
        productDescription,
        targetAudience,
        tone,
        keyFeatures,
        callToAction,
        maxLength: parseInt(maxLength),
        provider: provider as 'openai' | 'google'
      })).unwrap();
    } catch (err) {
      console.error('Failed to generate ad copy:', err);
    }
  };
  
  const handleClear = () => {
    dispatch(clearAdCopy());
    setProductName('');
    setProductDescription('');
    setTargetAudience('');
    setTone('professional');
    setCallToAction('');
    setKeyFeature('');
    setKeyFeatures([]);
    setMaxLength('200');
  };
  
  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>AI Ad Copy Generator</Title>
          <Text style={styles.description}>
            Generate compelling ad copy for your products or services using AI.
          </Text>
          
          <Divider style={styles.divider} />
          
          <TextInput
            label="Product/Service Name *"
            value={productName}
            onChangeText={setProductName}
            mode="outlined"
            style={styles.input}
          />
          
          <TextInput
            label="Product/Service Description *"
            value={productDescription}
            onChangeText={setProductDescription}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
          />
          
          <TextInput
            label="Target Audience *"
            value={targetAudience}
            onChangeText={setTargetAudience}
            mode="outlined"
            style={styles.input}
            placeholder="e.g., Small business owners aged 30-50"
          />
          
          <Text style={styles.sectionTitle}>Tone</Text>
          <SegmentedButtons
            value={tone}
            onValueChange={setTone}
            buttons={[
              { value: 'professional', label: 'Professional' },
              { value: 'friendly', label: 'Friendly' },
              { value: 'persuasive', label: 'Persuasive' },
              { value: 'urgent', label: 'Urgent' }
            ]}
            style={styles.segmentedButtons}
          />
          
          <TextInput
            label="Call to Action"
            value={callToAction}
            onChangeText={setCallToAction}
            mode="outlined"
            style={styles.input}
            placeholder="e.g., Sign up today, Learn more, Buy now"
          />
          
          <Text style={styles.sectionTitle}>Key Features</Text>
          <View style={styles.featureInputContainer}>
            <TextInput
              label="Add Feature"
              value={keyFeature}
              onChangeText={setKeyFeature}
              mode="outlined"
              style={styles.featureInput}
              placeholder="e.g., 24/7 customer support"
            />
            <Button 
              mode="contained" 
              onPress={handleAddFeature}
              style={styles.addButton}
              disabled={!keyFeature.trim()}
            >
              Add
            </Button>
          </View>
          
          <View style={styles.featuresContainer}>
            {keyFeatures.map((feature, index) => (
              <Chip
                key={index}
                onClose={() => handleRemoveFeature(feature)}
                style={styles.chip}
                mode="outlined"
              >
                {feature}
              </Chip>
            ))}
          </View>
          
          <TextInput
            label="Maximum Length (characters)"
            value={maxLength}
            onChangeText={setMaxLength}
            mode="outlined"
            style={styles.input}
            keyboardType="numeric"
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
              onPress={handleGenerateAdCopy}
              style={styles.generateButton}
              loading={loading}
              disabled={loading || !productName || !productDescription || !targetAudience}
            >
              Generate Ad Copy
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
            <Text style={styles.loadingText}>Generating ad copy...</Text>
          </Card.Content>
        </Card>
      )}
      
      {data && !loading && (
        <Card style={styles.resultCard}>
          <Card.Content>
            <View style={styles.resultHeader}>
              <Title style={styles.resultTitle}>Generated Ad Copy</Title>
              <MaterialIcons name="content-copy" size={24} color={theme.colors.primary} />
            </View>
            
            <Divider style={styles.divider} />
            
            <Text style={styles.headlineLabel}>Headline:</Text>
            <Text style={styles.headline}>{data.headline}</Text>
            
            <Text style={styles.bodyLabel}>Body:</Text>
            <Text style={styles.body}>{data.body}</Text>
            
            <Text style={styles.ctaLabel}>Call to Action:</Text>
            <Text style={styles.cta}>{data.callToAction}</Text>
            
            <Button 
              mode="contained" 
              onPress={() => {
                // In a real app, this would save the ad copy to the user's ads
                Alert.alert('Success', 'Ad copy saved successfully!');
              }}
              style={styles.saveButton}
              icon="content-save"
            >
              Save Ad Copy
            </Button>
          </Card.Content>
        </Card>
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
  featureInputContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  featureInput: {
    flex: 1,
    marginRight: 8,
  },
  addButton: {
    justifyContent: 'center',
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  chip: {
    margin: 4,
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
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headlineLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: theme.colors.primary,
  },
  headline: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  bodyLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: theme.colors.primary,
  },
  body: {
    fontSize: 16,
    marginBottom: 16,
    lineHeight: 24,
  },
  ctaLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: theme.colors.primary,
  },
  cta: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  saveButton: {
    marginTop: 8,
  },
});

export default AdCopyGenerator;

