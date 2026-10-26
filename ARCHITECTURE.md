# 🏗️ Arquitectura y Diseño del Sistema

> **Patrón:** Monolito Front-Driven (React + Inertia SPA) con capacidad Headless total (JSON:API v1 + GraphQL)

---

## 1. Visión general

La plataforma combina la velocidad de una SPA en **React 19 + Inertia.js v3** con un backend Headless que expone dos APIs estándar: **JSON:API v1** y **GraphQL**.

```
                    ┌────────────────────────────────────────────────┐
                    │              CAPA DE PRESENTACIÓN              │
                    └───────────────────────┬────────────────────────┘
          ┌─────────────────────────────────┼─────────────────────────────────┐
┌─────────┴──────────┐         ┌────────────┴───────────┐         ┌───────────┴──────────┐
│ Inertia v3 React   │         │ JSON:API v1 Server     │         │ GraphQL Lighthouse   │
│ SPA (Wayfinder)    │         │ (laravel-json-api)     │         │ (nuwave/lighthouse)  │
└─────────┬──────────┘         └────────────┬───────────┘         └───────────┬──────────┘
          └─────────────────────────────────┼─────────────────────────────────┘
                    ┌───────────────────────┴────────────────────────┐
                    │        CAPA DE DOMINIO Y SERVICIOS CORE        │
                    │ • Stock Reservation Engine                     │
                    │ • Multi-Carrier Shipping Engine                │
                    │ • Multi-Gateway Payment Engine                 │
                    │ • Tax Calculator & Multicurrency Manager       │
                    │ • Dynamic CPT & ACF Fields Builder             │
                    │ • LLM Detector & Vector Recommender            │
                    │ • Multi-Tenant Teams & RBAC Permission Matrix  │
                    └───────────────────────┬────────────────────────┘
                    ┌───────────────────────┴────────────────────────┐
                    │        CAPA DE PERSISTENCIA Y BÚSQUEDA         │
                    │ MySQL / PostgreSQL | Redis | Meilisearch Scout │
                    └────────────────────────────────────────────────┘
```

## 2. Stack tecnológico

| Capa | Tecnología |
|---|---|
| Backend | PHP 8.5 / Laravel 13 |
| Frontend | React 19.2 + Inertia.js v3 |
| Estilos | Tailwind CSS v4 + Lucide / Hugeicons (Glassmorphism y Dark Mode) |
| Rutas tipadas | `@laravel/vite-plugin-wayfinder` |
| APIs Headless | `laravel-json-api/laravel` (JSON:API v1) + `nuwave/lighthouse` (GraphQL) |
| Autenticación API | Laravel Sanctum |
| Búsqueda | Laravel Scout + Meilisearch |
| Correos | React Email + Resend SDK |
| Permisos | `spatie/laravel-permission` |
| Medios | `spatie/laravel-medialibrary` |
| Traducciones | `spatie/laravel-translatable` |
| Slugs | `spatie/laravel-sluggable` |
| Pagos | `laravel/cashier` (Stripe), PayPal API v2, Nuvei |
| Testing | Pest, Jest, Cypress |

---

## 3. Estructura de directorios

```
app/
├── Http/
│   ├── Controllers/
│   │   ├── Admin/        # 34 controladores de administración (Inertia)
│   │   ├── Api/          # Webhooks de pago
│   │   │   └── V1/       # Controladores JSON:API v1
│   │   ├── Auth/         # Passkeys (WebAuthn), 2FA y Fortify
│   │   └── Front/        # Frontend público
│   └── Middleware/
│       ├── EnsureTeamMembership.php        # Scoping multi-tenant
│       ├── SetCurrentTeamPermissions.php   # Permisos dinámicos por equipo
│       └── SetApiLocale.php                # Idioma en API (X-Locale)
├── Models/               # 65+ modelos Eloquent
└── Services/
    ├── Billing/          # BillingService y gateways
    ├── Cart/             # Carritos y ajustes
    ├── Payment/          # Abstracciones de pasarelas
    ├── Shipping/         # CarrierRateService y drivers
    ├── Stock/            # LockingStockReserver, PriorityStockAllocator
    ├── Taxes/            # TaxCalculator, SystemTaxProvider
    ├── DynamicFieldsService.php   # Campos ACF dinámicos
    ├── LLMDetector.php            # Calidad de contenido con IA
    └── ContentRecommender.php     # Recomendación vectorial
```

