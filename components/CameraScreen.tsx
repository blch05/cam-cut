import { Camera, CameraView } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BackgroundRemovalService } from '../services/BackgroundRemovalService';
import ConfigurationModal from './ConfigurationModal';

export default function CameraScreen({ onImageSaved }: { onImageSaved?: (uri: string) => void }) {
  const cameraRef = useRef<any>(null);
  const [hasPermission, setHasPermission] = useState<null | boolean>(null);
  const [hasMediaPermission, setHasMediaPermission] = useState<null | boolean>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [processedUri, setProcessedUri] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [loadingText, setLoadingText] = useState('Procesando...');
  
  const backgroundService = BackgroundRemovalService.getInstance();
  const { width, height } = Dimensions.get('window');

  useEffect(() => {
    requestPermissions();
    checkConfiguration();
  }, []);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync();
    
    setHasPermission(cameraStatus === 'granted');
    setHasMediaPermission(mediaStatus === 'granted');
  };

  const checkConfiguration = async () => {
    await backgroundService.loadSavedConfig();
    setIsConfigured(backgroundService.isConfigured());
  };

  const takePicture = async () => {
    if (!isConfigured) {
      Alert.alert(
        'Configuración necesaria',
        'Necesitas configurar una API key para usar esta funcionalidad',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Configurar', onPress: () => setShowConfig(true) }
        ]
      );
      return;
    }

    if (!cameraRef.current) {
      Alert.alert('Error', 'Cámara no disponible');
      return;
    }

    setIsLoading(true);
    setLoadingText('Tomando foto...');
    
    try {
      console.log('Tomando foto...');
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8, // Reducir calidad para evitar archivos muy grandes
        base64: false,
        skipProcessing: false,
      });
      
      if (!photo || !photo.uri) {
        throw new Error('No se pudo capturar la imagen');
      }
      
      console.log('Foto tomada:', photo.uri);
      setPhotoUri(photo.uri);
      
      // Procesar en segundo plano
      await removeBackground(photo.uri);
      
    } catch (error: any) {
      console.error('Error tomando foto:', error);
      
      let errorMessage = 'No se pudo tomar la foto';
      if (error?.message?.includes('permission')) {
        errorMessage = 'Permisos de cámara denegados. Ve a configuración y habilita el acceso.';
      } else if (error?.message?.includes('busy')) {
        errorMessage = 'Cámara ocupada. Espera un momento e intenta nuevamente.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const removeBackground = async (uri: string) => {
    try {
      setLoadingText('Validando imagen...');
      
      // Verificar que la URI sea válida
      if (!uri || uri.trim() === '') {
        throw new Error('URI de imagen inválida');
      }
      
      console.log('Procesando imagen:', uri);
      setLoadingText('Conectando con servidor de IA...');
      
      const result = await backgroundService.removeBackground(uri);
      
      if (result.success && result.uri) {
        console.log('Imagen procesada exitosamente:', result.uri);
        setProcessedUri(result.uri);
        if (onImageSaved) {
          onImageSaved(result.uri);
        }
      } else {
        console.error('Error procesando imagen:', result.error);
        
        // Mostrar errores más específicos
        let errorMessage = result.error || 'No se pudo eliminar el fondo';
        
        if (errorMessage.includes('API Key')) {
          errorMessage = 'API Key no configurada. Ve a configuración y añade tu clave.';
        } else if (errorMessage.includes('muy grande')) {
          errorMessage = 'La imagen es muy grande. Intenta con una imagen más pequeña.';
        } else if (errorMessage.includes('no existe')) {
          errorMessage = 'No se pudo acceder a la imagen. Intenta tomarla nuevamente.';
        } else if (errorMessage.includes('conexión') || errorMessage.includes('network')) {
          errorMessage = 'Error de conexión. Verifica tu internet e intenta nuevamente.';
        }
        
        Alert.alert('Error al procesar', errorMessage);
      }
    } catch (error: any) {
      console.error('Error en removeBackground:', error);
      Alert.alert(
        'Error', 
        error?.message || 'Error inesperado al procesar la imagen'
      );
    }
  };

  const saveToGallery = async () => {
    if (!processedUri) return;
    
    if (!hasMediaPermission) {
      Alert.alert('Permisos necesarios', 'Necesitas dar permisos para guardar en la galería');
      return;
    }

    try {
      setLoadingText('Guardando...');
      setIsLoading(true);
      
      await MediaLibrary.saveToLibraryAsync(processedUri);
      Alert.alert('Éxito', '¡Imagen guardada en la galería!');
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la imagen');
    } finally {
      setIsLoading(false);
    }
  };

  const resetCapture = () => {
    setPhotoUri(null);
    setProcessedUri(null);
  };

  const handleConfigSaved = () => {
    checkConfiguration();
  };

  if (hasPermission === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.permissionText}>Solicitando permisos de cámara...</Text>
      </View>
    );
  }
  
  if (hasPermission === false) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>No hay acceso a la cámara</Text>
        <Text style={styles.errorSubtext}>
          Ve a Configuración {">"} Privacidad {">"} Cámara y habilita el acceso para esta app
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Modal de configuración */}
      <ConfigurationModal
        visible={showConfig}
        onClose={() => setShowConfig(false)}
        onSave={handleConfigSaved}
      />

      {/* Loading overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>{loadingText}</Text>
          </View>
        </View>
      )}

      {processedUri ? (
        // Vista de resultado
        <View style={styles.resultContainer}>
          <View style={styles.imageContainer}>
            <Text style={styles.resultTitle}>¡Fondo eliminado!</Text>
            <Image 
              source={{ uri: processedUri }} 
              style={styles.processedImage}
              resizeMode="contain"
            />
          </View>
          
          <View style={styles.resultButtonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.saveButton]} 
              onPress={saveToGallery}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>💾 Guardar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.newPhotoButton]} 
              onPress={resetCapture}
            >
              <Text style={[styles.buttonText, { color: '#32CD32' }]}>📷 Nueva foto</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        // Vista de cámara
        <>
          <CameraView style={styles.camera} ref={cameraRef} facing="back" />
          
          {/* Header con botón de configuración */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.configButton}
              onPress={() => setShowConfig(true)}
            >
              <Text style={styles.configButtonText}>⚙️</Text>
            </TouchableOpacity>
            
            <View style={styles.statusIndicator}>
              <View style={[
                styles.statusDot, 
                isConfigured ? styles.statusDotActive : styles.statusDotInactive
              ]} />
              <Text style={styles.statusText}>
                {isConfigured ? 'Configurado' : 'Sin configurar'}
              </Text>
            </View>
          </View>
          
          {/* Instrucciones */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsText}>
              {isConfigured 
                ? '📸 Toma una foto para eliminar el fondo automáticamente'
                : '⚙️ Configura tu API key primero'
              }
            </Text>
          </View>
          
          {/* Controles de cámara */}
          <View style={styles.cameraControls}>
            <TouchableOpacity 
              style={[
                styles.captureButton,
                !isConfigured && styles.captureButtonDisabled
              ]}
              onPress={takePicture} 
              disabled={isLoading || !isConfigured}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  permissionText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorSubtext: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  camera: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 100,
  },
  configButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#32CD32',
    shadowColor: '#32CD32',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  configButtonText: {
    fontSize: 20,
    color: '#32CD32',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#32CD32',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusDotActive: {
    backgroundColor: '#32CD32',
  },
  statusDotInactive: {
    backgroundColor: '#FF5722',
  },
  statusText: {
    color: '#2D2D2D',
    fontSize: 12,
    fontWeight: '600',
  },
  instructionsContainer: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    zIndex: 100,
  },
  instructionsText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
    borderRadius: 8,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    alignItems: 'center',
    zIndex: 100,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#32CD32',
    shadowColor: '#32CD32',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 8,
  },
  captureButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  captureButtonInner: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: '#32CD32',
  },
  resultContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  processedImage: {
    width: Dimensions.get('window').width - 40,
    height: Dimensions.get('window').height * 0.6,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  resultButtonContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
  },
  button: {
    flex: 1,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  saveButton: {
    backgroundColor: '#32CD32',
  },
  newPhotoButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#32CD32',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});