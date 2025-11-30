import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';

export interface BackgroundRemovalProvider {
  name: string;
  apiKey?: string;
  endpoint: string;
  maxFileSize?: number;
  supportedFormats: string[];
}

export const PROVIDERS: BackgroundRemovalProvider[] = [
  {
    name: 'Remove.bg',
    endpoint: 'https://api.remove.bg/v1.0/removebg',
    maxFileSize: 12000000, // 12MB
    supportedFormats: ['jpg', 'jpeg', 'png', 'webp']
  },
  {
    name: 'Photroom',
    endpoint: 'https://image-api.photroom.com/v1/segment',
    maxFileSize: 10000000, // 10MB
    supportedFormats: ['jpg', 'jpeg', 'png']
  },
  {
    name: 'Clipdrop',
    endpoint: 'https://clipdrop-api.co/remove-background/v1',
    maxFileSize: 10000000, // 10MB
    supportedFormats: ['jpg', 'jpeg', 'png', 'webp']
  }
];

export class BackgroundRemovalService {
  private static instance: BackgroundRemovalService;
  private currentProvider: BackgroundRemovalProvider;
  private apiKey: string | null = null;

  private constructor() {
    this.currentProvider = PROVIDERS[0]; // Remove.bg por defecto
  }

  public static getInstance(): BackgroundRemovalService {
    if (!BackgroundRemovalService.instance) {
      BackgroundRemovalService.instance = new BackgroundRemovalService();
    }
    return BackgroundRemovalService.instance;
  }

  // Configurar API Key
  async setApiKey(key: string, provider?: string): Promise<void> {
    this.apiKey = key;
    await AsyncStorage.setItem('background_removal_api_key', key);
    
    if (provider) {
      const selectedProvider = PROVIDERS.find(p => p.name === provider);
      if (selectedProvider) {
        this.currentProvider = selectedProvider;
        await AsyncStorage.setItem('background_removal_provider', provider);
      }
    }
  }

  // Cargar configuración guardada
  async loadSavedConfig(): Promise<void> {
    try {
      const savedKey = await AsyncStorage.getItem('background_removal_api_key');
      const savedProvider = await AsyncStorage.getItem('background_removal_provider');
      
      if (savedKey) {
        this.apiKey = savedKey;
      }
      
      if (savedProvider) {
        const provider = PROVIDERS.find(p => p.name === savedProvider);
        if (provider) {
          this.currentProvider = provider;
        }
      }
    } catch (error) {
      console.log('Error loading saved config:', error);
    }
  }

  // Obtener proveedores disponibles
  getProviders(): BackgroundRemovalProvider[] {
    return PROVIDERS;
  }

  // Cambiar proveedor
  setProvider(providerName: string): boolean {
    const provider = PROVIDERS.find(p => p.name === providerName);
    if (provider) {
      this.currentProvider = provider;
      return true;
    }
    return false;
  }

