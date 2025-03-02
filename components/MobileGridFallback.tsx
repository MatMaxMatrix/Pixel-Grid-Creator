import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  Platform,
  Pressable,
} from 'react-native';
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
  PanGestureHandler,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  runOnJS,
  Easing,
  withSpring,
  interpolate,
  Extrapolate,
  useDerivedValue,
} from 'react-native-reanimated';
import { memo } from 'react';

// For sound and haptic feedback
let Audio: any, Haptics: any;

// Try to import audio and haptics modules
try {
  Audio = require('expo-av');
  console.log('[MobileGridFallback] Successfully imported Audio');
} catch (error) {
  console.log('[MobileGridFallback] Audio module not available');
}

try {
  Haptics = require('expo-haptics');
  console.log('[MobileGridFallback] Successfully imported Haptics');
} catch (error) {
  console.log('[MobileGridFallback] Haptics module not available');
}

interface MobileGridFallbackProps {
  pattern?: string;
  theme?: string;
  cellSize?: number;
  interactionRadius?: number;
  autoWave?: boolean;
  multipleWaves?: boolean;
  fullScreen?: boolean;
  height?: number;
  lightingMode?:
    | 'gradient'
    | 'simple'
    | 'pulse'
    | 'solid'
    | 'highlight'
    | 'uniform';
  animationSpeed?: number;
  isDrawMode?: boolean;
  drawnCells?: Array<{ x: number; y: number }>;
  onCellDraw?: (x: number, y: number) => void;
  lightingShape?: 'circular' | 'linear' | 'radial' | 'random';
  colorMode?: 'single' | 'gradient' | 'random';
  colorPalette?: string[];
  enableSound?: boolean;
  enableHaptics?: boolean;
  enableParticles?: boolean;
  customThemeColors?: Record<string, string>;
}

// Define theme colors outside the component to avoid recreation
const DEFAULT_THEME_COLORS = {
  default: {
    base: 'rgba(99, 102, 241, 0.2)',
    hover: 'rgba(129, 140, 248, 0.8)',
    background: 'rgba(10, 10, 30, 0.9)',
  },
  dark: {
    base: 'rgba(30, 41, 59, 0.2)',
    hover: 'rgba(51, 65, 85, 0.8)',
    background: 'rgba(15, 23, 42, 0.95)',
  },
  light: {
    base: 'rgba(224, 242, 254, 0.2)',
    hover: 'rgba(186, 230, 253, 0.8)',
    background: 'rgba(241, 245, 249, 0.9)',
  },
  neon: {
    base: 'rgba(0, 255, 0, 0.2)',
    hover: 'rgba(0, 255, 0, 0.8)',
    background: 'rgba(0, 0, 0, 0.95)',
  },
  pastel: {
    base: 'rgba(252, 213, 206, 0.2)',
    hover: 'rgba(248, 237, 235, 0.8)',
    background: 'rgba(255, 255, 255, 0.9)',
  },
  monochrome: {
    base: 'rgba(15, 23, 42, 0.2)',
    hover: 'rgba(30, 41, 59, 0.8)',
    background: 'rgba(15, 23, 42, 0.9)',
  },
  cyber: {
    base: 'rgba(139, 92, 246, 0.2)',
    hover: 'rgba(217, 70, 239, 0.8)',
    background: 'rgba(17, 24, 39, 0.95)',
  },
};

// Helper function to safely get theme colors
const safeGetThemeColors = (
  theme: string,
  customThemeColors?: Record<string, any>
) => {
  try {
    // Check if using custom theme
    if (
      theme === 'custom' &&
      customThemeColors &&
      typeof customThemeColors === 'object' &&
      customThemeColors.base &&
      customThemeColors.hover &&
      customThemeColors.background
    ) {
      return customThemeColors;
    }

    // Check if theme exists in default themes
    if (DEFAULT_THEME_COLORS[theme as keyof typeof DEFAULT_THEME_COLORS]) {
      return DEFAULT_THEME_COLORS[theme as keyof typeof DEFAULT_THEME_COLORS];
    }

    // Fallback to default theme
    return DEFAULT_THEME_COLORS.default;
  } catch (error) {
    console.error('[MobileGridFallback] Error getting theme colors:', error);
    // Always return a valid object with the required properties
    return DEFAULT_THEME_COLORS.default;
  }
};

