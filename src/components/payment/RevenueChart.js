import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { PieChart } from 'react-native-chart-kit';
import { formatCurrency } from '../../utils/formatters';

const RevenueChart = ({ data }) => {
  const theme = useTheme();
  
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text>No revenue data available</Text>
      </View>
    );
  }
  
  // Define colors for different revenue sources
  const sourceColors = {
    content: theme.colors.primary,
    affiliate: theme.colors.accent,
    product: theme.colors.notification,
    other: theme.colors.placeholder
  };
  
  // Format data for pie chart
  const chartData = data.map((item, index) => {
    const sourceName = item.source || 'other';
    return {
      name: sourceName.charAt(0).toUpperCase() + sourceName.slice(1),
      amount: item.total,
      color: sourceColors[sourceName] || `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 1)`,
      legendFontColor: theme.colors.text,
      legendFontSize: 12
    };
  });
  
  // Calculate total revenue
  const totalRevenue = data.reduce((sum, item) => sum + item.total, 0);

  return (
    <View style={styles.container}>
      <PieChart
        data={chartData}
        width={Dimensions.get('window').width - 64}
        height={180}
        chartConfig={{
          backgroundColor: theme.colors.background,
          backgroundGradientFrom: theme.colors.background,
          backgroundGradientTo: theme.colors.background,
          color: (opacity = 1) => `rgba(${theme.colors.primary.replace(/[^\d,]/g, '')}, ${opacity})`,
          labelColor: (opacity = 1) => theme.colors.text,
          style: {
            borderRadius: 16
          }
        }}
        accessor="amount"
        backgroundColor="transparent"
        paddingLeft="15"
        absolute
        hasLegend={false}
      />
      
      <View style={styles.legendContainer}>
        {chartData.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: item.color }]} />
            <Text style={styles.legendText}>{item.name}</Text>
            <Text style={styles.legendAmount}>{formatCurrency(item.amount)}</Text>
            <Text style={styles.legendPercentage}>
              {((item.amount / totalRevenue) * 100).toFixed(1)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 16,
  },
  emptyContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendContainer: {
    width: '100%',
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    flex: 1,
  },
  legendAmount: {
    marginRight: 8,
    fontWeight: 'bold',
  },
  legendPercentage: {
    width: 50,
    textAlign: 'right',
  },
});

export default RevenueChart;