---

## 4. Modelos de dominio (65+)

Organizados en cinco verticales funcionales:

| CMS & DXP | E-commerce | Logística | Pagos & Impuestos | Seguridad & Teams |
|---|---|---|---|---|
| Post | Product | Carrier | PaymentMethod | User |
| Page | ProductVariant | CarrierOption | TaxZone | Team |
| ContentSection | Category | Inventory | TaxRate | TeamInvitation |
| ContentSectionValue | Collection | InventoryHistory | TaxRateRule | Role |
| Cpt | CollectionRule | OrderShipping | TaxProvider | Permission |
| CptDefinition | Attribute | OrderShippingEvent | Currency | ApiKey |
| CptEntry | AttributeValue | Zone | Invoice | Session |
| Media | Brand | Address | Discount | Webhook |
| MediaFolder | Supplier | OrderAddress | DiscountDetail | WebhookLog |
| MediaLibrary | Review | Country | Subscription | Backup |
| AIInsight | Order / OrderItem | Geolocation | Plan / SubscriptionItem | Legal |

---

## 5. Multi-tenancy y seguridad

### Scoping por equipos
Todos los datos se aíslan bajo la entidad `Team`. El middleware `EnsureTeamMembership` valida que el usuario pertenezca al equipo indicado en la URL (`/{current_team}/...` o `/api/teams/{current_team}/...`). Las invitaciones usan tokens únicos con expiración (`TeamInvitation`).

### RBAC (Spatie Permissions + RolePermissionMatrix)
1. `Role` y `Permission` están vinculados dinámicamente al equipo actual.
2. El endpoint `permissions.generate` crea el esquema CRUD de permisos para cualquier modelo registrado.
3. `RolePermissionMatrix.tsx` permite activar/desactivar permisos granulares (`view_any`, `create`, `update`, `delete`, …) por rol y módulo, de forma asíncrona.

### Autenticación y auditoría
* **Passkeys / WebAuthn:** inicio de sesión biométrico sin contraseña.
* **2FA:** TOTP con códigos QR.
* **API Keys:** tokens con revocación e historial de uso (`ApiKey`).
* **Sesiones activas:** visualización y cierre remoto de sesiones sospechosas.
* **Roles base:** admin, editor, author, subscriber.

---

## 6. Motores de negocio

### A. Stock bloqueante (`LockingStockReserver`)
Previene *race conditions* y sobreventa:
1. El usuario inicia el checkout.
2. `LockingStockReserver` obtiene un bloqueo pesimista sobre los registros de `Inventory`.
3. `PriorityStockAllocator` elige el almacén óptimo por disponibilidad y cercanía.
4. Se registra una reserva con expiración (p. ej., 15 min); si el pago falla, se libera automáticamente.

### B. Envíos multi-carrier (`ShippingManager`)
Patrón *Strategy Driver Manager*:
```php
class ShippingManager extends Manager {
    public function createFedexDriver(): Driver;
    public function createUpsDriver(): Driver;
    public function createUspsDriver(): Driver;
    public function createManualDriver(): Driver;
}
```
`CarrierRateService` evalúa peso, volumen y dimensiones del carrito y consulta los drivers activos para devolver opciones en tiempo real (`CarrierOption`). Las tarifas consideran zonas geográficas (`Zone`, `Country`) y el tracking se registra en `OrderShippingEvent`.

