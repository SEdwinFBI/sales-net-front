# Guía de Arquitectura: Zustand vs React Query

## Regla de Oro

```
Zustand    = Estado del CLIENTE (lo que TÚ controlas)
React Query = Estado del SERVIDOR (lo que el BACKEND controla)
```

---

## Diagrama de Decisión

```
¿Los datos vienen de una API/backend?
├─ SÍ  → React Query
└─ NO  → ¿Es estado de UI o sesión del usuario?
         ├─ SÍ  → Zustand
         └─ NO  → ¿Es un formulario?
                  └─ SÍ  → React Hook Form
```

---

## Zustand: Cuándo y Cómo

### ✅ USAR para:

#### 1. Estado de UI
```typescript
// sidebar, modales, tema, pestaña activa
const useUIStore = create((set) => ({
  sidebarExpanded: false,
  toggleSidebar: () => set((s) => ({ sidebarExpanded: !s.sidebarExpanded })),
  
  activeTab: 'products',
  setActiveTab: (tab: string) => set({ activeTab: tab }),
}))
```

#### 2. Sesión del usuario (Auth)
```typescript
// Auth con persistencia en localStorage
const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      login: (session) => set({ user: session.user, token: session.token }),
      logout: () => set({ user: null, token: null }),
    }),
    { name: 'sales-net-auth' }
  )
)
```

**POR QUÉ Zustand aquí**:
- Los datos los crea TU app (no vienen del servidor)
- Necesitas persistencia manual (localStorage)
- Acceso síncrono e inmediato
- No necesita cache ni invalidación

#### 3. Carrito temporal
```typescript
// Estado efímero, se pierde al recargar
const useCartStore = create((set) => ({
  items: [],
  addItem: (product) => set((state) => ({
    items: [...state.items, { ...product, qty: 1 }]
  })),
  clearCart: () => set({ items: [] }),
}))
```

#### 4. Filtros y preferencias del usuario
```typescript
// Lo que el usuario selecciona en la UI
const useFiltersStore = create((set) => ({
  search: '',
  category: 'all',
  setSearch: (s) => set({ search: s }),
  setCategory: (c) => set({ category: c }),
}))
```

### ❌ NO USAR Zustand para:

```typescript
// ❌ MAL: Datos del servidor en Zustand
const useProductsStore = create((set) => ({
  products: [],
  fetchProducts: async () => {
    const res = await api.get('/products')
    set({ products: res.data })
  }
}))

// ❌ Problemas:
// 1. No tiene cache automático (recarga cada vez)
// 2. No deduplica requests (3 componentes = 3 llamadas)
// 3. No invalida automáticamente cuando creas un producto
// 4. No maneja loading states automáticamente
// 5. No revalida al reconectar
```

---

## React Query: Cuándo y Cómo

### ✅ USAR para:

#### 1. Leer datos del servidor (Queries)
```typescript
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { api } from '@/lib/api'

// Lista de productos
export function useProducts() {
  return useQuery({
    queryKey: queryKeys.products.lists(),
    queryFn: () => api.get('/products').then(r => r.data),
  })
}

// Un producto específico
export function useProduct(id: string) {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => api.get(`/products/${id}`).then(r => r.data),
    enabled: !!id, // solo ejecuta si hay ID
  })
}
```

**POR QUÉ React Query aquí**:
- Los datos viven en el servidor
- Necesitas cache (evitar llamadas repetidas)
- Necesitas invalidación (cuando algo cambia, refrescar)
- Múltiples componentes pueden necesitar los mismos datos
- Loading/error states automáticos

#### 2. Crear/Actualizar/Eliminar (Mutations)
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { api } from '@/lib/api'

// Crear una venta
export function useCreateSale() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (sale: SaleData) => api.post('/sales', sale),
    onSuccess: () => {
      // Invalida la lista de ventas para refrescar datos
      queryClient.invalidateQueries({ queryKey: queryKeys.sales.lists() })
    }
  })
}

// Actualizar producto
export function useUpdateProduct() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductData }) =>
      api.put(`/products/${id}`, data),
    onSuccess: (_, { id }) => {
      // Invalida solo ese producto
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(id) })
      // E invalida la lista también
      queryClient.invalidateQueries({ queryKeys.products.lists() })
    }
  })
}
```

**POR QUÉ React Query para mutations**:
- `onSuccess` ejecuta automáticamente cuando el servidor confirma
- `invalidateQueries` le dice a React Query: "esos datos ya no son frescos, recárgalos"
- Los componentes que usan esos queryKeys se actualizan solos

#### 3. Optimistic Updates (avanzado)
```typescript
// Mostrar cambios ANTES de que el servidor confirme
export function useUpdateProductName() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      api.patch(`/products/${id}`, { name }),
    
    // Antes de enviar, actualiza cache
    onMutate: async ({ id, name }) => {
      // Cancela queries en vuelo
      await queryClient.cancelQueries({ queryKey: queryKeys.products.detail(id) })
      
      // Guarda el estado anterior (para rollback si falla)
      const previous = queryClient.getQueryData(queryKeys.products.detail(id))
      
      // Actualiza cache optimísticamente
      queryClient.setQueryData(queryKeys.products.detail(id), (old: any) => ({
        ...old,
        name,
      }))
      
      return { previous }
    },
    
    // Si falla, regresa al estado anterior
    onError: (_, { id }, context) => {
      queryClient.setQueryData(queryKeys.products.detail(id), context?.previous)
    },
    
    // Siempre, revalida
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(id) })
    },
  })
}
```

### ❌ NO USAR React Query para:

```typescript
// ❌ MAL: Estado de UI con React Query
const { data: sidebarOpen } = useQuery({
  queryKey: ['sidebarOpen'],
  queryFn: () => false,
})

