import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { Mic, MicOff, Info } from 'lucide-react-native';
import { useGridStore } from '../../stores/gridStore';
import { useAlexaService } from '../../services/alexaService';

export default function VoiceScreen() {
  const {
    pattern,
    theme,
    autoWave,
    setPattern,
    setTheme,
    setAutoWave,
    saveConfiguration,
    loadConfiguration
  } = useGridStore();
  
  const {
    isConnected,
    isListening,
    lastCommand,
    connectToAlexa,
    disconnectFromAlexa,
    toggleListening,
    availableCommands
  } = useAlexaService();
  
  const [showInfo, setShowInfo] = useState(false);
  
  // Show platform-specific information
  const showPlatformInfo = () => {
    if (Platform.OS === 'web') {
      Alert.alert(
        "Web Platform Notice",
        "Alexa integration is simulated in web mode. For full functionality, please use the native iOS or Android app."
      );
    } else {
      setShowInfo(!showInfo);
    }
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Voice Control</Text>
        <TouchableOpacity onPress={showPlatformInfo} style={styles.infoButton}>
          <Info size={20} color="#94a3b8" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.statusContainer}>
        <View style={[styles.statusIndicator, isConnected ? styles.connected : styles.disconnected]} />
        <Text style={styles.statusText}>
          {isConnected ? 'Connected to Alexa' : 'Disconnected from Alexa'}
        </Text>
      </View>
      
      <View style={styles.micContainer}>
        <TouchableOpacity 
          style={[styles.micButton, isListening ? styles.micButtonActive : null]} 
          onPress={toggleListening}
          disabled={!isConnected}
        >
          {isListening ? (
            <MicOff size={40} color="#fff" />
          ) : (
            <Mic size={40} color="#fff" />
          )}
        </TouchableOpacity>
        <Text style={styles.micText}>
          {isListening ? 'Tap to stop listening' : 'Tap to start listening'}
        </Text>
      </View>
      
      {lastCommand && (
        <View style={styles.lastCommandContainer}>
          <Text style={styles.lastCommandLabel}>Last command:</Text>
          <Text style={styles.lastCommandText}>{lastCommand}</Text>
        </View>
      )}
      
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, isConnected ? styles.disconnectButton : styles.connectButton]} 
          onPress={isConnected ? disconnectFromAlexa : connectToAlexa}
        >
          <Text style={styles.actionButtonText}>
            {isConnected ? 'Disconnect from Alexa' : 'Connect to Alexa'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {showInfo && (
        <ScrollView style={styles.commandsContainer}>
          <Text style={styles.commandsTitle}>Available Voice Commands</Text>
          {availableCommands.map((command, index) => (
            <View key={index} style={styles.commandItem}>
              <Text style={styles.commandText}>{command.phrase}</Text>
              <Text style={styles.commandDescription}>{command.description}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1e',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    position: 'relative',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6366f1',
    textAlign: 'center',
  },
  infoButton: {
    position: 'absolute',
    right: 0,
    padding: 5,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  connected: {
    backgroundColor: '#10b981',
  },
  disconnected: {
    backgroundColor: '#ef4444',
  },
  statusText: {
    color: '#e0e0e0',
    fontSize: 16,
  },
  micContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  micButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4c1d95',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  micButtonActive: {
    backgroundColor: '#ef4444',
  },
  micText: {
    color: '#94a3b8',
    fontSize: 16,
  },
  lastCommandContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 15,
    marginBottom: 30,
  },
  lastCommandLabel: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 5,
  },
  lastCommandText: {
    color: '#e0e0e0',
    fontSize: 18,
    fontWeight: '500',
  },
  actionsContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  connectButton: {
    backgroundColor: '#6366f1',
  },
  disconnectButton: {
    backgroundColor: '#475569',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  commandsContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 15,
    maxHeight: 300,
  },
  commandsTitle: {
    color: '#e0e0e0',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  commandItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  commandText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  commandDescription: {
    color: '#94a3b8',
    fontSize: 14,
  },
});