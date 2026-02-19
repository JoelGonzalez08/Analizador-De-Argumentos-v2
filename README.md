# Analizador de Argumentos v2

Aplicación web inteligente que utiliza IA para analizar y fortalecer argumentos en textos. Identifica automáticamente premisas, conclusiones y proporciona recomendaciones para mejorar la calidad argumentativa.

## Descripción

Plataforma web desarrollada con Next.js que se conecta a un backend FastAPI para analizar textos argumentativos mediante procesamiento de lenguaje natural e inteligencia artificial. 

**Funcionalidades principales:**
- Análisis automático de argumentos con detección de premisas y conclusiones
- Editor de texto enriquecido con formato y resaltado
- Sistema de conversaciones para gestionar múltiples análisis
- Historial completo de análisis realizados
- Recomendaciones inteligentes para mejorar argumentos
- Sistema de autenticación con perfiles de usuario

## Stack Tecnológico

- **Next.js 15.5.9** + **React 18.3.1** + **TypeScript 5**
- **TailwindCSS 3.4.1** - Estilos utility-first
- **Tiptap 2.5.7** - Editor de texto rico
- **shadcn/ui + Radix UI** - Componentes UI accesibles
- **React Hook Form + Zod** - Manejo y validación de formularios
- **Turbopack** - Bundler rápido para desarrollo

## Inicio Rápido

### Requisitos

- Node.js 18 o superior
- Backend FastAPI corriendo en `http://localhost:8000`

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/JoelGonzalez08/Analizador-De-Argumentos-v2.git
cd Analizador-De-Argumentos-v2

# Instalar dependencias
npm install

# Configurar variables de entorno
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env

# Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:9002`

## Scripts Disponibles

```bash
npm run dev        # Inicia servidor de desarrollo (puerto 9002)
npm run build      # Compila para producción
npm start          # Inicia servidor en modo producción
npm run lint       # Verifica errores de linting
npm run typecheck  # Verifica tipos de TypeScript
```

## Configuración

### Variables de Entorno

Crea un archivo `.env` en la raíz:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Para producción, configura esta variable según tu entorno de despliegue.

## Estructura del Proyecto

```
src/
├── app/                    # Páginas Next.js (App Router)
│   ├── analyzer/          # Analizador de argumentos
│   ├── history/           # Historial de análisis
│   ├── login/             # Inicio de sesión
│   ├── register/          # Registro de usuarios
│   └── profile/           # Perfil de usuario
│
├── components/
│   ├── app/               # Componentes de la aplicación
│   │   ├── argument-analyzer.tsx    # Componente principal del analizador
│   │   ├── tiptap-editor.tsx        # Editor de texto rico
│   │   └── history-list.tsx         # Historial de conversaciones
│   ├── ui/                # Componentes UI (shadcn/ui)
│   └── auth/              # Componentes de autenticación
│
├── contexts/
│   └── auth-context.tsx   # Context de autenticación (JWT)
│
├── lib/
│   ├── api-client.ts      # Cliente HTTP para el backend
│   └── utils.ts           # Utilidades generales
│
└── hooks/                 # Custom hooks
    ├── use-toast.ts
    └── use-mobile.tsx
```

## Arquitectura

La aplicación sigue una arquitectura cliente-servidor:

**Frontend (Next.js):**
- Interfaz de usuario responsive
- Gestión de estado con React Context
- Comunicación con backend mediante API REST
- Almacenamiento de tokens JWT en localStorage

**Backend (FastAPI - requerido):**
- Procesamiento de lenguaje natural con IA
- Análisis de argumentos
- Gestión de usuarios y autenticación
- Persistencia de conversaciones y análisis

## Solución de Problemas

**Error de conexión con el backend:**
- Verifica que `NEXT_PUBLIC_API_URL` esté correctamente configurada en `.env`
- Asegúrate de que el backend esté corriendo
- Revisa la configuración CORS en el backend
- Verifica la consola del navegador para errores de red

**Errores de autenticación:**
- Limpia el localStorage: abre la consola del navegador y ejecuta `localStorage.clear()`
- Verifica que el token JWT no haya expirado
- Asegúrate de que el backend esté validando correctamente los tokens

**Problemas de estilos:**
- Verifica que TailwindCSS esté compilando: `npm run build`
- Limpia el caché de Next.js: elimina la carpeta `.next`
- Reinicia el servidor de desarrollo


## Licencia

MIT License - Ver el archivo `LICENSE` para más detalles.
