# Estructura de Datos - Minecraft Planner

Esta aplicación utiliza una estructura de datos **normalizada** con 3 entidades separadas en archivos JSON, lista para migrar a una base de datos relacional.

## 📁 Archivos de Datos

### 1. `vendedores.json`
Tabla de vendedores con información básica.

```json
[
  {
    "id": 1,
    "numero": 1,
    "piso": 1,
    "fechaCreacion": "2026-06-05T12:00:00.000Z"
  }
]
```

**Campos:**
- `id` (number): ID único del vendedor (auto-incrementa)
- `numero` (number): Número del vendedor (único, ingresado por usuario)
- `piso` (number): Piso donde se encuentra
- `fechaCreacion` (string ISO): Fecha de creación
- `fechaActualizacion` (string ISO, opcional): Fecha de última actualización

---

### 2. `encantamientos.json`
Tabla de encantamientos únicos en el sistema.

```json
[
  {
    "id": 1,
    "nombre": "Protección",
    "tieneNiveles": true,
    "fechaCreacion": "2026-06-05T12:00:00.000Z"
  },
  {
    "id": 2,
    "nombre": "Reparación",
    "tieneNiveles": false,
    "fechaCreacion": "2026-06-05T12:00:00.000Z"
  }
]
```

**Campos:**
- `id` (number): ID único del encantamiento (auto-incrementa)
- `nombre` (string): Nombre del encantamiento (único)
- `tieneNiveles` (boolean): Si el encantamiento tiene niveles (I, II, III, etc.)
- `fechaCreacion` (string ISO): Fecha de creación

**Nota:** Los encantamientos se crean automáticamente cuando se agregan a un vendedor. Si el mismo encantamiento se usa en múltiples vendedores, se reutiliza el mismo registro.

---

### 3. `vendedor_encantamientos.json`
Tabla de relación **muchos-a-muchos** entre vendedores y encantamientos.

```json
[
  {
    "id": 1,
    "vendedorId": 1,
    "encantamientoId": 1,
    "nivel": 3,
    "nivelMaximo": 4,
    "fechaCreacion": "2026-06-05T12:00:00.000Z"
  },
  {
    "id": 2,
    "vendedorId": 1,
    "encantamientoId": 2,
    "fechaCreacion": "2026-06-05T12:00:00.000Z"
  }
]
```

**Campos:**
- `id` (number): ID único de la relación (auto-incrementa)
- `vendedorId` (number): ID del vendedor (FK → `vendedores.id`)
- `encantamientoId` (number): ID del encantamiento (FK → `encantamientos.id`)
- `nivel` (number, opcional): Nivel actual del encantamiento (1-6)
- `nivelMaximo` (number, opcional): Nivel máximo del encantamiento (1-6)
- `fechaCreacion` (string ISO): Fecha de creación

**Nota:** Los campos `nivel` y `nivelMaximo` solo están presentes si el encantamiento tiene niveles.

---

## 🔗 Relaciones

### Relación Muchos-a-Muchos
- Un **vendedor** puede tener múltiples **encantamientos**
- Un **encantamiento** puede ser vendido por múltiples **vendedores**
- Los niveles (nivel, nivelMaximo) se almacenan en la tabla de relación, no en el encantamiento

### Diagrama ER

```
┌─────────────────┐       ┌──────────────────────────┐       ┌─────────────────┐
│   VENDEDORES    │       │  VENDEDOR_ENCANTAMIENTOS │       │ ENCANTAMIENTOS  │
├─────────────────┤       ├──────────────────────────┤       ├─────────────────┤
│ id (PK)         │──┐    │ id (PK)                  │    ┌──│ id (PK)         │
│ numero          │  └───<│ vendedorId (FK)          │    │  │ nombre          │
│ piso            │       │ encantamientoId (FK)     │>───┘  │ tieneNiveles    │
│ fechaCreacion   │       │ nivel                    │       │ fechaCreacion   │
└─────────────────┘       │ nivelMaximo              │       └─────────────────┘
                          │ fechaCreacion            │
                          └──────────────────────────┘
```

---

