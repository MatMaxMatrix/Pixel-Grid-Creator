import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Check, Zap } from 'lucide-react-native';

// Define available themes
const themes = [
  { value: 'default', label: 'Default' },
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'neon', label: 'Neon' },
  { value: 'pastel', label: 'Pastel' },
  { value: 'monochrome', label: 'Monochrome' },
  { value: 'cyber', label: 'Cyberpunk' },
];

const patterns = [
  { id: 'dots', name: 'Dots' },
  { id: 'lines', name: 'Lines' },
  { id: 'waves', name: 'Waves' },
  { id: 'grid', name: 'Grid' },
  { id: 'particles', name: 'Particles' },
];

// Define lighting shapes
const lightingShapes = [
  { id: 'circular', name: 'Circular' },
  { id: 'linear', name: 'Linear' },
  { id: 'radial', name: 'Radial' },
  { id: 'random', name: 'Random' },
];

// Define color modes
const colorModes = [
  { id: 'single', name: 'Single' },
  { id: 'gradient', name: 'Gradient' },
  { id: 'random', name: 'Random' },
];

interface GridControlsProps {
  pattern: string;
  theme: string;
  cellSize: number;
  interactionRadius: number;
  autoWave: boolean;
  multipleWaves?: boolean;
  lightingShape?: 'circular' | 'linear' | 'radial' | 'random';
  colorMode?: 'single' | 'gradient' | 'random';
  enableSound?: boolean;
  enableHaptics?: boolean;
  enableParticles?: boolean;
  onPatternChange: (pattern: string) => void;
  onThemeChange: (theme: string) => void;
  onCellSizeChange: (size: number) => void;
  onInteractionRadiusChange: (radius: number) => void;
  onAutoWaveChange: (enabled: boolean) => void;
  onMultipleWavesChange?: (enabled: boolean) => void;
  onLightingShapeChange?: (
    shape: 'circular' | 'linear' | 'radial' | 'random'
  ) => void;
  onColorModeChange?: (mode: 'single' | 'gradient' | 'random') => void;
  onEnableSoundChange?: (enabled: boolean) => void;
  onEnableHapticsChange?: (enabled: boolean) => void;
  onEnableParticlesChange?: (enabled: boolean) => void;
  compact?: boolean;
}

