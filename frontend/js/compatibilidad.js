(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.Compatibilidad = api;
    }
})(typeof window !== 'undefined' ? window : globalThis, function () {
    const GRUPOS_EXCLUSIVOS = [
        {
            id: 'armor_protection',
            enchantments: [
                'minecraft:protection',
                'minecraft:fire_protection',
                'minecraft:blast_protection',
                'minecraft:projectile_protection'
            ]
        },
        {
            id: 'damage',
            enchantments: [
                'minecraft:sharpness',
                'minecraft:smite',
                'minecraft:bane_of_arthropods',
                'minecraft:impaling'
            ]
        },
        {
            id: 'mace_impact',
            enchantments: [
                'minecraft:density',
                'minecraft:breach'
            ]
        },
        {
            id: 'boots_movement',
            enchantments: [
                'minecraft:depth_strider',
                'minecraft:frost_walker'
            ]
        },
        {
            id: 'mining_loot',
            enchantments: [
                'minecraft:fortune',
                'minecraft:silk_touch'
            ]
        },
        {
            id: 'bow',
            enchantments: [
                'minecraft:infinity',
                'minecraft:mending'
            ]
        },
        {
            id: 'crossbow',
            enchantments: [
                'minecraft:multishot',
                'minecraft:piercing'
            ]
        }
    ];

    const CONFLICTOS_ESPECIALES = {
        'minecraft:riptide': ['minecraft:loyalty', 'minecraft:channeling'],
        'minecraft:loyalty': ['minecraft:riptide'],
        'minecraft:channeling': ['minecraft:riptide']
    };

    const TRIANGULO_TRIDENTE = ['minecraft:riptide', 'minecraft:loyalty', 'minecraft:channeling'];
    const ROMANOS = [0, 'I', 'II', 'III', 'IV', 'V'];

    function idObjeto(ingles) {
        return String(ingles || '').trim().toLowerCase().replace(/ /g, '_');
    }

    function romano(nivel) {
        return ROMANOS[nivel] || String(nivel);
    }

    function nivelTope(encantamiento) {
        if (!encantamiento || encantamiento.tieneNiveles === false) return 1;
        return Number(encantamiento.nivelMaximo) || 1;
    }

    function nombresPorId(encantamientos) {
        const mapa = new Map();
        (encantamientos || []).forEach(encantamiento => {
            mapa.set(encantamiento.id, encantamiento.espanol || encantamiento.ingles || encantamiento.id);
        });
        return mapa;
    }

    function getEnchantmentConflicts(seleccionados, candidato, etiquetas) {
        const otros = (seleccionados || []).filter(id => id !== candidato);
        const conflictos = [];

        GRUPOS_EXCLUSIVOS.forEach(grupo => {
            if (!grupo.enchantments.includes(candidato)) return;
            otros.forEach(id => {
                if (grupo.enchantments.includes(id) && !conflictos.includes(id)) {
                    conflictos.push(id);
                }
            });
        });

        const especiales = CONFLICTOS_ESPECIALES[candidato] || [];
        otros.forEach(id => {
            if (especiales.includes(id) && !conflictos.includes(id)) {
                conflictos.push(id);
            }
        });

        const mapa = etiquetas || new Map();
        const nombres = conflictos.map(id => mapa.get(id) || id);
        let reason = '';
        if (nombres.length === 1) reason = `Incompatible con ${nombres[0]}.`;
        else if (nombres.length > 1) reason = `Incompatible con ${nombres.join(' y ')}.`;

        return {
            compatible: conflictos.length === 0,
            conflicts: conflictos,
            reason
        };
    }

    function idsAgrupados() {
        const ids = new Set(TRIANGULO_TRIDENTE);
        GRUPOS_EXCLUSIVOS.forEach(grupo => grupo.enchantments.forEach(id => ids.add(id)));
        return ids;
    }

    function maximoSimultaneo(encantamientos) {
        const ids = new Set((encantamientos || []).map(encantamiento => encantamiento.id));
        const agrupados = idsAgrupados();
        let total = [...ids].filter(id => !agrupados.has(id)).length;

        GRUPOS_EXCLUSIVOS.forEach(grupo => {
            if (grupo.enchantments.some(id => ids.has(id))) total += 1;
        });

        const conCorriente = ids.has('minecraft:riptide') ? 1 : 0;
        const sinCorriente = ['minecraft:loyalty', 'minecraft:channeling'].filter(id => ids.has(id)).length;
        total += Math.max(conCorriente, sinCorriente);
        return total;
    }

    function validarSeleccion(encantamientos, seleccion) {
        const errores = [];
        const lista = Array.isArray(seleccion) ? seleccion : [];
        const porId = new Map((encantamientos || []).map(encantamiento => [encantamiento.id, encantamiento]));
        const ids = lista.map(item => item.id);
        const etiquetas = nombresPorId(encantamientos);

        if (new Set(ids).size !== ids.length) {
            errores.push({ type: 'DUPLICADO', message: 'Hay encantamientos repetidos.' });
        }

        const pares = new Set();
        lista.forEach(item => {
            const encantamiento = porId.get(item.id);
            if (!encantamiento) {
                errores.push({
                    type: 'NO_APLICA',
                    enchantments: [item.id],
                    message: 'Hay un encantamiento que este objeto no puede llevar.'
                });
                return;
            }

            const nivel = Number(item.nivel);
            const tope = nivelTope(encantamiento);
            if (!Number.isInteger(nivel) || nivel < 1 || nivel > tope) {
                errores.push({
                    type: 'NIVEL',
                    enchantments: [item.id],
                    message: `${encantamiento.espanol} solo admite niveles del 1 al ${tope}.`
                });
            }

            const conflicto = getEnchantmentConflicts(ids, item.id, etiquetas);
            conflicto.conflicts.forEach(otro => {
                const par = [item.id, otro].sort().join('|');
                if (pares.has(par)) return;
                pares.add(par);
                errores.push({
                    type: 'ENCHANTMENT_CONFLICT',
                    enchantments: [item.id, otro],
                    message: conflicto.reason
                });
            });
        });

        if (lista.length > maximoSimultaneo(encantamientos || [])) {
            errores.push({
                type: 'MAXIMO',
                message: 'Supera el máximo de encantamientos de este objeto.'
            });
        }

        return { valid: errores.length === 0 && lista.length > 0, errors: errores };
    }

    function validarTexto(nombre, descripcion) {
        const errores = [];
        const titulo = String(nombre || '').trim();
        const texto = String(descripcion || '');
        if (titulo.length < 1 || titulo.length > 60) {
            errores.push('El nombre debe tener entre 1 y 60 caracteres.');
        }
        if (texto.length > 300) {
            errores.push('La descripción puede tener hasta 300 caracteres.');
        }
        return errores;
    }

    function evaluarEncantamiento(encantamientos, seleccionIds, encantamiento) {
        const etiquetas = nombresPorId(encantamientos);
        const seleccionado = seleccionIds.includes(encantamiento.id);
        const conflicto = getEnchantmentConflicts(seleccionIds, encantamiento.id, etiquetas);
        if (seleccionado) {
            return { estado: 'selected', motivo: conflicto.compatible ? '' : conflicto.reason };
        }
        if (!conflicto.compatible) {
            return { estado: 'incompatible', motivo: conflicto.reason };
        }
        if (seleccionIds.length >= maximoSimultaneo(encantamientos)) {
            return { estado: 'incompatible', motivo: 'Se alcanzó el máximo de este objeto.' };
        }
        return { estado: 'available', motivo: '' };
    }

    function completar(encantamientos, seleccion) {
        const siguiente = new Map(seleccion);
        const porId = new Map(encantamientos.map(encantamiento => [encantamiento.id, encantamiento]));
        const ids = new Set(porId.keys());
        const nivelDe = (id) => nivelTope(porId.get(id));
        const agrupados = idsAgrupados();
        const pendientes = [];

        ids.forEach(id => {
            if (!agrupados.has(id)) siguiente.set(id, siguiente.get(id) || nivelDe(id));
        });

        GRUPOS_EXCLUSIVOS.forEach(grupo => {
            const aplicables = grupo.enchantments.filter(id => ids.has(id));
            if (aplicables.some(id => siguiente.has(id)) || aplicables.length === 0) return;
            if (aplicables.length === 1) {
                siguiente.set(aplicables[0], nivelDe(aplicables[0]));
                return;
            }
            pendientes.push({ ids: aplicables });
        });

        const tieneCorriente = siguiente.has('minecraft:riptide');
        const tieneCompañero = siguiente.has('minecraft:loyalty') || siguiente.has('minecraft:channeling');
        const corriente = ids.has('minecraft:riptide') ? ['minecraft:riptide'] : [];
        const compañeros = ['minecraft:loyalty', 'minecraft:channeling'].filter(id => ids.has(id));

        if (tieneCorriente) {
            siguiente.delete('minecraft:loyalty');
            siguiente.delete('minecraft:channeling');
        } else if (tieneCompañero) {
            siguiente.delete('minecraft:riptide');
            compañeros.forEach(id => siguiente.set(id, siguiente.get(id) || nivelDe(id)));
        } else if (corriente.length && compañeros.length) {
            pendientes.push({ ids: corriente, alternativa: compañeros });
        } else {
            corriente.concat(compañeros).forEach(id => siguiente.set(id, nivelDe(id)));
        }

        return { seleccion: siguiente, pendientes };
    }

    return {
        GRUPOS_EXCLUSIVOS,
        idObjeto,
        romano,
        nivelTope,
        getEnchantmentConflicts,
        maximoSimultaneo,
        validarSeleccion,
        validarTexto,
        evaluarEncantamiento,
        completar
    };
});
