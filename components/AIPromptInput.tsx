import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
  Platform,
} from 'react-native';
import { Sparkles, Send } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAIService } from '../services/aiService';
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

interface AIPromptInputProps {
  onApplyConfig?: () => void;
}

const AIPromptInput = ({ onApplyConfig }: AIPromptInputProps) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { generateGridFromPrompt, applyAIConfiguration } = useAIService();
  const {
    setPattern,
    setTheme,
    setCellSize,
    setInteractionRadius,
    setAutoWave,
  } = useGridStore();
  const haptics = useHaptics();

  const handleSubmit = async () => {
    if (!prompt.trim()) return;

    try {
      setIsLoading(true);
      setError(null);
      Keyboard.dismiss();

      // Provide haptic feedback
      haptics.impact(Haptics.ImpactFeedbackStyle.Medium);

      const config = await generateGridFromPrompt(prompt);

      if (config) {
        applyAIConfiguration(config);
        setPrompt('');

        // Provide success haptic feedback
        haptics.notification(Haptics.NotificationFeedbackType.Success);

        if (onApplyConfig) {
          onApplyConfig();
        }
      } else {
        setError('Failed to generate grid configuration');
        haptics.notification(Haptics.NotificationFeedbackType.Error);
      }
    } catch (err) {
      setError('An error occurred while processing your prompt');
      haptics.notification(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateConfig = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    haptics.impact(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Simulate AI response with a timeout
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Apply a random configuration based on the prompt
      applyRandomConfig();
      onApplyConfig();
      haptics.notification(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error generating config:', error);
      haptics.notification(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
      setPrompt('');
      haptics.notification(Haptics.NotificationFeedbackType.Error);
    }
  };

  // Apply a random configuration based on the prompt
  const applyRandomConfig = () => {
    // This is a placeholder for actual AI-based configuration
    // In a real app, this would call an AI service to interpret the prompt

    const patterns = ['dots', 'grid', 'waves', 'lines', 'particles'];
    const themes = ['default', 'dark', 'light', 'neon', 'pastel', 'cyber'];

    // Simple keyword matching for demo purposes
    const promptLower = prompt.toLowerCase();

    // Pattern matching
    if (promptLower.includes('dot')) {
      setPattern('dots');
    } else if (promptLower.includes('grid') || promptLower.includes('square')) {
      setPattern('grid');
    } else if (promptLower.includes('wave') || promptLower.includes('ocean')) {
      setPattern('waves');
    } else if (promptLower.includes('line')) {
      setPattern('lines');
    } else if (
      promptLower.includes('particle') ||
      promptLower.includes('scatter')
    ) {
      setPattern('particles');
    } else {
      // Random pattern if no match
      setPattern(patterns[Math.floor(Math.random() * patterns.length)]);
    }

    // Theme matching
    if (promptLower.includes('dark') || promptLower.includes('night')) {
      setTheme('dark');
    } else if (
      promptLower.includes('light') ||
      promptLower.includes('bright')
    ) {
      setTheme('light');
    } else if (promptLower.includes('neon') || promptLower.includes('glow')) {
      setTheme('neon');
    } else if (promptLower.includes('pastel') || promptLower.includes('soft')) {
      setTheme('pastel');
    } else if (promptLower.includes('cyber') || promptLower.includes('punk')) {
      setTheme('cyber');
    } else {
      // Random theme if no match
      setTheme(themes[Math.floor(Math.random() * themes.length)]);
    }

    // Size and interaction settings
    if (promptLower.includes('large') || promptLower.includes('big')) {
      setCellSize(10);
    } else if (promptLower.includes('small') || promptLower.includes('tiny')) {
      setCellSize(3);
    } else {
      setCellSize(Math.floor(Math.random() * 8) + 3); // Random size between 3-10
    }

    // Interaction radius
    if (
      promptLower.includes('responsive') ||
      promptLower.includes('interactive')
    ) {
      setInteractionRadius(150);
    } else {
      setInteractionRadius(Math.floor(Math.random() * 100) + 50); // Random radius between 50-150
    }

    // Auto wave
    setAutoWave(
      promptLower.includes('animate') ||
        promptLower.includes('moving') ||
        promptLower.includes('wave') ||
        Math.random() > 0.5 // 50% chance of enabling auto wave
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <Sparkles size={20} color="#6366f1" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Describe your ideal grid..."
          placeholderTextColor="#6b7280"
          value={prompt}
          onChangeText={setPrompt}
          multiline={false}
          returnKeyType="send"
          onSubmitEditing={handleGenerateConfig}
          editable={!isLoading}
        />
        {isLoading ? (
          <ActivityIndicator size="small" color="#6366f1" style={styles.icon} />
        ) : (
          <TouchableOpacity
            style={[
              styles.sendButton,
              !prompt.trim() && styles.sendButtonDisabled,
            ]}
            onPress={handleGenerateConfig}
            disabled={!prompt.trim() || isLoading}
          >
            <Send size={18} color={prompt.trim() ? '#ffffff' : '#9ca3af'} />
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Text style={styles.helperText}>
        Try: "Create a neon cyberpunk grid with large hexagons" or "Gentle ocean
        waves with animation"
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#e2e8f0',
    fontSize: 16,
    paddingVertical: 8,
  },
  sendButton: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
  },
  errorText: {
    color: '#ef4444',
    marginTop: 8,
    fontSize: 14,
  },
  helperText: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default AIPromptInput;
