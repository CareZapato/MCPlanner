# 🎮 Minecraft Vendedores Manager

Aplicación web para gestionar vendedores de encantamientos en Minecraft. Diseñada con temática de Minecraft, responsive y accesible por red local.

## 🌟 Características

- ✅ Gestión completa de vendedores (CRUD)
- ✅ Almacenamiento en archivos JSON (simulando base de datos)
- ✅ Registro de vendedores con número, piso y encantamientos
- ✅ Sistema de filtros avanzados (por piso, nivel, nombre)
- ✅ Diseño temático de Minecraft con colores y estilos característicos
- ✅ Responsive design para dispositivos móviles
- ✅ Accesible por IP local en la red
- ✅ CORS configurado para acceso desde cualquier origen

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- [Node.js](https://nodejs.org/) (versión 14 o superior)
- npm (incluido con Node.js)

## 🚀 Instalación

### 1. Instalar todas las dependencias

Abre una terminal en la carpeta raíz del proyecto y ejecuta:

```bash
npm run install-all
```

Esto instalará:
- **Raíz:** Concurrently (ejecución simultánea) y http-server (servidor de frontend)
- **Backend:** Express (servidor API) y CORS (manejo de peticiones cross-origin)

### 2. Estructura del proyecto

```
MinecraftPlanner/
├── backend/
│   ├── server.js              # Servidor principal
│   ├── package.json           # Configuración de Node.js
│   ├── data/
│   │   └── vendedores.json   # Base de datos JSON
│   └── routes/
│       └── vendedores.js     # Rutas de la API
└── frontend/
    ├── index.html            # Página principal
    ├── css/
    │   └── style.css        # Estilos con tema Minecraft
    └── js/
        └── app.js           # Lógica de la aplicación
```

## 🎮 Uso

### Iniciar la aplicación en local

Desde la carpeta raíz del proyecto:

```bash
npm run dev
```

Este comando iniciará:
- **Backend y página** en el puerto 3000
- **Frontend de desarrollo** en el puerto 8080 (se abre automáticamente en el navegador)

`npm start` levanta solo el servidor de producción, el mismo que usa Render: página y API en un único puerto.

Verás algo como:

```
✅ Servidor corriendo en:
   - Backend API: http://localhost:3000
   - Frontend:    http://localhost:8080

📦 CORS habilitado para acceso desde cualquier origen
```

### Encontrar tu IP local

**Windows (PowerShell/CMD):**
```bash
ipconfig
```
Busca "Dirección IPv4" en tu adaptador de red activo (generalmente WiFi o Ethernet).

**Linux/Mac:**
```bash
ifconfig
# o
ip addr
```

### Acceder a la aplicación

- **Desde el mismo equipo:** `http://localhost:3000`
- **Desde otro dispositivo en la red:** `http://TU_IP_LOCAL:3000`
  
  Ejemplo: `http://192.168.1.100:3000`
8080`
- **Desde otro dispositivo en la red:** `http://TU_IP_LOCAL:8080`
  
  Ejemplo: `http://192.168.1.239:8080`

La API backend estará disponible en el puerto 3000, pero no necesitas acceder directamente a ella.

1. Ingresa el número del vendedor
2. Especifica el piso (ej: "Piso 1 - Norte")
3. Agrega encantamientos:
   - Escribe el nombre del encantamiento
   - Selecciona el nivel (1-5)
   - Haz clic en "+ Agregar"
4. Guarda el vendedor

### 2. Ver Vendedores

- Lista visual de todos los vendedores
- Cada tarjeta muestra:
  - Número del vendedor
  - Piso
  - Encantamientos con sus niveles (si aplica)
  - Nivel máximo (si aplica, en rojo)
  - Encantamientos sin niveles (en azul)
  - Botones de editar y eliminar
  - Botón × para eliminar encantamientos individuales

### 3. Buscar con Filtros

Puedes filtrar por:
- **Piso:** Busca por nombre del piso
- **Encantamiento:** Busca por nombre de encantamiento
- **Nivel:** Filtra por nivel específico (1-5)

### 4. Editar Vendedor

1. Haz clic en "✏️ Editar" en la tarjeta del vendedor
2. Modifica los datos en el formulario
3. Guarda los cambios

### 5. Eliminar Vendedor

1. Haz clic en "🗑️ Eliminar"
2. Confirma la eliminación en el modal

## 🎨 Diseño

El diseño está inspirado en Minecraft con:

- **Colores:** Tierra, piedra, esmeralda, oro
- **Fuente:** Press Start 2P (estilo pixel/retro)
- **Elementos:** Bordes gruesos, sombras características
- **Responsive:** Adaptado para pantallas de escritorio, tablet y móvil

## 📡 API REST

### Endpoints disponibles

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/vendedores` | Obtener todos los vendedores |
| GET | `/api/vendedores/:id` | Obtener vendedor por ID |
| POST | `/api/vendedores` | Crear nuevo vendedor |
| PUT | `/api/vendedores/:id` | Actualizar vendedor |
| DELETE | `/api/vendedores/:id` | Eliminar vendedor |
| GET | `/api/vendedores/buscar/filtros` | Buscar con filtros |

### Ejemplo de uso (cURL)

```bash
# Crear vendedor con encantamientos con y sin niveles
curl -X POST http://localhost:3000/api/vendedores \
  -H "Content-Type: application/json" \
  -d '{
    "numero": 1,
    "piso": "Piso 1 - Norte",
    "encantamientos": [
      {
        "nombre": "Protección",
        "nivel": 4,
        "nivelMaximo": 4
      },
      {
        "nombre": "Afilado",
        "nivel": 5,
        "nivelMaximo": 5
      },
      {
        "nombre": "Reparación",
        "tieneNiveles": false
      }
    ]
  }'

