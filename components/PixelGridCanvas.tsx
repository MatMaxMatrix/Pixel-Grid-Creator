import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, Platform, Text } from 'react-native';
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import {
  useSharedValue,
  withTiming,
  withRepeat,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import { useGridStore } from '../stores/gridStore';
import MobileGridFallback from './MobileGridFallback';

// Only import Skia on native platforms
const isWeb = Platform.OS === 'web';

// Log our platform detection
console.log('[PixelGridCanvas] Platform detection:', {
  platform: Platform.OS,
  isWeb,
});

// Setup for Canvas component
let Canvas: any, useFrame: any, useCanvasRef: any;

if (!isWeb) {
  try {
    // Import Skia only for native platforms
    console.log(
      '[PixelGridCanvas] Attempting to import Skia for native platform'
    );

    // Try to explicitly import the package
    const SkiaImports = require('@shopify/react-native-skia');

    // Log what we actually got from the import
    console.log(
      '[PixelGridCanvas] Skia import result:',
      Object.keys(SkiaImports).length
        ? 'Found ' + Object.keys(SkiaImports).length + ' exports'
        : 'Empty module'
    );

    Canvas = SkiaImports.Canvas;
    useFrame = SkiaImports.useFrame;
    useCanvasRef = SkiaImports.useCanvasRef;

    // Verify the imported components
    console.log('[PixelGridCanvas] Canvas available:', !!Canvas);
    console.log('[PixelGridCanvas] useFrame available:', !!useFrame);
    console.log('[PixelGridCanvas] useCanvasRef available:', !!useCanvasRef);
  } catch (error) {
    console.error('[PixelGridCanvas] Error importing Skia:', error);
    console.log('[PixelGridCanvas] Using mobile fallback implementation');

    // Always use the fallback for mobile to ensure consistent behavior
    Canvas = null;
    useFrame = null;
    useCanvasRef = null;
  }
} else {
  // Dummy implementation for web
  console.log('[PixelGridCanvas] Using web Canvas implementation');
  Canvas = ({ style, children, onDraw }: any) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const isMountedRef = useRef<boolean>(true);

    useEffect(() => {
      console.log('[PixelGridCanvas] Web Canvas effect running');
      const canvas = canvasRef.current;
      if (canvas && onDraw) {
        // Set canvas dimensions
        const { width, height } = canvas.getBoundingClientRect();
        console.log('[PixelGridCanvas] Web Canvas dimensions:', {
          width,
          height,
        });
        canvas.width = width;
        canvas.height = height;

        // Call onDraw with canvas and info
        onDraw(canvas, { width, height });

        // Set up animation frame for continuous drawing
        const animate = () => {
          if (isMountedRef.current && canvas) {
            onDraw(canvas, { width: canvas.width, height: canvas.height });
            animationFrameRef.current = requestAnimationFrame(animate);
          }
        };
        animationFrameRef.current = requestAnimationFrame(animate);
        console.log('[PixelGridCanvas] Web animation frame started');

        // Clean up on unmount
        return () => {
          console.log('[PixelGridCanvas] Cleaning up web animation');
          isMountedRef.current = false;
          if (animationFrameRef.current !== null) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
          }
        };
      }

      return () => {
        isMountedRef.current = false;
      };
    }, [onDraw]);

    return (
      <canvas
        ref={canvasRef}
        style={{ ...style, width: '100%', height: '100%' }}
      />
    );
  };

  useCanvasRef = () => useRef(null);
  useFrame = () => {};
}

