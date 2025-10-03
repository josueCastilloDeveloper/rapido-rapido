# Rápido Rápido ⏱️

Una aplicación web móvil para medir el tiempo de actividades diarias con estadísticas y gráficas.

## 🚀 Características

- ✅ Crear actividades personalizadas con emojis
- ✅ Crear recorridos de actividades
- ✅ Cronómetro en tiempo real para recorridos
- ✅ Estadísticas detalladas con gráficas
- ✅ Diseño mobile-first colorido y cartoon
- ✅ Base de datos persistente con Vercel KV

## 🛠️ Tecnologías

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Base de datos**: Vercel KV (Redis)
- **Deploy**: Vercel

## 📱 Configuración para Producción

### 1. Configurar Vercel KV

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Ve a la pestaña **Storage**
3. Haz clic en **Create Database** y selecciona **KV**
4. Conecta la base de datos a tu proyecto
5. Las variables de entorno se configurarán automáticamente

### 2. Variables de Entorno

Vercel configurará automáticamente estas variables:
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`

### 3. Deploy

```bash
# Instalar dependencias
npm install

# Build para producción
npm run build

# Deploy a Vercel
vercel --prod
```

## 🏗️ Estructura del Proyecto

```
├── app/
│   ├── api/                 # API Routes
│   │   ├── activities/      # CRUD de actividades
│   │   ├── routines/        # CRUD de recorridos
│   │   └── completed-routines/ # Historial de recorridos
│   └── page.tsx            # Página principal
├── lib/
│   └── db.ts              # Funciones de base de datos
└── next.config.ts         # Configuración de Next.js
```

## 🎯 Uso

1. **Crear Actividades**: Define actividades como "Lavarme los dientes" 🦷
2. **Crear Recorridos**: Combina actividades en rutinas como "Rutina matutina"
3. **Ejecutar Recorridos**: Inicia cronómetros y marca el progreso
4. **Ver Estadísticas**: Analiza tiempos, medias y tendencias

## 🔧 Desarrollo Local

```bash
# Clonar repositorio
git clone <tu-repo>

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Abrir en http://localhost:3000
```

## 📊 Base de Datos

La aplicación usa **Vercel KV** (Redis) para almacenar:
- **Actividades**: Nombre, emoji, ID
- **Recorridos**: Nombre, actividades, emoji, ID
- **Historial**: Tiempos completados, fechas, estadísticas

## 🎨 Diseño

- **Mobile-first**: Optimizado para dispositivos móviles
- **Cartoon**: Emojis grandes y colores vibrantes
- **Gradientes**: Fondos coloridos y efectos visuales
- **Touch-friendly**: Botones grandes y áreas de toque optimizadas

## 🚀 Deploy en Vercel

### Pasos para Deploy:

1. **Conectar repositorio**:
   - Ve a [Vercel Dashboard](https://vercel.com/dashboard)
   - Haz clic en "New Project"
   - Conecta tu repositorio GitHub

2. **Configurar Vercel KV**:
   - En tu proyecto, ve a la pestaña "Storage"
   - Haz clic en "Create Database" → "KV"
   - Conecta la base de datos a tu proyecto

3. **Deploy automático**:
   - Vercel detectará automáticamente que es un proyecto Next.js
   - El deploy se ejecutará automáticamente en cada push a main

### Solución de Problemas:

Si ves un error 404 en Vercel:
- Verifica que el archivo `vercel.json` esté presente
- Asegúrate de que `next.config.ts` no tenga `output: 'export'`
- Las variables de entorno de KV se configuran automáticamente

¡Listo! Tu aplicación estará disponible en `https://tu-proyecto.vercel.app`