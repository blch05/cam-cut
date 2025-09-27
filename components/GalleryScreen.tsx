import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
    Image,
    Modal,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface ProcessedImage {
  uri: string;
  name: string;
  date: string;
  size: number;
}

export default function GalleryScreen() {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ProcessedImage | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    setLoading(true);
    try {
      const documentDir = (FileSystem as any).documentDirectory;
      if (!documentDir) return;

      const files = await FileSystem.readDirectoryAsync(documentDir);
      const processedFiles = files.filter(file => 
        file.includes('processed_') && (file.endsWith('.png') || file.endsWith('.jpg'))
      );

      const imagePromises = processedFiles.map(async (fileName) => {
        const fileUri = `${documentDir}${fileName}`;
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        
        return {
          uri: fileUri,
          name: fileName,
          date: fileInfo.exists && 'modificationTime' in fileInfo && fileInfo.modificationTime 
            ? new Date(fileInfo.modificationTime).toLocaleDateString() 
            : 'Desconocida',
          size: fileInfo.exists && 'size' in fileInfo ? fileInfo.size : 0,
        };
      });

      const imageDetails = await Promise.all(imagePromises);
      // Ordenar por fecha más reciente
      imageDetails.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setImages(imageDetails);
    } catch (error) {
      console.error('Error loading images:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const saveToGallery = async (image: ProcessedImage) => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos necesarios', 'Necesitas dar permisos para guardar en la galería');
        return;
      }

      await MediaLibrary.saveToLibraryAsync(image.uri);
      Alert.alert('Éxito', '¡Imagen guardada en la galería!');
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la imagen en la galería');
    }
  };

  const deleteImage = async (image: ProcessedImage) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que quieres eliminar esta imagen?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await FileSystem.deleteAsync(image.uri);
              setImages(images.filter(img => img.uri !== image.uri));
              Alert.alert('Éxito', 'Imagen eliminada correctamente');
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar la imagen');
            }
          }
        }
      ]
    );
  };

  const renderImageItem = ({ item }: { item: ProcessedImage }) => (
    <TouchableOpacity
      style={styles.imageItem}
      onPress={() => {
        setSelectedImage(item);
        setShowPreview(true);
      }}
    >
      <Image source={{ uri: item.uri }} style={styles.thumbnail} />
      <View style={styles.imageInfo}>
        <Text style={styles.imageName} numberOfLines={1}>
          {item.name.replace('processed_', '').replace(/\.[^/.]+$/, '')}
        </Text>
        <Text style={styles.imageDate}>{item.date}</Text>
        <Text style={styles.imageSize}>{formatFileSize(item.size)}</Text>
      </View>
      <View style={styles.imageActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.saveButton]}
          onPress={() => saveToGallery(item)}
        >
          <Text style={styles.actionButtonText}>💾</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => deleteImage(item)}
        >
          <Text style={styles.actionButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>📷</Text>
      <Text style={styles.emptyStateTitle}>No hay imágenes procesadas</Text>
      <Text style={styles.emptyStateText}>
        Usa la cámara para tomar fotos y eliminar el fondo automáticamente
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Galería Procesada</Text>
        <Text style={styles.subtitle}>{images.length} imagen{images.length !== 1 ? 'es' : ''}</Text>
      </View>

      <FlatList
        data={images}
        renderItem={renderImageItem}
        keyExtractor={(item) => item.uri}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadImages} />
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={images.length === 0 ? styles.emptyContainer : styles.listContainer}
      />

      {/* Modal de preview */}
      <Modal
        visible={showPreview}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPreview(false)}
      >
        {selectedImage && (
          <View style={styles.previewContainer}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>Vista previa</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowPreview(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.previewImageContainer}>
              <Image
                source={{ uri: selectedImage.uri }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            </View>
            
            <View style={styles.previewActions}>
              <TouchableOpacity
                style={[styles.previewButton, styles.previewSaveButton]}
                onPress={() => {
                  saveToGallery(selectedImage);
                  setShowPreview(false);
                }}
              >
                <Text style={styles.previewButtonText}>💾 Guardar en Galería</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.previewButton, styles.previewDeleteButton]}
                onPress={() => {
                  deleteImage(selectedImage);
                  setShowPreview(false);
                }}
              >
                <Text style={styles.previewButtonText}>🗑️ Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

const { width } = Dimensions.get('window');
const thumbnailSize = (width - 60) / 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#32CD32',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  listContainer: {
    padding: 15,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  imageItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  imageInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  imageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  imageDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  imageSize: {
    fontSize: 12,
    color: '#999',
  },
  imageActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
  actionButtonText: {
    fontSize: 16,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
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
  previewImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  previewImage: {
    width: '90%',
    height: '80%',
  },
  previewActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
  },
  previewButton: {
    flex: 1,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  previewSaveButton: {
    backgroundColor: '#32CD32',
  },
  previewDeleteButton: {
    backgroundColor: '#FF5722',
  },
  previewButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});