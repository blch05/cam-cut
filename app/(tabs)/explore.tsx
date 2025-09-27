import GalleryScreen from '@/components/GalleryScreen';
import React from 'react';
import { StyleSheet } from 'react-native';

export default function TabTwoScreen() {
  return <GalleryScreen />;
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
});