// Define theme color mappings
const themeColors = {
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

interface PixelGridCanvasProps {
  height?: number;
  pattern?: string;
  theme?: string;
  cellSize?: number;
  interactionRadius?: number;
  autoWave?: boolean;
  fullScreen?: boolean;
  customThemeColors?: Record<string, string>;
  multipleWaves?: boolean;
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
}

// Helper function to interpolate between two colors
const interpolateColor = (color1: string, color2: string, factor: number) => {
  // Ensure factor is between 0 and 1
  const clampedFactor = Math.max(0, Math.min(1, factor));

  // Parse colors
  const parseColor = (color: string) => {
    // Handle undefined or invalid color values
    if (!color) {
      return { r: 0, g: 0, b: 0, a: 1 };
    }

    // Handle hex colors
    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return { r, g, b, a: 1 };
    }

    // Handle rgba colors
    const rgba = color.match(
      /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/
    );
    if (rgba) {
      return {
        r: parseInt(rgba[1]),
        g: parseInt(rgba[2]),
        b: parseInt(rgba[3]),
        a: rgba[4] ? parseFloat(rgba[4]) : 1,
      };
    }

    // Default fallback
    return { r: 0, g: 0, b: 0, a: 1 };
  };

  const color1Rgb = parseColor(color1);
  const color2Rgb = parseColor(color2);

  // Interpolate each component
  const r = Math.round(
    color1Rgb.r + (color2Rgb.r - color1Rgb.r) * clampedFactor
  );
  const g = Math.round(
    color1Rgb.g + (color2Rgb.g - color1Rgb.g) * clampedFactor
  );
  const b = Math.round(
    color1Rgb.b + (color2Rgb.b - color1Rgb.b) * clampedFactor
  );
  const a = color1Rgb.a + (color2Rgb.a - color1Rgb.a) * clampedFactor;

  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

const PixelGridCanvas = ({
  height,
  pattern = 'dots',
  theme = 'default',
  cellSize = 5,
  interactionRadius = 100,
  autoWave = false,
  fullScreen = false,
  customThemeColors,
  multipleWaves = false,
  lightingMode,
  animationSpeed = 1.0,
  isDrawMode = false,
  drawnCells = [],
  onCellDraw,
  lightingShape = 'circular',
  colorMode = 'single',
  colorPalette = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'],
  enableSound = false,
  enableHaptics = false,
  enableParticles = false,
}: PixelGridCanvasProps) => {
  console.log('[PixelGridCanvas] Initializing with props:', {
    pattern,
    theme,
    cellSize,
    interactionRadius,
    autoWave,
    multipleWaves,
    lightingMode,
    isDrawMode,
  });

  // Always use the mobile fallback for consistent behavior across platforms
  const useMobileFallback = !isWeb || !Canvas;

  if (useMobileFallback) {
    console.log('[PixelGridCanvas] Using mobile fallback implementation');
    return (
      <MobileGridFallback
        pattern={pattern}
        theme={theme}
        cellSize={cellSize}
        interactionRadius={interactionRadius}
        autoWave={autoWave}
        multipleWaves={multipleWaves}
        fullScreen={fullScreen}
        height={height}
        lightingMode={lightingMode || 'gradient'}
        animationSpeed={animationSpeed}
        isDrawMode={isDrawMode}
        drawnCells={drawnCells}
        onCellDraw={onCellDraw}
        lightingShape={lightingShape}
        colorMode={colorMode}
        colorPalette={colorPalette}
        enableSound={enableSound}
        enableHaptics={enableHaptics}
        enableParticles={enableParticles}
        customThemeColors={customThemeColors}
      />
    );
  }

  // Web implementation continues below
  const windowDimensions = Dimensions.get('window');
  const canvasWidth = windowDimensions.width;
  const canvasHeight = height || windowDimensions.height * 0.6;
  console.log('[PixelGridCanvas] Canvas dimensions:', {
    canvasWidth,
    canvasHeight,
  });

  const canvasRef = useCanvasRef ? useCanvasRef() : useRef(null);
  const touchX = useSharedValue(-100);
  const touchY = useSharedValue(-100);
  const isTouching = useSharedValue(false);
  const waveTime = useSharedValue(0);

  // Add new shared values for multiple wave sources
  const waveSourcesRef = useRef<
    Array<{
      x: number;
      y: number;
      speed: number;
      amplitude: number;
      frequency: number;
      phase: number;
      active: boolean;
    }>
  >([]);

  // Initialize wave sources if they're not already set
  useEffect(() => {
    if (multipleWaves && waveSourcesRef.current.length === 0) {
      // Create 3-5 wave sources with different parameters
      const numWaves = Math.floor(Math.random() * 3) + 3; // 3-5 waves

      for (let i = 0; i < numWaves; i++) {
        waveSourcesRef.current.push({
          x: Math.random() * canvasWidth,
          y: Math.random() * canvasHeight,
          speed: 0.2 + Math.random() * 0.8, // Random speed
          amplitude: 5 + Math.random() * 15, // Random amplitude
          frequency: 0.01 + Math.random() * 0.04, // Random frequency
          phase: Math.random() * Math.PI * 2, // Random phase
          active: true,
        });
      }
    }
  }, [multipleWaves, canvasWidth, canvasHeight]);

  // Update wave sources positions
  useEffect(() => {
    if (!multipleWaves) return;

    let frameId: number;
    let lastTime = 0;

    const updateWaveSources = (time: number) => {
      if (lastTime === 0) {
        lastTime = time;
      }

      const deltaTime = time - lastTime;
      lastTime = time;

      // Update position of each wave source
      waveSourcesRef.current.forEach((wave) => {
        if (!wave.active) return;

        // Move in a bounded random direction
        const angle = wave.phase + waveTime.value * wave.speed;
        wave.x += Math.cos(angle) * wave.speed * deltaTime * 0.05;
        wave.y += Math.sin(angle) * wave.speed * deltaTime * 0.05;

        // Bounce off edges
        if (wave.x < 0 || wave.x > canvasWidth) {
          wave.x = Math.max(0, Math.min(wave.x, canvasWidth));
          wave.phase = Math.PI - wave.phase;
        }

        if (wave.y < 0 || wave.y > canvasHeight) {
          wave.y = Math.max(0, Math.min(wave.y, canvasHeight));
          wave.phase = -wave.phase;
        }
      });

      frameId = requestAnimationFrame(updateWaveSources);
    };

    frameId = requestAnimationFrame(updateWaveSources);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [multipleWaves, canvasWidth, canvasHeight, waveTime]);

  // Use a regular state array instead of a ref for trail positions
  const [trailPositions, setTrailPositions] = React.useState<
    Array<{ x: number; y: number; age: number }>
  >([]);

  // State for particles
  const [particles, setParticles] = useState<
    Array<{
      x: number;
      y: number;
      size: number;
      color: string;
      life: number;
      decay: number;
    }>
  >([]);

  // Sound effect implementation
  const loadSound = async () => {
    try {
      if (Platform.OS !== 'web' && enableSound) {
        // Import Audio from expo-av
        const { Audio } = require('expo-av');

        // Create a simple beep sound instead of loading from file
        const soundObject = new Audio.Sound();

        // Try to load the sound file if it exists, otherwise use a fallback
        try {
          await soundObject.loadAsync(require('../assets/tap-sound.mp3'));
        } catch (error) {
          console.log('Using fallback sound');
          // Create a simple beep sound programmatically
          const audioContext = new (window.AudioContext ||
            window.webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
          oscillator.connect(audioContext.destination);
          oscillator.start();
          setTimeout(() => oscillator.stop(), 50);
        }

        return soundObject;
      }
      return null;
    } catch (error) {
      console.error('Error loading sound:', error);
      return null;
    }
  };

  const playSound = async () => {
    if (!enableSound) return;

    try {
      if (Platform.OS !== 'web') {
        // Import Audio from expo-av
        const { Audio } = require('expo-av');

        // Create a sound object
        const soundObject = new Audio.Sound();

        try {
          // Try to load the sound file
          await soundObject.loadAsync(require('../assets/tap-sound.mp3'));
          await soundObject.playAsync();

          // Release the sound object after playing
          soundObject.setOnPlaybackStatusUpdate((status) => {
            if (status.didJustFinish) {
              soundObject.unloadAsync();
            }
          });
        } catch (error) {
          console.log('Using fallback sound mechanism');
          // Fallback to vibration if sound fails
          if (enableHaptics) {
            triggerHaptics();
          }
        }
      } else if (typeof window !== 'undefined' && window.AudioContext) {
        // Web fallback using Web Audio API
        try {
          const audioContext = new (window.AudioContext ||
            window.webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
          oscillator.connect(audioContext.destination);
          oscillator.start();
          setTimeout(() => oscillator.stop(), 50);
        } catch (e) {
          console.error('Web Audio API error:', e);
        }
      }
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  // Haptic feedback implementation
  const triggerHaptics = () => {
    try {
      if (Platform.OS !== 'web' && enableHaptics) {
        const Haptics = require('expo-haptics');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error('Error triggering haptics:', error);
    }
  };

  // Particle effect implementation
  const createParticles = (x: number, y: number) => {
    if (!enableParticles) return;

    // Create particles at the given position
    const particleCount = 5;
    const newParticles = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 10;
      const px = x + Math.cos(angle) * distance;
      const py = y + Math.sin(angle) * distance;

      newParticles.push({
        x: px,
        y: py,
        size: Math.random() * 3 + 1,
        color: 'rgba(255, 255, 255, 0.8)',
        life: 1.0, // Full life
        decay: 0.05 + Math.random() * 0.05, // Random decay rate
      });
    }

    // Update particles state safely
    setParticles((prevParticles) => {
      // Limit the number of particles to prevent performance issues
      const maxParticles = 50;
      const combinedParticles = [...prevParticles, ...newParticles];
      return combinedParticles.slice(-maxParticles);
    });
  };

  // Draw particles
  const drawParticles = (ctx: any) => {
    if (!enableParticles || !particles.length) return;

    // Create a copy of particles to avoid mutation during rendering
    const currentParticles = [...particles];

    // Update and draw each particle
    const updatedParticles = currentParticles
      .map((p) => ({
        ...p,
        life: p.life - p.decay,
      }))
      .filter((p) => p.life > 0);

    // Draw each particle
    updatedParticles.forEach((p) => {
      try {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);

        // Fade out as life decreases
        const alpha = p.life.toFixed(2);
        ctx.fillStyle = p.color.replace('0.8', alpha);
        ctx.fill();
      } catch (error) {
        console.error('Error drawing particle:', error);
      }
    });

    // Update particles state
    setParticles(updatedParticles);
  };

  // Set up touch gesture with enhanced features
  const gesture = Gesture.Pan()
    .onBegin((e) => {
      try {
        console.log('[PixelGridCanvas] Gesture began:', { x: e.x, y: e.y });
        touchX.value = e.x;
        touchY.value = e.y;
        isTouching.value = true;

        // Clear trail on new touch
        runOnJS(setTrailPositions)([]);

        // Handle cell drawing in draw mode
        if (isDrawMode && onCellDraw) {
          runOnJS(onCellDraw)(e.x, e.y);
        }

        // Trigger interactive effects
        runOnJS(playSound)();
        runOnJS(triggerHaptics)();
        runOnJS(createParticles)(e.x, e.y);
      } catch (error) {
        console.error('[PixelGridCanvas] Error in gesture onBegin:', error);
      }
    })
    .onUpdate((e) => {
      try {
        console.log('[PixelGridCanvas] Gesture update:', { x: e.x, y: e.y });
        touchX.value = e.x;
        touchY.value = e.y;

        // Add to trail using runOnJS to safely update React state from a worklet
        runOnJS(setTrailPositions)((prev) => {
          try {
            // Handle case where prev is undefined
            const currentPositions = Array.isArray(prev) ? prev : [];
            const newPositions = [
              ...currentPositions,
              { x: e.x, y: e.y, age: 0 },
            ];
            // Limit trail length
            if (newPositions.length > 10) {
              return newPositions.slice(1);
            }
            return newPositions;
          } catch (error) {
            console.error(
              '[PixelGridCanvas] Error updating trail positions:',
              error
            );
            return Array.isArray(prev) ? prev : [];
          }
        });

        // Handle cell drawing in draw mode
        if (isDrawMode && onCellDraw) {
          runOnJS(onCellDraw)(e.x, e.y);
        }

        // Trigger particles occasionally during movement
        if (Math.random() > 0.7) {
          runOnJS(createParticles)(e.x, e.y);
        }
      } catch (error) {
        console.error('[PixelGridCanvas] Error in gesture onUpdate:', error);
      }
    })
    .onEnd(() => {
      try {
        console.log('[PixelGridCanvas] Gesture ended');
        // Don't reset position immediately to allow for fade-out effect
        isTouching.value = false;

        // Use runOnJS to safely schedule the timeout
        runOnJS(setTimeout)(() => {
          try {
            if (!isTouching.value) {
              touchX.value = -100;
              touchY.value = -100;
              runOnJS(setTrailPositions)([]);
              console.log(
                '[PixelGridCanvas] Reset touch position after timeout'
              );
            }
          } catch (error) {
            console.error(
              '[PixelGridCanvas] Error in timeout callback:',
              error
            );
          }
        }, 500);
      } catch (error) {
        console.error('[PixelGridCanvas] Error in gesture onEnd:', error);
      }
    });

  // Update wave time for animations with speed control
  useEffect(() => {
    let frameId: number;
    let lastTime = 0;

    const updateWaveTime = (time: number) => {
      if (lastTime === 0) {
        lastTime = time;
      }

      const deltaTime = time - lastTime;
      lastTime = time;

      // Apply animation speed to time updates
      waveTime.value += deltaTime * 0.001 * animationSpeed;

      // Update trail ages
      setTrailPositions((prev) => {
        try {
          // Handle case where prev is undefined
          if (!Array.isArray(prev)) {
            return [];
          }

          return prev
            .map((pos) => ({
              ...pos,
              age: pos.age + deltaTime * 0.001 * animationSpeed,
            }))
            .filter((pos) => pos.age < 1.5);
        } catch (error) {
          console.error('Error updating trail ages:', error);
          return [];
        }
      });

      frameId = requestAnimationFrame(updateWaveTime);
    };

    frameId = requestAnimationFrame(updateWaveTime);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [animationSpeed]); // Add animationSpeed as a dependency

  // Get the appropriate theme colors
  const getThemeColors = () => {
    if (theme === 'custom' && customThemeColors) {
      return customThemeColors;
    }
    return (
      themeColors[theme as keyof typeof themeColors] || themeColors.default
    );
  };

  // Enhanced drawGrid function to support multiple waves and drawn cells
  const drawGrid = (canvas: any, info: any) => {
    try {
      console.log('[PixelGridCanvas] drawGrid called with info:', {
        width: info.width,
        height: info.height,
        isWeb,
      });

      const { width, height } = info;
      const ctx = isWeb ? canvas.getContext('2d') : canvas.getContext('2d');

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Get colors for current theme
      const colors = getThemeColors();

      // Fill background
      ctx.fillStyle = colors.background;
      ctx.fillRect(0, 0, width, height);

      // Calculate grid parameters based on pattern
      const totalSize = cellSize + 2; // Cell size plus gap
      let cols, rows;

      switch (pattern) {
        case 'grid':
          cols = Math.ceil(width / totalSize / 1.0) + 1;
          rows = Math.ceil(height / totalSize / 1.0) + 1;
          break;
        case 'lines':
          cols = Math.ceil(width / totalSize / 1.0) + 1;
          rows = Math.ceil(height / totalSize / 2.0) + 1;
          break;
        case 'waves':
          cols = Math.ceil(width / totalSize / 1.5) + 1;
          rows = Math.ceil(height / totalSize / 1.5) + 1;
          break;
        case 'particles':
          cols = Math.ceil(width / totalSize / 1.8) + 1;
          rows = Math.ceil(height / totalSize / 1.8) + 1;
          break;
        case 'dots':
        default:
          cols = Math.ceil(width / totalSize / 1.2) + 1;
          rows = Math.ceil(height / totalSize / 1.2) + 1;
          break;
      }

      // Convert drawnCells to grid coordinates for drawing
      const gridDrawnCells = drawnCells.map((cell) => {
        const col = Math.floor(cell.x / totalSize);
        const row = Math.floor(cell.y / totalSize);
        return { col, row };
      });

      // Update touch position for autoWave if needed
      if (autoWave && !isTouching.value) {
        // Different movement patterns based on lighting shape
        if (lightingShape === 'circular') {
          // Circular movement around the center
          const radius = Math.min(width, height) * 0.3;
          touchX.value = width / 2 + Math.cos(waveTime.value) * radius;
          touchY.value = height / 2 + Math.sin(waveTime.value) * radius;
        } else if (lightingShape === 'linear') {
          // Horizontal movement for linear shape
          touchX.value = ((Math.sin(waveTime.value) + 1) * width) / 2;
          touchY.value = height / 2;
        } else if (lightingShape === 'radial') {
          // Stay at center for radial
          touchX.value = width / 2;
          touchY.value = height / 2;
        } else if (lightingShape === 'random') {
          // Random-looking but smooth movement
          touchX.value =
            width / 2 + Math.sin(waveTime.value * 1.3) * width * 0.4;
          touchY.value =
            height / 2 + Math.cos(waveTime.value * 0.7) * height * 0.4;
        }
      }

      // Draw grid cells based on pattern
      if (pattern === 'lines') {
        // Draw horizontal lines
        for (let row = 0; row < rows; row++) {
          const y = row * totalSize * 2.5;

          for (let col = 0; col < cols; col++) {
            const x = col * totalSize * 1.2;
            drawCell(ctx, x, y, col, row, colors, width, height);
          }
        }
      } else if (pattern === 'waves') {
        // Draw wave pattern with enhanced dynamics
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const x = col * totalSize * 1.8;

            let waveOffset = 0;

            if (multipleWaves && waveSourcesRef.current.length > 0) {
              // Calculate combined effect from all wave sources
              waveSourcesRef.current.forEach((wave) => {
                if (!wave.active) return;

                // Calculate distance from this cell to the wave source
                const dx = x - wave.x;
                const dy = row * totalSize * 1.8 - wave.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Calculate wave effect based on distance
                const waveEffect =
                  wave.amplitude *
                  Math.sin(
                    distance * wave.frequency -
                      waveTime.value * wave.speed +
                      wave.phase
                  ) *
                  Math.exp(-distance / (interactionRadius * 2)); // Decay with distance

                waveOffset += waveEffect;
              });
            } else {
              // Use the original wave logic
              // Enhanced wave pattern with multiple frequencies and interactions
              const primaryWave =
                Math.sin(col * 0.3 + waveTime.value * 1.2) * 15;
              const secondaryWave =
                Math.sin(col * 0.1 + row * 0.1 + waveTime.value * 0.8) * 8;

              // Add circular wave patterns
              const distFromCenter = Math.sqrt(
                Math.pow(col - cols / 2, 2) + Math.pow(row - rows / 2, 2)
              );
              const circularWave =
                Math.sin(distFromCenter * 0.3 - waveTime.value * 1.5) * 10;

              // Add diagonal wave patterns
              const diagonalWave =
                Math.cos((col + row) * 0.2 + waveTime.value) * 6;

              // Combine all wave components with different weights
              waveOffset =
                primaryWave * 0.4 +
                secondaryWave * 0.3 +
                circularWave * 0.2 +
                diagonalWave * 0.1;
            }

            const y = row * totalSize * 1.8 + waveOffset;
            drawCell(ctx, x, y, col, row, colors, width, height);
          }
        }
      } else if (pattern === 'grid') {
        // Draw structured grid
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const x = col * totalSize * 1.2;
            const y = row * totalSize * 1.2;
            drawCell(ctx, x, y, col, row, colors, width, height);
          }
        }
      } else if (pattern === 'particles') {
        // Draw scattered particles
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const x = col * totalSize * 2.0 + (row % 2 === 0 ? totalSize : 0);
            const y = row * totalSize * 2.0;
            drawCell(ctx, x, y, col, row, colors, width, height);
          }
        }
      } else {
        // Default dots pattern
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const x = col * totalSize * 1.5;
            const y = row * totalSize * 1.5;
            drawCell(ctx, x, y, col, row, colors, width, height);
          }
        }
      }

      // Draw drawn cells on top with special highlighting
      if (isDrawMode && gridDrawnCells.length > 0) {
        ctx.fillStyle = '#FF6B6B'; // Use a distinctive color for drawn cells

        gridDrawnCells.forEach(({ col, row }) => {
          const x = col * totalSize;
          const y = row * totalSize;

          // Draw the cell with pattern-specific shapes
          if (pattern === 'grid') {
            ctx.fillRect(x, y, cellSize * 1.5, cellSize * 1.5);
          } else if (
            pattern === 'particles' ||
            pattern === 'dots' ||
            pattern === 'waves'
          ) {
            ctx.beginPath();
            ctx.arc(x + cellSize, y + cellSize, cellSize * 1.2, 0, Math.PI * 2);
            ctx.fill();
          } else if (pattern === 'lines') {
            ctx.fillRect(x, y, cellSize * 2.5, cellSize * 0.8);
          }
        });
      }

      // Draw particles on top of everything
      if (enableParticles) {
        drawParticles(ctx);
      }
    } catch (error) {
      console.error('[PixelGridCanvas] Error in drawGrid:', error);
    }
  };

  // Draw individual cell with enhanced effects for lighting shapes and color modes
  const drawCell = (
    ctx: any,
    x: number,
    y: number,
    col: number,
    row: number,
    colors: any,
    width: number,
    height: number
  ) => {
    try {
      // Calculate intensity based on lighting shape
      let intensity = 0;
      const centerX = width / 2;
      const centerY = height / 2;

      // Check if touch is active or if autoWave is enabled
      const isInteractive = isTouching.value || autoWave;

      switch (lightingShape) {
        case 'circular':
          // Original circular lighting (distance-based)
          const touchDistance = Math.sqrt(
            Math.pow(x - touchX.value, 2) + Math.pow(y - touchY.value, 2)
          );

          if (isInteractive) {
            // If touch is active or autoWave is enabled, use touch position
            intensity = Math.max(0, 1 - touchDistance / interactionRadius);

            // Add wave effect for autoWave
            if (autoWave) {
              const waveEffect =
                Math.sin(touchDistance * 0.05 - waveTime.value * 3) * 0.3;
              intensity = Math.max(0, intensity + waveEffect);
            }
          }
          break;

        case 'linear':
          // Linear gradient with interactive touch
          if (isInteractive) {
            // Base intensity on horizontal position
            const baseIntensity = x / width;

            // Add touch-based intensity
            const touchDistance = Math.sqrt(
              Math.pow(x - touchX.value, 2) + Math.pow(y - touchY.value, 2)
            );
            const touchIntensity = Math.max(
              0,
              1 - touchDistance / (interactionRadius * 1.5)
            );

            // Add wave effect for autoWave
            let waveEffect = 0;
            if (autoWave) {
              // Create horizontal wave patterns
              waveEffect = Math.sin(x * 0.02 + waveTime.value * 2) * 0.3;
            }

            // Combine all effects
            intensity = baseIntensity * 0.3 + touchIntensity * 0.5 + waveEffect;
            intensity = Math.max(0, Math.min(1, intensity));
          } else {
            // Default linear gradient when not interactive
            intensity = x / width;
          }
          break;

        case 'radial':
          // Radial gradient from center with interactive touch
          const radialDist = Math.sqrt(
            Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
          );
          const maxRadius = Math.sqrt(
            Math.pow(width / 2, 2) + Math.pow(height / 2, 2)
          );

          // Base radial intensity
          let radialIntensity = 1 - radialDist / maxRadius;

          if (isInteractive) {
            // Add touch-based intensity
            const touchDistance = Math.sqrt(
              Math.pow(x - touchX.value, 2) + Math.pow(y - touchY.value, 2)
            );
            const touchIntensity = Math.max(
              0,
              1 - touchDistance / interactionRadius
            );

            // Add wave effect for autoWave
            let waveEffect = 0;
            if (autoWave) {
              // Create expanding circular waves
              waveEffect =
                Math.sin(radialDist * 0.05 - waveTime.value * 2) * 0.3;
            }

            // Combine all effects
            intensity =
              radialIntensity * 0.4 + touchIntensity * 0.4 + waveEffect;
            intensity = Math.max(0, Math.min(1, intensity));
          } else {
            intensity = radialIntensity;
          }
          break;

        case 'random':
          // Random intensity with interactive touch
          // Use a deterministic random based on position to avoid flickering
          const seed = ((col * 100 + row) % 1000) / 1000;

          if (isInteractive) {
            // Add touch-based intensity
            const touchDistance = Math.sqrt(
              Math.pow(x - touchX.value, 2) + Math.pow(y - touchY.value, 2)
            );
            const touchIntensity = Math.max(
              0,
              1 - touchDistance / interactionRadius
            );

            // Add wave effect for autoWave
            let waveEffect = 0;
            if (autoWave) {
              // Create random wave patterns
              waveEffect = Math.sin(seed * 10 + waveTime.value * 3) * 0.3;
            }

            // Combine all effects
            intensity = seed * 0.4 + touchIntensity * 0.4 + waveEffect;
            intensity = Math.max(0, Math.min(1, intensity));
          } else {
            intensity = seed;
          }
          break;

        default:
          // Default to circular if not specified
          const defaultDistance = Math.sqrt(
            Math.pow(x - touchX.value, 2) + Math.pow(y - touchY.value, 2)
          );
          intensity = Math.max(0, 1 - defaultDistance / interactionRadius);
          break;
      }

      // Apply lighting mode adjustments to intensity
      if (lightingMode === 'uniform') {
        intensity = 1.0; // Full brightness for uniform mode
      } else if (lightingMode === 'pulse') {
        // Add pulsating effect
        intensity *= 0.5 + 0.5 * Math.sin(waveTime.value * 5);
      }

      // Determine cell color based on color mode
      let cellColor;

      switch (colorMode) {
        case 'single':
          // Original single color behavior
          cellColor = interpolateColor(
            colors.background || '#000000',
            colors.primary || '#ffffff',
            intensity
          );
          break;

        case 'gradient':
          // Gradient across the grid
          const t = x / width; // Position from 0 to 1
          const gradientStart = colors.primary || '#ff0000';
          const gradientEnd = colors.secondary || '#00ffff'; // Use secondary color or default to cyan

          // First interpolate between start and end based on position
          const baseColor = interpolateColor(gradientStart, gradientEnd, t);

          // Then apply intensity
          cellColor = interpolateColor(
            colors.background || '#000000',
            baseColor,
            intensity
          );
          break;

        case 'random':
          // Random color from palette
          if (colorPalette && colorPalette.length > 0) {
            // Use a deterministic selection based on position to avoid flickering
            const index = (col + row * 3) % colorPalette.length;
            const randomColor = colorPalette[index];
            cellColor = interpolateColor(
              colors.background || '#000000',
              randomColor,
              intensity
            );
          } else {
            // Fallback to primary color if no palette
            cellColor = interpolateColor(
              colors.background || '#000000',
              colors.primary || '#ffffff',
              intensity
            );
          }
          break;

        default:
          // Default to single color mode
          cellColor = interpolateColor(
            colors.background || '#000000',
            colors.primary || '#ffffff',
            intensity
          );
          break;
      }

      // Draw the cell
      let cellSize2 = cellSize;

      // Scale cells based on intensity for some lighting modes
      if (
        intensity > 0 &&
        lightingMode !== 'uniform' &&
        lightingMode !== 'highlight' &&
        lightingMode !== 'simple'
      ) {
        cellSize2 = cellSize * (1 + intensity * 0.5);
      } else {
        cellSize2 = cellSize; // Fixed size for uniform, highlight and simple modes
      }

      // Calculate cell position
      let cellX = x - cellSize2 / 2;
      let cellY = y - cellSize2 / 2;

      // Add subtle movement for active cells, but not for uniform mode
      if (
        intensity > 0.1 &&
        lightingMode !== 'uniform' &&
        lightingMode !== 'highlight' &&
        lightingMode !== 'simple'
      ) {
        // Add subtle movement based on wave time
        const waveStrength = 8 * intensity;

        // Adjust movement based on lighting shape
        if (lightingShape === 'linear') {
          // For linear, move primarily horizontally
          cellX += Math.cos(waveTime.value * 5 + y * 0.1) * waveStrength;
          cellY += Math.sin(waveTime.value * 2 + x * 0.05) * waveStrength * 0.3;
        } else if (lightingShape === 'radial') {
          // For radial, move in circular patterns
          const angle = Math.atan2(y - centerY, x - centerX);
          cellX += Math.cos(angle + waveTime.value * 3) * waveStrength;
          cellY += Math.sin(angle + waveTime.value * 3) * waveStrength;
        } else if (lightingShape === 'random') {
          // For random, use the seed for consistent but random-looking movement
          cellX += Math.cos(waveTime.value * 5 + seed * 10) * waveStrength;
          cellY += Math.sin(waveTime.value * 5 + seed * 10) * waveStrength;
        } else {
          // Default circular movement
          cellX += Math.cos(waveTime.value * 5 + y * 0.1) * waveStrength;
          cellY += Math.sin(waveTime.value * 5 + x * 0.1) * waveStrength;
        }
      }

      // Draw the cell with the calculated color and position
      ctx.fillStyle = cellColor;

      // Use different shapes based on pattern
      if (pattern === 'dots') {
        ctx.beginPath();
        ctx.arc(
          cellX + cellSize2 / 2,
          cellY + cellSize2 / 2,
          cellSize2 / 2,
          0,
          Math.PI * 2
        );
        ctx.fill();
      } else if (pattern === 'lines') {
        ctx.fillRect(cellX, cellY, cellSize2, cellSize2 / 3);
      } else if (pattern === 'waves') {
        ctx.beginPath();
        ctx.moveTo(cellX, cellY + cellSize2 / 2);
        ctx.quadraticCurveTo(
          cellX + cellSize2 / 2,
          cellY + cellSize2 * (0.5 + Math.sin(col * 0.5) * 0.5),
          cellX + cellSize2,
          cellY + cellSize2 / 2
        );
        ctx.lineWidth = cellSize2 / 3;
        ctx.strokeStyle = cellColor;
        ctx.stroke();
      } else if (pattern === 'particles') {
        ctx.beginPath();
        ctx.arc(
          cellX + cellSize2 / 2,
          cellY + cellSize2 / 2,
          cellSize2 / 4,
          0,
          Math.PI * 2
        );
        ctx.fill();
      } else {
        // Default to grid pattern
        ctx.fillRect(cellX, cellY, cellSize2, cellSize2);
      }

      // Trigger interactive effects if cell is "active" (high intensity)
      if (intensity > 0.7 && (isTouching.value || autoWave)) {
        // Play sound if enabled and not already playing too many sounds
        if (enableSound) {
          playSound();
        }

        // Trigger haptic feedback if enabled
        if (enableHaptics) {
          triggerHaptics();
        }

        // Create particles if enabled
        if (enableParticles) {
          createParticles(x, y);
        }
      }

      return cellColor;
    } catch (error) {
      console.error('[PixelGridCanvas] Error in drawCell:', error);
      return 'rgba(0, 0, 0, 0)'; // Return a transparent color in case of error
    }
  };

  // Add logging to return statement
  console.log('[PixelGridCanvas] Rendering canvas with platform:', Platform.OS);

  return (
    <GestureHandlerRootView
      style={[styles.container, fullScreen && styles.fullScreen]}
    >
      <GestureDetector gesture={gesture}>
        <View style={[styles.canvasContainer, { height: canvasHeight }]}>
          {isWeb ? (
            <Canvas style={styles.canvas} onDraw={drawGrid} />
          ) : (
            <Canvas style={styles.canvas} ref={canvasRef} onDraw={drawGrid} />
          )}
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  fullScreen: {
    flex: 1,
  },
  canvasContainer: {
    width: '100%',
    overflow: 'hidden',
  },
  canvas: {
    flex: 1,
  },
});

export default PixelGridCanvas;