### C. Pagos y suscripciones (`PaymentGatewayManager`)
* **StripeGateway:** `laravel/cashier`, suscripciones y 3DS.
* **PayPalGateway:** API v2 Orders.
* **NuveiGateway:** SDK Nuvei (Latam / internacional).
* **Suscripciones:** planes con frecuencia de cobro, periodos de prueba y renovaciones (`Plan`, `Subscription`, `SubscriptionItem`).
* **Facturación:** facturas descargables en PDF (`Invoice`, `BillingController`).
* **Webhooks de pago:** verificados por firma (`PaymentWebhookController`).

### D. Impuestos y multimoneda (`TaxCalculator`)
1. Recibe un `TaxCalculationContext` (destino, ítems, cliente).
2. `TaxZone` localiza la zona (`TaxRate`, `TaxRateRule`).
3. Genera líneas de impuesto por ítem (`OrderTaxLine`).

La gestión multimoneda (`Currency`) incluye tipo de cambio en vivo (`CurrencyCorrectionController`).

### E. Catálogo y colecciones
* Productos simples, variables, virtuales y descargables.
* Matriz de atributos (`Attribute`, `AttributeValue`, `AttributeProduct`).
* Colecciones dinámicas con reglas automáticas (`CollectionRule`) por precio, stock, categoría o etiquetas.
* Marcas (`Brand`) y proveedores (`Supplier`).

---

## 7. CMS, CPT y campos personalizados (ACF)

1. **`Cpt`:** nuevo tipo de contenido (p. ej. "Inmuebles", "Cursos", "Eventos"), creado desde la UI (`CptController`).
2. **`CptDefinition`:** define cada campo (`field_type`: text, rich_text, date, select, image, relation; `name`, `validation_rules`).
3. **`CptEntry`:** instancias creadas por los usuarios.
4. **`DynamicFieldsService`:** procesa, valida y serializa los valores (estructuras flex / JSON).
5. **Content Builder:** secciones modulares reutilizables (`ContentSection`, `ContentSectionValue`).
6. **Medios:** carpetas jerárquicas (`MediaFolder`), subida temporal por chunks (`TemporaryUploadController`), recorte interactivo y conversión automática a WebP.
7. **Temas y plugins:** `ThemeService` (tema activo en `settings`, vistas en `resources/views/cms/themes/{tema}`) y `PluginController` (plugins registrados como service providers desde la tabla `plugins`).

---

## 8. Inteligencia Artificial

```
Texto / Post ───────> LLMDetector ───────────> Score de calidad / detección de IA / sugerencias SEO
Post / Producto ────> ContentRecommender ────> Recomendaciones semánticas similares
                      (OpenAI Embeddings)
```

* **`LLMDetector`:** invoca proveedores LLM (OpenAI / Cohere) para evaluar calidad, tono, legibilidad y originalidad, detectar contenido generado por IA y sugerir mejoras SEO.
* **`ContentRecommender`:** convierte contenido en vectores (`text-embedding-3-small`), los indexa y calcula similitud de coseno para recomendar contenido relacionado.
* **AI Insights:** página del admin que muestra estas métricas y permite re-generar u optimizar contenido.

---

## 9. Capa API y webhooks

* **JSON:API v1:** recursos tipados (`type`, `id`, `attributes`, `relationships`), *sparse fieldsets*, `include`, `filter[...]` y ordenamiento. Detalle en [API.md](API.md).
* **GraphQL:** esquema en `graphql/schema.graphql` con directivas `@paginate`, `@eq`, `@rules`, etc.
* **Webhooks salientes:** los eventos de dominio (`order.created`, `product.updated`, …) disparan trabajos en cola; `WebhookLog` registra intento, código HTTP, tiempo de ejecución y firma HMAC del payload. Se pueden probar desde el panel.
* **Localización:** `SetApiLocale` toma el idioma de `X-Locale` / `Accept-Language`.