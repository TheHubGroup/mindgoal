# La Línea del Tiempo

Una aplicación interactiva para que los niños creen su propia línea del tiempo con notas coloridas y divertidas.

## 🚀 Despliegue en HostGator

### Pasos para subir a tu hosting:

1. **Construir la aplicación:**
   ```bash
   npm run build
   ```

2. **Subir archivos:**
   - Sube todo el contenido de la carpeta `dist/` a tu directorio público de HostGator
   - Usualmente es `public_html/` o `www/`

3. **Configurar dominio:**
   - La aplicación estará disponible en tu dominio principal
   - Si subes a una subcarpeta, accede via `tudominio.com/subcarpeta`

### 📁 Estructura después del build:
```
dist/
├── index.html          # Archivo principal
├── assets/            # CSS, JS y otros recursos
└── vite.svg          # Favicon
```

### 🔧 Configuración de Supabase

La aplicación ya está configurada con tu base de datos Supabase:
- URL: https://xrmbcjkzqkfkmvwyjvlh.supabase.co
- La tabla `timeline_notes` se creó automáticamente
- Políticas de seguridad configuradas para acceso público

### 🎯 Características:

- **Tres secciones:** Pasado, Presente, Futuro
- **Notas personalizables:** Colores, formas, fuentes y emojis
- **Arrastrar y soltar:** Posiciona las notas donde quieras
- **Persistencia:** Todas las notas se guardan en Supabase
- **Responsive:** Funciona en móviles y tablets
- **Modo demo:** Funciona sin conexión para pruebas

### 🛠️ Desarrollo local:

```bash
npm install
npm run dev
```

### 📱 Compatibilidad:
- Chrome, Firefox, Safari, Edge
- Dispositivos móviles y tablets
- Optimizado para niños de 10+ años
