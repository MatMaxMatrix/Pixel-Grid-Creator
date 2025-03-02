import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Share } from 'react-native';

// Define the store state interface
interface GridState {
  // Grid appearance
  pattern: string;
  theme: string;
  cellSize: number;
  interactionRadius: number;

  // Behavior
  autoWave: boolean;
  reducedMotion: boolean;
  multipleWaves: boolean;

  // New features
  lightingShape: 'circular' | 'linear' | 'radial' | 'random';
  colorMode: 'single' | 'gradient' | 'random';
  colorPalette: string[];
  enableSound: boolean;
  enableHaptics: boolean;
  enableParticles: boolean;

  // Custom themes
  customThemes: Record<string, Record<string, string>>;
  activeCustomTheme: string | null;

  // Actions
  setPattern: (pattern: string) => void;
  setTheme: (theme: string) => void;
  setCellSize: (size: number) => void;
  setInteractionRadius: (radius: number) => void;
  setAutoWave: (enabled: boolean) => void;
  setReducedMotion: (enabled: boolean) => void;
  setMultipleWaves: (enabled: boolean) => void;

  // New feature actions
  setLightingShape: (
    shape: 'circular' | 'linear' | 'radial' | 'random'
  ) => void;
  setColorMode: (mode: 'single' | 'gradient' | 'random') => void;
  setColorPalette: (palette: string[]) => void;
  setEnableSound: (enabled: boolean) => void;
  setEnableHaptics: (enabled: boolean) => void;
  setEnableParticles: (enabled: boolean) => void;

  // Custom theme actions
  addCustomTheme: (name: string, colors: Record<string, string>) => void;
  setActiveCustomTheme: (name: string | null) => void;
  removeCustomTheme: (name: string) => void;

  // Configuration management
  saveConfiguration: () => Promise<void>;
  loadConfiguration: () => Promise<void>;
  resetToDefaults: () => void;
  exportConfiguration: () => Promise<{ success: boolean; message?: string }>;
  importConfiguration: () => Promise<{ success: boolean; message?: string }>;
}

// Storage keys
const STORAGE_KEY = 'pixel_grid_config';
const CUSTOM_THEMES_KEY = 'pixel_grid_custom_themes';

// Default configuration
const defaultConfig = {
  pattern: 'dots',
  theme: 'default',
  cellSize: 5,
  interactionRadius: 100,
  autoWave: false,
  reducedMotion: false,
  multipleWaves: false,
  lightingShape: 'circular' as const,
  colorMode: 'single' as const,
  colorPalette: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'],
  enableSound: false,
  enableHaptics: false,
  enableParticles: false,
  customThemes: {},
  activeCustomTheme: null,
};

