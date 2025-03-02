import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGridStore } from '../stores/gridStore';

// Mock API key for demo purposes - in a real app, use environment variables or secure storage
const OPENAI_API_KEY = 'sk-demo-key';

// Define the interface for AI-generated grid configurations
interface AIGridConfig {
  pattern: string;
  theme: string;
  cellSize: number;
  interactionRadius: number;
  autoWave: boolean;
}

// Define the interface for AI suggestions
interface AISuggestion {
  id: string;
  title: string;
  description: string;
  config: AIGridConfig;
}

export const useAIService = () => {
  // Get grid store functions
  const {
    setPattern,
    setTheme,
    setCellSize,
    setInteractionRadius,
    setAutoWave,
  } = useGridStore();

  // Generate a grid configuration based on a text prompt
  const generateGridFromPrompt = async (
    prompt: string
  ): Promise<AIGridConfig | null> => {
    try {
      // In a real implementation, this would call the OpenAI API
      // For demo purposes, we'll simulate a response

      console.log(`Generating grid from prompt: ${prompt}`);

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Parse the prompt to determine configuration
      const lowerPrompt = prompt.toLowerCase();

      // Create a configuration based on the prompt
      const config: AIGridConfig = {
        pattern: 'dots',
        theme: 'default',
        cellSize: 5,
        interactionRadius: 100,
        autoWave: false,
      };

      // Adjust pattern based on prompt keywords
      if (
        lowerPrompt.includes('wave') ||
        lowerPrompt.includes('ocean') ||
        lowerPrompt.includes('water')
      ) {
        config.pattern = 'waves';
      } else if (
        lowerPrompt.includes('line') ||
        lowerPrompt.includes('stripe')
      ) {
        config.pattern = 'lines';
      } else if (
        lowerPrompt.includes('hexagon') ||
        lowerPrompt.includes('honeycomb')
      ) {
        config.pattern = 'hexagons';
      } else if (
        lowerPrompt.includes('square') ||
        lowerPrompt.includes('grid')
      ) {
        config.pattern = 'squares';
      }

      // Adjust theme based on prompt keywords
      if (
        lowerPrompt.includes('dark') ||
        lowerPrompt.includes('night') ||
        lowerPrompt.includes('black')
      ) {
        config.theme = 'dark';
      } else if (
        lowerPrompt.includes('light') ||
        lowerPrompt.includes('day') ||
        lowerPrompt.includes('white')
      ) {
        config.theme = 'light';
      } else if (
        lowerPrompt.includes('neon') ||
        lowerPrompt.includes('glow') ||
        lowerPrompt.includes('bright')
      ) {
        config.theme = 'neon';
      } else if (
        lowerPrompt.includes('pastel') ||
        lowerPrompt.includes('soft') ||
        lowerPrompt.includes('gentle')
      ) {
        config.theme = 'pastel';
      } else if (
        lowerPrompt.includes('cyber') ||
        lowerPrompt.includes('tech') ||
        lowerPrompt.includes('future')
      ) {
        config.theme = 'cyber';
      }

      // Adjust cell size based on prompt keywords
      if (lowerPrompt.includes('small') || lowerPrompt.includes('tiny')) {
        config.cellSize = 3;
      } else if (lowerPrompt.includes('large') || lowerPrompt.includes('big')) {
        config.cellSize = 8;
      } else if (lowerPrompt.includes('medium')) {
        config.cellSize = 5;
      }

      // Adjust interaction radius based on prompt keywords
      if (lowerPrompt.includes('wide') || lowerPrompt.includes('broad')) {
        config.interactionRadius = 150;
      } else if (
        lowerPrompt.includes('narrow') ||
        lowerPrompt.includes('focused')
      ) {
        config.interactionRadius = 50;
      }

      // Adjust auto wave based on prompt keywords
      if (
        lowerPrompt.includes('animate') ||
        lowerPrompt.includes('moving') ||
        lowerPrompt.includes('dynamic')
      ) {
        config.autoWave = true;
      }

      return config;
    } catch (error) {
      console.error('Error generating grid from prompt:', error);
      return null;
    }
  };

  // Apply an AI-generated configuration to the grid
  const applyAIConfiguration = (config: AIGridConfig) => {
    setPattern(config.pattern);
    setTheme(config.theme);
    setCellSize(config.cellSize);
    setInteractionRadius(config.interactionRadius);
    setAutoWave(config.autoWave);
  };

  // Get AI-generated suggestions based on current configuration
  const getAISuggestions = async (): Promise<AISuggestion[]> => {
    try {
      // In a real implementation, this would call the OpenAI API
      // For demo purposes, we'll return predefined suggestions

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return [
        {
          id: '1',
          title: 'Cyberpunk Grid',
          description:
            'Neon-colored grid with a futuristic cyberpunk aesthetic',
          config: {
            pattern: 'hexagons',
            theme: 'neon',
            cellSize: 6,
            interactionRadius: 120,
            autoWave: true,
          },
        },
        {
          id: '2',
          title: 'Calm Ocean Waves',
          description: 'Gentle blue waves with a soothing animation',
          config: {
            pattern: 'waves',
            theme: 'default',
            cellSize: 4,
            interactionRadius: 100,
            autoWave: true,
          },
        },
        {
          id: '3',
          title: 'Minimalist Grid',
          description: 'Clean, monochromatic grid with subtle interactions',
          config: {
            pattern: 'dots',
            theme: 'monochrome',
            cellSize: 5,
            interactionRadius: 80,
            autoWave: false,
          },
        },
        {
          id: '4',
          title: 'Digital Rain',
          description: 'Matrix-inspired falling digital pattern',
          config: {
            pattern: 'lines',
            theme: 'neon',
            cellSize: 3,
            interactionRadius: 150,
            autoWave: true,
          },
        },
        {
          id: '5',
          title: 'Pastel Dream',
          description: 'Soft pastel colors with a dreamy aesthetic',
          config: {
            pattern: 'dots',
            theme: 'pastel',
            cellSize: 7,
            interactionRadius: 130,
            autoWave: false,
          },
        },
      ];
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      return [];
    }
  };

  // Generate a custom color theme based on a prompt
  const generateCustomTheme = async (
    prompt: string
  ): Promise<Record<string, string> | null> => {
    try {
      // In a real implementation, this would call the OpenAI API
      // For demo purposes, we'll simulate a response

      console.log(`Generating custom theme from prompt: ${prompt}`);

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Parse the prompt to determine colors
      const lowerPrompt = prompt.toLowerCase();

      // Create a theme based on the prompt
      let baseColor = 'rgba(99, 102, 241, 0.2)';
      let hoverColor = 'rgba(129, 140, 248, 0.8)';
      let backgroundColor = 'rgba(10, 10, 30, 0.9)';

      if (lowerPrompt.includes('sunset') || lowerPrompt.includes('warm')) {
        baseColor = 'rgba(251, 146, 60, 0.2)';
        hoverColor = 'rgba(251, 113, 133, 0.8)';
        backgroundColor = 'rgba(30, 41, 59, 0.9)';
      } else if (lowerPrompt.includes('ocean') || lowerPrompt.includes('sea')) {
        baseColor = 'rgba(56, 189, 248, 0.2)';
        hoverColor = 'rgba(14, 165, 233, 0.8)';
        backgroundColor = 'rgba(15, 23, 42, 0.9)';
      } else if (
        lowerPrompt.includes('forest') ||
        lowerPrompt.includes('nature')
      ) {
        baseColor = 'rgba(74, 222, 128, 0.2)';
        hoverColor = 'rgba(34, 197, 94, 0.8)';
        backgroundColor = 'rgba(20, 83, 45, 0.9)';
      } else if (
        lowerPrompt.includes('galaxy') ||
        lowerPrompt.includes('space')
      ) {
        baseColor = 'rgba(168, 85, 247, 0.2)';
        hoverColor = 'rgba(126, 34, 206, 0.8)';
        backgroundColor = 'rgba(9, 9, 11, 0.95)';
      }

      return {
        base: baseColor,
        hover: hoverColor,
        background: backgroundColor,
      };
    } catch (error) {
      console.error('Error generating custom theme:', error);
      return null;
    }
  };

  return {
    generateGridFromPrompt,
    applyAIConfiguration,
    getAISuggestions,
    generateCustomTheme,
  };
};