const GridControls = ({
  pattern,
  theme,
  cellSize,
  interactionRadius,
  autoWave,
  multipleWaves = false,
  lightingShape = 'circular',
  colorMode = 'single',
  enableSound = false,
  enableHaptics = false,
  enableParticles = false,
  onPatternChange,
  onThemeChange,
  onCellSizeChange,
  onInteractionRadiusChange,
  onAutoWaveChange,
  onMultipleWavesChange,
  onLightingShapeChange,
  onColorModeChange,
  onEnableSoundChange,
  onEnableHapticsChange,
  onEnableParticlesChange,
  compact = false,
}: GridControlsProps) => {
  console.log('[GridControls] Rendering with props:', {
    pattern,
    theme,
    cellSize,
    interactionRadius,
    autoWave,
    multipleWaves,
    lightingShape,
    colorMode,
    enableSound,
    enableHaptics,
    enableParticles,
    compact,
  });

  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Theme</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.optionsScroll}
        >
          <View style={styles.optionsContainer}>
            {themes.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.optionButton,
                  theme === item.value && styles.selectedOption,
                  { backgroundColor: getThemeColor(item.value) },
                ]}
                onPress={() => onThemeChange(item.value)}
              >
                <Text
                  style={[
                    styles.optionText,
                    theme === item.value && styles.selectedOptionText,
                    item.value === 'light' && { color: '#1e293b' },
                  ]}
                >
                  {item.label}
                </Text>
                {theme === item.value && (
                  <Check
                    size={16}
                    color={item.value === 'light' ? '#1e293b' : '#fff'}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pattern</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.optionsScroll}
        >
          <View style={styles.optionsContainer}>
            {patterns.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.optionButton,
                  pattern === item.id && styles.selectedOption,
                ]}
                onPress={() => onPatternChange(item.id)}
              >
                <Text
                  style={[
                    styles.optionText,
                    pattern === item.id && styles.selectedOptionText,
                  ]}
                >
                  {item.name}
                </Text>
                {pattern === item.id && <Check size={16} color="#fff" />}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* New Lighting Shape Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lighting Shape</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.optionsScroll}
        >
          <View style={styles.optionsContainer}>
            {lightingShapes.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.optionButton,
                  lightingShape === item.id && styles.selectedOption,
                ]}
                onPress={() =>
                  onLightingShapeChange && onLightingShapeChange(item.id as any)
                }
              >
                <Text
                  style={[
                    styles.optionText,
                    lightingShape === item.id && styles.selectedOptionText,
                  ]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* New Color Mode Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Color Mode</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.optionsScroll}
        >
          <View style={styles.optionsContainer}>
            {colorModes.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.optionButton,
                  colorMode === item.id && styles.selectedOption,
                ]}
                onPress={() =>
                  onColorModeChange && onColorModeChange(item.id as any)
                }
              >
                <Text
                  style={[
                    styles.optionText,
                    colorMode === item.id && styles.selectedOptionText,
                  ]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cell Size</Text>
        <Slider
          style={styles.slider}
          minimumValue={1}
          maximumValue={20}
          step={1}
          value={cellSize}
          onValueChange={onCellSizeChange}
          minimumTrackTintColor="#4f46e5"
          maximumTrackTintColor="#d1d5db"
        />
        <Text style={styles.sliderValue}>{cellSize}px</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Interaction Radius</Text>
        <Slider
          style={styles.slider}
          minimumValue={10}
          maximumValue={300}
          step={5}
          value={interactionRadius}
          onValueChange={onInteractionRadiusChange}
          minimumTrackTintColor="#4f46e5"
          maximumTrackTintColor="#d1d5db"
        />
        <Text style={styles.sliderValue}>{interactionRadius}px</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.toggleContainer}>
          <Text style={styles.toggleLabel}>Auto Wave</Text>
          <Switch
            value={autoWave}
            onValueChange={onAutoWaveChange}
            trackColor={{ false: '#d1d5db', true: '#4f46e5' }}
          />
        </View>

        {onMultipleWavesChange && (
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleLabel}>Multiple Waves</Text>
            <Switch
              value={multipleWaves}
              onValueChange={onMultipleWavesChange}
              trackColor={{ false: '#d1d5db', true: '#4f46e5' }}
              disabled={!autoWave}
            />
          </View>
        )}
      </View>

      {/* Interactive Features Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Interactive Features</Text>

        <View style={styles.toggleContainer}>
          <Text style={styles.toggleLabel}>Sound Effects</Text>
          <Switch
            value={enableSound}
            onValueChange={(value) =>
              onEnableSoundChange && onEnableSoundChange(value)
            }
            trackColor={{ false: '#d1d5db', true: '#4f46e5' }}
          />
        </View>

        <View style={styles.toggleContainer}>
          <Text style={styles.toggleLabel}>Haptic Feedback</Text>
          <Switch
            value={enableHaptics}
            onValueChange={(value) =>
              onEnableHapticsChange && onEnableHapticsChange(value)
            }
            trackColor={{ false: '#d1d5db', true: '#4f46e5' }}
          />
        </View>

        <View style={styles.toggleContainer}>
          <Text style={styles.toggleLabel}>Particle Effects</Text>
          <Switch
            value={enableParticles}
            onValueChange={(value) =>
              onEnableParticlesChange && onEnableParticlesChange(value)
            }
            trackColor={{ false: '#d1d5db', true: '#4f46e5' }}
          />
        </View>
      </View>
    </View>
  );
};

// Helper function to get theme color for buttons
const getThemeColor = (themeId: string): string => {
  switch (themeId) {
    case 'default':
      return '#6366f1';
    case 'dark':
      return '#1e293b';
    case 'light':
      return '#e0f2fe';
    case 'neon':
      return '#00ff00';
    case 'pastel':
      return '#fcd5ce';
    case 'monochrome':
      return '#0f172a';
    case 'cyber':
      return '#ff00ff';
    default:
      return '#6366f1';
  }
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
  },
  compactContainer: {
    backgroundColor: 'transparent',
    padding: 8,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e0e0e0',
    marginBottom: 8,
  },
  optionsScroll: {
    flexGrow: 0,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    minWidth: 80,
  },
  selectedOption: {
    backgroundColor: '#6366f1',
  },
  optionText: {
    color: '#e0e0e0',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  selectedOptionText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sliderValue: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#334155',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#6366f1',
  },
  toggleIcon: {
    marginRight: 8,
  },
  toggleText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  toggleLabel: {
    color: '#e0e0e0',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default GridControls;
