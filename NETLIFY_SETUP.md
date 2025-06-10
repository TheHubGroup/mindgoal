# Configuración de Variables de Entorno en Netlify

## Problema
La aplicación muestra "Supabase not configured" porque las variables de entorno no están configuradas en Netlify.

## Solución

### 1. Credenciales de Supabase (ACTUALIZADAS)

**URL del proyecto:** `https://tcrzwztmwryjdnkvmwzu.supabase.co`
**Clave anónima:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjcnp3enRtd3J5amRua3Ztd3p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NzAxMzgsImV4cCI6MjA2NTE0NjEzOH0.LPj-QXKhLDPkzHowFWcLytPZEry87qY5n1GCuAuj9FA`

### 2. Configurar variables en Netlify

1. Ve a tu sitio en [Netlify Dashboard](https://app.netlify.com)
2. Ve a **Site settings** > **Environment variables**
3. Haz clic en **Add a variable**
4. Agrega estas dos variables:

   **Variable 1:**
   - Key: `VITE_SUPABASE_URL`
   - Value: `https://tcrzwztmwryjdnkvmwzu.supabase.co`

   **Variable 2:**
   - Key: `VITE_SUPABASE_ANON_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjcnp3enRtd3J5amRua3Ztd3p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NzAxMzgsImV4cCI6MjA2NTE0NjEzOH0.LPj-QXKhLDPkzHowFWcLytPZEry87qY5n1GCuAuj9FA`

### 3. Redesplegar el sitio

1. Ve a **Deploys** en tu sitio de Netlify
2. Haz clic en **Trigger deploy** > **Deploy site**
3. Espera a que termine el despliegue

### 4. Verificar

1. Ve a tu sitio web
2. Abre las herramientas de desarrollador (F12)
3. Ve a la consola
4. Deberías ver:
   - "Supabase URL: Configured"
   - "Supabase Anon Key: Configured"

## Pasos Rápidos (Copia y Pega)

### Variables para Netlify:

```
VITE_SUPABASE_URL=https://tcrzwztmwryjdnkvmwzu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjcnp3enRtd3J5amRua3Ztd3p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NzAxMzgsImV4cCI6MjA2NTE0NjEzOH0.LPj-QXKhLDPkzHowFWcLytPZEry87qY5n1GCuAuj9FA
```

## Notas Importantes

- ✅ Las credenciales ya están actualizadas con el nuevo proyecto de Supabase
- ✅ Las variables deben empezar con `VITE_` para que Vite las incluya en el build
- ✅ Después de agregar las variables, SIEMPRE debes redesplegar el sitio
- ⚠️ No compartas las claves en repositorios públicos

## Si sigues teniendo problemas

1. Verifica que las variables estén escritas exactamente como se muestra arriba
2. Asegúrate de haber redesplegado después de agregar las variables
3. Revisa la consola del navegador para más detalles del error
4. Verifica que el nuevo proyecto de Supabase tenga las tablas necesarias configuradas

## Configuración de Base de Datos

Recuerda que necesitas ejecutar las migraciones en el nuevo proyecto de Supabase:
1. Ve a Supabase Dashboard > SQL Editor
2. Ejecuta la migración `20250610160103_scarlet_villa.sql` para crear las tablas necesarias