export const useGridStore = create<GridState>((set, get) => ({
  // Initial state
  ...defaultConfig,

  // Actions to update state
  setPattern: (pattern) => set({ pattern }),
  setTheme: (theme) => {
    // If setting a built-in theme, clear the active custom theme
    set({ theme, activeCustomTheme: null });
  },
  setCellSize: (cellSize) => set({ cellSize }),
  setInteractionRadius: (interactionRadius) => set({ interactionRadius }),
  setAutoWave: (autoWave) => set({ autoWave }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  setMultipleWaves: (enabled: boolean) => set({ multipleWaves: enabled }),

  // New feature actions
  setLightingShape: (shape) => set({ lightingShape: shape }),
  setColorMode: (mode) => set({ colorMode: mode }),
  setColorPalette: (palette) => set({ colorPalette: palette }),
  setEnableSound: (enabled) => set({ enableSound: enabled }),
  setEnableHaptics: (enabled) => set({ enableHaptics: enabled }),
  setEnableParticles: (enabled) => set({ enableParticles: enabled }),

  // Custom theme actions
  addCustomTheme: (name, colors) => {
    const { customThemes } = get();
    set({
      customThemes: { ...customThemes, [name]: colors },
      activeCustomTheme: name,
      theme: 'custom', // Set theme to custom when adding a custom theme
    });
  },

  setActiveCustomTheme: (name) => {
    if (name === null) {
      set({ activeCustomTheme: null });
      return;
    }

    const { customThemes } = get();
    if (customThemes[name]) {
      set({
        activeCustomTheme: name,
        theme: 'custom', // Set theme to custom when activating a custom theme
      });
    }
  },

  removeCustomTheme: (name) => {
    const { customThemes, activeCustomTheme } = get();
    const newCustomThemes = { ...customThemes };
    delete newCustomThemes[name];

    // If removing the active custom theme, reset to default theme
    if (activeCustomTheme === name) {
      set({
        customThemes: newCustomThemes,
        activeCustomTheme: null,
        theme: 'default',
      });
    } else {
      set({ customThemes: newCustomThemes });
    }
  },

  // Save current configuration to AsyncStorage
  saveConfiguration: async () => {
    try {
      const {
        pattern,
        theme,
        cellSize,
        interactionRadius,
        autoWave,
        reducedMotion,
        multipleWaves,
        lightingShape,
        colorMode,
        colorPalette,
        enableSound,
        enableHaptics,
        enableParticles,
        customThemes,
        activeCustomTheme,
      } = get();

      const config = {
        pattern,
        theme,
        cellSize,
        interactionRadius,
        autoWave,
        reducedMotion,
        multipleWaves,
        lightingShape,
        colorMode,
        colorPalette,
        enableSound,
        enableHaptics,
        enableParticles,
        activeCustomTheme,
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      await AsyncStorage.setItem(
        CUSTOM_THEMES_KEY,
        JSON.stringify(customThemes)
      );

      return Promise.resolve();
    } catch (error) {
      console.error('Error saving configuration:', error);
      return Promise.reject(error);
    }
  },

  // Load configuration from AsyncStorage
  loadConfiguration: async () => {
    try {
      const configJson = await AsyncStorage.getItem(STORAGE_KEY);
      const customThemesJson = await AsyncStorage.getItem(CUSTOM_THEMES_KEY);

      if (configJson) {
        const config = JSON.parse(configJson);
        set(config);
      }

      if (customThemesJson) {
        const customThemes = JSON.parse(customThemesJson);
        set({ customThemes });
      }

      return Promise.resolve();
    } catch (error) {
      console.error('Error loading configuration:', error);
      return Promise.reject(error);
    }
  },

  // Reset to default configuration
  resetToDefaults: () => {
    set(defaultConfig);
  },

  // Export configuration as JSON
  exportConfiguration: async () => {
    try {
      const {
        pattern,
        theme,
        cellSize,
        interactionRadius,
        autoWave,
        reducedMotion,
        multipleWaves,
        lightingShape,
        colorMode,
        colorPalette,
        enableSound,
        enableHaptics,
        enableParticles,
        customThemes,
        activeCustomTheme,
      } = get();

      const config = {
        pattern,
        theme,
        cellSize,
        interactionRadius,
        autoWave,
        reducedMotion,
        multipleWaves,
        lightingShape,
        colorMode,
        colorPalette,
        enableSound,
        enableHaptics,
        enableParticles,
        customThemes,
        activeCustomTheme,
      };

      const configJson = JSON.stringify(config, null, 2);

      if (Platform.OS === 'web') {
        // For web, copy to clipboard
        await navigator.clipboard.writeText(configJson);
        return { success: true, message: 'Configuration copied to clipboard' };
      } else {
        // For native platforms, use Share API
        const result = await Share.share({
          message: configJson,
          title: 'Pixel Grid Configuration',
        });

        if (result.action === Share.sharedAction) {
          return { success: true };
        } else {
          return { success: false, message: 'Share was cancelled' };
        }
      }
    } catch (error) {
      console.error('Error exporting configuration:', error);
      return { success: false, message: 'Failed to export configuration' };
    }
  },

  // Import configuration from JSON
  importConfiguration: async () => {
    try {
      // This is a placeholder for actual implementation
      // In a real app, you would show a modal or use a file picker

      // For demo purposes, we'll just load the saved configuration
      const configJson = await AsyncStorage.getItem(STORAGE_KEY);
      const customThemesJson = await AsyncStorage.getItem(CUSTOM_THEMES_KEY);

      if (configJson) {
        const config = JSON.parse(configJson);
        set(config);
      }

      if (customThemesJson) {
        const customThemes = JSON.parse(customThemesJson);
        set({ customThemes });
      }

      return { success: true };
    } catch (error) {
      console.error('Error importing configuration:', error);
      return { success: false, message: 'Failed to import configuration' };
    }
  },
}));
