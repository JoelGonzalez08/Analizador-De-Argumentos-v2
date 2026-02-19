# Analizador de Argumentos v2

Sistema web inteligente para el análisis y fortalecimiento de argumentos utilizando inteligencia artificial. Esta aplicación permite a los usuarios escribir y analizar textos argumentativos, identificando premisas, conclusiones y recibiendo recomendaciones para mejorar la solidez y persuasión de sus argumentos.

## Descripción

El Analizador de Argumentos es una plataforma desarrollada en Next.js que se conecta con un backend de FastAPI para proporcionar análisis detallados de textos argumentativos mediante procesamiento de lenguaje natural e inteligencia artificial. La aplicación ofrece un entorno completo para redacción, análisis, historial y gestión de conversaciones argumentativas.

## Características Principales

### Análisis de Argumentos
- Identificación automática de premisas y conclusiones en textos
- Análisis estructural de argumentos
- Visualización de resultados en formato jerárquico
- Detección de esquemas argumentativos

### Editor Avanzado
- Editor de texto enriquecido con Tiptap
- Soporte para formateo de texto (negrita, cursiva, listas, etc.)
- Resaltado de sintaxis para argumentos
- Guardado automático de borradores

### Sistema de Conversaciones
- Creación y gestión de múltiples conversaciones
- Historial completo de análisis realizados
- Edición de títulos de conversaciones
- Carga de conversaciones previas para continuar trabajando

### Recomendaciones Inteligentes
- Sugerencias para mejorar la calidad argumentativa
- Identificación de falacias lógicas
- Consejos para fortalecer premisas débiles
- Optimización de conclusiones

### Autenticación y Perfiles
- Sistema de registro y login de usuarios
- Perfiles personalizables con información profesional
- Gestión de sesiones segura con tokens JWT
- Protección de rutas privadas

### Interfaz de Usuario
- Diseño responsive adaptado a dispositivos móviles y desktop
- Modo claro y oscuro con persistencia de preferencias
- Componentes UI basados en shadcn/ui y Radix UI
- Animaciones fluidas y transiciones suaves

## Tecnologías Utilizadas

### Frontend
- **Next.js 15.5.9** - Framework de React para producción
- **React 18.3.1** - Biblioteca de interfaces de usuario
- **TypeScript 5** - Superset tipado de JavaScript
- **TailwindCSS 3.4.1** - Framework de CSS utility-first
- **Tiptap 2.5.7** - Editor de texto enriquecido headless

### Componentes UI
- **Radix UI** - Primitivos de componentes accesibles
- **shadcn/ui** - Colección de componentes reutilizables
- **Lucide React** - Biblioteca de iconos
- **Recharts** - Gráficos para visualización de datos

### Gestión de Estado y Formularios
- **React Hook Form 7.54.2** - Manejo de formularios performantes
- **Zod 3.24.2** - Validación de esquemas TypeScript-first
- **React Context API** - Gestión de estado global (autenticación)

### Estilos y UI/UX
- **next-themes** - Sistema de temas con soporte SSR
- **class-variance-authority** - Variantes de componentes con tipos
- **tailwind-merge** - Fusión inteligente de clases de Tailwind
- **tailwindcss-animate** - Animaciones predefinidas

### Herramientas de Desarrollo
- **Turbopack** - Bundler de nueva generación (modo desarrollo)
- **cross-env** - Variables de entorno multiplataforma
- **patch-package** - Parches persistentes de node_modules

## Requisitos Previos

- Node.js 18.x o superior
- npm, yarn o pnpm
- Backend FastAPI corriendo (por defecto en `http://localhost:8000`)
- Navegador web moderno (Chrome, Firefox, Edge, Safari)

## Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/tu-usuario/Analizador-De-Argumentos-v2.git
cd Analizador-De-Argumentos-v2
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
```

Editar el archivo `.env` con la URL de tu backend:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Configuración

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# URL del backend FastAPI
NEXT_PUBLIC_API_URL=http://localhost:8000

# Puerto de desarrollo (opcional, por defecto 9002)
PORT=9002
```

### Configuración de Next.js

El proyecto utiliza configuraciones personalizadas en `next.config.ts`:
- Soporte para TypeScript
- Configuración de paths para importaciones absolutas
- Optimizaciones de producción

### Configuración de TypeScript

El archivo `tsconfig.json` incluye:
- Strict mode habilitado
- Path aliases (`@/*` → `./src/*`)
- Resolución de módulos bundler
- Soporte para JSX

## Uso en Desarrollo

### Iniciar servidor de desarrollo

```bash
npm run dev
```

El servidor estará disponible en `http://localhost:9002` (o el puerto configurado).

### Otros comandos útiles

```bash
# Compilar para producción
npm run build

# Iniciar en modo producción
npm start

# Verificar errores de linting
npm run lint

# Verificar tipos de TypeScript
npm run typecheck
```

## Estructura del Proyecto

