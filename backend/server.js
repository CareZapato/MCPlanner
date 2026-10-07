const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;

const { prepararDatos } = require('./dataDir');
prepararDatos();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de CORS - permite acceso desde cualquier origen
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Rutas de la API
const vendedoresRoutes = require('./routes/vendedores');
const buildRoutes = require('./routes/build');
const composicionesRoutes = require('./routes/composiciones');
const catalogoRoutes = require('./routes/catalogo');
app.use('/api/vendedores', vendedoresRoutes);
app.use('/api/build', buildRoutes);
app.use('/api/composiciones', composicionesRoutes);
app.use('/api/catalogo', catalogoRoutes);

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Iniciar servidor en todas las interfaces (0.0.0.0) para acceso por IP
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🎮 ===================================== 🎮`);
  console.log(`   Minecraft Planner Server`);
  console.log(`🎮 ===================================== 🎮`);
  console.log(`\n✅ Servidor corriendo en:`);
  console.log(`   - Local:   http://localhost:${PORT}`);
  console.log(`   - Red:     http://[TU_IP_LOCAL]:${PORT}`);
  console.log(`\n📦 CORS habilitado para acceso desde cualquier origen`);
  console.log(`\n🔧 Para encontrar tu IP local:`);
  console.log(`   Windows: ipconfig`);
  console.log(`   Linux/Mac: ifconfig o ip addr\n`);
});