const MobileGridFallback: React.FC<MobileGridFallbackProps> = ({
  pattern = 'grid',
  theme = 'default',
  cellSize = 5,
  interactionRadius = 100,
  autoWave = false,
  multipleWaves = false,
  fullScreen = false,
  height = 0,
  lightingMode = 'gradient',
  animationSpeed = 1.0,
  isDrawMode = false,
  drawnCells = [],
  onCellDraw = () => {},
  lightingShape = 'circular',
  colorMode = 'single',
  colorPalette = [
    '#ff0000',
    '#00ff00',
    '#0000ff',
    '#ffff00',
    '#ff00ff',
    '#00ffff',
  ],
  enableSound = false,
  enableHaptics = false,
  enableParticles = false,
  customThemeColors = {},
}) => {
  console.log('[MobileGridFallback] Rendering with props:', {
    pattern,
    theme,
    cellSize,
    interactionRadius,
    autoWave,
    multipleWaves,
    fullScreen,
    lightingMode,
    animationSpeed,
    isDrawMode,
    lightingShape,
    colorMode,
  });

  // Get theme colors safely
  const themeColors = safeGetThemeColors(theme, customThemeColors);

  const windowDimensions = Dimensions.get('window');
  const containerWidth = windowDimensions.width;
  const containerHeight = fullScreen
    ? windowDimensions.height
    : height || windowDimensions.height * 0.6;

  // Store window dimensions as shared values to pass to worklets
  const screenWidth = useSharedValue(containerWidth);
  const screenHeight = useSharedValue(containerHeight);

  // Track touch position
  const touchX = useSharedValue(-100);
  const touchY = useSharedValue(-100);
  const timeValue = useSharedValue(0);

  // Flag to indicate if touch is active
  const isTouchActive = useSharedValue(false);

  // Create wave sources for multiple waves mode
  const [waveSources, setWaveSources] = useState<
    Array<{
      x: number;
      y: number;
      speed: number;
      id: number;
      radius: number;
      active: boolean;
    }>
  >([]);

  // Add state for tracking drawn cells coordinates on grid
  const [gridCoordinates, setGridCoordinates] = useState<
    Array<{ col: number; row: number }>
  >([]);

  // State for particles
  const [particles, setParticles] = useState<
    Array<{
      id: number;
      x: number;
      y: number;
      size: number;
      color: string;
      opacity: number;
      vx: number;
      vy: number;
    }>
  >([]);

  // Add a mounted ref to track component lifecycle
  const isMountedRef = useRef<boolean>(true);
  const animationFrameRef = useRef<number | null>(null);
  const lastRenderTimeRef = useRef<number>(0);
  const frameRateLimiterRef = useRef<number>(0);

  // Calculate grid dimensions based on pattern - memoize to avoid recalculation
  const gridDimensions = React.useMemo(() => {
    const actualCellSize = cellSize * 2; // Make cells bigger for visibility
    let cols, rows, spacingX, spacingY, skipFactor;

    switch (pattern) {
      case 'grid':
        cols = Math.floor(containerWidth / (actualCellSize * 1.2));
        rows = Math.floor(containerHeight / (actualCellSize * 1.2));
        break;
      case 'lines':
        cols = Math.floor(containerWidth / (actualCellSize * 1.2));
        rows = Math.floor(containerHeight / (actualCellSize * 2.5));
        break;
      case 'waves':
        cols = Math.floor(containerWidth / (actualCellSize * 1.5));
        rows = Math.floor(containerHeight / (actualCellSize * 1.5));
        break;
      case 'particles':
        cols = Math.floor(containerWidth / (actualCellSize * 1.8));
        rows = Math.floor(containerHeight / (actualCellSize * 1.8));
        break;
      case 'dots':
      default:
        cols = Math.floor(containerWidth / (actualCellSize * 1.5));
        rows = Math.floor(containerHeight / (actualCellSize * 1.5));
        break;
    }

    spacingX = containerWidth / cols;
    spacingY = containerHeight / rows;

    // Limit the number of cells to avoid performance issues
    const maxCells = 500;
    const totalCells = cols * rows;
    skipFactor = totalCells > maxCells ? Math.ceil(totalCells / maxCells) : 1;

    console.log('[MobileGridFallback] Grid dimensions:', {
      cols,
      rows,
      totalCells,
      skipFactor,
    });

    return { cols, rows, spacingX, spacingY, skipFactor, actualCellSize };
  }, [pattern, cellSize, containerWidth, containerHeight]);

  // Initialize component
  useEffect(() => {
    // Set mounted flag
    isMountedRef.current = true;

    // Return cleanup function
    return () => {
      // Set unmounted flag
      isMountedRef.current = false;

      // Cancel any pending animation frames
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      // Clear wave sources
      setWaveSources([]);
    };
  }, []);

  // Initialize wave sources
  useEffect(() => {
    if (multipleWaves) {
      console.log('[MobileGridFallback] Initializing wave sources');
      // Limit the number of wave sources based on device performance
      const numWaves = Math.min(4 + Math.floor(Math.random() * 3), 6); // 4-6 waves, max 6
      const newSources = [];

      for (let i = 0; i < numWaves; i++) {
        newSources.push({
          x: Math.random() * containerWidth,
          y: Math.random() * containerHeight,
          speed: 0.5 + Math.random() * 1.0, // Reduced speed range for better performance
          id: i,
          radius: 40 + Math.random() * 60, // Reduced radius variation
          active: true, // Active by default
        });
      }

      setWaveSources(newSources);
    }
  }, [multipleWaves, containerWidth, containerHeight]);

  // Convert drawn cells to grid coordinates on props change
  useEffect(() => {
    if (drawnCells && drawnCells.length > 0) {
      const newGridCoords = drawnCells.map((cell) => {
        // Convert absolute coordinates to grid coordinates
        const col = Math.floor(cell.x / (cellSize * 2 * 1.5));
        const row = Math.floor(cell.y / (cellSize * 2 * 1.5));
        return { col, row };
      });
      setGridCoordinates(newGridCoords);
    }
  }, [drawnCells, cellSize]);

  // Update wave sources with improved behavior and performance optimizations
  useEffect(() => {
    if (!multipleWaves || waveSources.length === 0) return;

    console.log(
      '[MobileGridFallback] Starting wave source animation with',
      waveSources.length,
      'sources'
    );

    let frameId: number;
    let lastTimestamp = 0;

    const animateWaves = (timestamp: number) => {
      if (!isMountedRef.current) return;

      // Throttle animation to improve performance (limit to ~30fps)
      if (timestamp - lastRenderTimeRef.current < 33) {
        frameId = requestAnimationFrame(animateWaves);
        return;
      }

      lastRenderTimeRef.current = timestamp;

      // Calculate delta time to make animation frame-rate independent
      const deltaTime = lastTimestamp ? (timestamp - lastTimestamp) / 16.67 : 1; // normalized to ~60fps
      lastTimestamp = timestamp;

      setWaveSources((prev) =>
        prev.map((wave) => {
          // Direction vector with some randomness but reduced complexity
          const dirX =
            Math.cos(timestamp * 0.0005 * wave.speed + wave.id) *
            wave.speed *
            deltaTime;
          const dirY =
            Math.sin(timestamp * 0.0005 * wave.speed + wave.id + 1.5) *
            wave.speed *
            deltaTime;

          // Update positions with smooth movement
          let newX = wave.x + dirX * 2;
          let newY = wave.y + dirY * 2;

          // Bounce off edges with some margin
          const margin = wave.radius;
          if (newX < margin || newX > containerWidth - margin) {
            newX = Math.max(margin, Math.min(newX, containerWidth - margin));
          }

          if (newY < margin || newY > containerHeight - margin) {
            newY = Math.max(margin, Math.min(newY, containerHeight - margin));
          }

          // Toggle active state occasionally for visual interest
          // Reduced probability to improve performance
          const shouldToggle = Math.random() < 0.005; // 0.5% chance per frame to toggle

          return {
            ...wave,
            x: newX,
            y: newY,
            active: shouldToggle ? !wave.active : wave.active,
          };
        })
      );

      frameId = requestAnimationFrame(animateWaves);
    };

    frameId = requestAnimationFrame(animateWaves);

    // Cleanup function
    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [multipleWaves, waveSources.length, containerWidth, containerHeight]);

  // Update wave animation to respect animation speed with performance optimizations
  useEffect(() => {
    if (autoWave) {
      console.log(
        '[MobileGridFallback] Starting auto wave animation with speed:',
        animationSpeed
      );
      // Use RAF for smoother animation
      let animationFrame: number;
      let lastTime = 0;

      const updateAnimation = (time: number) => {
        if (!isMountedRef.current) return;

        // Throttle animation to improve performance (limit to ~30fps)
        if (time - lastRenderTimeRef.current < 33) {
          animationFrame = requestAnimationFrame(updateAnimation);
          return;
        }

        lastRenderTimeRef.current = time;

        try {
          if (lastTime === 0) {
            lastTime = time;
          }

          const deltaTime = time - lastTime;
          lastTime = time;

          // Apply animationSpeed to the time increment
          // Reduce the multiplier for better performance
          timeValue.value += deltaTime * 0.0003 * animationSpeed;

          animationFrame = requestAnimationFrame(updateAnimation);
        } catch (error) {
          console.error('[MobileGridFallback] Animation frame error:', error);
          // Try to recover by resetting and continuing
          lastTime = 0;
          animationFrame = requestAnimationFrame(updateAnimation);
        }
      };

      animationFrame = requestAnimationFrame(updateAnimation);

      // Use the ref for animation frame
      animationFrameRef.current = animationFrame;

      return () => {
        console.log('[MobileGridFallback] Stopping auto wave animation');
        if (animationFrame) {
          cancelAnimationFrame(animationFrame);
        }
      };
    }
  }, [autoWave, timeValue, animationSpeed]);

  // Add performance optimization hooks - directly in component body
  const isHighPerformanceMode = useRef<boolean>(false);

  // Create a derived value for touch active state
  const derivedIsTouchActive = useSharedValue(false);

  // Update derived touch active state
  useEffect(() => {
    const updateInterval = setInterval(() => {
      derivedIsTouchActive.value = isTouchActive.value;
    }, 16); // ~60fps

    return () => clearInterval(updateInterval);
  }, [isTouchActive]);

  // Set up performance monitoring with derived values
  useEffect(() => {
    // Set up an interval to check performance
    const intervalId = setInterval(() => {
      // If we have a lot of particles or active touches, optimize
      if (particles.length > 15 || derivedIsTouchActive.value) {
        isHighPerformanceMode.current = true;
      } else {
        isHighPerformanceMode.current = false;
      }
    }, 1000);

    // Cleanup function
    return () => {
      clearInterval(intervalId);
    };
  }, [particles.length, derivedIsTouchActive]); // Use derived value

  // Create a derived value for touch position to avoid direct .value access in render
  const touchPosition = useSharedValue({ x: -100, y: -100 });

  // Update derived value whenever touchX or touchY changes
  useEffect(() => {
    const updateTouchPosition = () => {
      touchPosition.value = { x: touchX.value, y: touchY.value };
    };

    // Initial update
    updateTouchPosition();

    // Set up an interval to update the derived value
    const intervalId = setInterval(updateTouchPosition, 16); // ~60fps

    return () => clearInterval(intervalId);
  }, [touchX, touchY, touchPosition]);

  // Function to check if a cell needs to be updated - avoid direct .value access
  const checkUpdateNeeded = (cellProps: any) => {
    // Get the current touch position from our derived value
    const currentTouchX = touchPosition.value.x;
    const currentTouchY = touchPosition.value.y;

    // Always update cells near the touch point
    const dx = cellProps.x - currentTouchX;
    const dy = cellProps.y - currentTouchY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // If the cell is close to the touch point, always update it
    if (distance < interactionRadius * 1.5) {
      return true;
    }

    // For drawn cells, always update
    if (cellProps.isDrawnCell) {
      return true;
    }

    // For waves pattern or autoWave, always update
    if (pattern === 'waves' || autoWave) {
      return true;
    }

    // If we're not in high performance mode, update all cells
    if (!isHighPerformanceMode.current) {
      return true;
    }

    // In high performance mode, only update a subset of cells
    // Use a simple pattern to create a checkerboard effect for updates
    const cellX = Math.floor(cellProps.x / cellProps.size);
    const cellY = Math.floor(cellProps.y / cellProps.size);
    return (cellX + cellY) % 3 === 0; // Update every third cell in a pattern
  };

  // Create grid cells with memoization and cell recycling for better performance
  const gridCells = React.useMemo(() => {
    console.log('[MobileGridFallback] Rendering grid with pattern:', pattern);
    const cells = [];

    const { cols, rows, spacingX, spacingY, skipFactor, actualCellSize } =
      gridDimensions;

    // Create cells
    for (let row = 0; row < rows; row += skipFactor) {
      for (let col = 0; col < cols; col += skipFactor) {
        let x = col * spacingX;
        let y = row * spacingY;

        // Check if this cell is in the drawn cells list
        const isDrawnCell = gridCoordinates.some(
          (coord) => coord.col === col && coord.row === row
        );

        // Use absolute positioning for cells
        cells.push(
          <AnimatedCell
            key={`cell-${row}-${col}`}
            x={x}
            y={y}
            size={actualCellSize}
            touchX={touchX}
            touchY={touchY}
            interactionRadius={interactionRadius}
            baseColor={themeColors.base}
            hoverColor={themeColors.hover}
            pattern={pattern}
            waveSources={waveSources}
            multipleWaves={multipleWaves}
            timeValue={timeValue}
            autoWave={autoWave}
            screenWidth={screenWidth}
            screenHeight={screenHeight}
            lightingMode={lightingMode}
            isTouchActive={isTouchActive}
            animationSpeed={animationSpeed}
            isDrawnCell={isDrawnCell}
            lightingShape={lightingShape}
            colorMode={colorMode}
            colorPalette={colorPalette}
            shouldUpdate={true} // Initially set all to update
          />
        );
      }
    }

    return cells;
  }, [
    pattern,
    gridDimensions,
    gridCoordinates,
    theme,
    touchX,
    touchY,
    interactionRadius,
    waveSources,
    multipleWaves,
    timeValue,
    autoWave,
    screenWidth,
    screenHeight,
    lightingMode,
    isTouchActive,
    animationSpeed,
    lightingShape,
    colorMode,
    colorPalette,
    customThemeColors,
    themeColors,
  ]);

  // Apply cell recycling optimization
  const memoizedCells = React.useMemo(() => {
    return gridCells.map((cell: React.ReactElement) =>
      React.cloneElement(cell, {
        key: `${cell.props.x}-${cell.props.y}`,
        shouldUpdate: checkUpdateNeeded(cell.props),
      })
    );
  }, [gridCells, touchX.value, touchY.value, pattern, autoWave]);

  // Add functions for sound, haptics, and particles
  const playSound = async () => {
    if (!enableSound || !Audio) return;

    try {
      const { Sound } = Audio;
      const sound = new Sound();
      await sound.loadAsync(require('../assets/tap-sound.mp3'));
      await sound.playAsync();

      // Unload sound when finished
      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.error('[MobileGridFallback] Error playing sound:', error);
    }
  };

  const triggerHaptics = () => {
    if (!enableHaptics || !Haptics) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('[MobileGridFallback] Error triggering haptics:', error);
    }
  };

  const createParticles = (x: number, y: number, intensity: number = 1) => {
    if (!enableParticles) return;

    // Create fewer particles on mobile for better performance
    const particleCount = Math.floor(3 + intensity * 2);
    const newParticles: Array<{
      id: number;
      x: number;
      y: number;
      size: number;
      color: string;
      opacity: number;
      vx: number;
      vy: number;
    }> = [];

    for (let i = 0; i < particleCount; i++) {
      // Random angle and speed
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 2;

      newParticles.push({
        id: Math.random(),
        x: x,
        y: y,
        size: 2 + Math.random() * 3,
        color: colorPalette[Math.floor(Math.random() * colorPalette.length)],
        opacity: 0.7 + Math.random() * 0.3,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
      });
    }

    setParticles((prev) => [...prev, ...newParticles].slice(-30)); // Limit total particles
  };

  // Update particles
  useEffect(() => {
    if (particles.length === 0) return;

    const interval = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            opacity: p.opacity - 0.05,
          }))
          .filter((p) => p.opacity > 0)
      );
    }, 33); // ~30fps

    return () => clearInterval(interval);
  }, [particles.length]);

  // Enhanced pan and tap gestures to handle drawing mode
  const panGesture = Gesture.Pan()
    .onBegin((e) => {
      try {
        console.log('[MobileGridFallback] Touch began at:', e.x, e.y);
        touchX.value = e.x;
        touchY.value = e.y;
        isTouchActive.value = true;

        // Handle cell drawing if in draw mode
        if (isDrawMode && onCellDraw) {
          runOnJS(onCellDraw)(e.x, e.y);
        }

        // Add sound, haptics, and particles
        if (enableSound) runOnJS(playSound)();
        if (enableHaptics) runOnJS(triggerHaptics)();
        if (enableParticles) runOnJS(createParticles)(e.x, e.y, 1.0);
      } catch (error) {
        console.error('[MobileGridFallback] Gesture begin error:', error);
      }
    })
    .onUpdate((e) => {
      try {
        // Throttle logs to avoid flooding
        if (Math.random() < 0.01) {
          // Only log ~1% of updates for better performance
          console.log('[MobileGridFallback] Touch moved to:', e.x, e.y);
        }

        // Throttle updates for better performance
        frameRateLimiterRef.current++;
        if (frameRateLimiterRef.current % 2 === 0) {
          // Only update every other frame
          touchX.value = e.x;
          touchY.value = e.y;
          isTouchActive.value = true;

          // Handle continuous drawing in draw mode
          if (isDrawMode && onCellDraw) {
            runOnJS(onCellDraw)(e.x, e.y);
          }

          // Occasionally trigger effects during movement
          if (Math.random() < 0.1) {
            // 10% chance per frame
            if (enableParticles) runOnJS(createParticles)(e.x, e.y, 0.5);
            if (enableHaptics && Math.random() < 0.3) runOnJS(triggerHaptics)();
          }
        }
      } catch (error) {
        console.error('[MobileGridFallback] Gesture update error:', error);
      }
    })
    .onEnd(() => {
      try {
        console.log('[MobileGridFallback] Touch ended');
        // For simple and highlight modes, keep touch active longer
        // This helps with visual feedback
        const delayTime =
          lightingMode === 'simple' || lightingMode === 'highlight'
            ? 800 // Longer delay for simple/highlight modes
            : 500; // Standard delay for other modes

        // Reset after delay using runOnJS for safety
        runOnJS(setTimeout)(() => {
          touchX.value = -100;
          touchY.value = -100;
          isTouchActive.value = false;
        }, delayTime);
      } catch (error) {
        console.error('[MobileGridFallback] Gesture end error:', error);
      }
    });

  // Add a tap gesture to improve responsiveness
  const tapGesture = Gesture.Tap()
    .onBegin((e) => {
      try {
        console.log('[MobileGridFallback] Tap began at:', e.x, e.y);
        touchX.value = e.x;
        touchY.value = e.y;
        isTouchActive.value = true;

        // Immediately handle cell drawing for draw mode
        if (isDrawMode && onCellDraw) {
          runOnJS(onCellDraw)(e.x, e.y);
        }

        // Add sound, haptics, and particles
        if (enableSound) runOnJS(playSound)();
        if (enableHaptics) runOnJS(triggerHaptics)();
        if (enableParticles) runOnJS(createParticles)(e.x, e.y, 1.0);
      } catch (error) {
        console.error('[MobileGridFallback] Tap begin error:', error);
      }
    })
    .onEnd(() => {
      try {
        console.log('[MobileGridFallback] Tap ended');
        // For simple and highlight modes, keep touch active longer
        // This helps with visual feedback
        const delayTime =
          lightingMode === 'simple' || lightingMode === 'highlight'
            ? 800 // Longer delay for simple/highlight modes
            : 500; // Standard delay for other modes

        // Reset after delay using runOnJS for safety
        runOnJS(setTimeout)(() => {
          touchX.value = -100;
          touchY.value = -100;
          isTouchActive.value = false;
        }, delayTime);
      } catch (error) {
        console.error('[MobileGridFallback] Tap end error:', error);
      }
    });

  // Combine gestures for better response
  const combinedGesture = Gesture.Exclusive(tapGesture, panGesture);

  return (
    <GestureHandlerRootView
      style={[
        styles.gestureContainer,
        fullScreen && styles.fullScreenContainer,
      ]}
    >
      <GestureDetector gesture={combinedGesture}>
        <View
          style={[
            styles.container,
            {
              width: containerWidth,
              height: containerHeight,
              backgroundColor: themeColors.background,
            },
            fullScreen && styles.fullScreenContainer,
          ]}
        >
          {memoizedCells}

          {/* Render particles */}
          {enableParticles &&
            particles.map((particle) => (
              <Animated.View
                key={`particle-${particle.id}`}
                style={{
                  position: 'absolute',
                  left: particle.x,
                  top: particle.y,
                  width: particle.size,
                  height: particle.size,
                  borderRadius: particle.size / 2,
                  backgroundColor: particle.color,
                  opacity: particle.opacity,
                }}
              />
            ))}
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

// Animated cell component
interface AnimatedCellProps {
  x: number;
  y: number;
  size: number;
  touchX: Animated.SharedValue<number>;
  touchY: Animated.SharedValue<number>;
  interactionRadius: number;
  baseColor: string;
  hoverColor: string;
  pattern: string;
  waveSources: Array<{
    x: number;
    y: number;
    speed: number;
    id: number;
    radius: number;
    active: boolean;
  }>;
  multipleWaves: boolean;
  timeValue: Animated.SharedValue<number>;
  autoWave: boolean;
  screenWidth: Animated.SharedValue<number>;
  screenHeight: Animated.SharedValue<number>;
  lightingMode:
    | 'gradient'
    | 'simple'
    | 'pulse'
    | 'solid'
    | 'highlight'
    | 'uniform';
  isTouchActive: Animated.SharedValue<boolean>;
  animationSpeed?: number;
  isDrawnCell?: boolean;
  lightingShape?: 'circular' | 'linear' | 'radial' | 'random';
  colorMode?: 'single' | 'gradient' | 'random';
  colorPalette?: string[];
  shouldUpdate?: boolean; // Add new prop for performance optimization
}

const AnimatedCell = memo(
  ({
    x,
    y,
    size,
    touchX,
    touchY,
    interactionRadius,
    baseColor,
    hoverColor,
    pattern,
    waveSources,
    multipleWaves,
    timeValue,
    autoWave,
    screenWidth,
    screenHeight,
    lightingMode,
    isTouchActive,
    animationSpeed = 1.0,
    isDrawnCell = false,
    lightingShape = 'circular',
    colorMode = 'single',
    colorPalette = [],
    shouldUpdate = true, // Default to true for backward compatibility
  }: AnimatedCellProps) => {
    const intensity = useSharedValue(0);
    const position = useSharedValue({ x: 0, y: 0 });

    // Store grid position as refs to avoid recalculation
    const gridX = useRef(Math.floor(x / size)).current;
    const gridY = useRef(Math.floor(y / size)).current;

    // Create derived values to avoid accessing .value during render
    const derivedTouchX = useSharedValue(touchX.value);
    const derivedTouchY = useSharedValue(touchY.value);
    const derivedTimeValue = useSharedValue(timeValue.value);
    const derivedIsTouchActive = useSharedValue(isTouchActive.value);

    // Update derived values when originals change
    useEffect(() => {
      const updateInterval = setInterval(() => {
        derivedTouchX.value = touchX.value;
        derivedTouchY.value = touchY.value;
        derivedTimeValue.value = timeValue.value;
        derivedIsTouchActive.value = isTouchActive.value;
      }, 16); // ~60fps

      return () => clearInterval(updateInterval);
    }, [touchX, touchY, timeValue, isTouchActive]);

    // Enhanced pulse effect for better parity with web version
    React.useEffect(() => {
      if (lightingMode === 'pulse') {
        // Create a more pronounced pulse effect that matches the web version
        intensity.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 1500 / animationSpeed }),
            withTiming(0.2, { duration: 1500 / animationSpeed })
          ),
          -1, // Infinite repetition
          true // Reverse each sequence
        );
      }
    }, [lightingMode, animationSpeed]);

    // Set up animated style for cell
    const animatedStyle = useAnimatedStyle(() => {
      // Based on lighting mode, determine how intensity affects the cell
      let touchIntensity = 0;

      // Apply different lighting shapes
      if (lightingShape === 'circular') {
        // Calculate distance from touch point to cell center
        const dx = x - derivedTouchX.value;
        const dy = y - derivedTouchY.value;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Set intensity based on distance and lightingMode
        if (distance < interactionRadius) {
          touchIntensity = 1 - distance / interactionRadius;
        }
      } else if (lightingShape === 'linear') {
        // Linear gradient from left to right
        touchIntensity = x / screenWidth.value;

        // Boost intensity near touch point
        const dx = x - derivedTouchX.value;
        const dy = y - derivedTouchY.value;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < interactionRadius / 2) {
          touchIntensity = Math.max(
            touchIntensity,
            0.5 + (1 - distance / (interactionRadius / 2)) * 0.5
          );
        }
      } else if (lightingShape === 'radial') {
        // Radial gradient from center
        const centerX = screenWidth.value / 2;
        const centerY = screenHeight.value / 2;

        const dx = x - centerX;
        const dy = y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = Math.sqrt(
          Math.pow(screenWidth.value / 2, 2) +
            Math.pow(screenHeight.value / 2, 2)
        );

        touchIntensity = 1 - Math.min(1, distance / maxDistance);

        // Boost intensity near touch point
        const touchDx = x - derivedTouchX.value;
        const touchDy = y - derivedTouchY.value;
        const touchDistance = Math.sqrt(touchDx * touchDx + touchDy * touchDy);
        if (touchDistance < interactionRadius / 2) {
          touchIntensity = Math.max(
            touchIntensity,
            1 - touchDistance / (interactionRadius / 2)
          );
        }
      } else if (lightingShape === 'random') {
        // Random intensity for each cell, with a seed based on position and time
        const seed =
          gridX * 100 + gridY + Math.floor(derivedTimeValue.value * 5);
        touchIntensity = (Math.sin(seed) + 1) / 2; // Value between 0 and 1

        // Boost intensity near touch point
        const dx = x - derivedTouchX.value;
        const dy = y - derivedTouchY.value;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < interactionRadius) {
          touchIntensity = Math.max(
            touchIntensity,
            1 - distance / interactionRadius
          );
        }
      }

      // For simple mode - immediate on/off with no threshold
      // For uniform mode - all cells fully lit
      // For highlight mode - immediate on/off with no threshold
      if (
        lightingMode === 'simple' ||
        lightingMode === 'highlight' ||
        lightingMode === 'uniform' ||
        isDrawnCell
      ) {
        touchIntensity = touchIntensity > 0 ? 1.0 : 0;
      }

      // Handle uniform lighting mode - set all pixels to full brightness
      if (lightingMode === 'uniform') {
        touchIntensity = 1.0;
      }

      // Add pulse effect for pulse mode - now handled by the useEffect above
      // This is kept for backward compatibility
      if (lightingMode === 'pulse' && !intensity.value) {
        touchIntensity *=
          0.5 + 0.5 * Math.sin(derivedTimeValue.value * 3 * animationSpeed);
      }

      // Enhanced wave effect for 'waves' pattern
      if (pattern === 'waves') {
        // Create a more pronounced wave effect for the 'waves' pattern
        const waveTime = derivedTimeValue.value * animationSpeed;
        const waveIntensity =
          0.5 +
          0.5 *
            Math.sin(waveTime * 1.2 + gridX * 0.3) *
            Math.sin(waveTime * 0.8 + gridY * 0.2);

        // For waves pattern, make the wave effect stronger
        touchIntensity = Math.max(touchIntensity, waveIntensity);

        // Calculate wave offset for position - enhanced to match web version
        position.value = {
          x: Math.sin(waveTime * 0.5 + gridY * 0.2) * size * 0.15,
          y: Math.sin(waveTime * 0.7 + gridX * 0.3) * size * 0.15,
        };
      } else {
        position.value = { x: 0, y: 0 };
      }

      // Add auto wave effect if enabled
      if (autoWave) {
        // Create auto wave with scaled down intensity (20% of original)
        const autoWaveFactor = 0.2;
        const waveIntensity =
          autoWaveFactor *
          0.35 *
          (Math.sin(
            derivedTimeValue.value * 2 * animationSpeed +
              (gridX * 0.2 + gridY * 0.3)
          ) +
            1) *
          0.5;
        touchIntensity = Math.max(touchIntensity, waveIntensity);
      }

      // Calculate target intensity based on all factors
      // Skip this for pulse mode since we're handling it in useEffect
      if (lightingMode !== 'pulse' || !intensity.value) {
        intensity.value = withTiming(touchIntensity, {
          duration: 300,
          easing: Easing.out(Easing.quad),
        });
      }

      // Determine cell color based on color mode
      let r, g, b, a;

      if (colorMode === 'single') {
        // Use theme colors
        const parsedBaseColor = parseColor(baseColor);
        const parsedHoverColor = parseColor(hoverColor);

        // Interpolate between base and hover colors
        r = Math.round(
          interpolate(
            intensity.value,
            [0, 1],
            [parsedBaseColor.r, parsedHoverColor.r]
          )
        );
        g = Math.round(
          interpolate(
            intensity.value,
            [0, 1],
            [parsedBaseColor.g, parsedHoverColor.g]
          )
        );
        b = Math.round(
          interpolate(
            intensity.value,
            [0, 1],
            [parsedBaseColor.b, parsedHoverColor.b]
          )
        );
        a = interpolate(
          intensity.value,
          [0, 1],
          [parsedBaseColor.a, parsedHoverColor.a]
        );
      } else if (colorMode === 'gradient') {
        // Create a gradient effect across the grid
        // Position in grid normalized from 0 to 1
        const gradientPosition =
          (x / screenWidth.value + y / screenHeight.value) / 2;

        // Gradient color stops
        const gradientStops = [
          { pos: 0, r: 30, g: 60, b: 255 }, // Blue
          { pos: 0.33, r: 120, g: 70, b: 255 }, // Purple
          { pos: 0.66, r: 255, g: 50, b: 120 }, // Pink
          { pos: 1, r: 255, g: 100, b: 50 }, // Orange
        ];

        // Find the two color stops we're between
        let start = gradientStops[0];
        let end = gradientStops[gradientStops.length - 1];

        for (let i = 0; i < gradientStops.length - 1; i++) {
          if (
            gradientPosition >= gradientStops[i].pos &&
            gradientPosition <= gradientStops[i + 1].pos
          ) {
            start = gradientStops[i];
            end = gradientStops[i + 1];
            break;
          }
        }

        // Calculate normalized position between the two stops
        const normPos = (gradientPosition - start.pos) / (end.pos - start.pos);

        // Interpolate colors
        r = Math.round(start.r + (end.r - start.r) * normPos);
        g = Math.round(start.g + (end.g - start.g) * normPos);
        b = Math.round(start.b + (end.b - start.b) * normPos);

        // Apply intensity
        r = Math.round(r * intensity.value);
        g = Math.round(g * intensity.value);
        b = Math.round(b * intensity.value);
        a = intensity.value;
      } else if (colorMode === 'random') {
        // Use a palette of colors
        const palette =
          colorPalette.length > 0
            ? colorPalette
            : [
                '#ff0000',
                '#00ff00',
                '#0000ff',
                '#ffff00',
                '#ff00ff',
                '#00ffff',
              ];

        // Choose a color based on cell position (semi-random but consistent)
        const colorIndex = (gridX * 3 + gridY * 7) % palette.length;
        const parsedColor = parseHex(palette[colorIndex]);

        // Apply intensity to make it glow
        r = Math.round(parsedColor.r * intensity.value);
        g = Math.round(parsedColor.g * intensity.value);
        b = Math.round(parsedColor.b * intensity.value);
        a = intensity.value;
      }

      // Return the style with the calculated values
      return {
        opacity: a,
        backgroundColor: `rgb(${r}, ${g}, ${b})`,
        transform: [
          { translateX: position.value.x },
          { translateY: position.value.y },
          { scale: 1.0 + intensity.value * 0.1 }, // Slight scale effect based on intensity
        ],
      };
    });

    // Determine shape based on pattern
    let cellStyle;
    switch (pattern) {
      case 'grid':
        cellStyle = styles.squareCell;
        break;
      case 'lines':
        cellStyle = styles.lineCell;
        break;
      case 'particles':
      case 'waves':
      case 'dots':
      default:
        cellStyle = styles.circleCell;
        break;
    }

    return (
      <Animated.View
        style={[
          styles.cellContainer,
          cellStyle,
          {
            left: x,
            top: y,
            width: size,
            height: size,
          },
          animatedStyle,
        ]}
      />
    );
  },
  (prevProps, nextProps) => {
    // Optimize re-renders with custom comparison
    if (prevProps.isDrawnCell !== nextProps.isDrawnCell) return false;
    if (prevProps.color !== nextProps.color) return false;
    if (prevProps.isHighPerformanceMode !== nextProps.isHighPerformanceMode)
      return false;

    // In high-performance mode, we can skip some updates
    if (nextProps.isHighPerformanceMode) {
      // Only update cells that are drawn or part of patterns
      if (
        nextProps.isDrawnCell ||
        (nextProps.pattern && nextProps.pattern === 'waves') ||
        nextProps.autoWave
      ) {
        return false; // Don't skip update
      }

      // Skip update for cells far from touch point
      const dx = nextProps.x - nextProps.touchX.value;
      const dy = nextProps.y - nextProps.touchY.value;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Only update cells close to touch point
      return distance > 150;
    }

    return false; // Always update in normal mode
  }
);

