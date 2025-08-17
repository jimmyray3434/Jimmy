import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Main Screens
import DashboardScreen from '../screens/dashboard/DashboardScreen';

// Content Screens
import ContentListScreen from '../screens/content/ContentListScreen';
import ContentDetailScreen from '../screens/content/ContentDetailScreen';
import ContentCreateScreen from '../screens/content/ContentCreateScreen';
import ContentGenerateScreen from '../screens/content/ContentGenerateScreen';
import ContentEditScreen from '../screens/content/ContentEditScreen';

// Affiliate Screens
import AffiliateListScreen from '../screens/affiliate/AffiliateListScreen';
import AffiliateDetailScreen from '../screens/affiliate/AffiliateDetailScreen';
import AffiliateAddScreen from '../screens/affiliate/AffiliateAddScreen';

// Product Screens
import ProductListScreen from '../screens/product/ProductListScreen';
import ProductDetailScreen from '../screens/product/ProductDetailScreen';
import ProductCreateScreen from '../screens/product/ProductCreateScreen';

// Analytics Screens
import AnalyticsScreen from '../screens/analytics/AnalyticsScreen';

// Automation Screens
import AutomationScreen from '../screens/automation/AutomationScreen';
import TaskListScreen from '../screens/automation/TaskListScreen';

// Settings Screens
import SettingsScreen from '../screens/settings/SettingsScreen';
import ProfileScreen from '../screens/settings/ProfileScreen';
import ApiKeysScreen from '../screens/settings/ApiKeysScreen';
import NotificationsScreen from '../screens/settings/NotificationsScreen';

// Loading Screen
import LoadingScreen from '../screens/LoadingScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Navigator
const AuthNavigator = () => (
  <Stack.Navigator 
    screenOptions={{ 
      headerShown: false,
      contentStyle: { backgroundColor: colors.background }
    }}
  >
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
  </Stack.Navigator>
);

// Content Navigator
const ContentNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: true,
      headerTintColor: colors.primary,
      contentStyle: { backgroundColor: colors.background }
    }}
  >
    <Stack.Screen 
      name="ContentList" 
      component={ContentListScreen} 
      options={{ title: 'Content' }}
    />
    <Stack.Screen 
      name="ContentDetail" 
      component={ContentDetailScreen} 
      options={{ title: 'Content Details' }}
    />
    <Stack.Screen 
      name="ContentCreate" 
      component={ContentCreateScreen} 
      options={{ title: 'Create Content' }}
    />
    <Stack.Screen 
      name="ContentGenerate" 
      component={ContentGenerateScreen} 
      options={{ title: 'Generate Content' }}
    />
    <Stack.Screen 
      name="ContentEdit" 
      component={ContentEditScreen} 
      options={{ title: 'Edit Content' }}
    />
  </Stack.Navigator>
);

// Affiliate Navigator
const AffiliateNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: true,
      headerTintColor: colors.primary,
      contentStyle: { backgroundColor: colors.background }
    }}
  >
    <Stack.Screen 
      name="AffiliateList" 
      component={AffiliateListScreen} 
      options={{ title: 'Affiliate Products' }}
    />
    <Stack.Screen 
      name="AffiliateDetail" 
      component={AffiliateDetailScreen} 
      options={{ title: 'Product Details' }}
    />
    <Stack.Screen 
      name="AffiliateAdd" 
      component={AffiliateAddScreen} 
      options={{ title: 'Add Affiliate Product' }}
    />
  </Stack.Navigator>
);

// Product Navigator
const ProductNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: true,
      headerTintColor: colors.primary,
      contentStyle: { backgroundColor: colors.background }
    }}
  >
    <Stack.Screen 
      name="ProductList" 
      component={ProductListScreen} 
      options={{ title: 'Digital Products' }}
    />
    <Stack.Screen 
      name="ProductDetail" 
      component={ProductDetailScreen} 
      options={{ title: 'Product Details' }}
    />
    <Stack.Screen 
      name="ProductCreate" 
      component={ProductCreateScreen} 
      options={{ title: 'Create Product' }}
    />
  </Stack.Navigator>
);

// Settings Navigator
const SettingsNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: true,
      headerTintColor: colors.primary,
      contentStyle: { backgroundColor: colors.background }
    }}
  >
    <Stack.Screen 
      name="SettingsMain" 
      component={SettingsScreen} 
      options={{ title: 'Settings' }}
    />
    <Stack.Screen 
      name="Profile" 
      component={ProfileScreen} 
      options={{ title: 'Profile' }}
    />
    <Stack.Screen 
      name="ApiKeys" 
      component={ApiKeysScreen} 
      options={{ title: 'API Keys' }}
    />
    <Stack.Screen 
      name="Notifications" 
      component={NotificationsScreen} 
      options={{ title: 'Notifications' }}
    />
  </Stack.Navigator>
);

// Main Tab Navigator
const MainNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.disabled,
      tabBarStyle: {
        backgroundColor: colors.surface,
        borderTopColor: colors.background,
        paddingBottom: 5,
        paddingTop: 5,
      },
      headerShown: false,
    }}
  >
    <Tab.Screen
      name="Dashboard"
      component={DashboardScreen}
      options={{
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="view-dashboard" color={color} size={size} />
        ),
      }}
    />
    <Tab.Screen
      name="Content"
      component={ContentNavigator}
      options={{
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="file-document-edit" color={color} size={size} />
        ),
      }}
    />
    <Tab.Screen
      name="Affiliate"
      component={AffiliateNavigator}
      options={{
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="tag" color={color} size={size} />
        ),
      }}
    />
    <Tab.Screen
      name="Products"
      component={ProductNavigator}
      options={{
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="shopping" color={color} size={size} />
        ),
      }}
    />
    <Tab.Screen
      name="Analytics"
      component={AnalyticsScreen}
      options={{
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="chart-bar" color={color} size={size} />
        ),
      }}
    />
    <Tab.Screen
      name="Settings"
      component={SettingsNavigator}
      options={{
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="cog" color={color} size={size} />
        ),
      }}
    />
  </Tab.Navigator>
);

// Root Navigator
const AppNavigator = () => {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;

