import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { PieChart } from 'react-native-chart-kit';

const LeadStatusChart = ({ newLeads, qualifiedLeads, disqualifiedLeads, convertedLeads }) => {
  const theme = useTheme();
  
  const totalLeads = newLeads + qualifiedLeads + disqualifiedLeads + convertedLeads;
  
  if (totalLeads === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text>No lead data available</Text>
      </View>
    );
  }
  
  // Define colors for different lead statuses
  const statusColors = {
    new: theme.colors.notification,
    qualified: theme.colors.success,
    disqualified: theme.colors.error,
    converted: theme.colors.primary
  };
  
  // Format data for pie chart
  const chartData = [
    {
      name: 'New',
      count: newLeads,
      color: statusColors.new,
      legendFontColor: theme.colors.text,
      legendFontSize: 12
    },
    {
      name: 'Qualified',
      count: qualifiedLeads,
      color: statusColors.qualified,
      legendFontColor: theme.colors.text,
      legendFontSize: 12
    },
    {
      name: 'Disqualified',
      count: disqualifiedLeads,
      color: statusColors.disqualified,
      legendFontColor: theme.colors.text,
      legendFontSize: 12
    },
    {
      name: 'Converted',
      count: convertedLeads,
      color: statusColors.converted,
      legendFontColor: theme.colors.text,
      legendFontSize: 12
    }
  ].filter(item => item.count > 0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lead Status Distribution</Text>
      
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
        accessor="count"
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
            <Text style={styles.legendCount}>{item.count}</Text>
            <Text style={styles.legendPercentage}>
              {((item.count / totalLeads) * 100).toFixed(1)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
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
  legendCount: {
    marginRight: 8,
    fontWeight: 'bold',
  },
  legendPercentage: {
    width: 50,
    textAlign: 'right',
  },
});

export default LeadStatusChart;

