# Guía Completa: Arquitectura de Sales-Net-Front

> **Objetivo:** Que entiendas CADA pieza, por qué está donde está, cómo se conectan,
> y puedas construirlo tú mismo desde cero.

---

## Tabla de Contenidos

1. [Visión General](#1-visión-general)
2. [Mapa Completo del Proyecto](#2-mapa-completo-del-proyecto)
3. [El Router: Cómo Funciona el Enrutamiento](#3-el-router-cómo-funciona-el-enrutamiento)
4. [El Sidebar: Navegación](#4-el-sidebar-navegación)
5. [Cada Feature Explicada](#5-cada-feature-explicada)
6. [Zustand vs React Query: Cuál y Por Qué](#6-zustand-vs-react-query-cuál-y-por-qué)
7. [Flujo Completo: De Click a Pantalla](#7-flujo-completo-de-click-a-pantalla)
8. [Cómo Crear una Nueva Feature Tú Mismo](#8-cómo-crear-una-nueva-feature-tú-mismo)
9. [Convenciones y Reglas](#9-convenciones-y-reglas)

---

## 1. Visión General

### ¿Qué es esta aplicación?

Un sistema de punto de venta (POS) con dos roles:
- **Vendedor:** Solo ve el Punto de Venta (Venta)
- **Admin:** Ve el Catálogo (Productos y Categorías)

### ¿Qué tecnologías usa y PARA QUÉ?

| Tecnología | Para qué | ¿Por qué esta y no otra? |
|---|---|---|
| **React 19** | Renderizar UI | Biblioteca estándar de UI |
| **TypeScript** | Tipos seguros | Previene errores antes de ejecutar |
| **Vite** | Build y dev server | Rápido, moderno |
| **React Router v7** | Navegación entre páginas | Maneja URL, historia del browser, lazy loading |
| **Zustand** | Estado global de UI | Simple, síncrono, sin boilerplate |
| **React Query** | Estado del servidor (API) | Cache, invalidación, deduplicación |
| **Axios** | Hacer llamadas HTTP | Interceptores para auth automática |
| **Tailwind CSS** | Estilos | Sin archivos CSS separados, utilidades |
| **shadcn / base-ui** | Componentes UI base | Primitivos accesibles, sin estilos fijos |
| **Sonner** | Notificaciones toast | Bonitas, simples |
| **React Hook Form + Zod** | Formularios + validación | Performante, type-safe |

### ¿Qué problema resuelve la arquitectura?

Sin arquitectura, todo termina en carpetas gigantes:
```
components/ → 200 archivos mezclados
pages/      → 30 páginas sin contexto
hooks/      → 40 hooks sin saber quién los usa
```

Con **Feature-Sliced**, cada módulo es **autocontenido**:
```
features/sales/ → TODO lo de ventas (páginas, componentes, hooks, rutas, tipos)
features/auth/  → TODO lo de auth
features/catalog/ → TODO lo de catálogo
```

---

## 2. Mapa Completo del Proyecto

```
src/
│
├── main.tsx                    ← Punto de entrada. Configura QueryClient + renderiza App
├── App.tsx                     ← Solo pasa el router a RouterProvider
│
├── routes/
│   └── routes.tsx              ← Crea el browserRouter. IMPORTA rutas de cada feature.
│                                 Este archivo NO define rutas, las REÚNE.
│
├── lib/
│   ├── api.ts                  ← Instancia de Axios con interceptor de auth.
│   │                             TODAS las llamadas al API pasan por aquí.
│   │                             Agrega token automáticamente.
│   │
│   ├── utils.ts                ← cn() = clsx + tailwind-merge.
│   │                             Sirve para combinar clases condicionalmente.
│   │
│   ├── query-keys.ts           ← Query Key Factory. Claves consistentes para React Query.
│   │
│   ├── navigation-config.ts    ← Configuración del MENÚ del sidebar.
│   │                             Define qué ítems ve cada rol, iconos, paths.
│   │                             Los navbars leen ESTO para renderizar el sidebar.
│   │
│   └── menu-tabs.ts            ← Convierte hijos del menú en tabs para mobile.
│
├── features/                   ← LÓGICA DE NEGOCIO (cada feature es autocontenida)
│   │
│   ├── auth/                   ← Autenticación
│   │   ├── pages/LoginPage.tsx ← Página de login. Envuelve LoginFeature en LoginLayout.
│   │   ├── components/         ← Componentes SOLO de auth (LoginForm)
│   │   ├── hooks/              ← Hooks SOLO de auth (useLoginMutation)
│   │   ├── services/           ← Llamadas API de auth (auth-service.ts)
│   │   ├── types/              ← Tipos de auth (AuthSession, AuthCredentials)
│   │   ├── routes.tsx          ← Rutas de auth: export const authRoutes
│   │   └── index.tsx           ← Exporta authRoutes + LoginFeature (componente)
│   │
│   ├── sales/                  ← Punto de venta (unificado: era pos + sales)
│   │   ├── pages/PosPage.tsx   ← Página wrapper con PageTemplateSimple + <Sales />
│   │   ├── components/         ← Componentes SOLO de ventas
│   │   │   ├── ListProduct.tsx       ← Grid de productos + botón agregar
│   │   │   ├── CartButton.tsx        ← Botón flotante del carrito
│   │   │   ├── CartDrawer.tsx        ← Drawer editable del carrito
│   │   │   ├── CheckoutDialog.tsx    ← Confirmar venta
│   │   │   └── ClearCartDialog.tsx   ← Confirmar vaciar carrito
│   │   ├── hooks/
│   │   │   └── useSalesStore.ts ← Zustand store del carrito
│   │   ├── types/sales.ts      ← Tipos: CartItem, SaleProduct, SalesDialog
│   │   ├── routes.tsx          ← Rutas de ventas: export const salesRoutes
│   │   └── index.tsx           ← Exporta salesRoutes + componente Sales (orquestador)
│   │
│   ├── catalog/                ← Catálogo
│   │   ├── pages/
│   │   │   ├── ProductsList.tsx       ← Lista de productos (con PageTemplateSimple)
│   │   │   └── ProductsCategories.tsx ← Categorías (con PageTemplateSimple)
│   │   ├── routes.tsx          ← Rutas de catálogo: export const catalogRoutes
│   │   └── index.tsx           ← Exporta catalogRoutes
│   │
│   └── core/                   ← Páginas compartidas (error, sin permiso)
│       ├── pages/
│       │   ├── ErrorPage.tsx        ← Página de error de ruta
│       │   └── UnauthorizePage.tsx  ← Página de acceso denegado
│       ├── routes.tsx          ← Rutas de core: export const coreRoutes
│       └── index.tsx           ← Exporta coreRoutes + componentes
│
├── components/                 ← CÓDIGO COMPARTIDO (múltiples features lo usan)
│   │
│   ├── ui/                     ← Componentes UI base (sin lógica de negocio)
│   │   ├── button.tsx          ← Botón con variantes (CVA)
│   │   ├── card.tsx            ← Card con subcomponentes
│   │   ├── dialog.tsx          ← Dialog wrapper sobre base-ui
│   │   ├── drawer.tsx          ← Drawer wrapper sobre vaul
│   │   ├── input.tsx           ← Input base
│   │   ├── field.tsx           ← Field wrapper para formularios
│   │   ├── badge.tsx           ← Badge con variantes
│   │   └── ...
│   │
│   ├── navbar/                 ← Barra de navegación (la usan TODAS las features)
│   │   ├── index.tsx           ← Elige Desktop o Mobile según screen size
│   │   ├── NavBarDesktop.tsx   ← Sidebar desktop. Lee MENU de navigation-config.
│   │   └── NavBarMobile.tsx    ← Bottom tabs mobile. Lee MENU de navigation-config.
│   │
│   ├── page-template/          ← Plantillas de página (las usan todas las features)
│   │   ├── PageMeta.tsx        ← Setea document title + meta description
│   │   ├── PageTabs.tsx        ← Tabs de navegación mobile
│   │   ├── PageTemplateSimple.tsx ← Wrapper con PageMeta + contenido
│   │   └── PageTemplate.tsx    ← Wrapper con tabs + Outlet
│   │
│   └── route/                  ← Guards de rutas
│       ├── ProtectedRoute.tsx  ← Verifica auth + rol antes de renderizar
│       └── RedirectIndex.tsx   ← Redirige al home según rol
│
├── layouts/                    ← ESTRUCTURA DE PÁGINA (cómo se ve el shell)
│   ├── main/
│   │   ├── MainLayout.tsx      ← Sidebar + Header + Outlet (donde se renderizan las páginas)
│   │   ├── DesktopSidebar.tsx  ← Sidebar container con glassmorphism
│   │   ├── LayoutHeader.tsx    ← Topbar con toggle + logout
│   │   └── MobileSidebar.tsx   ← Sidebar mobile con overlay
│   └── login/
│       └── LoginLayout.tsx     ← Layout centrado para login
│
├── store/                      ← STORES ZUSTAND GLOBALES
│   └── auth-store.ts           ← User + token. Persistido en localStorage.
│                                 TODAS las features leen esto para saber quién está logueado.
│
├── hooks/                      ← HOOKS GENÉRICOS REUTILIZABLES
│   ├── useMediaQuery.ts        ← Hook para media queries (useSyncExternalStore)
│   └── useDesktopMediaQuery.ts ← Hook para saber si es desktop/tablet
│
├── types/                      ← TIPOS COMPARTIDOS ENTRE FEATURES
│   └── menu.ts                 ← ItemMenu (lo usan navigation-config y navbars)
│
└── helpers/                    ← HELPERS PEQUEÑOS
    └── money.ts                ← formatCurrency() para GTQ
```

---

## 3. El Router: Cómo Funciona el Enrutamiento

### Arquitectura descentralizada

**ANTES (centralizado):** Un solo archivo definía TODO el menú y todas las rutas.
**AHORA (descentralizado):** Cada feature define SUS propias rutas y las exporta.

### Flujo de creación del router

```
main.tsx
  → renderiza <App />
    → App.tsx importa router de routes/routes.tsx
      → routes.tsx IMPORTA rutas de cada feature
```

### routes.tsx explicado línea por línea

```typescript
// src/routes/routes.tsx

import { createBrowserRouter, type RouteObject } from 'react-router'
import MainLayout from '@/layouts/main/MainLayout'
import RedirectIndex from '@/components/route/RedirectIndex'

// Cada feature EXPORTA su ruta. routes.tsx solo las importa.
import { authRoutes } from '@/features/auth'
import { coreRoutes, ErrorPage } from '@/features/core'
import { salesRoutes } from '@/features/sales'
import { catalogRoutes } from '@/features/catalog'

// Rutas que van DENTRO del MainLayout (sidebar + header)
const mainLayoutRoutes: RouteObject = {
  path: '/',
  element: <MainLayout />,        // ← Sidebar + Header + Outlet
  errorElement: <ErrorPage />,     // ← Si algo falla, muestra ErrorPage
  children: [
    {
      index: true,                 // ← Ruta "/" (raíz)
      element: <RedirectIndex />,  // ← Redirige según rol
    },
    salesRoutes,                   // ← { path: 'venta', ... }
    catalogRoutes,                 // ← { path: 'catalogo', ... }
  ],
}

// Router final: combina TODAS las rutas
export const router = createBrowserRouter([
  authRoutes,       // ← /login (fuera del MainLayout, sin sidebar)
  ...coreRoutes,    // ← /acceso-denegado (fuera del MainLayout)
  mainLayoutRoutes, // ← / con children (dentro del MainLayout)
])
```

### Qué pasa cuando navegas a `/venta/punto-de-venta`

```
1. React Router busca la ruta que match con /venta/punto-de-venta
2. Encuentra mainLayoutRoutes (path: '/')
3. Dentro, encuentra salesRoutes (path: 'venta')
4. salesRoutes dice:
   {
     path: 'venta',
     element: <ProtectedRoute allowedRoles={['vendedor']} />,
     children: [
       { index: true, lazy: async () => ({ Component: PosPage }) }
     ]
   }
5. ProtectedRoute verifica: ¿usuario está logueado? ¿tiene rol 'vendedor'?
   - NO → redirige a /login o /acceso-denegado
   - SÍ → renderiza children
6. Como es index (punto-de-venta es el index de venta), carga PosPage con lazy()
7. PosPage se renderiza DENTRO del Outlet de MainLayout
```

### authRoutes (fuera de MainLayout)

```typescript
// features/auth/routes.tsx
export const authRoutes: RouteObject = {
  path: '/login',
  element: <LoginPage />,   // ← No usa MainLayout. No tiene sidebar.
}
```

### coreRoutes (fuera de MainLayout)

```typescript
// features/core/routes.tsx
export const coreRoutes: RouteObject[] = [
  {
    path: '/acceso-denegado',
    element: <UnauthorizePage />,
  },
]
```

### salesRoutes (dentro de MainLayout)

```typescript
// features/sales/routes.tsx
export const salesRoutes: RouteObject = {
  path: 'venta',                              // ← /venta
  element: <ProtectedRoute allowedRoles={['vendedor']} />,
  children: [
    {
      index: true,                            // ← /venta = /venta/punto-de-venta
      lazy: async () => ({                    // ← Code splitting: carga solo cuando se necesita
        Component: PosPage,
      }),
    },
  ],
}
```

### catalogRoutes (dentro de MainLayout)

```typescript
// features/catalog/routes.tsx
export const catalogRoutes: RouteObject = {
  path: 'catalogo',
  element: <ProtectedRoute allowedRoles={['admin']} />,
  children: [
    { index: true, element: <Navigate to="productos" replace /> },  // ← /catalogo → /catalogo/productos
    {
      path: 'productos',
      lazy: async () => ({ Component: ProductsList }),
    },
    {
      path: 'categorias',
      lazy: async () => ({ Component: ProductsCategories }),
    },
  ],
}
```

### RedirectIndex: qué pasa cuando entras a "/"

```typescript
// components/route/RedirectIndex.tsx
export default function RedirectIndex() {
  const user = useAuthStore((state) => state.user)

  if (!user) {
    return <Navigate to="/login" replace />      // ← No logueado → login
  }

  if (user.role === 'admin') {
    return <Navigate to="/catalogo/productos" replace />  // ← Admin → catálogo
  }

  if (user.role === 'vendedor') {
    return <Navigate to="/venta/punto-de-venta" replace />  // ← Vendedor → POS
  }

  return <Navigate to="/acceso-denegado" replace />
}
```

**POR QUÉ redirect en vez de renderizar algo directo:**
El "/" no es una página real. Es solo un atajo que te manda al home de tu rol.

### ProtectedRoute: cómo protege las rutas

```typescript
// components/route/ProtectedRoute.tsx
export default function ProtectedRoute({ allowedRoles, children }) {
  const user = useAuthStore((state) => state.user)

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/acceso-denegado" replace />
  }

  return children || <Outlet />
}
```

**Flujo:**
1. Usuario logueado → ¿tiene rol permitido? → renderiza children
2. No logueado → redirect a /login
3. Logueado pero rol incorrecto → redirect a /acceso-denegado

---

## 4. El Sidebar: Navegación

### Arquitectura del sidebar

```
MainLayout.tsx
  ├── DesktopSidebar.tsx / MobileSidebar.tsx
  │     └── NavBarDesktop.tsx / NavBarMobile.tsx
  │           └── Lee MENU de lib/navigation-config.ts
  ├── LayoutHeader.tsx
  └── <Outlet />  ← Aquí se renderiza la página activa
```

### navigation-config.ts: La fuente de verdad del menú

```typescript
// lib/navigation-config.ts
export const MENU: ItemMenu[] = [
  {
    id: 'venta',
    name: 'Venta',
    description: 'Operacion de ventas',
    path: 'venta',
    icon: Store,                    // ← Icono de Lucide
    roles: ['vendedor'],            // ← Solo vendedor ve esto
    children: [
      {
        id: 'venta-punto-de-venta',
        name: 'Punto de venta',
        path: 'punto-de-venta',
        icon: Store,
        roles: ['vendedor'],
        lazy: () => import('@/features/sales/pages/PosPage'),  // ← Para code splitting
      },
    ],
  },
  {
    id: 'catalogo',
    name: 'Catalogo',
    path: 'catalogo',
    icon: Package,
    roles: ['admin'],               // ← Solo admin ve esto
    children: [
      {
        id: 'catalogo-productos',
        name: 'Productos',
        path: 'productos',
        lazy: () => import('@/features/catalog/pages/ProductsList'),
      },
      {
        id: 'catalogo-categorias',
        name: 'Categorias',
        path: 'categorias',
        lazy: () => import('@/features/catalog/pages/ProductsCategories'),
      },
    ],
  },
]
```

**POR QUÉ existe este archivo separado de las rutas:**
- `routes.tsx` = qué URL existen y cómo se protegen
- `navigation-config.ts` = qué se muestra en el sidebar

Podrían ser el mismo archivo, pero separarlos permite:
- Cambiar el sidebar sin tocar rutas
- Tener rutas sin ítem en el sidebar (rutas ocultas)
- Reutilizar MENU en mobile tabs

### NavBarDesktop.tsx: Cómo renderiza el sidebar

```
Para cada ítem en MENU que tenga el rol del usuario:
  ├─ Si TIENE hijos → Renderiza un <button> que SOLO expande/colapsa hijos
  │    └─ Si sidebar expandido Y pathname empieza con /item.path:
  │         └─ Renderiza links a cada hijo (NavLink)
  │
  └─ Si NO tiene hijos → Renderiza un <NavLink> directo
```

**COMPORTAMIENTO CLAVE (esto es lo que arreglamos):**

```typescript
// ANTES (mal):
<NavLink to={`/${item.path}`}>  // ← Al dar click, navega al padre
                                // → El padre tiene <Navigate to="primer-hijo">
                                // → Automáticamente te manda al hijo

// AHORA (bien):
{hasChildren ? (
  <button type="button">        // ← Al dar click, NO navega. Solo expande hijos.
    ...icono y texto...
  </button>
) : (
  <NavLink to={`/${item.path}`}>  // ← Si no tiene hijos, sí navega
    ...icono y texto...
  </NavLink>
)}
```

**POR QUÉ funciona así:**
1. Click en "Catálogo" (padre) → se abren los hijos "Productos", "Categorías"
2. Click en "Productos" (hijo) → navega a `/catalogo/productos`
3. El padre NUNCA navega. Solo expande/colapsa.

### NavBarMobile.tsx: Bottom tabs

En mobile no hay sidebar expandible. Cada ítem del menú es un tab que navega DIRECTO al primer hijo:

```typescript
const firstChild = children[0]
const href = firstChild ? `/${item.path}/${firstChild.path}` : `/${item.path}`
// "Venta" → /venta/punto-de-venta
// "Catálogo" → /catalogo/productos
```

---

## 5. Cada Feature Explicada

### 5.1 Feature: Auth

**Propósito:** Login del usuario.

**Archivos y qué hace cada uno:**

```
features/auth/
├── pages/LoginPage.tsx     ← Página. Envuelve LoginFeature en LoginLayout + PageMeta.
├── components/LoginForm.tsx ← Formulario visual. Recibe onSubmit del padre.
├── hooks/useLoginMutation.ts ← React Query mutation. Llama loginService.
├── services/auth-service.ts  ← Función que llama a la API (con fallback mock).
├── types/auth.ts             ← AuthSession, AuthCredentials, User, Zod schemas.
├── types/form.ts             ← LoginFormValues (tipo del formulario).
├── utils/schema.ts           ← Zod schema para validar login.
├── routes.tsx                ← Exporta authRoutes.
└── index.tsx                 ← LoginFeature: orquestador que conecta todo.
```

**Flujo completo del login:**

```
1. Usuario entra a / (no logueado)
2. RedirectIndex → redirige a /login
3. authRoutes renderiza <LoginPage />
4. LoginPage → LoginLayout + LoginFeature
5. LoginFeature → renderiza <LoginForm onSubmit={handleSubmit} />
6. Usuario escribe usuario y contraseña
7. Submit → handleSubmit se ejecuta:
   a. toast.loading('Validando...')
   b. llama login({ username, password }) → useLoginMutation
   c. useLoginMutation llama loginService() → POST /auth/login
   d. Si falla la API, usa mock data (dev mode)
   e. parseAuthSession() valida con Zod
   f. applySession(session) → useAuthStore.login(session)
   g. toast.success('Sesión iniciada')
   h. navigate('/') → RedirectIndex detecta usuario → redirige al home del rol
```

**POR QUÉ esta estructura:**

- `pages/` → Solo el wrapper de página (layout, meta)
- `components/` → Solo UI del formulario (sin lógica de datos)
- `hooks/` → Solo la mutation de React Query (lógica de datos)
- `services/` → Solo la llamada HTTP pura (sin React)
- `types/` → Tipos TypeScript y schemas Zod
- `index.tsx` → Orquestador que conecta todo (tiene la lógica de flujo)

### 5.2 Feature: Sales (Punto de Venta)

**Propósito:** Mostrar productos, agregar al carrito, cobrar.

**Archivos y qué hace cada uno:**

```
features/sales/
├── pages/PosPage.tsx         ← Página wrapper con PageTemplateSimple + <Sales />
├── components/
│   ├── ListProduct.tsx       ← Grid de productos hardcodeados + botón "Agregar"
│   ├── CartButton.tsx        ← Botón flotante inferior: muestra total + items
│   ├── CartDrawer.tsx        ← Drawer editable: cambiar cantidades, eliminar items
│   ├── CheckoutDialog.tsx    ← Dialog confirmar venta
│   └── ClearCartDialog.tsx   ← Dialog confirmar vaciar carrito
├── hooks/
│   └── useSalesStore.ts      ← Zustand store: items, cartOpen, activeDialog
├── types/sales.ts            ← CartItem, SaleProduct, SalesDialog
├── routes.tsx                ← salesRoutes: /venta protegido para vendedor
└── index.tsx                 ← Componente Sales: orquestador de todos los components
```

**Flujo completo de una venta:**

```
1. Vendedor navega a /venta
2. ProtectedRoute verifica rol 'vendedor' → OK
3. Carga PosPage (lazy)
4. PosPage renderiza <PageTemplateSimple> + <Sales />
5. Sales() renderiza: ListProduct + CartButton + CartDrawer + CheckoutDialog + ClearCartDialog
6. ListProduct muestra productos hardcodeados
7. Click en "Agregar" → useSalesStore.addItem(producto)
   → Zustand: agrega al array items (o incrementa qty si ya existe)
8. CartButton se actualiza: lee items del store → calcula total
9. Click en CartButton → openCart() → cartOpen = true
10. CartDrawer se abre
11. En drawer: + / - → increaseQty / decreaseQty
12. Click "Cobrar" → openDialog('checkout') → cartOpen = false, activeDialog = 'checkout'
13. CheckoutDialog se abre
14. Click "Confirmar" → clearCart() + closeDialog() + closeCart()
15. Carrito vaciado, dialog cerrado, drawer cerrado
```

**POR QUÉ un solo store para todo sales:**

Todo el flujo de ventas es un solo estado interconectado:
- items del carrito
- si el drawer está abierto
- qué dialog está activo

No necesita React Query porque NADA viene del servidor (productos hardcodeados).

### 5.3 Feature: Catalog

**Propósito:** Gestionar productos y categorías.

**Archivos:**

```
features/catalog/
├── pages/
│   ├── ProductsList.tsx       ← PageTemplateSimple + contenido placeholder
│   └── ProductsCategories.tsx ← PageTemplateSimple + contenido placeholder
├── routes.tsx                 ← catalogRoutes: /catalogo con hijos
└── index.tsx                  ← Exporta catalogRoutes
```

**Estado actual:** Placeholder. Sin datos reales.

**Flujo:**
```
1. Admin navega a /catalogo
2. ProtectedRoute verifica rol 'admin' → OK
3. Redirect a /catalogo/productos (index)
4. ProductsList se carga (lazy)
5. ProductsList tiene PageTemplateSimple con title "Productos"
```

### 5.4 Feature: Core

**Propósito:** Páginas compartidas de error.

```
features/core/
├── pages/
│   ├── ErrorPage.tsx         ← Error de ruta no disponible
│   └── UnauthorizePage.tsx   ← Acceso denegado
├── routes.tsx                ← coreRoutes: /acceso-denegado
└── index.tsx                 ← Exporta coreRoutes + componentes
```

**POR QUÉ no es un "shared component":**
Son páginas completas con su propio layout (pantalla completa, sin sidebar). No son reutilizables dentro de otras páginas.

### 5.5 Stores Globales (Zustand)

**auth-store.ts:**

```typescript
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      login: (session) => {
        syncTokenStorage(session.token)     // ← Guarda en localStorage.token
        set({ token: session.token, user: buildAuthUser(session) })
      },
      logout: () => {
        syncTokenStorage(null)              // ← Elimina de localStorage
        set({ token: null, user: null })
      },
    }),
    {
      name: 'sales-net-auth',               // ← Key en localStorage
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({             // ← Solo persiste token y user
        token: state.token,
        user: state.user,
      }),
    },
  ),
)
```

**POR QUÉ persist:**
Si el usuario recarga la página, no pierde su sesión. `persist` guarda automáticamente en localStorage y restaura al iniciar.

**POR QUÉ también syncTokenStorage separado:**
El interceptor de axios lee `localStorage.getItem('token')`, no el store de Zustand (que no está disponible fuera de React).

**useSalesStore.ts:**

```typescript
export const useSalesStore = create<SalesState>()((set) => ({
  items: [],              // ← Productos en carrito
  cartOpen: false,        // ← Si drawer está abierto
  activeDialog: null,     // ← 'checkout' | 'clear-cart' | null
  addItem: (product) => set((state) => {
    // Si ya existe, incrementa qty. Si no, agrega.
  }),
  removeItem: (id) => set((state) => ({
    items: state.items.filter(item => item.id !== id),
  })),
  increaseQty: (id) => set((state) => ({
    items: updateItems(state.items, id, item => ({ ...item, qty: item.qty + 1 })),
  })),
  decreaseQty: (id) => set((state) => ({
    items: updateItems(state.items, id, item => item.qty <= 1 ? null : { ...item, qty: item.qty - 1 }),
  })),
  clearCart: () => set({ items: [] }),
  openCart: () => set({ cartOpen: true }),
  closeCart: () => set({ cartOpen: false }),
  openDialog: (dialog) => set({ cartOpen: false, activeDialog: dialog }),
  closeDialog: () => set({ cartOpen: true, activeDialog: null }),
}))
```

**POR QUÉ NO persist:**
El carrito es temporal. Si recargas, se pierde. Es el comportamiento esperado de un POS.

**POR QUÉ activeDialog en vez de booleanos:**
```typescript
// ❌ MAL: Múltiples booleanos
const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
const [isClearCartOpen, setIsClearCartOpen] = useState(false)
// Pueden estar ambos abiertos a la vez = overlays superpuestos = bug

// ✅ BIEN: Un solo estado enum
type SalesDialog = 'checkout' | 'clear-cart' | null
const [activeDialog, setActiveDialog] = useState<SalesDialog>(null)
// Solo uno puede estar activo a la vez
```

---

## 6. Zustand vs React Query: Cuál y Por Qué

### La regla más importante

```
¿Los datos los controla TU aplicación?     → Zustand
¿Los datos los controla el SERVIDOR/API?   → React Query
```

### Tabla de decisión

| Situación | Cuál usar | Por qué |
|---|---|---|
| Usuario logueado | Zustand | Lo creas tú, persistes en localStorage |
| Sidebar abierto/cerrado | Zustand | Estado de UI puro |
| Carrito actual | Zustand | Temporal, efímero |
| Lista de productos de API | React Query | Viene del servidor, necesita cache |
| Historial de ventas | React Query | Datos del servidor |
| Crear una venta | React Query Mutation | Envía datos al servidor |
| Filtros de tabla | Zustand | Preferencia del usuario |
| Formulario | React Hook Form | Validación, estado interno del form |
| Tema claro/oscuro | Zustand | Preferencia de UI |
| Query keys | lib/query-keys.ts | Consistencia global |

### Zustand: Qué es y cuándo usarlo

**Zustand es un store global de estado.** Como Redux pero simple.

**Úsalo cuando:**
- El estado lo crea TU aplicación (no viene de API)
- Necesitas acceso síncrono inmediato
- Múltiples componentes necesitan leer/escribir el mismo estado
- No necesita cache ni invalidación automática

**NO lo uses cuando:**
- Los datos vienen de una API → React Query
- Es estado interno de un componente → useState
- Es un formulario → React Hook Form

### React Query: Qué es y cuándo usarlo

**React Query es un gestor de estado del servidor.** Maneja fetching, cache, y actualización de datos que vienen de una API.

**Úsalo cuando:**
- Necesitas hacer GET/POST/PUT/DELETE a una API
- Múltiples componentes necesitan los mismos datos
- Quieres cache automático (no hacer la misma llamada twice)
- Necesitas invalidar datos cuando algo cambia

**NO lo uses cuando:**
- Es estado de UI (sidebar, modal) → Zustand
- Es un formulario → React Hook Form
- Es un dato que no viene del servidor → useState o Zustand

### Ejemplo práctico: Feature de Clientes (futura)

```typescript
// ❌ MAL: Datos del servidor en Zustand
const useCustomersStore = create((set) => ({
  customers: [],
  fetchCustomers: async () => {
    const res = await api.get('/customers')
    set({ customers: res.data })
  }
}))

// ✅ BIEN: Datos del servidor en React Query
export function useCustomers() {
  return useQuery({
    queryKey: queryKeys.customers.lists(),
    queryFn: () => api.get('/customers').then(r => r.data),
  })
}

// ✅ BIEN: Estado de UI en Zustand
const useUIStore = create((set) => ({
  customersFilter: '',
  setCustomersFilter: (f) => set({ customersFilter: f }),
}))

// ✅ BIEN: Crear cliente en React Query Mutation
export function useCreateCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CustomerData) => api.post('/customers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.lists() })
    }
  })
}
```

### Query Key Factory: Por qué existe

**Problema:** Sin factory, cada dev escribe keys diferentes:
```typescript
useQuery({ queryKey: ['customers'], ... })        // dev 1
useQuery({ queryKey: ['customerList'], ... })     // dev 2
useQuery({ queryKey: ['get-customers'], ... })    // dev 3

// Cuando invalidas ['customers'], NO invalida los otros 2!
```

**Solución:** Una factory central:
```typescript
// lib/query-keys.ts
queryKeys.customers.lists()        // → ['customers', 'list']
queryKeys.customers.detail('123')  // → ['customers', 'detail', '123']

// Invalidación segura:
queryClient.invalidateQueries({ queryKey: queryKeys.customers.all })
// Invalida TODOS los customers
```

---

## 7. Flujo Completo: De Click a Pantalla

### Ejemplo: Admin hace click en "Catálogo > Productos"

```
1. Admin ve sidebar con "Catálogo" (porque tiene rol 'admin')
   ↳ MENU.filter(role === 'admin') → muestra solo items de admin

2. Click en "Catálogo" (padre)
   ↳ Es un <button>, NO un <NavLink>
   ↳ Solo expande los hijos: "Productos", "Categorías"
   ↳ NO cambia la URL

3. Click en "Productos" (hijo)
   ↳ Es un <NavLink to="/catalogo/productos">
   ↳ React Router navega a /catalogo/productos

4. React Router busca la ruta:
   mainLayoutRoutes (path: '/')
   → catalogRoutes (path: 'catalogo')
   → children.find(path === 'productos')

5. ProtectedRoute se ejecuta:
   ↳ useAuthStore → user.role === 'admin' → OK

6. React Router carga el componente con lazy():
   ↳ import('@/features/catalog/pages/ProductsList')
   ↳ Code splitting: este chunk no se cargó hasta ahora

7. ProductsList se monta:
   ↳ Renderiza <PageTemplateSimple title="Productos">
   ↳ Dentro: contenido placeholder

8. PageTemplateSimple renderiza:
   ↳ <PageMeta title="Productos" /> → actualiza document.title
   ↳ <main> con el contenido

9. El resultado se muestra en el <Outlet> de MainLayout
   ↳ Sidebar sigue visible a la izquierda
   ↳ Header sigue visible arriba
   ↳ Solo cambia el contenido central
```

---

## 8. Cómo Crear una Nueva Feature Tú Mismo

### Ejemplo: Crear feature "Clientes"

#### Paso 1: Crear la estructura

```bash
npm run gen-feature --name=customers
```

Esto crea:
```
features/customers/
  components/
  services/
  hooks/
  types/
  utils/
  index.tsx
```

#### Paso 2: Crear carpeta pages/ y routes.tsx

```bash
mkdir src/features/customers/pages
```

#### Paso 3: Crear la página

```tsx
// features/customers/pages/CustomersPage.tsx
import PageTemplateSimple from '@/components/page-template/PageTemplateSimple'

export default function CustomersPage() {
  return (
    <PageTemplateSimple
      title="Clientes"
      description="Gestión de clientes de Sales Net."
    >
      <p>Contenido de clientes aquí.</p>
    </PageTemplateSimple>
  )
}
```

**POR QUÉ PageTemplateSimple:**
Cada página necesita title + description en el documento. PageTemplateSimple lo hace automáticamente con PageMeta.

#### Paso 4: Crear routes.tsx

```tsx
// features/customers/routes.tsx
import { type RouteObject } from 'react-router'
import ProtectedRoute from '@/components/route/ProtectedRoute'
import type { AppRole } from '@/store/auth-store'
import CustomersPage from './pages/CustomersPage'

const roles: AppRole[] = ['admin', 'vendedor']

export const customersRoutes: RouteObject = {
  path: 'clientes',
  element: <ProtectedRoute allowedRoles={roles} />,
  children: [
    {
      index: true,
      lazy: async () => ({
        Component: CustomersPage,
      }),
    },
  ],
}
```

**POR QUÉ esta estructura:**
- `path: 'clientes'` → se monta bajo `/` → URL final: `/clientes`
- `ProtectedRoute` → solo los roles especificados pueden entrar
- `lazy` → code splitting (no carga hasta que el usuario navega ahí)
- `index: true` → `/clientes` carga la página directamente

#### Paso 5: Exportar desde index.tsx

```tsx
// features/customers/index.tsx
export { customersRoutes } from './routes'
```

#### Paso 6: Registrar en routes.tsx global

```tsx
// routes/routes.tsx (agregar esta línea)
import { customersRoutes } from '@/features/customers'

// Y agregar a mainLayoutRoutes.children:
const mainLayoutRoutes = {
  children: [
    salesRoutes,
    catalogRoutes,
    customersRoutes,  // ← agregar aquí
  ],
}
```

**POR QUÉ aquí:**
routes.tsx es el punto donde TODAS las rutas se reúnen. Si no la agregas aquí, React Router no sabe que existe.

#### Paso 7: Agregar al sidebar (navigation-config.ts)

```tsx
// lib/navigation-config.ts (agregar al array MENU)
{
  id: 'clientes',
  name: 'Clientes',
  description: 'Gestión de clientes',
  path: 'clientes',
  icon: Users,              // ← Icono de Lucide
  roles: ['admin', 'vendedor'],
  children: [
    {
      id: 'clientes-gestion',
      name: 'Gestión',
      path: 'gestion',
      icon: Users,
      roles: ['admin', 'vendedor'],
      lazy: () => import('@/features/customers/pages/CustomersPage'),
    },
  ],
}
```

**POR QUÉ aquí:**
El sidebar lee MENU para saber qué mostrar. Si no agregas aquí, la ruta funciona pero nadie la ve en el sidebar.

#### Paso 8: Si necesita datos del servidor → agregar a query-keys.ts

```tsx
// lib/query-keys.ts (agregar al objeto queryKeys)
customers: {
  all: ['customers'] as const,
  lists: () => [...queryKeys.customers.all, 'list'] as const,
  detail: (id: string) => [...queryKeys.customers.all, 'detail', id] as const,
}
```

#### Paso 9: Crear hooks de datos

```tsx
// features/customers/hooks/useCustomers.ts
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { api } from '@/lib/api'

export function useCustomers() {
  return useQuery({
    queryKey: queryKeys.customers.lists(),
    queryFn: () => api.get('/customers').then(r => r.data),
  })
}
```

**POR QUÉ separado:**
Cada hook es una unidad independiente de lógica de datos. La página importa el hook, no llama la API directamente.

---

## 9. Convenciones y Reglas

### Regla de Oro de Carpetas

```
¿Solo UNA feature lo usa?    → Dentro de features/X/
¿MÚLTIPLES features lo usan? → En components/ o lib/
```

### Regla de Oro de Estado

```
¿Lo controla TU app?      → Zustand
¿Lo controla el servidor?  → React Query
¿Es un formulario?         → React Hook Form
¿Es local de un componente? → useState
```

### Regla de Oro de Páginas

```
Toda página DEBE tener:
1. PageTemplateSimple (o PageTemplate)
2. title y description
3. Exportarse como default
4. Estar en features/X/pages/
```

### Regla de Oro de Rutas

```
1. Cada feature exporta SU RouteObject
2. routes.tsx las reúne todas
3. navigation-config.ts define qué se ve en el sidebar
4. Lazy loading siempre (code splitting)
5. ProtectedRoute siempre (seguridad)
```

### Regla de Oro de Componentes

```
¿Es UI genérica? (botón, input, card)   → components/ui/
¿Es de negocio específico?             → features/X/components/
¿Lo usan varias features?              → components/shared/
¿Es un layout de página?               → layouts/
```

### Qué NO hacer

```
❌ NO crear páginas en src/pages/
   → Todo va en features/X/pages/

❌ NO poner datos de API en Zustand
   → React Query para server state

❌ NO usar React Query para estado de UI
   → Zustand para sidebar, modales, etc.

❌ NO crear routes en un solo archivo gigante
   → Cada feature exporta las suyas

❌ NO importar de otro feature directamente
   → Si lo necesitas, hazlo shared o global

❌ NO hardcodear query keys como strings
   → Usa queryKeys.products.lists()
```

---

## Apéndice: Resumen Visual de Relaciones

```
┌─────────────────────────────────────────────────────────┐
│                    main.tsx                             │
│              (QueryClient + App + Toaster)              │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                    App.tsx                              │
│              (<RouterProvider router={router} />)        │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              routes/routes.tsx                          │
│         (Reúne rutas de todas las features)              │
│                                                         │
│    authRoutes ─────┐                                    │
│    coreRoutes ─────┤                                    │
│    mainLayout ─────┤                                    │
│      ├─ RedirectIndex                                   │
│      ├─ salesRoutes                                     │
│      └─ catalogRoutes                                   │
└──┬──────────┬──────────┬──────────┬─────────────────────┘
   │          │          │          │
   ▼          ▼          ▼          ▼
┌──────┐  ┌──────┐  ┌───────┐  ┌────────┐
│Auth  │  │Core  │  │Sales  │  │Catalog │
│      │  │      │  │       │  │        │
│Login │  │Error │  │POS    │  │Products│
│Page  │  │Unauth│  │Page   │  │Categories│
└──────┘  └──────┘  └───┬───┘  └────┬───┘
                        │           │
                        ▼           ▼
              ┌─────────────────────────────┐
              │   useSalesStore (Zustand)   │
              │   - items (carrito)         │
              │   - cartOpen                │
              │   - activeDialog            │
              └─────────────────────────────┘

─────────────────────────────────────────────
Referencias cruzadas:

Todos los features → useAuthStore (saben quién está logueado)
Todos los navbars  → MENU (navigation-config.ts)
Todos los pages    → PageTemplateSimple
Todos los routes   → ProtectedRoute
Todos los api calls→ api (lib/api.ts)
Todos los queries  → queryKeys (lib/query-keys.ts)
```
