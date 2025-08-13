import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { 
  Card, 
  Title, 
  Text, 
  Button, 
  Divider,
  SegmentedButtons
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

import AdCopyGenerator from './AdCopyGenerator';
import AudienceRecommendations from './AudienceRecommendations';
import ContentIdeas from './ContentIdeas';
import { theme } from '../../../theme/theme';

const AIFeaturesScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState('adCopy');
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'adCopy':
        return <AdCopyGenerator />;
      case 'audience':
        return <AudienceRecommendations />;
      case 'content':
        return <ContentIdeas />;
      default:
        return <AdCopyGenerator />;
    }
  };
  
  return (
    <View style={styles.container}>
      <Card style={styles.tabCard}>
        <Card.Content>
          <SegmentedButtons
            value={activeTab}
            onValueChange={setActiveTab}
            buttons={[
              { value: 'adCopy', label: 'Ad Copy', icon: 'text-box-outline' },
              { value: 'audience', label: 'Audience', icon: 'account-group' },
              { value: 'content', label: 'Content', icon: 'lightbulb-outline' }
            ]}
          />
        </Card.Content>
      </Card>
      
      {renderTabContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  tabCard: {
    margin: 16,
    marginBottom: 0,
  }
});

export default AIFeaturesScreen;

