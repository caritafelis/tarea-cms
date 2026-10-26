# 🌐 Documentación de API

La plataforma expone dos APIs Headless sobre el mismo dominio:

| API | Estándar | Endpoint | Auth |
|---|---|---|---|
| **REST** | [JSON:API v1.0](https://jsonapi.org/) | `/api/teams/{current_team}/v1/` | Bearer (Sanctum) obligatorio |
| **GraphQL** | Lighthouse (`nuwave/lighthouse`) | `POST /graphql` | Pública para lecturas; Bearer para mutaciones y datos privados |

Además existe un webhook de Stripe y un sistema de webhooks salientes (sección 3).

---

# Parte 1 · REST (JSON:API v1)

## 1.1 Autenticación y cabeceras

Todas las peticiones (excepto el webhook de Stripe) requieren un token **Sanctum**:

```http
Authorization: Bearer <tu-sanctum-token>
Accept: application/vnd.api+json
Content-Type: application/vnd.api+json
X-Locale: es
```

* **`Authorization`:** token generado desde el panel de administración o el endpoint de autenticación.
* **`Accept` / `Content-Type`:** `application/vnd.api+json` es obligatorio por la especificación.
* **`X-Locale` / `Accept-Language`:** idioma de los atributos traducibles (`es`, `en`, `fr`, …).

## 1.2 Base URL

```
https://tu-dominio.com/api/teams/{current_team}/v1/
```

Los datos están aislados por equipo; el usuario debe pertenecer a `{current_team}`.

## 1.3 Recursos expuestos (35+)

| Recurso | Endpoint | Métodos | Descripción |
|---|---|---|---|
| Productos | `/products` | GET, POST, PATCH, DELETE | Catálogo general |
| Variantes | `/product-variants` | GET, POST, PATCH, DELETE | Opciones y SKUs |
| Categorías | `/categories` | GET, POST, PATCH, DELETE | Categorías de productos y posts |
| Colecciones | `/collections` | GET, POST, PATCH, DELETE | Colecciones estáticas y dinámicas |
| Reglas de colección | `/collection-rules` | GET, POST, PATCH, DELETE | Reglas automáticas |
| Atributos | `/attributes` | GET, POST, PATCH, DELETE | Color, talla, etc. |
| Valores de atributo | `/attribute-values` | GET, POST, PATCH, DELETE | Valores asignables |
| Marcas | `/brands` | GET, POST, PATCH, DELETE | Fabricantes |
| Proveedores | `/suppliers` | GET, POST, PATCH, DELETE | Proveedores y contacto |
| Entradas | `/posts` | GET, POST, PATCH, DELETE | Blog y noticias |
| Páginas | `/pages` | GET, POST, PATCH, DELETE | Páginas estáticas |
| CPTs | `/cpts` | GET, POST, PATCH, DELETE | Custom Post Types |
| CPT Definitions | `/cpt-definitions` | GET, POST, PATCH, DELETE | Definición de campos ACF |
| CPT Entries | `/cpt-entries` | GET, POST, PATCH, DELETE | Entradas de CPT |
| Carritos | `/carts` | GET, POST, PATCH, DELETE | Carritos de compra |
| Líneas de carrito | `/cart-lines` | GET, POST, PATCH, DELETE | Ítems del carrito |
| Checkout | `/carts/{id}/-actions/checkout` | POST | Genera la orden |
| Órdenes | `/orders` | GET, POST, PATCH | Historial de órdenes |
| Ítems de orden | `/order-items` | GET | Detalle de lo comprado |
| Inventarios | `/inventories` | GET, POST, PATCH | Stock por almacén |
| Transportistas | `/carriers` | GET, POST, PATCH, DELETE | Empresas de logística |
| Opciones de envío | `/carrier-options` | GET, POST, PATCH, DELETE | Tarifas y modalidades |
| Métodos de pago | `/payment-methods` | GET, POST, PATCH, DELETE | Pasarelas disponibles |
| Transacciones | `/payment-transactions` | GET | Log de transacciones |
| Descuentos | `/discounts` | GET, POST, PATCH, DELETE | Cupones y reglas |
| Zonas fiscales | `/tax-zones` | GET, POST, PATCH, DELETE | Zonas de impuestos |
| Tasas de impuesto | `/tax-rates` | GET, POST, PATCH, DELETE | Tasas aplicables |
| Zonas geográficas | `/zones` | GET, POST, PATCH, DELETE | Envío y cobertura |
| Países | `/countries` | GET | Países habilitados |
| Monedas | `/currencies` | GET, POST, PATCH | Divisas y conversión |
| Reseñas | `/reviews` | GET, POST, PATCH, DELETE | Valoraciones |
| Direcciones | `/addresses` | GET, POST, PATCH, DELETE | Direcciones de clientes |
| Archivos de medios | `/media-libraries` | GET, POST, DELETE | Biblioteca de medios |
| Carpetas de medios | `/media-folders` | GET, POST, PATCH, DELETE | Organización jerárquica |
| Usuarios | `/users` | GET, POST, PATCH, DELETE | Usuarios de la API |
| Ajustes | `/settings` | GET | Configuración pública (solo lectura) |

Soporta `include`, `filter[...]`, `sort`, `fields[...]` (sparse fieldsets) y paginación `page[number]` / `page[size]`.

## 1.4 Ejemplos

### Listar productos con relaciones

```http
GET /api/teams/default-team/v1/products?include=category,brand,variants&filter[status]=published&page[number]=1&page[size]=10 HTTP/1.1
Host: tu-dominio.com
Authorization: Bearer 1|sanctum_token_sample
Accept: application/vnd.api+json
X-Locale: es
```

**Respuesta `200 OK`:**
```json
{
  "meta": {
    "page": { "currentPage": 1, "from": 1, "lastPage": 5, "perPage": 10, "to": 10, "total": 50 }
  },
  "data": [
    {
      "type": "products",
      "id": "101",
      "attributes": {
        "name": "Camiseta Premium Cotton",
        "slug": "camiseta-premium-cotton",
        "description": "Camiseta de algodón orgánico 100%",
        "price": 29.99,
        "sku": "TSHIRT-COT-01",
        "status": "published",
        "created-at": "2026-09-28T04:00:00.000000Z"
      },
      "relationships": {
        "category": { "data": { "type": "categories", "id": "12" } },
        "brand": { "data": { "type": "brands", "id": "3" } }
      }
    }
  ],
  "included": [
    { "type": "categories", "id": "12", "attributes": { "name": "Ropa Masculina", "slug": "ropa-masculina" } },
    { "type": "brands", "id": "3", "attributes": { "name": "EcoWear" } }
  ]
}
```

### Crear un producto

```http
POST /api/teams/default-team/v1/products HTTP/1.1
Host: tu-dominio.com
Authorization: Bearer 1|sanctum_token_sample
Content-Type: application/vnd.api+json
Accept: application/vnd.api+json

{
  "data": {
    "type": "products",
    "attributes": {
      "name": "Zapatillas Trail Running Pro",
      "description": "Zapatillas impermeables para montaña",
      "price": 120.00,
      "sku": "SHOES-TRAIL-001",
      "status": "published"
    },
    "relationships": {
      "category": { "data": { "type": "categories", "id": "15" } }
    }
  }
}
```

**Respuesta `201 Created`:**
```json
{
  "data": {
    "type": "products",
    "id": "102",
    "attributes": {
      "name": "Zapatillas Trail Running Pro",
      "slug": "zapatillas-trail-running-pro",
      "description": "Zapatillas impermeables para montaña",
      "price": 120.00,
      "sku": "SHOES-TRAIL-001",
      "status": "published",
      "created-at": "2026-09-28T05:30:00.000000Z"
    }
  }
}
```

### Checkout de carrito

```http
POST /api/teams/default-team/v1/carts/cart-88912/-actions/checkout HTTP/1.1
Host: tu-dominio.com
Authorization: Bearer 1|sanctum_token_sample
Content-Type: application/vnd.api+json
Accept: application/vnd.api+json

{
  "payment_method_id": "pm_stripe_card_01",
  "carrier_option_id": 4,
  "shipping_address_id": 25,
  "billing_address_id": 25
}
```

**Respuesta `200 OK`:**
```json
{
  "data": {
    "type": "orders",
    "id": "ORD-2026-0991",
    "attributes": {
      "status": "processing",
      "total-amount": 149.99,
      "tax-amount": 15.00,
      "shipping-amount": 14.99,
      "currency": "USD",
      "created-at": "2026-09-28T05:31:00.000000Z"
    }
  }
}
```

## 1.5 Errores

Los errores (400, 401, 403, 404, 422, 500) siguen JSON:API:

```json
{
  "errors": [
    {
      "status": "422",
      "title": "Unprocessable Entity",
      "detail": "El campo sku ya ha sido registrado.",
      "source": { "pointer": "/data/attributes/sku" }
    }
  ]
}
```

---

# Parte 2 · GraphQL

## 2.1 Autenticación y cabeceras

Las consultas públicas (listar posts o productos) no requieren autenticación. Las mutaciones y consultas privadas requieren Bearer:

```http
Authorization: Bearer <sanctum-token>
Content-Type: application/json
Accept: application/json
X-Locale: es
```

## 2.2 Esquema y directivas

El esquema vive en `graphql/schema.graphql` y usa directivas de Lighthouse:

* **Consulta:** `@paginate`, `@find`, `@all`, `@eq`, `@where`, `@orderBy`, `@search`
* **Relaciones:** `@belongsTo`, `@hasMany`, `@hasOne`, `@belongsToMany`
* **Autorización:** `@can`, `@auth`, `@guard`

Para imprimir el esquema: `php artisan lighthouse:print-schema`.

## 2.3 Queries

### Posts con paginación y categorías

```graphql
query GetPublishedPosts($first: Int!, $page: Int!) {
  posts(
    first: $first
    page: $page
    where: { column: STATUS, operator: EQ, value: "published" }
    orderBy: [{ column: CREATED_AT, order: DESC }]
  ) {
    paginatorInfo { currentPage lastPage total hasMorePages }
    data {
      id title slug content published_at
      user { id name email }
      categories { id name slug }
    }
  }
}
```
Variables: `{ "first": 5, "page": 1 }`

### Producto por slug (variantes y reseñas)

```graphql
query GetProductDetail($slug: String!) {
  product(slug: $slug) {
    id name slug description price sku status
    brand { name }
    category { name slug }
    variants {
      id sku price stock
      attributeValues { id value attribute { name } }
    }
    reviews { id rating comment user { name } }
  }
}
```

### Entradas de CPT con campos ACF

```graphql
query GetCustomPostTypeEntries($cptSlug: String!) {
  cptEntries(cptSlug: $cptSlug, first: 10) {
    data {
      id title slug
      values { field_name field_value }
    }
  }
}
```

## 2.4 Mutations

### Crear entrada de blog

```graphql
mutation CreateNewPost($input: CreatePostInput!) {
  createPost(input: $input) { id title slug status created_at }
}
```
```json
{
  "input": {
    "title": "Novedades de la Plataforma 2026",
    "content": "<p>Estamos orgullosos de lanzar la versión 2.0 con soporte nativo de GraphQL...</p>",
    "status": "published",
    "categories": [1, 3]
  }
}
```

### Actualizar perfil

```graphql
mutation UpdateUserProfile($name: String!, $email: String!) {
  updateProfile(input: { name: $name, email: $email }) { id name email }
}
```

### Checkout de carrito

```graphql
mutation CheckoutCart($cartId: ID!, $paymentMethodId: String!, $shippingAddressId: ID!) {
  checkoutCart(
    cartId: $cartId
    paymentMethodId: $paymentMethodId
    shippingAddressId: $shippingAddressId
  ) {
    order { id total_amount status created_at }
    success
    message
  }
}
```

## 2.5 Playground

Con `APP_DEBUG=true` puedes probar queries y mutaciones de forma interactiva con Altair GraphQL, Postman u otro cliente apuntando a:

```
http://127.0.0.1:8000/graphql
```

---

# Parte 3 · Webhooks

## 3.1 Webhook entrante de Stripe

Se encuentra fuera del grupo autenticado con Sanctum porque lo invoca directamente Stripe.

* **Endpoint:** `POST /api/payments/webhook`
* **Autenticación:** firma criptográfica en la cabecera `Stripe-Signature`
* **Eventos manejados:** `payment_intent.succeeded`, `invoice.payment_succeeded`, `customer.subscription.deleted`, `charge.refunded`

## 3.2 Webhooks salientes

* Se registran dinámicamente desde el panel (`Webhook`) y se pueden probar con un botón de envío instantáneo.
* Los eventos de dominio (`order.created`, `product.updated`, …) disparan trabajos en cola.
* Cada payload va firmado con HMAC y cada intento se guarda en `WebhookLog` (código HTTP, tiempo de ejecución y firma).