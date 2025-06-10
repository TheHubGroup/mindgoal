# Configuración de Variables de Entorno en Netlify

## Problema
La aplicación muestra "Supabase not configured" porque las variables de entorno no están configuradas en Netlify.

## Solución

### 1. Obtener las credenciales de Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Ve a **Settings** > **API**
3. Copia los siguientes valores:
   - **Project URL** (ejemplo: `https://xrmbcjkzqkfkmvwyjvlh.supabase.co`)
   - **anon public** key (la clave larga que empieza con `eyJhbGciOiJIUzI1NiIs...`)

### 2. Configurar variables en Netlify

1. Ve a tu sitio en [Netlify Dashboard](https://app.netlify.com)
2. Ve a **Site settings** > **Environment variables**
3. Haz clic en **Add a variable**
4. Agrega estas dos variables:

   **Variable 1:**
   - Key: `VITE_SUPABASE_URL`
   - Value: `https://xrmbcjkzqkfkmvwyjvlh.supabase.co` (tu URL real)

   **Variable 2:**
   - Key: `VITE_SUPABASE_ANON_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIs...` (tu clave real)

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

## Notas Importantes

- Las variables deben empezar con `VITE_` para que Vite las incluya en el build
- Después de agregar las variables, SIEMPRE debes redesplegar el sitio
- No compartas las claves en repositorios públicos

## Si sigues teniendo problemas

1. Verifica que las variables estén escritas exactamente como se muestra
2. Asegúrate de haber redesplegado después de agregar las variables
3. Revisa la consola del navegador para más detalles del error