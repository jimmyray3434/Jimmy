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
  Chip
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialIcons } from '@expo/vector-icons';

import { RootState, AppDispatch } from '../../../store/store';
import { generateAudienceRecommendations, clearAudienceRecommendations } from '../../../store/slices/aiSlice';
import { theme } from '../../../theme/theme';

const AudienceRecommendations: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { data, loading, error } = useSelector((state: RootState) => state.ai.audienceRecommendations);
  
  const [businessType, setBusinessType] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [campaignGoals, setCampaignGoals] = useState('');
  const [provider, setProvider] = useState('openai');
  
  const handleGenerateRecommendations = async () => {
    if (!businessType || !productCategory || !campaignGoals) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }
    
    try {
      await dispatch(generateAudienceRecommendations({
        businessType,
        productCategory,
        campaignGoals,
        provider: provider as 'openai' | 'google'
      })).unwrap();
    } catch (err) {
      console.error('Failed to generate audience recommendations:', err);
    }
  };
  
  const handleClear = () => {
    dispatch(clearAudienceRecommendations());
    setBusinessType('');
    setProductCategory('');
    setCampaignGoals('');
  };
  
  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>AI Audience Targeting</Title>
          <Text style={styles.description}>
            Get AI-powered audience targeting recommendations for your ad campaigns.
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
            label="Campaign Goals *"
            value={campaignGoals}
            onChangeText={setCampaignGoals}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
            placeholder="e.g., Increase brand awareness, Generate leads, Drive sales"
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
              onPress={handleGenerateRecommendations}
              style={styles.generateButton}
              loading={loading}
              disabled={loading || !businessType || !productCategory || !campaignGoals}
            >
              Generate Recommendations
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
            <Text style={styles.loadingText}>Generating audience recommendations...</Text>
          </Card.Content>
        </Card>
      )}
      
      {data && !loading && (
        <Card style={styles.resultCard}>
          <Card.Content>
            <View style={styles.resultHeader}>
              <Title style={styles.resultTitle}>Audience Recommendations</Title>
              <MaterialIcons name="content-copy" size={24} color={theme.colors.primary} />
            </View>
            
            <Divider style={styles.divider} />
            
            <Text style={styles.sectionHeader}>Primary Audience</Text>
            <Text style={styles.sectionContent}>{data.primaryAudience}</Text>
            
            <Text style={styles.sectionHeader}>Secondary Audiences</Text>
            {data.secondaryAudiences.map((audience, index) => (
              <List.Item
                key={index}
                title={audience}
                left={props => <List.Icon {...props} icon="account-group" />}
                titleStyle={styles.listItemTitle}
              />
            ))}
            
            <Text style={styles.sectionHeader}>Demographics</Text>
            <View style={styles.demographicsContainer}>
              {data.demographics.age && (
                <View style={styles.demographicItem}>
                  <Text style={styles.demographicLabel}>Age:</Text>
                  <Text style={styles.demographicValue}>{data.demographics.age}</Text>
                </View>
              )}
              {data.demographics.gender && (
                <View style={styles.demographicItem}>
                  <Text style={styles.demographicLabel}>Gender:</Text>
                  <Text style={styles.demographicValue}>{data.demographics.gender}</Text>
                </View>
              )}
              {data.demographics.income && (
                <View style={styles.demographicItem}>
                  <Text style={styles.demographicLabel}>Income:</Text>
                  <Text style={styles.demographicValue}>{data.demographics.income}</Text>
                </View>
              )}
              {data.demographics.education && (
                <View style={styles.demographicItem}>
                  <Text style={styles.demographicLabel}>Education:</Text>
                  <Text style={styles.demographicValue}>{data.demographics.education}</Text>
                </View>
              )}
              {data.demographics.location && (
                <View style={styles.demographicItem}>
                  <Text style={styles.demographicLabel}>Location:</Text>
                  <Text style={styles.demographicValue}>{data.demographics.location}</Text>
                </View>
              )}
            </View>
            
            <Text style={styles.sectionHeader}>Interests</Text>
            <View style={styles.chipsContainer}>
              {data.interests.map((interest, index) => (
                <Chip key={index} style={styles.chip} mode="outlined">
                  {interest}
                </Chip>
              ))}
            </View>
            
            <Text style={styles.sectionHeader}>Behaviors</Text>
            <View style={styles.chipsContainer}>
              {data.behaviors.map((behavior, index) => (
                <Chip key={index} style={styles.chip} mode="outlined">
                  {behavior}
                </Chip>
              ))}
            </View>
            
            <Text style={styles.sectionHeader}>Exclusions</Text>
            <View style={styles.chipsContainer}>
              {data.exclusions.map((exclusion, index) => (
                <Chip key={index} style={styles.chip} mode="outlined" icon="minus-circle">
                  {exclusion}
                </Chip>
              ))}
            </View>
            
            <Button 
              mode="contained" 
              onPress={() => {
                // In a real app, this would save the audience recommendations
                Alert.alert('Success', 'Audience recommendations saved successfully!');
              }}
              style={styles.saveButton}
              icon="content-save"
            >
              Save Recommendations
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
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: theme.colors.primary,
  },
  sectionContent: {
    fontSize: 16,
    marginBottom: 8,
    lineHeight: 24,
  },
  listItemTitle: {
    fontSize: 14,
  },
  demographicsContainer: {
    marginBottom: 16,
  },
  demographicItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  demographicLabel: {
    fontWeight: 'bold',
    marginRight: 8,
    width: 80,
  },
  demographicValue: {
    flex: 1,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  chip: {
    margin: 4,
  },
  saveButton: {
    marginTop: 24,
  },
});

export default AudienceRecommendations;

