import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Dimensions,
  Share,
  Alert,
  Switch,
  Slider,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Save,
  Sparkles,
  Palette,
  Maximize,
  Minimize,
  Lightbulb,
  Download,
  Edit,
  Sliders,
  Camera,
} from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import ViewShot from 'react-native-view-shot';
import PixelGridCanvas from '../components/PixelGridCanvas';
import GridControls from '../components/GridControls';
import AIPromptInput from '../components/AIPromptInput';
import CustomThemeCreator from '../components/CustomThemeCreator';
import { useGridStore } from '../stores/gridStore';

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

export default function FullScreenGridScreen() {
  const router = useRouter();
  const haptics = useHaptics();
  const isWeb = Platform.OS === 'web';
  const isMounted = useRef(true);

  console.log('[FullScreenGrid] Initializing grid screen');

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
    customThemes,
    activeCustomTheme,
    setPattern,
    setTheme,
    setCellSize,
    setInteractionRadius,
    setAutoWave,
    setMultipleWaves,
    setLightingShape,
    setColorMode,
    setColorPalette,
    setEnableSound,
    setEnableHaptics,
    setEnableParticles,
    saveConfiguration,
  } = useGridStore();

  // Add lightingMode state
  const [lightingMode, setLightingMode] = useState<
    'gradient' | 'simple' | 'pulse' | 'solid' | 'highlight' | 'uniform'
  >('highlight');

  // Advanced features
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1.0); // Default speed
  const [isDrawMode, setIsDrawMode] = useState(false);
  const [drawnCells, setDrawnCells] = useState<Array<{ x: number; y: number }>>(
    []
  );
  const viewShotRef = React.useRef(null);

  console.log('[FullScreenGrid] Grid store values:', {
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
  });

  const [showControls, setShowControls] = useState(true);
  const [showAIPrompt, setShowAIPrompt] = useState(false);
  const [showThemeCreator, setShowThemeCreator] = useState(false);
  const [showLightingOptions, setShowLightingOptions] = useState(false);

  // Track whether we're in true fullscreen mode (no controls)
  const isTrueFullScreen = !showControls;

  // Get custom theme colors if active
  const getCustomThemeColors = () => {
    if (
      theme === 'custom' &&
      activeCustomTheme &&
      customThemes[activeCustomTheme]
    ) {
      console.log('[FullScreenGrid] Using custom theme:', activeCustomTheme);
      return customThemes[activeCustomTheme];
    }
    console.log('[FullScreenGrid] Using standard theme:', theme);
    return undefined;
  };

  const handleSave = async () => {
    haptics.impact(Haptics.ImpactFeedbackStyle.Medium);
    await saveConfiguration();
    haptics.notification(Haptics.NotificationFeedbackType.Success);
  };

  const toggleAIPrompt = () => {
    haptics.impact(Haptics.ImpactFeedbackStyle.Light);
    setShowAIPrompt(!showAIPrompt);

    // If opening AI prompt, make sure controls are visible
    if (!showAIPrompt && !showControls) {
      setShowControls(true);
    }
  };

  const handleCreateTheme = () => {
    haptics.impact(Haptics.ImpactFeedbackStyle.Light);
    setShowThemeCreator(true);
  };

  const toggleLightingOptions = () => {
    haptics.impact(Haptics.ImpactFeedbackStyle.Light);
    setShowLightingOptions(!showLightingOptions);

    // If opening lighting options, make sure controls are visible
    if (!showLightingOptions && !showControls) {
      setShowControls(true);
    }
  };

  const toggleDrawMode = () => {
    haptics.impact(Haptics.ImpactFeedbackStyle.Medium);
    setIsDrawMode(!isDrawMode);

    // Clear drawn cells when exiting draw mode
    if (isDrawMode) {
      setDrawnCells([]);
    }
  };

  // Function to capture screenshot
  const captureScreenshot = async () => {
    try {
      if (viewShotRef.current) {
        haptics.impact(Haptics.ImpactFeedbackStyle.Medium);

        // Use different capture options based on platform
        const captureOptions =
          Platform.OS === 'web'
            ? { format: 'jpg', quality: 0.9, result: 'base64' }
            : { format: 'jpg', quality: 0.9 };

        const result = await viewShotRef.current.capture(captureOptions);

        // Different handling for web vs native
        if (Platform.OS === 'web') {
          // For web, create a download link with the base64 data
          const link = document.createElement('a');
          link.href = `data:image/jpeg;base64,${result}`;
          link.download = 'pixel-grid-screenshot.jpg';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          Alert.alert('Screenshot captured', 'Your image has been downloaded');
        } else {
          // For native platforms, use Share API
          const shareOptions = {
            title: 'PixelGrid Creation',
            message: 'Check out my PixelGrid creation!',
            url: result,
          };
          await Share.share(shareOptions);
        }

        haptics.notification(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      Alert.alert('Error', 'Failed to capture screenshot');
    }
  };

  // Function to handle cell drawing with debouncing for mobile
  const handleCellDraw = useCallback(
    (x: number, y: number) => {
      if (isDrawMode) {
        // For mobile, limit the number of drawn cells to prevent performance issues
        if (!isWeb && drawnCells.length > 100) {
          // Remove oldest cells if we have too many
          setDrawnCells((prev) => [...prev.slice(-100), { x, y }]);
        } else {
          setDrawnCells((prev) => [...prev, { x, y }]);
        }

        haptics.impact(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    [isDrawMode, drawnCells.length, isWeb, haptics]
  );

  const changeLightingMode = (
    mode: 'gradient' | 'simple' | 'pulse' | 'solid' | 'highlight' | 'uniform'
  ) => {
    setLightingMode(mode);
    haptics.impact(Haptics.ImpactFeedbackStyle.Medium);
  };

  // Add a useEffect to log when the component mounts and unmounts
  useEffect(() => {
    console.log('[FullScreenGrid] Component mounted');
    isMounted.current = true;

    // Check if in mobile
    const isMobile = Platform.OS !== 'web';
    console.log('[FullScreenGrid] Platform:', {
      OS: Platform.OS,
      isMobile,
      dimensions: Dimensions.get('window'),
    });

    return () => {
      console.log('[FullScreenGrid] Component unmounted');
      isMounted.current = false;
    };
  }, []);

  // Optimize performance for mobile devices
  useEffect(() => {
    // If on mobile, use more conservative settings for better performance
    if (!isWeb) {
      // Adjust cell size for better performance on mobile
      if (cellSize < 5) {
        setCellSize(5);
      }

      // Limit interaction radius on mobile for better performance
      if (interactionRadius > 100) {
        setInteractionRadius(100);
      }

      // Disable multiple waves on lower-end devices
      if (multipleWaves && Platform.OS === 'android') {
        setMultipleWaves(false);
      }
    }
  }, [isWeb, cellSize, interactionRadius, multipleWaves]);

  console.log('[FullScreenGrid] About to render component');

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      {/* Main Grid Canvas */}
      <View style={styles.canvasContainer}>
        <ViewShot
          ref={viewShotRef}
          options={{ format: 'jpg', quality: 0.9 }}
          style={styles.viewShot}
        >
          <PixelGridCanvas
            height={Dimensions.get('window').height}
            pattern={pattern}
            theme={theme}
            cellSize={cellSize}
            interactionRadius={interactionRadius}
            autoWave={autoWave}
            multipleWaves={multipleWaves}
            fullScreen={isTrueFullScreen}
            customThemeColors={getCustomThemeColors()}
            lightingMode={lightingMode}
            animationSpeed={animationSpeed}
            isDrawMode={isDrawMode}
            drawnCells={drawnCells}
            onCellDraw={handleCellDraw}
            lightingShape={lightingShape}
            colorMode={colorMode}
            colorPalette={colorPalette}
            enableSound={enableSound}
            enableHaptics={enableHaptics}
            enableParticles={enableParticles}
          />
        </ViewShot>
      </View>

      {/* Controls Panel */}
      <BlurView
        intensity={80}
        style={[
          styles.controlsContainer,
          showControls ? styles.controlsVisible : styles.controlsHidden,
        ]}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Pixel Grid</Text>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Save size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollContainer}>
          <GridControls
            pattern={pattern}
            theme={theme}
            cellSize={cellSize}
            interactionRadius={interactionRadius}
            autoWave={autoWave}
            multipleWaves={multipleWaves}
            lightingShape={lightingShape}
            colorMode={colorMode}
            enableSound={enableSound}
            enableHaptics={enableHaptics}
            enableParticles={enableParticles}
            onPatternChange={setPattern}
            onThemeChange={setTheme}
            onCellSizeChange={setCellSize}
            onInteractionRadiusChange={setInteractionRadius}
            onAutoWaveChange={setAutoWave}
            onMultipleWavesChange={setMultipleWaves}
            onLightingShapeChange={setLightingShape}
            onColorModeChange={setColorMode}
            onEnableSoundChange={setEnableSound}
            onEnableHapticsChange={setEnableHaptics}
            onEnableParticlesChange={setEnableParticles}
          />

          {showControls && (
            <View>
              {showAIPrompt && (
                <View style={styles.aiPromptContainer}>
                  <AIPromptInput
                    onApplyConfig={() => {
                      setShowAIPrompt(false);
                      haptics.notification(
                        Haptics.NotificationFeedbackType.Success
                      );
                    }}
                  />
                </View>
              )}

              {/* Color Palette Editor - Show when colorMode is 'random' */}
              {colorMode === 'random' && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Color Palette</Text>
                  <View style={styles.colorPaletteContainer}>
                    {colorPalette.map((color, index) => (
                      <TouchableOpacity
                        key={`color-${index}`}
                        style={[styles.colorSwatch, { backgroundColor: color }]}
                        onPress={() => {
                          // Simple color picker could be implemented here
                          // For now, we'll just cycle through some preset colors
                          const presetColors = [
                            '#ff0000',
                            '#00ff00',
                            '#0000ff',
                            '#ffff00',
                            '#ff00ff',
                            '#00ffff',
                            '#ff8000',
                            '#8000ff',
                            '#0080ff',
                            '#ff0080',
                            '#ffffff',
                            '#000000',
                          ];
                          const currentIndex = presetColors.indexOf(color);
                          const nextIndex =
                            (currentIndex + 1) % presetColors.length;
                          const newPalette = [...colorPalette];
                          newPalette[index] = presetColors[nextIndex];
                          setColorPalette(newPalette);
                          haptics.impact(Haptics.ImpactFeedbackStyle.Light);
                        }}
                      />
                    ))}

                    {/* Add new color button */}
                    {colorPalette.length < 10 && (
                      <TouchableOpacity
                        style={styles.addColorButton}
                        onPress={() => {
                          const newPalette = [...colorPalette, '#ffffff'];
                          setColorPalette(newPalette);
                          haptics.impact(Haptics.ImpactFeedbackStyle.Light);
                        }}
                      >
                        <Text style={styles.addColorButtonText}>+</Text>
                      </TouchableOpacity>
                    )}

                    {/* Remove color button */}
                    {colorPalette.length > 2 && (
                      <TouchableOpacity
                        style={styles.removeColorButton}
                        onPress={() => {
                          const newPalette = colorPalette.slice(0, -1);
                          setColorPalette(newPalette);
                          haptics.impact(Haptics.ImpactFeedbackStyle.Light);
                        }}
                      >
                        <Text style={styles.removeColorButtonText}>-</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}

              {showLightingOptions && (
                <View style={styles.lightingOptionsContainer}>
                  <Text style={styles.sectionTitle}>Lighting Effects</Text>
                  <View style={styles.optionsRow}>
                    <TouchableOpacity
                      style={[
                        styles.optionButton,
                        lightingMode === 'gradient' &&
                          styles.optionButtonActive,
                      ]}
                      onPress={() => changeLightingMode('gradient')}
                    >
                      <Text style={styles.optionButtonText}>Gradient</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.optionButton,
                        lightingMode === 'simple' && styles.optionButtonActive,
                      ]}
                      onPress={() => changeLightingMode('simple')}
                    >
                      <Text style={styles.optionButtonText}>Simple</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.optionButton,
                        lightingMode === 'pulse' && styles.optionButtonActive,
                      ]}
                      onPress={() => changeLightingMode('pulse')}
                    >
                      <Text style={styles.optionButtonText}>Pulse</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.optionsRow, styles.optionsRowMarginTop]}>
                    <TouchableOpacity
                      style={[
                        styles.optionButton,
                        lightingMode === 'solid' && styles.optionButtonActive,
                      ]}
                      onPress={() => changeLightingMode('solid')}
                    >
                      <Text style={styles.optionButtonText}>Solid</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.optionButton,
                        styles.optionButtonHighlight,
                        lightingMode === 'highlight' &&
                          styles.optionButtonActive,
                      ]}
                      onPress={() => changeLightingMode('highlight')}
                    >
                      <Text style={styles.optionButtonText}>Highlight</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.optionsRow, styles.optionsRowMarginTop]}>
                    <TouchableOpacity
                      style={[
                        styles.optionButton,
                        lightingMode === 'uniform' && styles.optionButtonActive,
                      ]}
                      onPress={() => changeLightingMode('uniform')}
                    >
                      <Text style={styles.optionButtonText}>Uniform</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.optionDescription}>
                    {lightingMode === 'gradient'
                      ? 'Smooth transitions with varied intensity'
                      : lightingMode === 'simple'
                      ? 'Sharp on/off with slight movement'
                      : lightingMode === 'pulse'
                      ? 'Pulsating effect with wave motion'
                      : lightingMode === 'highlight'
                      ? 'Ultra-reliable highlighting with no animations or scaling'
                      : lightingMode === 'uniform'
                      ? 'All pixels at full brightness with no effects'
                      : 'Uniform brightness with crisp edges'}
                  </Text>
                </View>
              )}

              {showAdvancedControls && (
                <View style={styles.advancedControlsContainer}>
                  <Text style={styles.sectionTitle}>Advanced Controls</Text>

                  <View style={styles.controlItem}>
                    <Text style={styles.controlLabel}>Animation Speed</Text>
                    <View style={styles.sliderContainer}>
                      <Text style={styles.sliderLabel}>Slow</Text>
                      <View style={styles.slider}>
                        {Platform.OS === 'web' ? (
                          <input
                            type="range"
                            min="0.2"
                            max="3"
                            step="0.1"
                            value={animationSpeed}
                            onChange={(e) =>
                              setAnimationSpeed(parseFloat(e.target.value))
                            }
                            style={{ width: '100%' }}
                          />
                        ) : (
                          <Slider
                            style={{ width: '100%', height: 40 }}
                            minimumValue={0.2}
                            maximumValue={3}
                            step={0.1}
                            value={animationSpeed}
                            onValueChange={setAnimationSpeed}
                            minimumTrackTintColor="#6366f1"
                            maximumTrackTintColor="#374151"
                            thumbTintColor="#818cf8"
                          />
                        )}
                      </View>
                      <Text style={styles.sliderLabel}>Fast</Text>
                    </View>
                  </View>

                  <View style={styles.controlItem}>
                    <Text style={styles.controlLabel}>Draw Mode</Text>
                    <View style={styles.switchContainer}>
                      <Text style={styles.switchLabel}>Off</Text>
                      <Switch
                        value={isDrawMode}
                        onValueChange={toggleDrawMode}
                        trackColor={{ false: '#374151', true: '#6366f1' }}
                        thumbColor={isDrawMode ? '#818cf8' : '#f4f3f4'}
                      />
                      <Text style={styles.switchLabel}>On</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={captureScreenshot}
                  >
                    <Camera
                      size={18}
                      color="#fff"
                      style={styles.actionButtonIcon}
                    />
                    <Text style={styles.actionButtonText}>
                      Capture Screenshot
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          <CustomThemeCreator
            visible={showThemeCreator}
            onClose={() => setShowThemeCreator(false)}
          />

          {/* Advanced Controls Toggle Button */}
          <TouchableOpacity
            style={styles.advancedToggleButton}
            onPress={() => {
              setShowAdvancedControls(!showAdvancedControls);
              haptics.impact(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Sliders size={16} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.advancedToggleText}>
              {showAdvancedControls
                ? 'Hide Advanced Controls'
                : 'Show Advanced Controls'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </BlurView>

      <TouchableOpacity
        style={[
          styles.toggleButton,
          isTrueFullScreen && styles.toggleButtonFullscreen,
        ]}
        onPress={() => {
          setShowControls(!showControls);
          haptics.impact(Haptics.ImpactFeedbackStyle.Medium);

          // If hiding controls, also hide AI prompt and lighting options
          if (showControls) {
            setShowAIPrompt(false);
            setShowLightingOptions(false);
            setShowAdvancedControls(false);
          }
        }}
      >
        {isTrueFullScreen ? (
          <Minimize size={18} color="#fff" style={styles.toggleIcon} />
        ) : (
          <Maximize size={18} color="#fff" style={styles.toggleIcon} />
        )}
        <Text style={styles.toggleButtonText}>
          {showControls ? 'Hide Controls' : 'Show Controls'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1e',
  },
  canvasContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  viewShot: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 15,
    zIndex: 10,
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
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  aiPromptContainer: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(99, 102, 241, 0.3)',
  },
  lightingOptionsContainer: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(99, 102, 241, 0.3)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  optionButton: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  optionButtonActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.8)',
  },
  optionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  optionsRowMarginTop: {
    marginTop: 8,
  },
  optionButtonHighlight: {
    backgroundColor: 'rgba(129, 140, 248, 0.5)',
  },
  optionDescription: {
    fontSize: 12,
    color: '#cbd5e1',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  advancedControlsContainer: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(99, 102, 241, 0.3)',
  },
  controlItem: {
    marginBottom: 16,
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 8,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slider: {
    flex: 1,
    marginHorizontal: 10,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#94a3b8',
    width: 40,
    textAlign: 'center',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginHorizontal: 8,
  },
  actionButton: {
    backgroundColor: 'rgba(79, 70, 229, 0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  actionButtonIcon: {
    marginRight: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  toggleButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(99, 102, 241, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 100,
  },
  toggleButtonFullscreen: {
    backgroundColor: 'rgba(20, 20, 40, 0.7)',
  },
  toggleButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  toggleIcon: {
    marginRight: 6,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    zIndex: 10,
    maxHeight: '80%',
  },
  controlsVisible: {
    opacity: 1,
    transform: [{ translateY: 0 }],
  },
  controlsHidden: {
    opacity: 0,
    transform: [{ translateY: 100 }],
    height: 0,
    overflow: 'hidden',
  },
  section: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(99, 102, 241, 0.3)',
  },
  colorPaletteContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  colorSwatch: {
    width: '30%',
    height: 40,
    borderRadius: 8,
    marginBottom: 8,
  },
  addColorButton: {
    width: '30%',
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  addColorButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  removeColorButton: {
    width: '30%',
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  removeColorButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  advancedToggleButton: {
    backgroundColor: 'rgba(99, 102, 241, 0.8)',
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  advancedToggleText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
