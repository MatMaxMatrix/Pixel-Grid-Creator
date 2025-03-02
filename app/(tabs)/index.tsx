import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import {
  Save,
  RefreshCw,
  Zap,
  Chrome as Home,
  Sparkles,
  Palette,
  Maximize2,
  Settings,
  Info,
} from 'lucide-react-native';
import PixelGridCanvas from '../../components/PixelGridCanvas';
import GridControls from '../../components/GridControls';
import AIPromptInput from '../../components/AIPromptInput';
import AISuggestions from '../../components/AISuggestions';
import CustomThemeCreator from '../../components/CustomThemeCreator';
import { useGridStore } from '../../stores/gridStore';
import { Stack, useRouter, Link } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

// Helper function to safely use Haptics
const useHaptics = () => {
  const isWeb = Platform.OS === 'web';

  return {
    impact: (style = Haptics.ImpactFeedbackStyle.Medium) => {
      if (!isWeb) {
        Haptics.impactAsync(style);
      }
    },
    notification: (type = Haptics.NotificationFeedbackType.Success) => {
      if (!isWeb) {
        Haptics.notificationAsync(type);
      }
    },
  };
};

export default function HomeScreen() {
  const router = useRouter();
  const {
    pattern,
    theme,
    cellSize,
    interactionRadius,
    autoWave,
    customThemes,
    activeCustomTheme,
    setPattern,
    setTheme,
    setCellSize,
    setInteractionRadius,
    setAutoWave,
    loadConfiguration,
    saveConfiguration,
  } = useGridStore();

  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [showThemeCreator, setShowThemeCreator] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const windowDimensions = Dimensions.get('window');
  const canvasHeight = windowDimensions.height * 0.6;

  // Animation for the controls panel
  const controlsPosition = useSharedValue(0);

  const controlsStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: controlsPosition.value }],
    };
  });

  const toggleControls = () => {
    const newValue = isControlsVisible ? 300 : 0;
    controlsPosition.value = withTiming(newValue, { duration: 300 });
    setIsControlsVisible(!isControlsVisible);
  };

  // Pulse animation for the canvas
  const pulseValue = useSharedValue(1);

  useEffect(() => {
    if (autoWave) {
      pulseValue.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1500 }),
          withTiming(0.95, { duration: 1500 })
        ),
        -1,
        true
      );
    } else {
      pulseValue.value = withTiming(1, { duration: 300 });
    }
  }, [autoWave]);

  const pulseStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseValue.value }],
    };
  });

  // Load saved configuration on mount
  useEffect(() => {
    loadConfiguration();
  }, []);

  const haptics = useHaptics();

  // Get custom theme colors if active
  const getCustomThemeColors = () => {
    if (
      theme === 'custom' &&
      activeCustomTheme &&
      customThemes[activeCustomTheme]
    ) {
      return customThemes[activeCustomTheme];
    }
    return undefined;
  };

  const handleFullScreenPress = () => {
    haptics.impact(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/grid');
  };

  const handleCreateThemePress = () => {
    haptics.impact(Haptics.ImpactFeedbackStyle.Light);
    setShowThemeCreator(true);
  };

  const handleSave = async () => {
    haptics.impact(Haptics.ImpactFeedbackStyle.Medium);
    await saveConfiguration();
  };

  const handleInfoToggle = () => {
    haptics.impact(Haptics.ImpactFeedbackStyle.Light);
    setShowInfo(!showInfo);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <LinearGradient
        colors={['rgba(15, 23, 42, 0.9)', 'rgba(10, 10, 30, 0.95)']}
        style={styles.headerGradient}
      >
        <Text style={styles.title}>Pixel Grid Creator</Text>
        <Text style={styles.subtitle}>
          <Sparkles size={16} color="#6366f1" /> AI-Powered Interactive Pixel
          Grids
        </Text>
      </LinearGradient>

      <View style={styles.previewContainer}>
        <PixelGridCanvas
          pattern={pattern}
          theme={theme}
          cellSize={cellSize}
          interactionRadius={interactionRadius}
          autoWave={autoWave}
          height={240}
          customThemeColors={getCustomThemeColors()}
        />

        <TouchableOpacity
          style={styles.fullScreenButton}
          onPress={handleFullScreenPress}
        >
          <Text style={styles.fullScreenButtonText}>Full Screen Mode</Text>
        </TouchableOpacity>
      </View>

      <AIPromptInput />

      <AISuggestions />

      <View style={styles.customThemeSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            <Palette size={18} color="#6366f1" /> Custom Themes
          </Text>
          <TouchableOpacity
            style={styles.createThemeButton}
            onPress={handleCreateThemePress}
          >
            <Text style={styles.createThemeButtonText}>Create New</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.themesContainer}
        >
          {Object.keys(customThemes).length > 0 ? (
            Object.entries(customThemes).map(([name, colors]) => (
              <TouchableOpacity
                key={name}
                style={[
                  styles.themeCard,
                  activeCustomTheme === name && styles.activeThemeCard,
                ]}
                onPress={() => {
                  setTheme('custom');
                  useGridStore.getState().setActiveCustomTheme(name);
                  haptics.impact(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <View
                  style={[
                    styles.themeColorPreview,
                    { backgroundColor: colors.hover },
                  ]}
                />
                <Text style={styles.themeCardText}>{name}</Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noThemesText}>
              No custom themes yet. Create one with AI!
            </Text>
          )}
        </ScrollView>
      </View>

      <View style={styles.controlsSection}>
        <Text style={styles.sectionTitle}>Grid Controls</Text>
        <GridControls
          pattern={pattern}
          theme={theme}
          cellSize={cellSize}
          interactionRadius={interactionRadius}
          autoWave={autoWave}
          onPatternChange={setPattern}
          onThemeChange={setTheme}
          onCellSizeChange={setCellSize}
          onInteractionRadiusChange={setInteractionRadius}
          onAutoWaveChange={setAutoWave}
        />
      </View>

      <CustomThemeCreator
        visible={showThemeCreator}
        onClose={() => setShowThemeCreator(false)}
      />

      {showInfo && (
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>About Pixel Grid Creator</Text>
          <Text style={styles.infoText}>
            Create beautiful interactive pixel grids with various patterns and
            themes. Use the controls to customize your grid, or try the AI
            suggestions for inspiration.
          </Text>
          <Text style={styles.infoText}>
            Tap and drag on the grid to see interactive effects. Use the
            full-screen button to view your creation in immersive mode.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1e',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#6366f1',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#e0e0e0',
    textAlign: 'center',
    marginBottom: 20,
  },
  previewContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  fullScreenButton: {
    backgroundColor: 'rgba(99, 102, 241, 0.8)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 16,
  },
  fullScreenButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  customThemeSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 12,
  },
  createThemeButton: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.5)',
  },
  createThemeButtonText: {
    color: '#a5b4fc',
    fontSize: 14,
    fontWeight: '600',
  },
  themesContainer: {
    paddingBottom: 8,
  },
  themeCard: {
    width: 100,
    height: 100,
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  activeThemeCard: {
    borderColor: '#6366f1',
    borderWidth: 2,
  },
  themeColorPreview: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 8,
  },
  themeCardText: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  noThemesText: {
    color: '#94a3b8',
    fontStyle: 'italic',
    padding: 16,
  },
  controlsSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  infoCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 10,
    lineHeight: 20,
  },
});