# Obtener todos los vendedores
curl http://localhost:3000/api/vendedores

# Buscar con filtros
curl "http://localhost:3000/api/vendedores/buscar/filtros?piso=Norte&nivel=4"
```

## 📊 Estructura de Datos

### Vendedor (JSON)

```json
{
  "id": 1,
  "numero": 1,
  "piso": "Piso 1 - Norte",
  "encantamientos": [
    {
      "nombre": "Protección",
      "nivel": 4,
      "nivelMaximo": 4
    },
    {
      "nombre": "Afilado",
      "nivel": 5,
      "nivelMaximo": 5
    },
    {
      "nombre": "Reparación",
      "tieneNiveles": false
    }
  ],
  "fechaCreacion": "2026-06-05T10:30:00.000Z",
  "fechaActualizacion": "2026-06-05T11:00:00.000Z"
}
```

### Estructura de Encantamiento

**Encantamiento con niveles:**
```json
{
  "nombre": "Protección",
  "nivel": 4,
  "nivelMaximo": 4
}
```

**Encantamiento sin niveles:**
```json
{
  "nombre": "Reparación",
  "tieneNiveles": false
}
```

**Atributos:**
- `nombre` (string, requerido): Nombre del encantamiento
- `nivel` (number, opcional): Nivel actual del encantamiento (1 a nivelMaximo)
- `nivelMaximo` (number, opcional): Nivel máximo que puede alcanzar el encantamiento (1 a 10)
- `tieneNiveles` (boolean, opcional): `false` si el encantamiento no se clasifica por niveles

## 🔧 Configuración Avanzada

### Cambiar el puerto

Edita `backend/server.js`:

```javascript
const PORT = process.env.PORT || 3000; // Cambia 3000 por el puerto deseado
```

O usa variable de entorno:

```bash
PORT=8080 npm start
```

### Cambiar la ubicación del archivo de datos

Edita `backend/routes/vendedores.js`:

```javascript
const DATA_FILE = path.join(__dirname, '../data/vendedores.json');
```

## 🛠️ Desarrollo

### Estructura del código

**Backend:**
- `server.js`: Configuración del servidor Express
- `routes/vendedores.js`: Lógica de la API REST
- `data/vendedores.json`: Almacenamiento de datos

**Frontend:**
- `index.html`: Estructura HTML
- `css/style.css`: Estilos con tema Minecraft
- `js/app.js`: Lógica de la aplicación (fetch API, DOM)

### Agregar nuevas características

1. **Nueva ruta API:** Edita `backend/routes/vendedores.js`
2. **Nuevo estilo:** Edita `frontend/css/style.css`
3. **Nueva funcionalidad:** Edita `frontend/js/app.js`

## 📱 Acceso desde dispositivos móviles

1. Asegúrate de que tu dispositivo móvil esté en la misma red WiFi
2. Encuentra tu IP local (ver sección "Encontrar tu IP local")
3. En el navegador móvil, accede a: `http://TU_IP_LOCAL:3000`
4. La interfaz se adaptará automáticamente al tamaño de pantalla

## 🔒 Seguridad

**NOTA:** Esta aplicación está diseñada para uso en red local. Para producción:

- Implementa autenticación y autorización
- Usa HTTPS
- Valida y sanitiza todas las entradas
- Implementa rate limiting
- Configura CORS de manera más restrictiva

## 🐛 Solución de Problemas

### El servidor no inicia

```bash
# Verifica que Node.js esté instalado
node --version

# Reinstala las dependencias
npm run install-all
```

### No puedo acceder desde otro dispositivo

1. Verifica que ambos dispositivos estén en la misma red
2. Desactiva temporalmente el firewall o agrega una excepción para el puerto 3000
3. Verifica tu IP local con `ipconfig`

### Error de CORS

El CORS ya está configurado para permitir cualquier origen. Si aún tienes problemas:

1. Verifica que estés usando la IP correcta
2. Comprueba la configuración en `backend/server.js`

### Los datos no se guardan

1. Verifica que el archivo `backend/data/vendedores.json` exista
2. Comprueba los permisos de escritura en la carpeta `data/`

## 📈 Próximas Mejoras

- [ ] Migración a base de datos real (MongoDB, PostgreSQL)
- [ ] Sistema de autenticación
- [ ] Exportar/Importar datos
- [ ] Gráficos y estadísticas
- [ ] Notificaciones toast en lugar de alerts
- [ ] Drag & drop para reordenar encantamientos
- [ ] Búsqueda en tiempo real
- [ ] Temas personalizables

## Publicar en GitHub y Render

El repositorio de destino es [CareZapato/MCPlanner](https://github.com/CareZapato/MCPlanner).

Render ejecuta `npm install` y después `npm start`. Ese comando sirve la página y la API en el mismo puerto (`PORT`). En local, el puerto 8080 sigue hablando con la API del puerto 3000.

En el panel de Render: New → Blueprint, y elige este repositorio. El archivo `render.yaml` define el servicio web `mcplanner` en el plan gratis.

El plan gratis no conserva los cambios de vendedores ni composiciones cuando el servicio se reinicia o se vuelve a desplegar. Los datos que van en el repositorio sí vuelven a aparecer. Para guardarlos de forma permanente hace falta un disco de Render y la variable `DATA_DIR` apuntando a esa carpeta. Al primer arranque, si esa carpeta está vacía, se copian los JSON del repositorio.

## 📝 Licencia

Este proyecto es de código abierto y está disponible para uso personal.

## 👨‍💻 Autor

Desarrollado para gestionar vendedores de encantamientos en Minecraft.

---

**¡Disfruta gestionando tus vendedores de Minecraft! ⛏️🎮**