// Helper function to parse hex colors
const parseHex = (hex: string) => {
  'worklet';
  try {
    // Handle both #RGB and #RRGGBB formats
    let r = 0,
      g = 0,
      b = 0;

    // Validate hex string
    if (!hex || typeof hex !== 'string') {
      return { r: 0, g: 0, b: 0 };
    }

    // Remove # if present
    const cleanHex = hex.startsWith('#') ? hex.slice(1) : hex;

    if (cleanHex.length === 3) {
      // #RGB
      r = parseInt(cleanHex.charAt(0) + cleanHex.charAt(0), 16);
      g = parseInt(cleanHex.charAt(1) + cleanHex.charAt(1), 16);
      b = parseInt(cleanHex.charAt(2) + cleanHex.charAt(2), 16);
    } else if (cleanHex.length === 6) {
      // #RRGGBB
      r = parseInt(cleanHex.slice(0, 2), 16);
      g = parseInt(cleanHex.slice(2, 4), 16);
      b = parseInt(cleanHex.slice(4, 6), 16);
    }

    // Handle NaN values
    r = isNaN(r) ? 0 : r;
    g = isNaN(g) ? 0 : g;
    b = isNaN(b) ? 0 : b;

    return { r, g, b };
  } catch (error) {
    console.error('[MobileGridFallback] Error parsing hex color:', error);
    return { r: 0, g: 0, b: 0 };
  }
};

