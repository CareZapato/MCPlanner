const express = require('express');
const fs = require('fs').promises;

const Compatibilidad = require('../../frontend/js/compatibilidad');
const router = express.Router();
const { archivo } = require('../dataDir');
const CATALOGO_FILE = archivo('catalogo_encantamientos.json');
const RELACIONES_FILE = archivo('vendedor_encantamientos.json');

const ORDEN_OBJETOS = [
    'Sword',
    'Spear',
    'Axe',
    'Mace',
    'Trident',
    'Bow',
    'Crossbow',
    'Pickaxe',
    'Shovel',
    'Hoe',
    'Shears',
    'Fishing Rod',
    'Flint and Steel',
    'Brush',
    'Carrot on a Stick',
    'Warped Fungus on a Stick',
    'Helmet',
    'Turtle Shell',
    'Chestplate',
    'Leggings',
    'Boots',
    'Elytra',
    'Shield',
    'Mob Head',
    'Carved Pumpkin',
    'Compass'
];

router.get('/', async (req, res) => {
    try {
        const raw = await fs.readFile(CATALOGO_FILE, 'utf8');
        const catalogo = JSON.parse(raw);
        const registrados = await idsRegistradosEnVendedor();
        const objetos = new Map();

        for (const encantamiento of catalogo.encantamientos) {
            if (!Array.isArray(encantamiento.items)) continue;

            for (const item of encantamiento.items) {
                if (!objetos.has(item.ingles)) {
                    objetos.set(item.ingles, {
                        id: Compatibilidad.idObjeto(item.ingles),
                        ingles: item.ingles,
                        espanol: item.espanol,
                        encantamientos: []
                    });
                }

                objetos.get(item.ingles).encantamientos.push({
                    id: encantamiento.id,
                    ingles: encantamiento.ingles,
                    espanol: encantamiento.espanol,
                    nombreLista: encantamiento.nombreLista,
                    aliases: Array.isArray(encantamiento.aliases) ? encantamiento.aliases : [],
                    nivelMaximo: encantamiento.nivelMaximo,
                    tieneNiveles: encantamiento.tieneNiveles === true,
                    descripcion: encantamiento.descripcion || '',
                    descripcionIngles: encantamiento.descripcionIngles || '',
                    disponible: encantamiento.encantamientoId != null && registrados.has(encantamiento.encantamientoId)
                });
            }
        }

        const lista = [...objetos.values()].sort((a, b) => {
            const indiceA = ORDEN_OBJETOS.indexOf(a.ingles);
            const indiceB = ORDEN_OBJETOS.indexOf(b.ingles);
            return (indiceA === -1 ? 999 : indiceA) - (indiceB === -1 ? 999 : indiceB);
        });

        lista.forEach(objeto => {
            objeto.encantamientos.sort((a, b) => a.espanol.localeCompare(b.espanol, 'es'));
            objeto.maximoSimultaneo = Compatibilidad.maximoSimultaneo(objeto.encantamientos);
        });

        res.json({ objetos: lista });
    } catch (error) {
        res.status(500).json({ error: 'Error al armar las builds', details: error.message });
    }
});

async function idsRegistradosEnVendedor() {
    try {
        const raw = await fs.readFile(RELACIONES_FILE, 'utf8');
        const relaciones = JSON.parse(raw);
        return new Set((Array.isArray(relaciones) ? relaciones : []).map(relacion => relacion.encantamientoId));
    } catch (error) {
        if (error.code === 'ENOENT') return new Set();
        throw error;
    }
}

module.exports = router;
