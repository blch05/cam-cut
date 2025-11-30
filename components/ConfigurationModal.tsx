import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { BackgroundRemovalService, PROVIDERS } from '../services/BackgroundRemovalService';

interface ConfigurationModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function ConfigurationModal({ visible, onClose, onSave }: ConfigurationModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('Remove.bg');
  const [loading, setLoading] = useState(false);
  const backgroundService = BackgroundRemovalService.getInstance();

  useEffect(() => {
    if (visible) {
      loadCurrentConfig();
    }
  }, [visible]);

  const loadCurrentConfig = async () => {
    await backgroundService.loadSavedConfig();
    const currentProvider = backgroundService.getCurrentProvider();
    setSelectedProvider(currentProvider.name);
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      Alert.alert('Error', 'Por favor ingresa una API Key válida');
      return;
    }

    setLoading(true);
    try {
      await backgroundService.setApiKey(apiKey, selectedProvider);
      Alert.alert('Éxito', 'Configuración guardada correctamente', [
        {
          text: 'OK',
          onPress: () => {
            onSave();
            onClose();
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      Alert.alert('Error', 'Por favor ingresa una API Key válida primero');
      return;
    }

    setLoading(true);
    try {
      await backgroundService.setApiKey(apiKey, selectedProvider);
      Alert.alert('Éxito', 'API Key configurada correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo verificar la API Key');
    } finally {
      setLoading(false);
    }
  };

  const renderProviderInfo = (providerName: string) => {
    const provider = PROVIDERS.find(p => p.name === providerName);
    if (!provider) return null;

    const getInstructions = (name: string) => {
      switch (name) {
        case 'Remove.bg':
          return {
            url: 'https://www.remove.bg/api',
            steps: [
              '1. Ve a remove.bg/api',
              '2. Crea una cuenta gratuita',
              '3. Obtén tu API key del dashboard',
              '4. Plan gratuito: 50 imágenes/mes'
            ]
          };
        case 'Photroom':
          return {
            url: 'https://www.photroom.com/api',
            steps: [
              '1. Ve a photroom.com/api',
              '2. Regístrate para obtener acceso',
              '3. Genera tu API key',
              '4. Plan gratuito disponible'
            ]
          };
        case 'Clipdrop':
          return {
            url: 'https://clipdrop.co/apis',
            steps: [
              '1. Ve a clipdrop.co/apis',
              '2. Crea una cuenta',
              '3. Obtén tu API key',
              '4. Créditos gratuitos incluidos'
            ]
          };
        default:
          return { url: '', steps: [] };
      }
    };

    const info = getInstructions(providerName);

    return (
      <View style={styles.providerInfo}>
        <Text style={styles.providerTitle}>{providerName}</Text>
        <Text style={styles.providerUrl}>{info.url}</Text>
        {info.steps.map((step, index) => (
          <Text key={index} style={styles.providerStep}>{step}</Text>
        ))}
        <Text style={styles.providerLimits}>
          Límite: {provider.maxFileSize ? `${Math.round(provider.maxFileSize / 1000000)}MB` : 'No especificado'} | 
          Formatos: {provider.supportedFormats.join(', ')}
        </Text>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Configuración de API</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Seleccionar Proveedor</Text>
          
          {PROVIDERS.map((provider) => (
            <TouchableOpacity
              key={provider.name}
              style={[
                styles.providerOption,
                selectedProvider === provider.name && styles.providerOptionSelected
              ]}
              onPress={() => setSelectedProvider(provider.name)}
            >
              <View style={styles.providerHeader}>
                <Text style={[
                  styles.providerName,
                  selectedProvider === provider.name && styles.providerNameSelected
                ]}>
                  {provider.name}
                </Text>
                <View style={[
                  styles.radioButton,
                  selectedProvider === provider.name && styles.radioButtonSelected
                ]}>
                  {selectedProvider === provider.name && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
              </View>
              {selectedProvider === provider.name && renderProviderInfo(provider.name)}
            </TouchableOpacity>
          ))}

          <Text style={styles.sectionTitle}>API Key</Text>
          <TextInput
            style={styles.input}
            placeholder="Ingresa tu API Key aquí..."
            value={apiKey}
            onChangeText={setApiKey}
            secureTextEntry={true}
            autoCapitalize="none"
            multiline={false}
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.testButton]}
              onPress={handleTestConnection}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Probando...' : 'Probar Conexión'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Guardando...' : 'Guardar'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.helpSection}>
            <Text style={styles.helpTitle}>💡 Consejos</Text>
            <Text style={styles.helpText}>
              • Remove.bg es el más popular y confiable{'\n'}
              • Photroom ofrece buena calidad para retratos{'\n'}
              • Clipdrop tiene herramientas adicionales de IA{'\n'}
              • Todas ofrecen planes gratuitos para comenzar
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 2,
    borderBottomColor: '#32CD32',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D2D2D',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    marginTop: 10,
  },
  providerOption: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  providerOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  providerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  providerNameSelected: {
    color: '#007AFF',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#007AFF',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
  },
  providerInfo: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  providerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  providerUrl: {
    fontSize: 12,
    color: '#007AFF',
    marginBottom: 8,
  },
  providerStep: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  providerLimits: {
    fontSize: 11,
    color: '#888',
    marginTop: 5,
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  testButton: {
    backgroundColor: '#8E8E8E',
  },
  saveButton: {
    backgroundColor: '#32CD32',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  helpSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginTop: 10,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});