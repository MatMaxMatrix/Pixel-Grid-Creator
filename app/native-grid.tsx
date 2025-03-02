import React, { useEffect, useState } from 'react';
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

export default function NativeGridScreen() {
  const router = useRouter();
  const [animatedValue] = useState(new Animated.Value(0));
  const { width } = Dimensions.get('window');
  const gridSize = Math.min(width - 40, 300);

  // Start animation
  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 5000,
        useNativeDriver: true,
      })
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, []);

  // Create grid cells
  const renderGrid = () => {
    const rows = 20;
    const cols = 20;
    const cellSize = gridSize / cols;
    const grid = [];

    for (let i = 0; i < rows; i++) {
      const row = [];
      for (let j = 0; j < cols; j++) {
        // Calculate animation values based on position
        const delay = (i + j) * 0.01;
        const scale = animatedValue.interpolate({
          inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
          outputRange: [
            1,
            1 + Math.sin(i * 0.2) * 0.2,
            1 + Math.cos(j * 0.2) * 0.2,
            1 + Math.sin((i + j) * 0.1) * 0.2,
            1 + Math.cos(i * j * 0.01) * 0.2,
            1,
          ],
        });

        // Calculate color based on position
        const opacity = 0.2 + ((i + j) % 5) * 0.15;

        row.push(
          <Animated.View
            key={`cell-${i}-${j}`}
            style={[
              styles.cell,
              {
                width: cellSize - 2,
                height: cellSize - 2,
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
          title: 'Native Grid',
          headerShown: false,
        }}
      />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Native Grid</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>
          A reliable grid implementation for Android
        </Text>

        <View
          style={[styles.gridContainer, { width: gridSize, height: gridSize }]}
        >
          {renderGrid()}
        </View>

        <Text style={styles.instructions}>
          This version uses React Native's Animated API instead of Skia for
          better compatibility
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1e',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#e0e0e0',
    textAlign: 'center',
    marginBottom: 30,
  },
  gridContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  cell: {
    margin: 1,
    borderRadius: 2,
  },
  instructions: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    marginTop: 30,
    maxWidth: 300,
  },
});
