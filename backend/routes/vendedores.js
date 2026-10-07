const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const { archivo } = require('../dataDir');

const VENDEDORES_FILE = archivo('vendedores.json');
const ENCANTAMIENTOS_FILE = archivo('encantamientos.json');
const RELACIONES_FILE = archivo('vendedor_encantamientos.json');

// Funciones auxiliares para leer/escribir entidades
async function leerArchivo(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function guardarArchivo(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// Funciones específicas por entidad
async function leerVendedores() {
  return await leerArchivo(VENDEDORES_FILE);
}

async function guardarVendedores(vendedores) {
  await guardarArchivo(VENDEDORES_FILE, vendedores);
}

async function leerEncantamientos() {
  return await leerArchivo(ENCANTAMIENTOS_FILE);
}

async function guardarEncantamientos(encantamientos) {
  await guardarArchivo(ENCANTAMIENTOS_FILE, encantamientos);
}

async function leerRelaciones() {
  return await leerArchivo(RELACIONES_FILE);
}

async function guardarRelaciones(relaciones) {
  await guardarArchivo(RELACIONES_FILE, relaciones);
}

// Función para obtener o crear encantamiento
async function obtenerOCrearEncantamiento(nombre, tieneNiveles = true) {
  const encantamientos = await leerEncantamientos();
  
  // Buscar si ya existe
  let encantamiento = encantamientos.find(e => e.nombre.toLowerCase() === nombre.toLowerCase());
  
  if (!encantamiento) {
    // Crear nuevo
    encantamiento = {
      id: encantamientos.length > 0 ? Math.max(...encantamientos.map(e => e.id)) + 1 : 1,
      nombre: nombre,
      tieneNiveles: tieneNiveles,
      fechaCreacion: new Date().toISOString()
    };
    encantamientos.push(encantamiento);
    await guardarEncantamientos(encantamientos);
  }
  
  return encantamiento;
}

// ============================================
// RUTAS DE VENDEDORES (con JOIN a encantamientos)
// ============================================

// GET - Obtener todos los vendedores con sus encantamientos
router.get('/', async (req, res) => {
  try {
    const vendedores = await leerVendedores();
    const encantamientos = await leerEncantamientos();
    const relaciones = await leerRelaciones();
    
    // JOIN: Agregar encantamientos a cada vendedor
    const vendedoresConEncantamientos = vendedores.map(vendedor => {
      const relacionesVendedor = relaciones.filter(r => r.vendedorId === vendedor.id);
      const encantamientosVendedor = relacionesVendedor.map(rel => {
        const enc = encantamientos.find(e => e.id === rel.encantamientoId);
        return {
          relacionId: rel.id,  // ID de la relación para poder eliminarla
          nombre: enc ? enc.nombre : 'Desconocido',
          tieneNiveles: enc ? enc.tieneNiveles : true,
          nivel: rel.nivel,
          nivelMaximo: rel.nivelMaximo
        };
      });
      
      return {
        ...vendedor,
        encantamientos: encantamientosVendedor
      };
    });
    
    res.json(vendedoresConEncantamientos);
  } catch (error) {
    res.status(500).json({ error: 'Error al leer vendedores', details: error.message });
  }
});

// GET - Obtener vendedor por ID con sus encantamientos
router.get('/:id', async (req, res) => {
  try {
    const vendedores = await leerVendedores();
    const encantamientos = await leerEncantamientos();
    const relaciones = await leerRelaciones();
    
    const vendedor = vendedores.find(v => v.id === parseInt(req.params.id));
    
    if (!vendedor) {
      return res.status(404).json({ error: 'Vendedor no encontrado' });
    }
    
    // JOIN: Agregar encantamientos
    const relacionesVendedor = relaciones.filter(r => r.vendedorId === vendedor.id);
    const encantamientosVendedor = relacionesVendedor.map(rel => {
      const enc = encantamientos.find(e => e.id === rel.encantamientoId);
      return {
        relacionId: rel.id,  // ID de la relación para poder eliminarla
        nombre: enc ? enc.nombre : 'Desconocido',
        tieneNiveles: enc ? enc.tieneNiveles : true,
        nivel: rel.nivel,
        nivelMaximo: rel.nivelMaximo
      };
    });
    
    res.json({
      ...vendedor,
      encantamientos: encantamientosVendedor
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar vendedor', details: error.message });
  }
});

// POST - Crear nuevo vendedor con sus encantamientos
router.post('/', async (req, res) => {
  try {
    const vendedores = await leerVendedores();
    const relaciones = await leerRelaciones();
    const { numero, piso, encantamientos } = req.body;
    
    // Validaciones
    if (!numero || !piso) {
      return res.status(400).json({ error: 'Número y piso son requeridos' });
    }
    
    if (!encantamientos || encantamientos.length === 0) {
      return res.status(400).json({ error: 'Debe agregar al menos un encantamiento' });
    }
    
    // Verificar si ya existe un vendedor con ese número
    const existe = vendedores.find(v => v.numero === numero);
    if (existe) {
      return res.status(400).json({ error: 'Ya existe un vendedor con ese número' });
    }
    
    // Crear vendedor
    const nuevoVendedor = {
      id: vendedores.length > 0 ? Math.max(...vendedores.map(v => v.id)) + 1 : 1,
      numero: parseInt(numero),
      piso: parseInt(piso),
      fechaCreacion: new Date().toISOString()
    };
    
    vendedores.push(nuevoVendedor);
    await guardarVendedores(vendedores);
    
    // Procesar cada encantamiento y crear relaciones
    const relacionesCreadas = [];
    for (const enc of encantamientos) {
      // Obtener o crear el encantamiento
      const tieneNiveles = enc.tieneNiveles !== false;
      const encantamiento = await obtenerOCrearEncantamiento(enc.nombre, tieneNiveles);
      
      // Crear relación
      const nuevaRelacion = {
        id: relaciones.length > 0 ? Math.max(...relaciones.map(r => r.id)) + 1 : 1,
        vendedorId: nuevoVendedor.id,
        encantamientoId: encantamiento.id,
        fechaCreacion: new Date().toISOString()
      };
      
      // Agregar niveles solo si el encantamiento los tiene
      if (tieneNiveles && enc.nivel !== undefined) {
        nuevaRelacion.nivel = enc.nivel;
        nuevaRelacion.nivelMaximo = enc.nivelMaximo || enc.nivel;
      }
      
      relaciones.push(nuevaRelacion);
      relacionesCreadas.push({        relacionId: nuevaRelacion.id,        nombre: encantamiento.nombre,
        tieneNiveles: encantamiento.tieneNiveles,
        nivel: nuevaRelacion.nivel,
        nivelMaximo: nuevaRelacion.nivelMaximo
      });
    }
    
    await guardarRelaciones(relaciones);
    
    res.status(201).json({
      ...nuevoVendedor,
      encantamientos: relacionesCreadas
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear vendedor', details: error.message });
  }
});

// PUT - Actualizar vendedor
router.put('/:id', async (req, res) => {
  try {
    const vendedores = await leerVendedores();
    const relaciones = await leerRelaciones();
    const index = vendedores.findIndex(v => v.id === parseInt(req.params.id));
    
    if (index === -1) {
      return res.status(404).json({ error: 'Vendedor no encontrado' });
    }
    
    const { numero, piso, encantamientos } = req.body;
    const vendedorId = parseInt(req.params.id);
    
    // Verificar si el nuevo número ya existe en otro vendedor
    if (numero && numero !== vendedores[index].numero) {
      const existe = vendedores.find(v => v.numero === numero && v.id !== vendedorId);
      if (existe) {
        return res.status(400).json({ error: 'Ya existe otro vendedor con ese número' });
      }
    }
    
    // Actualizar vendedor
    vendedores[index] = {
      ...vendedores[index],
      numero: numero !== undefined ? parseInt(numero) : vendedores[index].numero,
      piso: piso !== undefined ? parseInt(piso) : vendedores[index].piso,
      fechaActualizacion: new Date().toISOString()
    };
    
    await guardarVendedores(vendedores);
    
    // Si se enviaron encantamientos, actualizar relaciones
    if (encantamientos !== undefined) {
      // Eliminar relaciones existentes
      const relacionesFiltradas = relaciones.filter(r => r.vendedorId !== vendedorId);
      
      // Crear nuevas relaciones
      const relacionesCreadas = [];
      for (const enc of encantamientos) {
        const tieneNiveles = enc.tieneNiveles !== false;
        const encantamiento = await obtenerOCrearEncantamiento(enc.nombre, tieneNiveles);
        
        const nuevaRelacion = {
          id: relacionesFiltradas.length > 0 ? Math.max(...relacionesFiltradas.map(r => r.id)) + 1 : 1,
          vendedorId: vendedorId,
          encantamientoId: encantamiento.id,
          fechaCreacion: new Date().toISOString()
        };
        
        if (tieneNiveles && enc.nivel !== undefined) {
          nuevaRelacion.nivel = enc.nivel;
          nuevaRelacion.nivelMaximo = enc.nivelMaximo || enc.nivel;
        }
        
        relacionesFiltradas.push(nuevaRelacion);
        relacionesCreadas.push({
          relacionId: nuevaRelacion.id,
          nombre: encantamiento.nombre,
          tieneNiveles: encantamiento.tieneNiveles,
          nivel: nuevaRelacion.nivel,
          nivelMaximo: nuevaRelacion.nivelMaximo
        });
      }
      
      await guardarRelaciones(relacionesFiltradas);
      
      res.json({
        ...vendedores[index],
        encantamientos: relacionesCreadas
      });
    } else {
      // Si no se enviaron encantamientos, devolver con encantamientos actuales
      const relacionesVendedor = relaciones.filter(r => r.vendedorId === vendedorId);
      const encantamientos = await leerEncantamientos();
      const encantamientosVendedor = relacionesVendedor.map(rel => {
        const enc = encantamientos.find(e => e.id === rel.encantamientoId);
        return {
          relacionId: rel.id,
          nombre: enc ? enc.nombre : 'Desconocido',
          tieneNiveles: enc ? enc.tieneNiveles : true,
          nivel: rel.nivel,
          nivelMaximo: rel.nivelMaximo
        };
      });
      
      res.json({
        ...vendedores[index],
        encantamientos: encantamientosVendedor
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar vendedor', details: error.message });
  }
});

// DELETE - Eliminar vendedor y sus relaciones
router.delete('/:id', async (req, res) => {
  try {
    const vendedores = await leerVendedores();
    const relaciones = await leerRelaciones();
    const index = vendedores.findIndex(v => v.id === parseInt(req.params.id));
    
    if (index === -1) {
      return res.status(404).json({ error: 'Vendedor no encontrado' });
    }
    
    const vendedorId = parseInt(req.params.id);
    const vendedorEliminado = vendedores.splice(index, 1)[0];
    
    // Eliminar relaciones del vendedor
    const relacionesFiltradas = relaciones.filter(r => r.vendedorId !== vendedorId);
    
    await guardarVendedores(vendedores);
    await guardarRelaciones(relacionesFiltradas);
    
    res.json({ message: 'Vendedor eliminado', vendedor: vendedorEliminado });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar vendedor', details: error.message });
  }
});

// GET - Búsqueda con filtros
router.get('/buscar/filtros', async (req, res) => {
  try {
    const vendedores = await leerVendedores();
    const encantamientos = await leerEncantamientos();
    const relaciones = await leerRelaciones();
    
    const { piso, nivel, nombre, numero } = req.query;
    
    // JOIN: Construir vendedores con encantamientos
    let vendedoresConEncantamientos = vendedores.map(vendedor => {
      const relacionesVendedor = relaciones.filter(r => r.vendedorId === vendedor.id);
      const encantamientosVendedor = relacionesVendedor.map(rel => {
        const enc = encantamientos.find(e => e.id === rel.encantamientoId);
        return {
          relacionId: rel.id,
          nombre: enc ? enc.nombre : 'Desconocido',
          tieneNiveles: enc ? enc.tieneNiveles : true,
          nivel: rel.nivel,
          nivelMaximo: rel.nivelMaximo
        };
      });
      
      return {
        ...vendedor,
        encantamientos: encantamientosVendedor
      };
    });
    
    // Aplicar filtros
    if (numero) {
      vendedoresConEncantamientos = vendedoresConEncantamientos.filter(v => v.numero == parseInt(numero));
    }
    
    if (piso) {
      vendedoresConEncantamientos = vendedoresConEncantamientos.filter(v => v.piso == parseInt(piso));
    }
    
    if (nombre) {
      vendedoresConEncantamientos = vendedoresConEncantamientos.filter(v => 
        v.encantamientos.some(e => 
          e.nombre.toLowerCase().includes(nombre.toLowerCase())
        )
      );
    }
    
    if (nivel) {
      vendedoresConEncantamientos = vendedoresConEncantamientos.filter(v => 
        v.encantamientos.some(e => e.nivel === parseInt(nivel))
      );
    }
    
    res.json(vendedoresConEncantamientos);
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar vendedores', details: error.message });
  }
});

// ============================================
// RUTAS DE ENCANTAMIENTOS
// ============================================

// GET - Listar todos los encantamientos
router.get('/encantamientos/todos', async (req, res) => {
  try {
    const encantamientos = await leerEncantamientos();
    res.json(encantamientos);
  } catch (error) {
    res.status(500).json({ error: 'Error al leer encantamientos', details: error.message });
  }
});

// DELETE - Eliminar un encantamiento específico de un vendedor
router.delete('/:vendedorId/encantamientos/:relacionId', async (req, res) => {
  try {
    const relaciones = await leerRelaciones();
    const { vendedorId, relacionId } = req.params;
    
    const index = relaciones.findIndex(r => 
      r.id === parseInt(relacionId) && r.vendedorId === parseInt(vendedorId)
    );
    
    if (index === -1) {
      return res.status(404).json({ error: 'Relación no encontrada' });
    }
    
    const relacionEliminada = relaciones.splice(index, 1)[0];
    await guardarRelaciones(relaciones);
    
    res.json({ message: 'Encantamiento eliminado del vendedor', relacion: relacionEliminada });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar encantamiento', details: error.message });
  }
});

module.exports = router;