```
Analizador-De-Argumentos-v2/
├── public/                      # Archivos estáticos públicos
├── src/
│   ├── app/                     # Rutas de Next.js App Router
│   │   ├── analyzer/           # Página del analizador de argumentos
│   │   ├── api/                # Endpoints de API (proxy)
│   │   ├── contact/            # Página de contacto/equipo
│   │   ├── history/            # Historial de análisis
│   │   ├── login/              # Página de inicio de sesión
│   │   ├── profile/            # Página de perfil de usuario
│   │   ├── register/           # Página de registro
│   │   ├── layout.tsx          # Layout principal de la aplicación
│   │   ├── page.tsx            # Página de inicio (landing page)
│   │   └── globals.css         # Estilos globales
│   │
│   ├── components/              # Componentes React
│   │   ├── app/                # Componentes específicos de la aplicación
│   │   │   ├── app-layout.tsx           # Layout wrapper con navegación
│   │   │   ├── argument-analyzer.tsx    # Componente principal del analizador
│   │   │   ├── history-list.tsx         # Lista de historial de análisis
│   │   │   ├── sidebar-nav.tsx          # Navegación lateral
│   │   │   └── tiptap-editor.tsx        # Editor de texto rico
│   │   │
│   │   ├── auth/               # Componentes de autenticación
│   │   │   └── protected-route.tsx      # HOC para rutas protegidas
│   │   │
│   │   ├── ui/                 # Componentes UI reutilizables (shadcn/ui)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── textarea.tsx
│   │   │   └── ... (más componentes)
│   │   │
│   │   ├── theme-provider.tsx  # Provider del sistema de temas
│   │   └── theme-toggle.tsx    # Botón de cambio de tema
│   │
│   ├── contexts/                # Contextos de React
│   │   └── auth-context.tsx    # Gestión de autenticación global
│   │
│   ├── hooks/                   # Custom hooks
│   │   ├── use-mobile.tsx      # Detección de dispositivos móviles
│   │   └── use-toast.ts        # Sistema de notificaciones toast
│   │
│   └── lib/                     # Utilidades y librerías
│       ├── api-client.ts       # Cliente HTTP para comunicación con backend
│       └── utils.ts            # Funciones utilitarias (cn, etc.)
│
├── .env                         # Variables de entorno (no versionado)
├── components.json              # Configuración de shadcn/ui
├── next.config.ts               # Configuración de Next.js
├── package.json                 # Dependencias y scripts
├── postcss.config.mjs           # Configuración de PostCSS
├── tailwind.config.ts           # Configuración de TailwindCSS
├── tsconfig.json                # Configuración de TypeScript
└── README.md                    # Este archivo
```

## Funcionalidades Detalladas

### 1. Analizador de Argumentos

El componente principal (`argument-analyzer.tsx`) proporciona:

- **Editor de Texto**: Interfaz basada en Tiptap con opciones de formateo
- **Análisis en Tiempo Real**: Envío de texto al backend para análisis mediante IA
- **Visualización de Resultados**: 
  - Premisas identificadas con numeración
  - Conclusiones destacadas
  - Estructura argumentativa visual
- **Guardado de Análisis**: Persistencia de análisis en el backend
- **Gestión de Conversaciones**: Creación, edición y carga de conversaciones previas

### 2. Sistema de Autenticación

Implementado en `auth-context.tsx`, incluye:

- **Registro de Usuarios**: Con validación de email, username y campos opcionales
- **Inicio de Sesión**: Autenticación mediante username/password
- **Gestión de Tokens**: Almacenamiento seguro de JWT en localStorage
- **Verificación de Sesión**: Validación automática de tokens en cada carga
- **Actualización de Perfil**: Modificación de datos de usuario autenticado

### 3. Cliente de API

El archivo `api-client.ts` proporciona interfaces para:

- **Conversaciones**:
  - `createConversation()` - Crear nueva conversación
  - `listConversations()` - Listar conversaciones del usuario
  - `getConversation()` - Obtener detalles de conversación
  - `updateConversation()` - Actualizar título de conversación
  - `deleteConversation()` - Eliminar conversación

- **Análisis**:
  - `analyzeText()` - Enviar texto para análisis
  - `getRecommendations()` - Obtener recomendaciones de mejora
  - `getConversationAnalyses()` - Obtener análisis de una conversación

### 4. Interfaz de Usuario

Componentes UI basados en Design System consistente:

- **Sistema de Temas**: Modo claro/oscuro con transiciones suaves
- **Responsive Design**: Adaptación automática a móvil, tablet y desktop
- **Feedback Visual**: Toasts, skeletons, progress bars
- **Navegación**: Sidebar colapsable y menú responsive


## Solución de Problemas

### El frontend no se conecta al backend

- Verifica que la variable `NEXT_PUBLIC_API_URL` esté correctamente configurada
- Asegúrate de que el backend esté corriendo y accesible
- Revisa la configuración CORS en el backend
- Verifica que no haya errores de red en la consola del navegador

### Errores de autenticación

- Limpia el localStorage: `localStorage.clear()`
- Verifica que el token no haya expirado
- Asegúrate de que el backend esté validando correctamente los tokens

### Problemas de estilos o temas

- Verifica que TailwindCSS esté compilando correctamente
- Revisa la configuración de `next-themes` en el provider
- Limpia el caché de Next.js: `rm -rf .next`

## Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo `LICENSE` para más detalles.
