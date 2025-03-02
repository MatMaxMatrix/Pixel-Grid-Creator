import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

export default function BasicGridScreen() {
  const router = useRouter();
  const [animatedValue] = useState(new Animated.Value(0));

  // Simple animation using Animated API
  useEffect(() => {
    Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  // Create a grid of cells
  const renderGrid = () => {
    const rows = 15;
    const cols = 15;
    const grid = [];

    for (let i = 0; i < rows; i++) {
      const row = [];
      for (let j = 0; j < cols; j++) {
        // Calculate a color based on position
        const opacity = 0.2 + ((i + j) % 5) * 0.15;

        // Create a simple animation for each cell
        const scale = animatedValue.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [
            1,
            1 + (Math.sin(i * 0.5) + Math.cos(j * 0.5)) * 0.1,
            1,
          ],
        });

        row.push(
          <Animated.View
            key={`cell-${i}-${j}`}
            style={[
              styles.cell,
              {
                backgroundColor: `rgba(99, 102, 241, ${opacity})`,
                transform: [{ scale }],
              },
            ]}
          />
        );
      }
      grid.push(
        <View key={`row-${i}`} style={styles.row}>
          {row}
        </View>
      );
    }

    return grid;
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Basic Grid',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.gridContainer}>
        <Text style={styles.title}>Basic Grid View</Text>
        <Text style={styles.subtitle}>A simple grid with basic animations</Text>

        <View style={styles.grid}>{renderGrid()}</View>
      </View>
    </View>
  );
}

const { width } = Dimensions.get('window');
const gridSize = Math.min(width - 40, 300);
const cellSize = gridSize / 15;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1e',
  },
  gridContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6366f1',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#e0e0e0',
    textAlign: 'center',
    marginBottom: 30,
  },
  grid: {
    width: gridSize,
    height: gridSize,
  },
  row: {
    flexDirection: 'row',
    height: cellSize,
  },
  cell: {
    width: cellSize,
    height: cellSize,
    margin: 1,
    borderRadius: 2,
  },
});
