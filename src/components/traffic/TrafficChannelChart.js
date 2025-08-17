import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { BarChart } from 'react-native-chart-kit';

const TrafficChannelChart = ({ data }) => {
  const theme = useTheme();
  
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text>No channel data available</Text>
      </View>
    );
  }
  
  // Format data for bar chart
  const labels = data.map(item => item.channel);
  const trafficValues = data.map(item => item.estimatedTraffic || item.actualTraffic || 0);
  const clickValues = data.map(item => item.estimatedClicks || item.actualClicks || 0);
  
  // Calculate total traffic
  const totalTraffic = trafficValues.reduce((sum, value) => sum + value, 0);

  const chartData = {
    labels,
    datasets: [
      {
        data: trafficValues,
        color: (opacity = 1) => theme.colors.primary,
        strokeWidth: 2
      },
      {
        data: clickValues,
        color: (opacity = 1) => theme.colors.accent,
        strokeWidth: 2
      }
    ],
    legend: ['Traffic', 'Clicks']
  };

  const chartConfig = {
    backgroundColor: theme.colors.background,
    backgroundGradientFrom: theme.colors.background,
    backgroundGradientTo: theme.colors.background,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(${theme.colors.primary.replace(/[^\d,]/g, '')}, ${opacity})`,
    labelColor: (opacity = 1) => theme.colors.text,
    style: {
      borderRadius: 16
    },
    barPercentage: 0.5
  };

  return (
    <View style={styles.container}>
      <BarChart
        data={chartData}
        width={Dimensions.get('window').width - 64}
        height={220}
        chartConfig={chartConfig}
        verticalLabelRotation={30}
        fromZero
        showValuesOnTopOfBars
      />
      
      <View style={styles.legendContainer}>
        {data.map((item, index) => (
          <View key={index} style={styles.channelItem}>
            <Text style={styles.channelName}>
              {item.channel.charAt(0).toUpperCase() + item.channel.slice(1)}
            </Text>
            <Text style={styles.channelTraffic}>
              {(item.estimatedTraffic || item.actualTraffic || 0).toLocaleString()} visits
            </Text>
            <Text style={styles.channelPercentage}>
              {totalTraffic > 0 
                ? ((item.estimatedTraffic || item.actualTraffic || 0) / totalTraffic * 100).toFixed(1) 
                : 0}%
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
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendContainer: {
    width: '100%',
    marginTop: 16,
  },
  channelItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  channelName: {
    flex: 1,
    fontWeight: 'bold',
  },
  channelTraffic: {
    marginHorizontal: 8,
  },
  channelPercentage: {
    width: 50,
    textAlign: 'right',
  },
});

export default TrafficChannelChart;