// ❌ Problemas:
// 1. Overhead innecesario (cache, garbage collection, etc.)
// 2. No es reactivo síncronamente (siempre hay un ciclo de render extra)
// 3. Complejidad sin beneficio
```

---

## Query Key Factory: Por Qué y Cómo

### Problema que resuelve

```typescript
// ❌ SIN FACTORY: cada dev escribe como quiere
useQuery({ queryKey: ['products'], ... })           // dev 1
useQuery({ queryKey: ['productList'], ... })        // dev 2  
useQuery({ queryKey: ['get-products'], ... })       // dev 3

// Cuando invalidas ['products'], NO invalida los otros 2!
```

### Solución

```typescript
// src/lib/query-keys.ts
export const queryKeys = {
  products: {
    all: ['products'] as const,
    lists: () => [...queryKeys.products.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.products.all, 'detail', id] as const,
    categories: () => [...queryKeys.products.all, 'categories'] as const,
  },
  sales: {
    all: ['sales'] as const,
    lists: () => [...queryKeys.sales.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.sales.all, 'detail', id] as const,
  },
}

// ✅ USO CONSISTENTE:
queryKeys.products.lists()         // → ['products', 'list']
queryKeys.products.detail('123')   // → ['products', 'detail', '123']

// ✅ INVALIDACIÓN PODEROSA:
queryClient.invalidateQueries({ queryKey: queryKeys.products.all })
// Invalida TODOS los products (lists, details, categories)
```

### Reglas de Query Keys

```typescript
// Jerarquía de granularidad:
queryKeys.products.all          // ['products']             → todo el namespace
queryKeys.products.lists()      // ['products', 'list']     → todas las listas
queryKeys.products.list(f)      // ['products', 'list', {page:1}] → lista con filtros
queryKeys.products.detail('1')  // ['products', 'detail', '1']    → un producto

// Invalidación de amplio a específico:
queryKeys.products.all          // invalida absolutamente todo
queryKeys.products.lists()      // invalida todas las listas (no details)
queryKeys.products.list(f)      // invalida solo esa lista con esos filtros
```

---

## Patrones de Organización de Carpetas

### Regla Fundamental

```
¿Solo UNA feature lo usa?     → Dentro de features/X/
¿MÚLTIPLES features lo usan?  → En components/ o lib/
```

### Estructura de una Feature

```
src/features/ventas/
├── pages/           ← Páginas que renderiza el router
│   ├── VentasPage.tsx     ← Layout principal de la feature
│   └── VentaDetalle.tsx   ← Página hija
│
├── components/      ← Componentes SOLO de esta feature
│   ├── VentaForm.tsx
│   └── VentaTabla.tsx
│
├── hooks/           ← Hooks de datos (React Query)
│   ├── useVentas.ts         ← useQuery para lista
│   └── useCrearVenta.ts     ← useMutation para crear
│
├── services/        ← Llamadas directas al API
│   └── ventas-service.ts    ← api.get('/ventas'), etc.
│
├── types/           ← Tipos TypeScript
│   └── ventas.ts
│
├── routes.tsx       ← RouteObject de esta feature
│
└── index.tsx        ← Exporta routes y componente principal
```

### Qué va en cada nivel global

```
src/
├── components/          ← UI genérica SIN lógica de negocio
│   ├── ui/              ← Button, Input, Card, Dialog (primitivos)
│   ├── navbar/          ← Barra de navegación (la usan TODAS las features)
│   ├── page-template/   ← PageMeta, PageTemplateSimple
│   └── route/           ← ProtectedRoute, RedirectIndex
│
├── layouts/             ← Estructura de página completa
│   ├── main/            ← Sidebar + Header + Outlet
│   └── login/           ← Layout centrado
│
├── lib/                 ← Utilidades GLOBALES
│   ├── api.ts           ← Axios instance (todas las features llaman API)
│   ├── utils.ts         ← cn() (clsx + tailwind-merge)
│   └── query-keys.ts    ← Query Key Factory (todas las features la usan)
│
├── store/               ← Stores Zustand GLOBALES
│   └── auth-store.ts    ← Auth (todas las features necesitan saber quién está logueado)
│
├── hooks/               ← Hooks genéricos reutilizables
│   └── useMediaQuery.ts ← Hook de responsive (sin lógica de negocio)
│
└── types/               ← Tipos compartidos entre features
    └── menu.ts          ← ItemMenu (routes y navbar lo usan)
