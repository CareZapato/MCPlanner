const express = require('express');
const fs = require('fs').promises;

const { archivo } = require('../dataDir');
const router = express.Router();
const CATALOGO_FILE = archivo('catalogo_encantamientos.json');

router.get('/', async (req, res) => {
    try {
        const catalogo = JSON.parse(await fs.readFile(CATALOGO_FILE, 'utf8'));
        const fichas = (catalogo.encantamientos || []).map(encantamiento => ({
            id: encantamiento.id,
            espanol: encantamiento.espanol,
            ingles: encantamiento.ingles,
            descripcion: encantamiento.descripcion || '',
            descripcionIngles: encantamiento.descripcionIngles || '',
            aliases: Array.isArray(encantamiento.aliases) ? encantamiento.aliases : [],
            nombreLista: encantamiento.nombreLista || '',
            nivelMaximo: encantamiento.nivelMaximo,
            tieneNiveles: encantamiento.tieneNiveles === true
        }));
        res.json(fichas);
    } catch (error) {
        res.status(500).json({ error: 'Error al leer el catálogo', details: error.message });
    }
});

module.exports = router;
