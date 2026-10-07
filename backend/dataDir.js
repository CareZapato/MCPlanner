const fs = require('fs');
const path = require('path');

const SEMILLA = path.join(__dirname, 'data');
const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : SEMILLA;

const ARCHIVOS = [
    'vendedores.json',
    'encantamientos.json',
    'vendedor_encantamientos.json',
    'composiciones.json',
    'catalogo_encantamientos.json',
    'info_encantamientos.json'
];

function prepararDatos() {
    if (path.resolve(DATA_DIR) === path.resolve(SEMILLA)) return;
    fs.mkdirSync(DATA_DIR, { recursive: true });
    ARCHIVOS.forEach(nombre => {
        const destino = path.join(DATA_DIR, nombre);
        if (!fs.existsSync(destino)) {
            fs.copyFileSync(path.join(SEMILLA, nombre), destino);
        }
    });
}

function archivo(nombre) {
    return path.join(DATA_DIR, nombre);
}

module.exports = { prepararDatos, archivo, DATA_DIR };
