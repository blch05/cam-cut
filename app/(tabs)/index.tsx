import CameraScreen from '@/components/CameraScreen';
import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

export default function HomeScreen() {
  const [processedImageUri, setProcessedImageUri] = useState<string | null>(null);

  const handleImageSaved = (uri: string) => {
    setProcessedImageUri(uri);
    Alert.alert(
      '¡Éxito!', 
      'Imagen procesada correctamente. El fondo ha sido eliminado.',
      [
        { text: 'OK', style: 'default' }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <CameraScreen onImageSaved={handleImageSaved} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
