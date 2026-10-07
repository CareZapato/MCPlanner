const express = require('express');
const fs = require('fs').promises;
const crypto = require('crypto');
const Compatibilidad = require('../../frontend/js/compatibilidad');

const router = express.Router();
const { archivo } = require('../dataDir');
const ARCHIVO = archivo('composiciones.json');
const CATALOGO = archivo('catalogo_encantamientos.json');

let cola = Promise.resolve();

function encolar(tarea) {
    const trabajo = cola.then(tarea, tarea);
    cola = trabajo.then(() => {}, () => {});
    return trabajo;
}

async function leerComposiciones() {
    try {
        const raw = await fs.readFile(ARCHIVO, 'utf8');
        const data = JSON.parse(raw);
        return Array.isArray(data) ? data : [];
    } catch (error) {
        if (error.code === 'ENOENT') return [];
        throw error;
    }
}

async function guardarComposiciones(lista) {
    await fs.writeFile(ARCHIVO, JSON.stringify(lista, null, 2), 'utf8');
}

async function encantamientosDelObjeto(itemIngles) {
    const catalogo = JSON.parse(await fs.readFile(CATALOGO, 'utf8'));
    return (catalogo.encantamientos || [])
        .filter(encantamiento => (encantamiento.items || []).some(item => item.ingles === itemIngles))
        .map(encantamiento => ({
            id: encantamiento.id,
            ingles: encantamiento.ingles,
            espanol: encantamiento.espanol,
            nivelMaximo: encantamiento.nivelMaximo,
            tieneNiveles: encantamiento.tieneNiveles === true
        }));
}

function erroresDeComposicion(cuerpo, encantamientos) {
    const errores = Compatibilidad.validarTexto(cuerpo.nombre, cuerpo.descripcion)
        .map(message => ({ type: 'TEXTO', message }));
    if (!cuerpo.encantamientos.length) {
        errores.push({ type: 'VACIA', message: 'Elige al menos un encantamiento.' });
    }
    const validacion = Compatibilidad.validarSeleccion(encantamientos, cuerpo.encantamientos);
    if (!validacion.valid) errores.push(...validacion.errors);
    return errores;
}

function normalizarCuerpo(body) {
    return {
        nombre: String(body.nombre || '').trim(),
        descripcion: String(body.descripcion || '').trim(),
        itemIngles: String(body.itemIngles || '').trim(),
        encantamientos: Array.isArray(body.encantamientos)
            ? body.encantamientos.map(item => ({
                id: item.id,
                nivel: Number(item.nivel)
            }))
            : []
    };
}

router.get('/', async (req, res) => {
    try {
        res.json(await leerComposiciones());
    } catch (error) {
        res.status(500).json({ error: 'Error al leer composiciones', details: error.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const cuerpo = normalizarCuerpo(req.body);
        const encantamientos = await encantamientosDelObjeto(cuerpo.itemIngles);
        if (!encantamientos.length) {
            return res.status(400).json({ error: 'Ese objeto no tiene encantamientos compatibles.' });
        }
        const errores = erroresDeComposicion(cuerpo, encantamientos);
        if (errores.length) {
            return res.status(400).json({ valid: false, errors: errores });
        }

        const ahora = new Date().toISOString();
        const composicion = await encolar(async () => {
            const lista = await leerComposiciones();
            const nueva = {
                id: crypto.randomUUID(),
                nombre: cuerpo.nombre,
                descripcion: cuerpo.descripcion,
                itemId: Compatibilidad.idObjeto(cuerpo.itemIngles),
                itemIngles: cuerpo.itemIngles,
                encantamientos: cuerpo.encantamientos,
                createdAt: ahora,
                updatedAt: ahora
            };
            lista.push(nueva);
            await guardarComposiciones(lista);
            return nueva;
        });

        res.status(201).json(composicion);
    } catch (error) {
        res.status(500).json({ error: 'Error al guardar la composición', details: error.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const cuerpo = normalizarCuerpo(req.body);
        const encantamientos = await encantamientosDelObjeto(cuerpo.itemIngles);
        if (!encantamientos.length) {
            return res.status(400).json({ error: 'Ese objeto no tiene encantamientos compatibles.' });
        }
        const errores = erroresDeComposicion(cuerpo, encantamientos);
        if (errores.length) {
            return res.status(400).json({ valid: false, errors: errores });
        }

        const actualizada = await encolar(async () => {
            const lista = await leerComposiciones();
            const indice = lista.findIndex(item => item.id === req.params.id);
            if (indice === -1) return null;
            lista[indice] = {
                ...lista[indice],
                nombre: cuerpo.nombre,
                descripcion: cuerpo.descripcion,
                itemId: Compatibilidad.idObjeto(cuerpo.itemIngles),
                itemIngles: cuerpo.itemIngles,
                encantamientos: cuerpo.encantamientos,
                updatedAt: new Date().toISOString()
            };
            await guardarComposiciones(lista);
            return lista[indice];
        });

        if (!actualizada) return res.status(404).json({ error: 'Composición no encontrada' });
        res.json(actualizada);
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar la composición', details: error.message });
    }
});

router.post('/:id/duplicar', async (req, res) => {
    try {
        const copia = await encolar(async () => {
            const lista = await leerComposiciones();
            const original = lista.find(item => item.id === req.params.id);
            if (!original) return null;
            const ahora = new Date().toISOString();
            let nombre = `${original.nombre} - copia`;
            if (nombre.length > 60) nombre = nombre.slice(0, 60).trim();
            const nueva = {
                ...original,
                id: crypto.randomUUID(),
                nombre,
                createdAt: ahora,
                updatedAt: ahora
            };
            lista.push(nueva);
            await guardarComposiciones(lista);
            return nueva;
        });
        if (!copia) return res.status(404).json({ error: 'Composición no encontrada' });
        res.status(201).json(copia);
    } catch (error) {
        res.status(500).json({ error: 'Error al duplicar la composición', details: error.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const eliminada = await encolar(async () => {
            const lista = await leerComposiciones();
            const indice = lista.findIndex(item => item.id === req.params.id);
            if (indice === -1) return null;
            const [item] = lista.splice(indice, 1);
            await guardarComposiciones(lista);
            return item;
        });
        if (!eliminada) return res.status(404).json({ error: 'Composición no encontrada' });
        res.json({ message: 'Composición eliminada', composicion: eliminada });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar la composición', details: error.message });
    }
});

module.exports = router;
