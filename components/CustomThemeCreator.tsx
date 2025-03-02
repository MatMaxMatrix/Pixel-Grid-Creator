import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Keyboard,
  Platform,
} from 'react-native';
import { Palette, X, Sparkles, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAIService } from '../services/aiService';
import { useGridStore } from '../stores/gridStore';
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

interface CustomThemeCreatorProps {
  visible: boolean;
  onClose: () => void;
}

const CustomThemeCreator = ({ visible, onClose }: CustomThemeCreatorProps) => {
  const [themeName, setThemeName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { generateCustomTheme } = useAIService();
  const { addCustomTheme, setTheme, setActiveCustomTheme } = useGridStore();
  const haptics = useHaptics();

  const handleCreateTheme = async () => {
    if (!themeName.trim() || !prompt.trim()) {
      setError('Please provide both a theme name and description');
      haptics.notification(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      Keyboard.dismiss();

      // Provide haptic feedback
      haptics.impact(Haptics.ImpactFeedbackStyle.Medium);

      const themeColors = await generateCustomTheme(prompt);

      if (themeColors) {
        addCustomTheme(themeName.trim(), themeColors);

        // Provide success haptic feedback
        haptics.notification(Haptics.NotificationFeedbackType.Success);

        // Reset form and close modal
        setThemeName('');
        setPrompt('');
        onClose();
      } else {
        setError('Failed to generate custom theme');
        haptics.notification(Haptics.NotificationFeedbackType.Error);
      }
    } catch (err) {
      setError('An error occurred while creating your theme');
      haptics.notification(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setThemeName('');
    setPrompt('');
    setError(null);
    onClose();
  };

  const handleSave = () => {
    haptics.impact(Haptics.ImpactFeedbackStyle.Medium);

    if (!themeName.trim()) {
      setError('Please enter a theme name');
      haptics.notification(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      // Add the custom theme
      addCustomTheme(themeName, {
        base: 'rgba(99, 102, 241, 0.2)',
        hover: 'rgba(129, 140, 248, 0.8)',
        background: 'rgba(10, 10, 30, 0.9)',
      });

      // Set the theme to custom and activate this theme
      setTheme('custom');
      setActiveCustomTheme(themeName);

      // Reset form and close
      resetForm();
      onClose();
      haptics.notification(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error saving theme:', error);
      setError('Failed to save theme');
      haptics.notification(Haptics.NotificationFeedbackType.Error);
    }
  };

  const resetForm = () => {
    setThemeName('');
    setPrompt('');
    setError(null);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <BlurView intensity={20} style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              <Palette size={20} color="#6366f1" /> Create Custom Theme
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleCancel}>
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.label}>Theme Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter a name for your theme"
              placeholderTextColor="#6b7280"
              value={themeName}
              onChangeText={setThemeName}
              editable={!isLoading}
            />

            <Text style={styles.label}>Theme Description</Text>
            <View style={styles.promptContainer}>
              <Sparkles size={18} color="#6366f1" style={styles.promptIcon} />
              <TextInput
                style={styles.promptInput}
                placeholder="Describe your theme (e.g., sunset colors, ocean vibes)"
                placeholderTextColor="#6b7280"
                value={prompt}
                onChangeText={setPrompt}
                multiline
                numberOfLines={3}
                editable={!isLoading}
              />
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <Text style={styles.helperText}>
              AI will generate a custom color theme based on your description
            </Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
                disabled={isLoading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.createButton,
                  (!themeName.trim() || !prompt.trim() || isLoading) &&
                    styles.createButtonDisabled,
                ]}
                onPress={handleCreateTheme}
                disabled={!themeName.trim() || !prompt.trim() || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.createButtonText}>Create Theme</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.saveButtonContainer}>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                disabled={!themeName.trim() || !prompt.trim() || isLoading}
              >
                <Check size={18} color="#fff" />
                <Text style={styles.saveButtonText}>Save Theme</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(30, 41, 59, 0.8)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButton: {
    padding: 4,
  },
  formContainer: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 8,
    padding: 12,
    color: '#e2e8f0',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  promptContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    marginBottom: 16,
  },
  promptIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  promptInput: {
    flex: 1,
    color: '#e2e8f0',
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#ef4444',
    marginBottom: 16,
    fontSize: 14,
  },
  helperText: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 24,
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  cancelButtonText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: 'rgba(99, 102, 241, 0.5)',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  saveButton: {
    backgroundColor: 'rgba(99, 102, 241, 0.9)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 5,
  },
});

export default CustomThemeCreator;
