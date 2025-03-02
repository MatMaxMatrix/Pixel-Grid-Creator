import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { Save, RefreshCw, Trash2, Share2 } from 'lucide-react-native';
import { useGridStore } from '../../stores/gridStore';

export default function SettingsScreen() {
  const {
    reducedMotion,
    setReducedMotion,
    saveConfiguration,
    loadConfiguration,
    resetToDefaults,
    exportConfiguration,
    importConfiguration
  } = useGridStore();
  
  const [showImportDialog, setShowImportDialog] = useState(false);
  
  const handleExport = async () => {
    try {
      const result = await exportConfiguration();
      if (result.success) {
        Alert.alert("Success", "Configuration exported successfully!");
      } else {
        Alert.alert("Error", result.message || "Failed to export configuration");
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred");
    }
  };
  
  const handleImport = async () => {
    try {
      const result = await importConfiguration();
      if (result.success) {
        Alert.alert("Success", "Configuration imported successfully!");
      } else {
        Alert.alert("Error", result.message || "Failed to import configuration");
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred");
    }
  };
  
  const handleReset = () => {
    Alert.alert(
      "Reset to Defaults",
      "Are you sure you want to reset all settings to default values?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Reset",
          onPress: () => {
            resetToDefaults();
            Alert.alert("Success", "Settings have been reset to defaults");
          },
          style: "destructive"
        }
      ]
    );
  };
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Accessibility</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Reduced Motion</Text>
          <Switch
            value={reducedMotion}
            onValueChange={setReducedMotion}
            trackColor={{ false: '#334155', true: '#6366f1' }}
            thumbColor={reducedMotion ? '#fff' : '#f4f3f4'}
          />
        </View>
        <Text style={styles.settingDescription}>
          Reduces animations and motion effects for improved accessibility
        </Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>
        
        <TouchableOpacity style={styles.button} onPress={saveConfiguration}>
          <Save size={20} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Save Current Configuration</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={loadConfiguration}>
          <RefreshCw size={20} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Load Saved Configuration</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={handleExport}>
          <Share2 size={20} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Export Configuration</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={handleImport}>
          <Share2 size={20} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Import Configuration</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={handleReset}>
          <Trash2 size={20} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Reset to Defaults</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.aboutText}>
          Pixel Grid Creator v1.0.0
        </Text>
        <Text style={styles.aboutDescription}>
          Create beautiful interactive pixel grids with touch and voice control. This app allows you to customize grid patterns, colors, and animations, and control them with Alexa voice commands.
        </Text>
        
        {Platform.OS === 'web' && (
          <View style={styles.webNotice}>
            <Text style={styles.webNoticeText}>
              Note: Some features like Alexa integration are limited in web mode. For the full experience, please use the native iOS or Android app.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1e',
    padding: 20,
  },
  section: {
    marginBottom: 30,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#e0e0e0',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  settingLabel: {
    fontSize: 16,
    color: '#e0e0e0',
  },
  settingDescription: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    padding: 14,
    borderRadius: 8,
    marginBottom: 12,
  },
  dangerButton: {
    backgroundColor: '#991b1b',
  },
  buttonIcon: {
    marginRight: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  aboutText: {
    fontSize: 16,
    color: '#e0e0e0',
    marginBottom: 8,
  },
  aboutDescription: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  webNotice: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#4c1d95',
    borderRadius: 8,
  },
  webNoticeText: {
    fontSize: 14,
    color: '#e0e0e0',
  },
});