```

---

## Flujo de Trabajo: Crear una Feature Completa

### Escenario: Crear feature "Clientes"

#### Paso 1: Scaffold
```bash
npm run gen-feature --name=customers
# Crea: features/customers/ con components/, hooks/, services/, types/
```

#### Paso 2: Agregar páginas
```
features/customers/pages/
├── CustomersPage.tsx      ← Layout con PageTemplateSimple
└── CustomerForm.tsx       ← (opcional) Formulario de creación
```

#### Paso 3: Definir routes.tsx
```typescript
import { type RouteObject } from 'react-router'
import ProtectedRoute from '@/components/route/ProtectedRoute'
import type { AppRole } from '@/store/auth-store'
import CustomersPage from './pages/CustomersPage'

const roles: AppRole[] = ['admin', 'vendedor']

export const customersRoutes: RouteObject = {
  path: 'clientes',
  element: <ProtectedRoute allowedRoles={roles} />,
  children: [
    { index: true, lazy: async () => ({ Component: CustomersPage }) },
  ],
}
```

#### Paso 4: Agregar query keys
```typescript
// lib/query-keys.ts (ya existe, solo agregas)
customers: {
  all: ['customers'] as const,
  lists: () => [...queryKeys.customers.all, 'list'] as const,
  detail: (id: string) => [...queryKeys.customers.all, 'detail', id] as const,
}
```

#### Paso 5: Crear hooks de datos
```typescript
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

#### Paso 6: Crear mutation
```typescript
// features/customers/hooks/useCreateCustomer.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { api } from '@/lib/api'

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

#### Paso 7: Registrar en routes.tsx global
```typescript
// routes/routes.tsx
import { customersRoutes } from '@/features/customers'

const mainLayoutRoutes = {
  path: '/',
  children: [
    posRoutes,
    catalogRoutes,
    customersRoutes,  // ← agregar aquí
  ],
}
```

#### Paso 8: Agregar al menú
```typescript
// routes/menuConf.tsx
{
  id: 'clientes',
  name: 'Clientes',
  path: 'clientes',
  icon: Users,
  roles: ['admin', 'vendedor'],
  lazy: () => import('@/features/customers/pages/CustomersPage'),
}
```

---

## Anti-patrones a Evitar

### ❌ 1. useEffect + useState en lugar de React Query
```typescript
// ❌ MAL: reinventando React Query
const [products, setProducts] = useState([])
const [loading, setLoading] = useState(false)
const [error, setError] = useState(null)

useEffect(() => {
  setLoading(true)
  api.get('/products')
    .then(r => setProducts(r.data))
    .catch(e => setError(e))
    .finally(() => setLoading(false))
}, [])

// ✅ BIEN:
const { data: products, isLoading, error } = useProducts()
```

### ❌ 2. Zustand para datos del servidor
```typescript
// ❌ MAL
const useProductsStore = create((set) => ({
  products: [],
  setProducts: (p) => set({ products: p }),
}))

// ✅ BIEN: useQuery
```

### ❌ 3. React Query para estado de UI
```typescript
// ❌ MAL
const { data: isModalOpen } = useQuery({
  queryKey: ['isModalOpen'],
  queryFn: () => false,
})

// ✅ BIEN: Zustand
const useUIStore = create((set) => ({
  isModalOpen: false,
  openModal: () => set({ isModalOpen: true }),
}))
```

### ❌ 4. Query keys como strings sueltos
```typescript
// ❌ MAL
useQuery({ queryKey: ['products'], ... })
useQuery({ queryKey: ['products-list'], ... })

// ✅ BIEN
useQuery({ queryKey: queryKeys.products.lists(), ... })
```

### ❌ 5. Múltiples booleanos para dialogs
```typescript
// ❌ MAL
const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
const [isClearCartOpen, setIsClearCartOpen] = useState(false)
const [isDeleteOpen, setIsDeleteOpen] = useState(false)

// ✅ BIEN: un solo estado enum
type DialogType = 'checkout' | 'clear-cart' | 'delete' | null
const [activeDialog, setActiveDialog] = useState<DialogType>(null)
```

---

## Resumen Rápido

| Qué | Dónde | Por Qué |
|-----|-------|---------|
| Auth session | Zustand + persist | Lo crea tu app, necesita localStorage |
| Sidebar open/closed | Zustand | Estado de UI puro |
| Lista de productos | React Query | Viene del servidor, necesita cache |
| Crear venta | React Query Mutation | Necesita invalidar cache después |
| Filtros de tabla | Zustand | Preferencia del usuario |
| Formulario | React Hook Form | Validación, sin necesidad de estado global |
| Carrito actual | Zustand | Temporal, efímero |
| Historial de ventas | React Query | Datos del servidor |
| Query keys | lib/query-keys.ts | Consistencia global |
| API client | lib/api.ts | Todas las features la usan |
