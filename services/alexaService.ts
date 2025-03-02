import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { useGridStore } from '../stores/gridStore';

// Define available voice commands
const commands = [
  { phrase: "Alexa, change grid color to blue", description: "Changes the grid theme to a blue color scheme" },
  { phrase: "Alexa, set pattern to waves", description: "Changes the grid pattern to waves" },
  { phrase: "Alexa, increase cell size", description: "Makes the grid cells larger" },
  { phrase: "Alexa, decrease cell size", description: "Makes the grid cells smaller" },
  { phrase: "Alexa, enable auto wave", description: "Turns on the automatic wave animation" },
  { phrase: "Alexa, disable auto wave", description: "Turns off the automatic wave animation" },
  { phrase: "Alexa, save grid configuration", description: "Saves the current grid settings" },
  { phrase: "Alexa, load saved configuration", description: "Loads previously saved grid settings" },
  { phrase: "Alexa, reset grid to default", description: "Resets all grid settings to default values" },
];

export const useAlexaService = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  
  const {
    setPattern,
    setTheme,
    setCellSize,
    setAutoWave,
    cellSize,
    saveConfiguration,
    loadConfiguration,
    resetToDefaults
  } = useGridStore();
  
  // Connect to Alexa service
  const connectToAlexa = async () => {
    // Simulate connection process
    try {
      // In a real implementation, this would connect to AWS Amplify and set up the Alexa skill
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsConnected(true);
      return true;
    } catch (error) {
      console.error('Failed to connect to Alexa:', error);
      return false;
    }
  };
  
  // Disconnect from Alexa service
  const disconnectFromAlexa = async () => {
    // Simulate disconnection
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsConnected(false);
      setIsListening(false);
      return true;
    } catch (error) {
      console.error('Failed to disconnect from Alexa:', error);
      return false;
    }
  };
  
  // Toggle listening state
  const toggleListening = () => {
    if (!isConnected) return;
    
    if (isListening) {
      // Stop listening
      setIsListening(false);
    } else {
      // Start listening and simulate receiving commands
      setIsListening(true);
      
      // Simulate receiving a command after a delay
      if (Platform.OS !== 'web') {
        setTimeout(() => {
          const randomCommand = commands[Math.floor(Math.random() * commands.length)].phrase;
          processCommand(randomCommand);
        }, 3000);
      }
    }
  };
  
  // Process a voice command
  const processCommand = (command: string) => {
    setLastCommand(command);
    
    // Parse and execute the command
    const lowerCommand = command.toLowerCase();
    
    if (lowerCommand.includes('change grid color') || lowerCommand.includes('change theme')) {
      if (lowerCommand.includes('blue')) {
        setTheme('default');
      } else if (lowerCommand.includes('dark')) {
        setTheme('dark');
      } else if (lowerCommand.includes('light')) {
        setTheme('light');
      } else if (lowerCommand.includes('neon')) {
        setTheme('neon');
      } else if (lowerCommand.includes('pastel')) {
        setTheme('pastel');
      } else if (lowerCommand.includes('monochrome')) {
        setTheme('monochrome');
      }
    } 
    else if (lowerCommand.includes('set pattern')) {
      if (lowerCommand.includes('dots')) {
        setPattern('dots');
      } else if (lowerCommand.includes('lines')) {
        setPattern('lines');
      } else if (lowerCommand.includes('waves')) {
        setPattern('waves');
      } else if (lowerCommand.includes('grid')) {
        setPattern('grid');
      } else if (lowerCommand.includes('particles')) {
        setPattern('particles');
      }
    }
    else if (lowerCommand.includes('increase cell size')) {
      setCellSize(Math.min(cellSize + 2, 10));
    }
    else if (lowerCommand.includes('decrease cell size')) {
      setCellSize(Math.max(cellSize - 2, 2));
    }
    else if (lowerCommand.includes('enable auto wave')) {
      setAutoWave(true);
    }
    else if (lowerCommand.includes('disable auto wave')) {
      setAutoWave(false);
    }
    else if (lowerCommand.includes('save grid configuration')) {
      saveConfiguration();
    }
    else if (lowerCommand.includes('load saved configuration')) {
      loadConfiguration();
    }
    else if (lowerCommand.includes('reset grid')) {
      resetToDefaults();
    }
    
    // Stop listening after processing a command
    setIsListening(false);
  };
  
  return {
    isConnected,
    isListening,
    lastCommand,
    connectToAlexa,
    disconnectFromAlexa,
    toggleListening,
    processCommand,
    availableCommands: commands
  };
};