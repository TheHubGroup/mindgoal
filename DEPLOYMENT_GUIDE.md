# Guía de Despliegue para HostGator

## Paso 1: Preparar el Código Localmente

### 1.1 Instalar Node.js (si no lo tienes)
- Descarga Node.js desde: https://nodejs.org/
- Instala la versión LTS (recomendada)

### 1.2 Preparar el proyecto
1. Descarga todo el código del proyecto
2. Abre una terminal/cmd en la carpeta del proyecto
3. Ejecuta estos comandos:

```bash
# Instalar dependencias
npm install

# Compilar para producción
npm run build
```

## Paso 2: Configurar Variables de Entorno (Opcional)

Si quieres usar Supabase, crea un archivo `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=tu_url_de_supabase_aqui
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_aqui
```

Luego vuelve a ejecutar:
```bash
npm run build
```

## Paso 3: Subir a HostGator

### 3.1 Archivos a subir
- **SOLO sube la carpeta `dist`** que se genera después del build
- **NO subas** las carpetas: `node_modules`, `src`, ni archivos como `package.json`

### 3.2 Estructura en HostGator
```
public_html/
├── index.html (del contenido de dist/)
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── otros archivos...
└── vite.svg
```

### 3.3 Pasos en cPanel de HostGator
1. Accede a tu cPanel
2. Ve a "Administrador de archivos"
3. Navega a `public_html/`
4. **Elimina** cualquier archivo anterior (index.html, etc.)
5. **Sube TODO el contenido** de la carpeta `dist/`
6. Asegúrate de que `index.html` esté en la raíz de `public_html/`

## Paso 4: Configurar .htaccess (Importante para React)

Crea un archivo `.htaccess` en `public_html/` con este contenido:

```apache
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QR,L]
```

## Paso 5: Verificar

1. Visita tu dominio
2. La aplicación debería cargar correctamente
3. Si hay errores, revisa la consola del navegador (F12)

## Solución de Problemas Comunes

### Error: "Página en blanco"
- Verifica que `index.html` esté en `public_html/`
- Revisa que todos los archivos de `dist/` se hayan subido

### Error: "404 al navegar"
- Asegúrate de tener el archivo `.htaccess` configurado

### Error: "Archivos CSS/JS no cargan"
- Verifica que la carpeta `assets/` se haya subido completa
- Revisa los permisos de archivos (644 para archivos, 755 para carpetas)

### La aplicación funciona pero no guarda datos
- Esto es normal si no has configurado Supabase
- La app funcionará en "modo demo" con datos temporales

## Comandos Resumidos

```bash
# En tu computadora:
npm install
npm run build

# Luego sube SOLO el contenido de la carpeta 'dist/' a public_html/
```