// Helper function to parse color strings
const parseColor = (
  color: string
): { r: number; g: number; b: number; a: number } => {
  'worklet';
  try {
    if (!color || typeof color !== 'string') {
      return { r: 0, g: 0, b: 0, a: 0 };
    }

    // Handle rgba/rgb format
    if (color.startsWith('rgba') || color.startsWith('rgb')) {
      const match = color.match(
        /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/
      );
      if (match) {
        const r = parseInt(match[1]);
        const g = parseInt(match[2]);
        const b = parseInt(match[3]);
        const a = match[4] ? parseFloat(match[4]) : 1;

        // Handle NaN values
        return {
          r: isNaN(r) ? 0 : r,
          g: isNaN(g) ? 0 : g,
          b: isNaN(b) ? 0 : b,
          a: isNaN(a) ? 1 : a,
        };
      }
    }

    // Handle hex format
    if (color.startsWith('#')) {
      const hex = parseHex(color);
      return { ...hex, a: 1 };
    }

    // Default fallback
    return { r: 0, g: 0, b: 0, a: 1 };
  } catch (error) {
    console.error('[MobileGridFallback] Error parsing color:', error);
    return { r: 0, g: 0, b: 0, a: 1 };
  }
};

const styles = StyleSheet.create({
  gestureContainer: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
  },
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#0a0a1e',
    overflow: 'hidden',
    position: 'relative',
  },
  fullScreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
    zIndex: 10,
  },
  cellContainer: {
    position: 'absolute',
    zIndex: 1,
  },
  squareCell: {
    position: 'absolute',
  },
  lineCell: {
    position: 'absolute',
    height: 2,
  },
  circleCell: {
    position: 'absolute',
    borderRadius: 100,
  },
});

export default MobileGridFallback;
