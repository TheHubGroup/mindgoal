# 🚀 Configuración de Variables de Entorno en Netlify

## ❌ Problema Actual
La aplicación muestra "Supabase not configured" porque las variables de entorno no están configuradas en el servidor de Netlify.

## ✅ Solución Paso a Paso

### 1. Credenciales de Supabase (ACTUALIZADAS)

**URL del proyecto:** `https://tcrzwztmwryjdnkvmwzu.supabase.co`
**Clave anónima:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjcnp3enRtd3J5amRua3Ztd3p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NzAxMzgsImV4cCI6MjA2NTE0NjEzOH0.LPj-QXKhLDPkzHowFWcLytPZEry87qY5n1GCuAuj9FA`

### 2. Configurar en Netlify Dashboard

1. **Ve a tu sitio en Netlify:**
   - Abre [https://app.netlify.com](https://app.netlify.com)
   - Busca tu sitio: `fancy-taiyaki-05f568`

2. **Accede a la configuración:**
   - Haz clic en tu sitio
   - Ve a **Site settings** (en el menú lateral)
   - Haz clic en **Environment variables** (en el menú lateral)

3. **Agregar las variables:**
   - Haz clic en **Add a variable**
   
   **Variable 1:**
   - Key: `VITE_SUPABASE_URL`
   - Value: `https://tcrzwztmwryjdnkvmwzu.supabase.co`
   - Haz clic en **Create variable**

   **Variable 2:**
   - Key: `VITE_SUPABASE_ANON_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjcnp3enRtd3J5amRua3Ztd3p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NzAxMzgsImV4cCI6MjA2NTE0NjEzOH0.LPj-QXKhLDPkzHowFWcLytPZEry87qY5n1GCuAuj9FA`
   - Haz clic en **Create variable**

### 3. Redesplegar el Sitio (IMPORTANTE)

1. **Ve a la sección Deploys:**
   - Haz clic en **Deploys** (en el menú superior)

2. **Forzar un nuevo despliegue:**
   - Haz clic en **Trigger deploy** (botón verde)
   - Selecciona **Deploy site**
   - Espera a que termine (aparecerá "Published" cuando esté listo)

### 4. Verificar que Funciona

1. **Ve a tu sitio:**
   - Abre: https://fancy-taiyaki-05f568.netlify.app

2. **Verificar en la consola:**
   - Presiona F12 para abrir las herramientas de desarrollador
   - Ve a la pestaña **Console**
   - Deberías ver:
     ```
     Supabase URL: Configured
     Supabase Anon Key: Configured
     ```

3. **Probar el login:**
   - Intenta hacer login con cualquier cuenta
   - Ya no debería aparecer "Supabase not configured"

## 📋 Resumen de Variables (Para Copiar y Pegar)

```
VITE_SUPABASE_URL=https://tcrzwztmwryjdnkvmwzu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjcnp3enRtd3J5amRua3Ztd3p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NzAxMzgsImV4cCI6MjA2NTE0NjEzOH0.LPj-QXKhLDPkzHowFWcLytPZEry87qY5n1GCuAuj9FA
```

## ⚠️ Puntos Importantes

- ✅ **SIEMPRE redesplegar:** Después de agregar variables, DEBES redesplegar el sitio
- ✅ **Prefijo VITE_:** Las variables deben empezar con `VITE_` para que funcionen
- ✅ **Exactitud:** Copia las variables exactamente como están escritas
- ✅ **Base de datos:** El nuevo proyecto de Supabase ya tiene las tablas configuradas

## 🔧 Si Sigues Teniendo Problemas

1. **Verifica las variables:**
   - Ve a Site settings > Environment variables
   - Confirma que ambas variables estén ahí
   - Verifica que no tengan espacios extra

2. **Verifica el despliegue:**
   - Ve a Deploys
   - Confirma que el último deploy sea DESPUÉS de agregar las variables
   - Si no, haz otro "Trigger deploy"

3. **Limpia la caché:**
   - Presiona Ctrl+F5 (o Cmd+Shift+R en Mac) para recargar sin caché

4. **Verifica en la consola:**
   - Si ves errores diferentes, compártelos para ayudarte mejor

## 🎯 Resultado Esperado

Después de seguir estos pasos:
- ✅ La aplicación cargará sin errores
- ✅ Podrás registrar nuevos usuarios
- ✅ Podrás hacer login
- ✅ Los perfiles se guardarán en Supabase
- ✅ Las actividades funcionarán correctamente

¡Una vez configurado, tu aplicación estará completamente funcional!