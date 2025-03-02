import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import MobileGridFallback from '../components/MobileGridFallback';

export default function TestScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Test Screen',
          headerStyle: {
            backgroundColor: '#0a0a1e',
          },
          headerTintColor: '#fff',
        }}
      />

      <Text style={styles.title}>Testing MobileGridFallback</Text>

      <View style={styles.gridContainer}>
        <MobileGridFallback
          pattern="dots"
          theme="default"
          cellSize={8}
          interactionRadius={100}
          autoWave={true}
        />
      </View>

      <Button title="Go Back" onPress={() => router.back()} color="#6366f1" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#0a0a1e',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  gridContainer: {
    flex: 1,
    marginVertical: 20,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
});