  // Verificar si el archivo es válido
  private async validateImage(uri: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      
      if (!fileInfo.exists) {
        return { valid: false, error: 'El archivo no existe' };
      }

      // Verificar tamaño del archivo si está disponible
      const maxSize = this.currentProvider.maxFileSize || 12000000;
      if (fileInfo.exists && (fileInfo as any).size && (fileInfo as any).size > maxSize) {
        return { valid: false, error: 'El archivo es muy grande' };
      }

      return { valid: true };
    } catch (error: any) {
      console.error('Error validating image:', error);
      return { valid: false, error: error?.message || 'Error al validar la imagen' };
    }
  }

  // Comprimir imagen si es necesario
  private async compressImageIfNeeded(uri: string): Promise<string> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      const maxSize = this.currentProvider.maxFileSize || 12000000;
      
      // Verificar si necesita compresión
      if (fileInfo.exists && (fileInfo as any).size && (fileInfo as any).size > maxSize) {
        console.log('Comprimiendo imagen...', (fileInfo as any).size, 'bytes');
        
        // Comprimir la imagen
        const compressedImage = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 1024 } }], // Redimensionar manteniendo aspecto
          {
            compress: 0.7,
            format: ImageManipulator.SaveFormat.JPEG,
          }
        );
        
        console.log('Imagen comprimida:', compressedImage.uri);
        return compressedImage.uri;
      }
      
      return uri;
    } catch (error) {
      console.error('Error comprimiendo imagen:', error);
      // Si falla la compresión, devolver la imagen original
      return uri;
    }
  }

  // Remover fondo usando Remove.bg
  private async removeBackgroundRemoveBg(uri: string): Promise<Blob> {
    const formData = new FormData();
    formData.append('image_file', {
      uri,
      name: 'photo.jpg',
      type: 'image/jpeg',
    } as any);
    formData.append('size', 'auto');

    const response = await fetch(this.currentProvider.endpoint, {
      method: 'POST',
      headers: {
        'X-Api-Key': this.apiKey!,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Error de Remove.bg: ${error}`);
    }

    return response.blob();
  }

  // Remover fondo usando Photroom
  private async removeBackgroundPhotroom(uri: string): Promise<Blob> {
    const formData = new FormData();
    formData.append('image_file', {
      uri,
      name: 'photo.jpg',
      type: 'image/jpeg',
    } as any);

    const response = await fetch(this.currentProvider.endpoint, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey!,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Error de Photroom: ${error}`);
    }

    return response.blob();
  }

  // Remover fondo usando Clipdrop
  private async removeBackgroundClipdrop(uri: string): Promise<Blob> {
    const formData = new FormData();
    formData.append('image_file', {
      uri,
      name: 'photo.jpg',
      type: 'image/jpeg',
    } as any);

    const response = await fetch(this.currentProvider.endpoint, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey!,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Error de Clipdrop: ${error}`);
    }

    return response.blob();
  }

  // Convertir blob a base64
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = (reader.result as string).split(',')[1];
        resolve(base64data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Función principal para remover fondo
  async removeBackground(uri: string, options?: {
    quality?: 'auto' | 'hd' | '4k';
    format?: 'png' | 'jpg' | 'webp';
  }): Promise<{ success: boolean; uri?: string; error?: string }> {
    try {
      console.log('Iniciando eliminación de fondo para:', uri);
      
      if (!this.apiKey) {
        return { success: false, error: 'API Key no configurada' };
      }

      if (!uri || uri.trim() === '') {
        return { success: false, error: 'URI de imagen inválida' };
      }

      // Validar imagen
      console.log('Validando imagen...');
      const validation = await this.validateImage(uri);
      if (!validation.valid) {
        console.error('Validación falló:', validation.error);
        return { success: false, error: validation.error };
      }

      // Comprimir si es necesario
      console.log('Comprimiendo imagen si es necesario...');
      const processedUri = await this.compressImageIfNeeded(uri);

      let resultBlob: Blob;

      // Procesar según el proveedor
      console.log('Procesando con proveedor:', this.currentProvider.name);
      switch (this.currentProvider.name) {
        case 'Remove.bg':
          resultBlob = await this.removeBackgroundRemoveBg(processedUri);
          break;
        case 'Photroom':
          resultBlob = await this.removeBackgroundPhotroom(processedUri);
          break;
        case 'Clipdrop':
          resultBlob = await this.removeBackgroundClipdrop(processedUri);
          break;
        default:
          return { success: false, error: 'Proveedor no soportado' };
      }

      // Verificar que el blob sea válido
      if (!resultBlob || resultBlob.size === 0) {
        return { success: false, error: 'Respuesta vacía del servidor' };
      }

      // Guardar resultado
      console.log('Guardando resultado...');
      const base64Data = await this.blobToBase64(resultBlob);
      const timestamp = Date.now();
      const fileName = `processed_${timestamp}.png`;
      
      // Verificar que documentDirectory esté disponible
      const docDir = (FileSystem as any).documentDirectory;
      if (!docDir) {
        return { success: false, error: 'No se puede acceder al directorio de documentos' };
      }
      
      const finalUri = docDir + fileName;

      await FileSystem.writeAsStringAsync(finalUri, base64Data, {
        encoding: 'base64' as any,
      });

      console.log('Imagen guardada en:', finalUri);

      return { success: true, uri: finalUri };

    } catch (error: any) {
      console.error('Error removing background:', error);
      return { success: false, error: error.message || 'Error desconocido' };
    }
  }

  // Obtener información del proveedor actual
  getCurrentProvider(): BackgroundRemovalProvider {
    return this.currentProvider;
  }

  // Verificar si está configurado
  isConfigured(): boolean {
    return !!this.apiKey;
  }
}