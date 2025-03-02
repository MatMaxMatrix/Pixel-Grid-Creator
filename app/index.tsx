import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Link, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useGridStore } from '../stores/gridStore';
import PixelGridCanvas from '../components/PixelGridCanvas';

export default function HomeScreen() {
  const {
    pattern,
    theme,
    cellSize,
    interactionRadius,
    autoWave,
    multipleWaves,
    lightingShape,
    colorMode,
    colorPalette,
    enableSound,
    enableHaptics,
    enableParticles,
    loadConfiguration,
  } = useGridStore();

  // Load saved configuration on mount
  useEffect(() => {
    loadConfiguration();
  }, [loadConfiguration]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Pixel Grid',
          headerShown: false,
        }}
      />

      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.title}>Pixel Grid</Text>
        <Text style={styles.subtitle}>Interactive Light Experience</Text>
      </View>

      <View style={styles.previewContainer}>
        <PixelGridCanvas
          height={200}
          pattern={pattern}
          theme={theme}
          cellSize={cellSize}
          interactionRadius={interactionRadius}
          autoWave={autoWave}
          multipleWaves={multipleWaves}
          lightingShape={lightingShape}
          colorMode={colorMode}
          colorPalette={colorPalette}
          enableSound={enableSound}
          enableHaptics={enableHaptics}
          enableParticles={enableParticles}
        />
      </View>

      <View style={styles.content}>
        <Text style={styles.description}>
          Experience an interactive grid of light that responds to your touch.
          Customize patterns, colors, and effects for a unique visual
          experience.
        </Text>

        <Link href="/grid" asChild>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Open Full Experience</Text>
          </TouchableOpacity>
        </Link>

        <View style={styles.features}>
          <Text style={styles.featuresTitle}>Features:</Text>
          <Text style={styles.featureItem}>• Dynamic lighting shapes</Text>
          <Text style={styles.featureItem}>• Multi-color options</Text>
          <Text style={styles.featureItem}>• Interactive sound & haptics</Text>
          <Text style={styles.featureItem}>• Particle effects</Text>
          <Text style={styles.featureItem}>• Customizable themes</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#0a0a1e',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#6366f1',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#e0e0e0',
    textAlign: 'center',
    marginBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  previewContainer: {
    marginBottom: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
  },
  description: {
    color: '#e0e0e0',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#4c1d95',
    padding: 16,
    borderRadius: 12,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  features: {
    marginTop: 20,
    alignSelf: 'flex-start',
  },
  featuresTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  featureItem: {
    color: '#d1d5db',
    fontSize: 14,
    marginBottom: 4,
  },
});