## 🚀 Migración a Base de Datos

Esta estructura está lista para migrar directamente a una base de datos relacional (MySQL, PostgreSQL, etc.) con:

### SQL (PostgreSQL ejemplo)

```sql
-- Tabla vendedores
CREATE TABLE vendedores (
    id SERIAL PRIMARY KEY,
    numero INTEGER UNIQUE NOT NULL,
    piso INTEGER NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP
);

-- Tabla encantamientos
CREATE TABLE encantamientos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    tiene_niveles BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT NOW()
);

-- Tabla de relación (muchos-a-muchos)
CREATE TABLE vendedor_encantamientos (
    id SERIAL PRIMARY KEY,
    vendedor_id INTEGER REFERENCES vendedores(id) ON DELETE CASCADE,
    encantamiento_id INTEGER REFERENCES encantamientos(id) ON DELETE CASCADE,
    nivel INTEGER CHECK (nivel >= 1 AND nivel <= 6),
    nivel_maximo INTEGER CHECK (nivel_maximo >= 1 AND nivel_maximo <= 6),
    fecha_creacion TIMESTAMP DEFAULT NOW(),
    UNIQUE(vendedor_id, encantamiento_id)
);

-- Índices para mejorar búsquedas
CREATE INDEX idx_vendedor_encantamientos_vendedor ON vendedor_encantamientos(vendedor_id);
CREATE INDEX idx_vendedor_encantamientos_encantamiento ON vendedor_encantamientos(encantamiento_id);
```

---

## 💡 Ventajas de esta Estructura

1. **Sin Duplicación**: Los nombres de encantamientos se almacenan una sola vez
2. **Normalización**: Cumple con la Tercera Forma Normal (3NF)
3. **Flexibilidad**: Fácil agregar nuevos encantamientos sin modificar vendedores
4. **Búsquedas Eficientes**: Se pueden hacer JOINs para obtener datos completos
5. **Migración Directa**: La estructura JSON se traduce 1:1 a tablas SQL
6. **Eliminación en Cascada**: Al eliminar un vendedor, se eliminan sus relaciones automáticamente

---

## 📊 Ejemplos de Consultas

### Frontend (fetch actual)
```javascript
// Obtener todos los vendedores con sus encantamientos (JOIN automático)
const response = await fetch('http://localhost:3000/api/vendedores');
const vendedores = await response.json();
```

### Futuro SQL (después de migración)
```sql
-- Obtener vendedores con sus encantamientos
SELECT 
    v.numero,
    v.piso,
    e.nombre AS encantamiento,
    ve.nivel,
    ve.nivel_maximo
FROM vendedores v
LEFT JOIN vendedor_encantamientos ve ON v.id = ve.vendedor_id
LEFT JOIN encantamientos e ON ve.encantamiento_id = e.id
ORDER BY v.numero, e.nombre;

-- Buscar qué vendedores tienen un encantamiento específico
SELECT v.numero, v.piso, ve.nivel
FROM vendedores v
JOIN vendedor_encantamientos ve ON v.id = ve.vendedor_id
JOIN encantamientos e ON ve.encantamiento_id = e.id
WHERE e.nombre = 'Protección'
ORDER BY ve.nivel DESC;
```

---

## 🔧 API Endpoints

El backend ya implementa todas las operaciones necesarias:

- `GET /api/vendedores` - Listar todos (con JOIN)
- `GET /api/vendedores/:id` - Obtener uno (con JOIN)
- `POST /api/vendedores` - Crear vendedor + encantamientos + relaciones
- `PUT /api/vendedores/:id` - Actualizar vendedor + relaciones
- `DELETE /api/vendedores/:id` - Eliminar vendedor (cascada a relaciones)
- `DELETE /api/vendedores/:vendedorId/encantamientos/:relacionId` - Eliminar una relación específica
- `GET /api/vendedores/buscar/filtros` - Búsqueda con filtros (con JOIN)
- `GET /api/vendedores/encantamientos/todos` - Listar todos los encantamientos

---

¡La aplicación está lista para escalar a una base de datos sin cambios en la lógica de negocio! 🎮✨
