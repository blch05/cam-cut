# 📷 CamCut - Eliminador de Fondo con IA

Una aplicación de React Native/Expo que permite tomar fotos y eliminar el fondo automáticamente usando APIs de inteligencia artificial.

## ✨ Características

- **Cámara integrada**: Toma fotos directamente desde la app
- **Eliminación automática de fondo**: Usa IA para recortar el fondo de las imágenes
- **Múltiples proveedores de IA**: Compatible con Remove.bg, Photroom y Clipdrop
- **Galería integrada**: Visualiza y gestiona todas las imágenes procesadas
- **Guardado en galería**: Guarda las imágenes procesadas en tu galería de fotos
- **Interfaz moderna**: Diseño intuitivo y fácil de usar

## 🚀 Inicio Rápido

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar API Key
1. Abre la app y ve a la tab "Cámara"
2. Toca el botón de configuración (⚙️) en la esquina superior izquierda
3. Selecciona un proveedor de IA (recomendado: Remove.bg)
4. Obtén tu API Key siguiendo las instrucciones mostradas
5. Ingresa tu API Key y guarda la configuración

### 3. Ejecutar la aplicación
```bash
npm start
```

## 🔑 Configuración de API Keys

### Remove.bg (Recomendado)
1. Ve a [remove.bg/api](https://www.remove.bg/api)
2. Crea una cuenta gratuita
3. Obtén tu API key del dashboard
4. **Plan gratuito**: 50 imágenes por mes
5. **Calidad**: Excelente para todo tipo de imágenes

### Photroom
1. Ve a [photroom.com/api](https://www.photroom.com/api)  
2. Regístrate para obtener acceso
3. Genera tu API key
4. **Plan gratuito**: Disponible
5. **Calidad**: Muy bueno para retratos y productos

### Clipdrop
1. Ve a [clipdrop.co/apis](https://clipdrop.co/apis)
2. Crea una cuenta
3. Obtén tu API key
4. **Plan gratuito**: Créditos incluidos
5. **Calidad**: Bueno, con herramientas adicionales de IA

## 📱 Cómo Usar

### Tomar y Procesar Fotos
1. **Configuración inicial**: Asegúrate de tener una API key configurada
2. **Tomar foto**: Toca el botón rojo de captura en la pantalla de cámara
3. **Procesamiento automático**: La app eliminará el fondo automáticamente
4. **Ver resultado**: Se mostrará la imagen con el fondo removido
5. **Guardar**: Toca "💾 Guardar" para guardar en tu galería
6. **Nueva foto**: Toca "📷 Nueva foto" para tomar otra imagen

### Gestionar Galería
1. Ve a la tab "Galería"
2. **Ver imágenes**: Todas las imágenes procesadas aparecerán aquí
3. **Vista previa**: Toca cualquier imagen para verla en tamaño completo
4. **Guardar**: Toca 💾 para guardar una imagen en tu galería
5. **Eliminar**: Toca 🗑️ para eliminar una imagen de la app
6. **Actualizar**: Desliza hacia abajo para refrescar la lista

## 🛠️ Estructura del Proyecto

```
cam-cut/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx        # Pantalla de cámara
│   │   ├── explore.tsx      # Pantalla de galería
│   │   └── _layout.tsx      # Layout de tabs
├── components/
│   ├── CameraScreen.tsx     # Componente principal de cámara
│   ├── GalleryScreen.tsx    # Componente de galería
│   └── ConfigurationModal.tsx # Modal de configuración
├── services/
│   └── BackgroundRemovalService.ts # Servicio para APIs de IA
└── package.json
```

## 🔧 Tecnologías Utilizadas

- **React Native & Expo**: Framework de desarrollo
- **expo-camera**: Acceso a la cámara del dispositivo
- **expo-image-manipulator**: Procesamiento de imágenes
- **expo-media-library**: Acceso a la galería del dispositivo
- **expo-file-system**: Gestión de archivos
- **AsyncStorage**: Almacenamiento local de configuración
- **TypeScript**: Tipado estático

## 📝 Dependencias Clave

```json
{
  "expo-camera": "~17.0.8",
  "expo-image-manipulator": "latest", 
  "expo-media-library": "latest",
  "expo-file-system": "~19.0.7",
  "@react-native-async-storage/async-storage": "latest"
}
```

## 🎨 Características de la Interfaz

### Pantalla de Cámara
- **Vista previa en tiempo real** de la cámara
- **Indicador de estado** de configuración
- **Instrucciones contextuale**s según el estado
- **Botón de captura** intuitivo
- **Overlay de carga** durante el procesamiento

### Pantalla de Resultados
- **Vista previa** de la imagen procesada
- **Botones de acción** claramente diferenciados
- **Feedback visual** del proceso

### Galería
- **Lista de imágenes** con miniaturas
- **Información detallada** (fecha, tamaño)
- **Vista previa modal** en pantalla completa
- **Acciones rápidas** (guardar/eliminar)

### Configuración
- **Selección de proveedor** con información detallada
- **Instrucciones paso a paso** para obtener API keys
- **Validación de API keys**
- **Consejos y mejores prácticas**

## 🚨 Permisos Necesarios

La app solicita los siguientes permisos:
- **Cámara**: Para tomar fotografías
- **Galería/Media Library**: Para guardar las imágenes procesadas

## 🔍 Solución de Problemas

### Error: "API Key no configurada"
- Ve a configuración (⚙️) y ingresa una API key válida

### Error: "No hay acceso a la cámara"
- Ve a Configuración del dispositivo > Privacidad > Cámara
- Habilita el acceso para la aplicación

### Error: "No se pudo eliminar el fondo"
- Verifica tu conexión a internet
- Asegúrate de que tu API key sea válida
- Comprueba que no hayas excedido el límite de tu plan

### La imagen es muy pesada
- La app comprime automáticamente las imágenes grandes
- Los límites por proveedor:
  - Remove.bg: 12MB
  - Photroom: 10MB  
  - Clipdrop: 10MB

## 💡 Consejos para Mejores Resultados

1. **Iluminación**: Usa buena iluminación para mejores resultados
2. **Contraste**: Asegúrate de que haya buen contraste entre el sujeto y el fondo
3. **Enfoque**: Mantén el sujeto enfocado y nítido
4. **Fondo simple**: Los fondos simples dan mejores resultados
5. **Personas**: Funciona excelentemente con retratos de personas
6. **Productos**: Ideal para fotografía de productos

## 🔄 Actualizaciones Futuras

- [ ] Edición manual de bordes
- [ ] Aplicación de fondos personalizados
- [ ] Procesamiento por lotes
- [ ] Integración con más APIs de IA
- [ ] Filtros y efectos adicionales
- [ ] Export en diferentes formatos
- [ ] Ajustes de calidad personalizables

## 📄 Licencia

Este proyecto está bajo la licencia MIT.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:
1. Haz un fork del proyecto
2. Crea una rama para tu feature
3. Haz commit de tus cambios
4. Push a la rama
5. Abre un Pull Request

---

**¡Disfruta eliminando fondos con IA! 🎉**