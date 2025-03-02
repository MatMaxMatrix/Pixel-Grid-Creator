import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Sparkles, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAIService } from '../services/aiService';
import { LinearGradient } from 'expo-linear-gradient';

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

interface AISuggestionsProps {
  onClose?: () => void;
}

const AISuggestions = ({ onClose }: AISuggestionsProps) => {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { getAISuggestions, applyAIConfiguration } = useAIService();
  const haptics = useHaptics();

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const suggestionsData = await getAISuggestions();
      setSuggestions(suggestionsData);
    } catch (err) {
      setError('Failed to load AI suggestions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplySuggestion = (suggestion: any) => {
    haptics.impact(Haptics.ImpactFeedbackStyle.Medium);

    applyAIConfiguration(suggestion.config);

    if (onClose) {
      onClose();
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading AI suggestions...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadSuggestions}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        <Sparkles size={18} color="#6366f1" /> AI Suggestions
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.suggestionsContainer}
      >
        {suggestions.map((suggestion) => (
          <TouchableOpacity
            key={suggestion.id}
            style={styles.suggestionCard}
            onPress={() => handleApplySuggestion(suggestion)}
          >
            <LinearGradient
              colors={['rgba(30, 41, 59, 0.9)', 'rgba(15, 23, 42, 0.95)']}
              style={styles.cardGradient}
            >
              <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
              <Text style={styles.suggestionDescription}>
                {suggestion.description}
              </Text>

              <View style={styles.applyButton}>
                <Text style={styles.applyButtonText}>Apply</Text>
                <ChevronRight size={16} color="#fff" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionsContainer: {
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  suggestionCard: {
    width: 220,
    height: 160,
    marginHorizontal: 8,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  cardGradient: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  suggestionDescription: {
    fontSize: 14,
    color: '#cbd5e1',
    marginBottom: 16,
    flex: 1,
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(99, 102, 241, 0.8)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#e2e8f0',
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#ef4444',
    marginBottom: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: 'rgba(99, 102, 241, 0.8)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AISuggestions;
