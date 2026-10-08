// ================================================
// CONFIGURACIÓN DE LA API
// ================================================
const API_URL = window.location.port === '8080'
    ? `http://${window.location.hostname}:3000/api`
    : `${window.location.origin}/api`;

// ================================================
// ESTADO DE LA APLICACIÓN
// ================================================
let vendedores = [];
let encantamientosTemp = [];
let vendedorEditando = null;
let vendedorAEliminar = null;

// Estado de ordenamiento de tabla
let sortState = {
    column: null,
    direction: 'asc' // 'asc' o 'desc'
};

const MODO_LISTA_KEY = 'encantamientosModoLista';

// Estado de paginación
let paginationState = {
    enchantments: {
        currentPage: 1,
        itemsPerPage: 10,
        visibleCount: 10,
        totalItems: 0,
        totalPages: 1
    },
    vendors: {
        currentPage: 1,
        itemsPerPage: 10,
        totalItems: 0,
        totalPages: 1
    }
};

let enchantmentsListMode = localStorage.getItem(MODO_LISTA_KEY) === 'infinite' ? 'infinite' : 'paginated';
let encantamientosListaActual = [];
let objetosBuild = [];
let composiciones = [];
let vistaBuild = 'lista';
let composicionActiva = null;
let idiomaApp = localStorage.getItem('idiomaApp') === 'en' ? 'en' : 'es';
let catalogoBase = [];
let nombresEnLista = [];
let observadorListaInfinita = null;
let rellenandoListaInfinita = false;

// ================================================
// ELEMENTOS DEL DOM
// ================================================
const elements = {
    // Formulario
    form: document.getElementById('vendedorForm'),
    formToggle: document.getElementById('formToggle'),
    vendedorId: document.getElementById('vendedorId'),
    numero: document.getElementById('numero'),
    piso: document.getElementById('piso'),
    nombreEncantamiento: document.getElementById('nombreEncantamiento'),
    autocompleteList: document.getElementById('autocompleteList'),
    tieneNiveles: document.getElementById('tieneNiveles'),
    nivelEncantamiento: document.getElementById('nivelEncantamiento'),
    nivelMaximo: document.getElementById('nivelMaximo'),
    levelControls: document.getElementById('levelControls'),
    increaseLevel: document.getElementById('increaseLevel'),
    decreaseLevel: document.getElementById('decreaseLevel'),
    increaseMaxLevel: document.getElementById('increaseMaxLevel'),
    decreaseMaxLevel: document.getElementById('decreaseMaxLevel'),
    addEnchantment: document.getElementById('addEnchantment'),
    enchantmentsList: document.getElementById('enchantmentsList'),
    submitBtn: document.getElementById('submitBtn'),
    cancelBtn: document.getElementById('cancelBtn'),
    
    // Filtros Vendedores
    filterPiso: document.getElementById('filterPiso'),
    filterNumero: document.getElementById('filterNumero'),
    applyFilters: document.getElementById('applyFilters'),
    clearFilters: document.getElementById('clearFilters'),
    
    // Filtros Encantamientos
    filterEnchName: document.getElementById('filterEnchName'),
    filterEnchNivel: document.getElementById('filterEnchNivel'),
    filterEnchPiso: document.getElementById('filterEnchPiso'),
    filterEnchVendor: document.getElementById('filterEnchVendor'),
    applyEnchFilters: document.getElementById('applyEnchFilters'),
    clearEnchFilters: document.getElementById('clearEnchFilters'),
    
    // Pestañas
    tabBtns: document.querySelectorAll('.tab-btn'),
    enchantmentsTab: document.getElementById('enchantments-tab'),
    vendorsTab: document.getElementById('vendors-tab'),
    enchantmentsTableBody: document.getElementById('enchantmentsTableBody'),
    
    // Lista
    vendorsList: document.getElementById('vendorsList'),
    vendorCount: document.getElementById('vendorCount'),
    
    // Build
    filterBuildObject: document.getElementById('filterBuildObject'),
    filterBuildEnchant: document.getElementById('filterBuildEnchant'),
    filterCompositionObject: document.getElementById('filterCompositionObject'),
    buildListView: document.getElementById('buildListView'),
    buildCompositionsView: document.getElementById('buildCompositionsView'),
    compositionsList: document.getElementById('compositionsList'),
    buildList: document.getElementById('buildList'),

    // Modal
    deleteModal: document.getElementById('deleteModal'),
    confirmDelete: document.getElementById('confirmDelete'),
    cancelDelete: document.getElementById('cancelDelete')
};

// ================================================
// INICIALIZACIÓN
// ================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 Minecraft Planner - Inicializando...');
    console.log('📡 API URL:', API_URL);
    
    inicializarEventos();
    renderizarEncantamientos(); // Mostrar mensaje inicial
    cargarVendedores();
    cargarTablaEncantamientos();
    cargarBuild();
    cargarComposiciones();
    cargarCatalogoBase();
    sincronizarIdioma();
});

// ================================================
// EVENTOS
// ================================================
function inicializarEventos() {
    document.querySelectorAll('[data-lang]').forEach(boton => {
        boton.addEventListener('click', () => cambiarIdioma(boton.dataset.lang));
    });
    document.addEventListener('mouseover', (evento) => {
        const ancla = evento.target.closest('[data-ficha]');
        if (ancla) mostrarTip(ancla);
    });
    document.addEventListener('mouseout', (evento) => {
        const ancla = evento.target.closest('[data-ficha]');
        if (!ancla) return;
        if (evento.relatedTarget && ancla.contains(evento.relatedTarget)) return;
        ocultarTip();
    });

    // Pestañas
    elements.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => cambiarTab(btn.dataset.tab));
    });
    
    // Formulario colapsable
    elements.formToggle.addEventListener('click', toggleFormulario);
    
    // Formulario
    elements.form.addEventListener('submit', handleSubmit);
    elements.cancelBtn.addEventListener('click', cancelarEdicion);
    elements.addEnchantment.addEventListener('click', agregarEncantamiento);
    
    // Toggle de tiene niveles
    elements.tieneNiveles.addEventListener('change', () => {
        if (elements.tieneNiveles.checked) {
            elements.levelControls.classList.remove('hidden');
        } else {
            elements.levelControls.classList.add('hidden');
        }
    });
    
    // Controles de nivel
    elements.increaseLevel.addEventListener('click', () => {
        const nivelActual = parseInt(elements.nivelEncantamiento.value) || 1;
        const maxLevel = parseInt(elements.nivelMaximo.value) || 6;
        if (nivelActual < maxLevel) {
            elements.nivelEncantamiento.value = nivelActual + 1;
        }
    });
    
    elements.decreaseLevel.addEventListener('click', () => {
        const nivelActual = parseInt(elements.nivelEncantamiento.value) || 1;
        if (nivelActual > 1) {
            elements.nivelEncantamiento.value = nivelActual - 1;
        }
    });
    
    // Controles de nivel máximo
    elements.increaseMaxLevel.addEventListener('click', () => {
        const maxActual = parseInt(elements.nivelMaximo.value) || 1;
        if (maxActual < 6) {
            elements.nivelMaximo.value = maxActual + 1;
        }
    });
    
    elements.decreaseMaxLevel.addEventListener('click', () => {
        const maxActual = parseInt(elements.nivelMaximo.value) || 1;
        if (maxActual > 1) {
            elements.nivelMaximo.value = maxActual - 1;
        }
    });
    
    // Controles de número de vendedor
    const increaseNumero = document.getElementById('increaseNumero');
    const decreaseNumero = document.getElementById('decreaseNumero');
    
    increaseNumero.addEventListener('click', () => {
        const actual = parseInt(elements.numero.value) || 0;
        elements.numero.value = actual + 1;
    });
    
    decreaseNumero.addEventListener('click', () => {
        const actual = parseInt(elements.numero.value) || 1;
        if (actual > 1) {
            elements.numero.value = actual - 1;
        }
    });
    
    // Controles de piso
    const increasePiso = document.getElementById('increasePiso');
    const decreasePiso = document.getElementById('decreasePiso');
    
    increasePiso.addEventListener('click', () => {
        const actual = parseInt(elements.piso.value) || 0;
        elements.piso.value = actual + 1;
    });
    
    decreasePiso.addEventListener('click', () => {
        const actual = parseInt(elements.piso.value) || 1;
        if (actual > 1) {
            elements.piso.value = actual - 1;
        }
    });
    
    // Validar entrada numérica en inputs
    [elements.numero, elements.piso, elements.nivelEncantamiento, elements.nivelMaximo].forEach(input => {
        input.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
        });
    });
    
    // Enter en campos de encantamiento
    elements.nombreEncantamiento.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            agregarEncantamiento();
        }
    });
    
    elements.nivelEncantamiento.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            agregarEncantamiento();
        }
    });
    
    // Validar que el nivel esté entre 1 y el máximo
    elements.nivelEncantamiento.addEventListener('input', (e) => {
        let valor = parseInt(e.target.value);
        const maxLevel = parseInt(elements.nivelMaximo.value) || 6;
        if (valor < 1) {
            e.target.value = 1;
        }
        if (valor > maxLevel) {
            e.target.value = maxLevel;
        }
    });
    
    // Validar que el nivel máximo esté entre 1 y 6
    elements.nivelMaximo.addEventListener('input', (e) => {
        let valor = parseInt(e.target.value);
        if (valor < 1) {
            e.target.value = 1;
        }
        if (valor > 6) {
            e.target.value = 6;
        }
        // Ajustar el nivel actual si excede el nuevo máximo
        const nivelActual = parseInt(elements.nivelEncantamiento.value);
        if (nivelActual > valor) {
            elements.nivelEncantamiento.value = valor;
        }
    });
    
    [elements.filterBuildObject, elements.filterBuildEnchant].forEach(input => {
        if (input) input.addEventListener('input', renderizarBuild);
    });
    if (elements.filterCompositionObject) {
        elements.filterCompositionObject.addEventListener('input', renderizarComposiciones);
    }
    document.querySelectorAll('[data-build-view]').forEach(boton => {
        boton.addEventListener('click', () => {
            vistaBuild = boton.dataset.buildView;
            actualizarVistaBuild();
        });
    });
    if (elements.buildList) {
        elements.buildList.addEventListener('click', manejarClickBuild);
        elements.buildList.addEventListener('change', manejarCambioBuild);
        elements.buildList.addEventListener('input', manejarInputBuild);
    }
    if (elements.compositionsList) {
        elements.compositionsList.addEventListener('click', manejarClickComposiciones);
    }
    iniciarSugerenciasBuild();

    // Filtros Vendedores
    elements.applyFilters.addEventListener('click', aplicarFiltros);
    elements.clearFilters.addEventListener('click', limpiarFiltros);
    
    // Filtro en tiempo real para vendedores
    elements.filterPiso.addEventListener('input', aplicarFiltros);
    elements.filterNumero.addEventListener('input', aplicarFiltros);
    
    // Filtros Encantamientos
    elements.applyEnchFilters.addEventListener('click', aplicarFiltrosEncantamientos);
    elements.clearEnchFilters.addEventListener('click', limpiarFiltrosEncantamientos);
    
    // Filtro en tiempo real mientras se escribe en el campo de nombre de encantamiento
    elements.filterEnchName.addEventListener('input', aplicarFiltrosEncantamientos);
    
    // Filtro en tiempo real en todos los campos de filtro de encantamientos
    elements.filterEnchNivel.addEventListener('input', aplicarFiltrosEncantamientos);
    elements.filterEnchPiso.addEventListener('input', aplicarFiltrosEncantamientos);
    elements.filterEnchVendor.addEventListener('input', aplicarFiltrosEncantamientos);
    
    // DIAGNÓSTICO COMPLETO Y EVENT DELEGATION
    console.log('🎯 Iniciando sistema de autocompletado');
    
    // Event delegation en el documento con TODOS los tipos de eventos
    document.addEventListener('input', (e) => {
        console.log('📢 INPUT event en:', e.target.id, e.target.tagName);
        
        // Campo principal de encantamiento
        if (e.target && e.target.id === 'nombreEncantamiento') {
            console.log('⚡⚡⚡ CAPTURADO nombreEncantamiento! Value:', e.target.value);
            mostrarSugerencias(e.target.value);
        }
        
        // Campos inline de encantamiento (inlineNombre-{vendedorId})
        if (e.target && e.target.id && e.target.id.startsWith('inlineNombre-')) {
            console.log('⚡⚡⚡ CAPTURADO campo inline! ID:', e.target.id, 'Value:', e.target.value);
            const vendedorId = e.target.id.split('-')[1];
            mostrarSugerenciasInline(e.target.value, vendedorId);
        }
    }, true); // Usar capture phase
    
    document.addEventListener('keydown', (e) => {
        if (e.target && e.target.id === 'nombreEncantamiento') {
            console.log('⌨️ KEYDOWN capturado en nombreEncantamiento, key:', e.key);
        }
    }, true);
    
    // Focus listener para agregar listeners directamente cuando el campo recibe foco
    document.addEventListener('focus', (e) => {
        if (e.target && e.target.id === 'nombreEncantamiento') {
            console.log('🎯 FOCUS en nombreEncantamiento, agregando listeners directos');
            
            // Eliminar listeners anteriores si existen
            const campo = e.target;
            
            // Agregar listener directo al campo focuseado
            const inputHandler = function(ev) {
                console.log('🔥🔥🔥 INPUT DIRECTO disparado! Value:', ev.target.value);
                mostrarSugerencias(ev.target.value);
            };
            
            // Guardar referencia para no duplicar
            if (!campo._autocompletadoListener) {
                campo.addEventListener('input', inputHandler);
                campo._autocompletadoListener = true;
                console.log('✅ Listener directo agregado al campo focuseado');
            }
        }
    }, true);
    
    console.log('✅ Sistema de autocompletado inicializado con event delegation y focus handler');
    
    // Enter en filtros vendedores
    [elements.filterPiso, elements.filterNumero].forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                aplicarFiltros();
            }
        });
    });
    
    // Enter en filtros encantamientos
    [elements.filterEnchName, elements.filterEnchNivel, elements.filterEnchPiso, elements.filterEnchVendor].forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                aplicarFiltrosEncantamientos();
            }
        });
    });
    
    // Modal
    elements.cancelDelete.addEventListener('click', cerrarModal);
    elements.confirmDelete.addEventListener('click', confirmarEliminacion);
    
    // Cerrar modal al hacer click fuera
    elements.deleteModal.addEventListener('click', (e) => {
        if (e.target === elements.deleteModal) {
            cerrarModal();
        }
    });
    
    // Ordenamiento de tabla de encantamientos
    const sortableHeaders = document.querySelectorAll('.enchantments-table th.sortable');
    sortableHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const column = header.dataset.sort;
            ordenarTabla(column);
        });
    });

    document.querySelectorAll('#enchantmentsListMode .btn-mode').forEach(btn => {
        btn.addEventListener('click', () => cambiarModoListaEncantamientos(btn.dataset.mode));
    });
    const botonExportar = document.getElementById('exportEnchantments');
    const menuExportar = document.getElementById('exportOptions');
    botonExportar.addEventListener('click', (e) => {
        e.stopPropagation();
        const abrir = menuExportar.hidden;
        menuExportar.hidden = !abrir;
        botonExportar.setAttribute('aria-expanded', abrir ? 'true' : 'false');
    });
    menuExportar.addEventListener('click', (e) => {
        const opcion = e.target.closest('[data-format]');
        if (!opcion) return;
        e.stopPropagation();
        cerrarMenuExportacion();
        exportarTablaEncantamientos(opcion.dataset.format);
    });
    actualizarVistaModoLista();
    iniciarScrollInfinito();
    
    // Cerrar autocomplete al hacer click fuera
    document.addEventListener('click', (e) => {
        if (!elements.nombreEncantamiento.contains(e.target) && 
            !elements.autocompleteList.contains(e.target)) {
            cerrarAutocomplete();
        }
        if (!e.target.closest('.export-menu')) {
            cerrarMenuExportacion();
        }
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') cerrarMenuExportacion();
    });
    
    // Navegación con teclado en autocomplete
    elements.nombreEncantamiento.addEventListener('keydown', (e) => {
        const items = elements.autocompleteList.querySelectorAll('.autocomplete-item');
        const activeItem = elements.autocompleteList.querySelector('.autocomplete-item.active');
        let currentIndex = Array.from(items).indexOf(activeItem);
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (currentIndex < items.length - 1) {
                if (activeItem) activeItem.classList.remove('active');
                items[currentIndex + 1].classList.add('active');
            } else if (items.length > 0) {
                if (activeItem) activeItem.classList.remove('active');
                items[0].classList.add('active');
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (currentIndex > 0) {
                if (activeItem) activeItem.classList.remove('active');
                items[currentIndex - 1].classList.add('active');
            } else if (items.length > 0) {
                if (activeItem) activeItem.classList.remove('active');
                items[items.length - 1].classList.add('active');
            }
        } else if (e.key === 'Enter' && activeItem) {
            e.preventDefault();
            aplicarFichaPrincipal(fichaDesdeSugerencia(activeItem));
            cerrarAutocomplete();
        } else if (e.key === 'Escape') {
            cerrarAutocomplete();
        }
    });
}

// ================================================
// TOGGLE FORMULARIO COLAPSABLE
// ================================================
function toggleFormulario() {
    const arrow = document.querySelector('.dropdown-arrow');
    elements.form.classList.toggle('collapsed');
    elements.formToggle.classList.toggle('collapsed');
    
    if (elements.form.classList.contains('collapsed')) {
        arrow.textContent = '▼';
    } else {
        arrow.textContent = '▲';
    }
}

function expandirFormulario() {
    const arrow = document.querySelector('.dropdown-arrow');
    elements.form.classList.remove('collapsed');
    elements.formToggle.classList.remove('collapsed');
    arrow.textContent = '▲';
}

// ================================================
// SISTEMA DE PESTAÑAS
// ================================================
function cambiarTab(tab) {
    // Desactivar todos los botones y contenidos
    elements.tabBtns.forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Activar la pestaña seleccionada
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    document.getElementById(`${tab}-tab`).classList.add('active');

    if (tab === 'enchantments') solicitarMasEncantamientos();
}

function normalizarBusqueda(valor) {
    return String(valor || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
}

function clavesFicha(ficha) {
    return [ficha.espanol, ficha.ingles, ficha.nombreLista, ...(ficha.aliases || [])]
        .filter(Boolean)
        .map(normalizarBusqueda);
}

function buscarFicha(texto) {
    const consulta = normalizarBusqueda(texto);
    if (!consulta) return null;
    return catalogoBase.find(ficha => clavesFicha(ficha).includes(consulta)) || null;
}

function nombreVisible(ficha) {
    if (!ficha) return '';
    if (idiomaApp === 'en' && ficha.ingles) return ficha.ingles;
    return ficha.espanol || ficha.ingles || '';
}

function descripcionVisible(ficha) {
    if (!ficha) return '';
    if (idiomaApp === 'en') return ficha.descripcionIngles || '';
    return ficha.descripcion || '';
}

function estaEnLista(ficha) {
    if (!ficha || ficha.personalizado) return true;
    const claves = new Set(clavesFicha(ficha));
    return nombresEnLista.some(nombre => claves.has(normalizarBusqueda(nombre)));
}

function sincronizarIdioma() {
    document.documentElement.lang = idiomaApp === 'en' ? 'en' : 'es';
    document.querySelectorAll('[data-lang]').forEach(boton => {
        const activo = boton.dataset.lang === idiomaApp;
        boton.classList.toggle('active', activo);
        boton.setAttribute('aria-pressed', activo ? 'true' : 'false');
    });
}

function cambiarIdioma(idioma) {
    idiomaApp = idioma === 'en' ? 'en' : 'es';
    localStorage.setItem('idiomaApp', idiomaApp);
    sincronizarIdioma();
    renderizarBuild();
    renderizarComposiciones();
    if (encantamientosListaActual.length) renderizarTablaEncantamientos(encantamientosListaActual);
}

async function cargarCatalogoBase() {
    try {
        const response = await fetch(`${API_URL}/catalogo`);
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        catalogoBase = await response.json();
        renderizarBuild();
        renderizarComposiciones();
        if (encantamientosListaActual.length) renderizarTablaEncantamientos(encantamientosListaActual);
    } catch (error) {
        console.error('Error al cargar el catálogo:', error);
    }
}

async function cargarNombresEnLista() {
    try {
        const response = await fetch(`${API_URL}/vendedores/encantamientos/todos`);
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        const data = await response.json();
        nombresEnLista = data.map(item => item.nombre).filter(Boolean);
    } catch (error) {
        console.error('Error al cargar la lista de encantamientos:', error);
    }
}

function fichaVisible(id) {
    return catalogoBase.find(ficha => ficha.id === id)
        || objetosBuild.flatMap(objeto => objeto.encantamientos || []).find(ficha => ficha.id === id)
        || null;
}

function mostrarTip(ancla) {
    const tip = document.getElementById('enchantTip');
    const ficha = fichaVisible(ancla.dataset.ficha);
    if (!tip || !ficha) return;
    const descripcion = descripcionVisible(ficha);
    tip.replaceChildren();
    const titulo = document.createElement('strong');
    titulo.textContent = nombreVisible(ficha);
    tip.appendChild(titulo);
    if (descripcion) {
        const texto = document.createElement('p');
        texto.textContent = descripcion;
        tip.appendChild(texto);
    }
    if (ancla.classList.contains('is-unavailable')) {
        const nota = document.createElement('span');
        nota.className = 'enchant-tip-note';
        nota.textContent = 'Sin registrar en un vendedor';
        tip.appendChild(nota);
    }
    tip.hidden = false;
    const rect = ancla.getBoundingClientRect();
    const ancho = tip.offsetWidth;
    const alto = tip.offsetHeight;
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - ancho - 8));
    let top = rect.bottom + 8;
    if (top + alto > window.innerHeight - 8) top = Math.max(8, rect.top - alto - 8);
    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
}

function ocultarTip() {
    const tip = document.getElementById('enchantTip');
    if (tip) tip.hidden = true;
}

function iconoNoDisponible() {
    const marca = document.createElement('span');
    marca.className = 'build-missing';
    marca.textContent = '○';
    marca.setAttribute('aria-hidden', 'true');
    return marca;
}

async function cargarBuild() {
    try {
        const response = await fetch(`${API_URL}/build`);
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        const data = await response.json();
        objetosBuild = Array.isArray(data.objetos) ? data.objetos : [];
        renderizarBuild();
    } catch (error) {
        console.error('Error al cargar builds:', error);
        if (elements.buildList) {
            elements.buildList.innerHTML = '<p class="build-empty">No se pudo cargar la lista de objetos</p>';
        }
    }
}

function objetoPorIngles(ingles) {
    return objetosBuild.find(objeto => objeto.ingles === ingles);
}

function seleccionActual() {
    if (!composicionActiva) return [];
    return [...composicionActiva.seleccion.entries()].map(([id, nivel]) => ({ id, nivel }));
}

function renderizarBuild() {
    if (!elements.buildList) return;

    const consultaObjeto = normalizarBusqueda(elements.filterBuildObject ? elements.filterBuildObject.value : '');
    const consultaEncantamiento = normalizarBusqueda(elements.filterBuildEnchant ? elements.filterBuildEnchant.value : '');
    const visibles = [];

    objetosBuild.forEach(objeto => {
        const componiendo = composicionActiva && composicionActiva.itemIngles === objeto.ingles;
        const objetoCoincide = !consultaObjeto || normalizarBusqueda(`${objeto.espanol} ${objeto.ingles}`).includes(consultaObjeto);
        if (!objetoCoincide && !componiendo) return;

        const encantamientos = (objeto.encantamientos || []).filter(encantamiento => {
            if (componiendo || !consultaEncantamiento) return true;
            const aliases = (encantamiento.aliases || []).join(' ');
            return normalizarBusqueda(`${encantamiento.espanol} ${encantamiento.ingles} ${encantamiento.nombreLista || ''} ${aliases}`).includes(consultaEncantamiento);
        });
        if (encantamientos.length > 0 || componiendo) visibles.push({ objeto, encantamientos, componiendo });
    });

    if (visibles.length === 0) {
        elements.buildList.innerHTML = '<p class="build-empty">No hay objetos para esa búsqueda</p>';
        return;
    }

    elements.buildList.innerHTML = '';
    visibles.forEach(({ objeto, encantamientos, componiendo }) => {
        const bloque = document.createElement('article');
        bloque.className = componiendo ? 'build-item is-composing' : 'build-item';
        bloque.appendChild(crearCabeceraObjeto(objeto, componiendo));
        if (componiendo) {
            bloque.appendChild(crearConstructor(objeto));
        } else {
            bloque.appendChild(crearChipsEncantamientos(encantamientos));
        }
        elements.buildList.appendChild(bloque);
    });
}

function crearCabeceraObjeto(objeto, componiendo) {
    const cabecera = document.createElement('div');
    cabecera.className = 'build-heading';

    const icono = document.createElement('img');
    icono.className = 'build-icon';
    icono.alt = '';
    icono.src = `img/objetos/${objeto.ingles.toLowerCase().replace(/ /g, '-')}.png`;
    cabecera.appendChild(icono);

    const titulo = document.createElement('h3');
    titulo.className = 'build-name';
    titulo.appendChild(document.createTextNode(objeto.espanol));
    const cuenta = document.createElement('span');
    cuenta.className = 'build-count';
    const maximo = Compatibilidad.maximoSimultaneo(objeto.encantamientos);
    if (componiendo) {
        cuenta.textContent = `${composicionActiva.seleccion.size} / ${maximo}`;
    } else {
        cuenta.textContent = `${objeto.encantamientos.length} · máx ${maximo}`;
    }
    titulo.appendChild(cuenta);
    cabecera.appendChild(titulo);

    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'build-action';
    if (componiendo) {
        boton.dataset.cerrarComposicion = '1';
        boton.textContent = 'Cerrar';
    } else {
        boton.dataset.componer = objeto.ingles;
        boton.textContent = 'Componer';
    }
    cabecera.appendChild(boton);
    return cabecera;
}

function marcarSiNoDisponible(elemento, encantamiento) {
    if (encantamiento && encantamiento.disponible !== false) return;
    elemento.classList.add('is-unavailable');
}

function crearChipsEncantamientos(encantamientos) {
    const lista = document.createElement('div');
    lista.className = 'build-enchants';
    encantamientos.forEach(encantamiento => {
        const chip = document.createElement('span');
        chip.className = 'build-enchant';
        chip.dataset.ficha = encantamiento.id;
        if (encantamiento.disponible === false) chip.appendChild(iconoNoDisponible());
        chip.appendChild(document.createTextNode(nombreVisible(encantamiento)));
        marcarSiNoDisponible(chip, encantamiento);
        if (encantamiento.tieneNiveles && encantamiento.nivelMaximo) {
            const nivel = document.createElement('span');
            nivel.className = 'build-level';
            nivel.textContent = encantamiento.nivelMaximo;
            chip.appendChild(nivel);
        }
        lista.appendChild(chip);
    });
    return lista;
}

function crearConstructor(objeto) {
    const panel = document.createElement('div');
    panel.className = 'build-composer';
    const seleccionIds = [...composicionActiva.seleccion.keys()];
    const validacion = Compatibilidad.validarSeleccion(objeto.encantamientos, seleccionActual());
    const dentroDelMaximo = composicionActiva.seleccion.size <= Compatibilidad.maximoSimultaneo(objeto.encantamientos);
    const puedeGuardar = validacion.valid && dentroDelMaximo;

    const opciones = document.createElement('div');
    opciones.className = 'build-choices';
    objeto.encantamientos.forEach(encantamiento => {
        const estado = Compatibilidad.evaluarEncantamiento(objeto.encantamientos, seleccionIds, encantamiento);
        const fila = document.createElement('label');
        fila.className = `build-choice is-${estado.estado}`;
        marcarSiNoDisponible(fila, encantamiento);

        const casilla = document.createElement('input');
        casilla.type = 'checkbox';
        casilla.dataset.enchant = encantamiento.id;
        casilla.checked = estado.estado === 'selected';
        casilla.disabled = estado.estado === 'incompatible';
        fila.appendChild(casilla);

        const nombre = document.createElement('span');
        nombre.className = 'build-choice-name';
        nombre.textContent = nombreVisible(encantamiento);
        fila.dataset.ficha = encantamiento.id;
        if (encantamiento.disponible === false) fila.appendChild(iconoNoDisponible());
        fila.appendChild(nombre);

        if (encantamiento.tieneNiveles && encantamiento.nivelMaximo > 1) {
            const selector = document.createElement('select');
            selector.dataset.level = encantamiento.id;
            selector.disabled = estado.estado !== 'selected';
            const actual = composicionActiva.seleccion.get(encantamiento.id) || encantamiento.nivelMaximo;
            for (let nivel = 1; nivel <= encantamiento.nivelMaximo; nivel += 1) {
                const opcion = document.createElement('option');
                opcion.value = String(nivel);
                opcion.textContent = Compatibilidad.romano(nivel);
                opcion.selected = nivel === actual;
                selector.appendChild(opcion);
            }
            fila.appendChild(selector);
        }

        if (estado.motivo) {
            const motivo = document.createElement('small');
            motivo.className = 'build-reason';
            motivo.textContent = estado.motivo;
            fila.appendChild(motivo);
        }
        opciones.appendChild(fila);
    });
    panel.appendChild(opciones);

    if (composicionActiva.pendientes && composicionActiva.pendientes.length) {
        const aviso = document.createElement('div');
        aviso.className = 'build-pending';
        const texto = document.createElement('p');
        texto.textContent = 'Elige una opción para completar al máximo:';
        aviso.appendChild(texto);
        const grupo = composicionActiva.pendientes[0];
        const opciones = grupo.alternativa
            ? [{ ids: grupo.ids }, { ids: grupo.alternativa }]
            : grupo.ids.map(id => ({ ids: [id] }));
        opciones.forEach(opcion => {
            const boton = document.createElement('button');
            boton.type = 'button';
            boton.className = 'build-action';
            boton.dataset.elegir = opcion.ids.join(',');
            boton.textContent = opcion.ids.map(id => {
                const encantamiento = objeto.encantamientos.find(item => item.id === id);
                if (!encantamiento) return id;
                const visible = nombreVisible(encantamiento);
                return encantamiento.tieneNiveles ? `${visible} ${Compatibilidad.romano(encantamiento.nivelMaximo)}` : visible;
            }).join(' + ');
            aviso.appendChild(boton);
        });
        panel.appendChild(aviso);
    }

    const formulario = document.createElement('div');
    formulario.className = 'build-save';
    formulario.innerHTML = `
        <label class="build-field">Nombre
            <input type="text" id="compositionName" maxlength="60" value="">
        </label>
        <label class="build-field">Descripción
            <textarea id="compositionDescription" maxlength="300" rows="2"></textarea>
        </label>
        <p class="build-save-note" id="compositionNote"></p>
        <div class="build-save-actions">
            <button type="button" class="build-action" data-completar-maximo="1">Al máximo</button>
            <button type="button" class="build-action build-save-button" data-guardar-composicion="1" ${puedeGuardar ? '' : 'hidden'}>Guardar</button>
        </div>
    `;
    panel.appendChild(formulario);
    const nombre = formulario.querySelector('#compositionName');
    const descripcion = formulario.querySelector('#compositionDescription');
    nombre.value = composicionActiva.nombre;
    descripcion.value = composicionActiva.descripcion;
    if (!puedeGuardar && composicionActiva.seleccion.size > 0) {
        formulario.querySelector('#compositionNote').textContent = validacion.errors[0]?.message || 'Esta composición no se puede guardar.';
    }
    return panel;
}

function abrirComposicion(itemIngles, existente = null) {
    composicionActiva = {
        itemIngles,
        id: existente?.id || null,
        nombre: existente?.nombre || '',
        descripcion: existente?.descripcion || '',
        seleccion: new Map((existente?.encantamientos || []).map(item => [item.id, item.nivel])),
        pendientes: []
    };
    vistaBuild = 'lista';
    actualizarVistaBuild();
    renderizarBuild();
    document.querySelector('.is-composing')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function manejarClickBuild(evento) {
    const componer = evento.target.closest('[data-componer]');
    if (componer) {
        abrirComposicion(componer.dataset.componer);
        return;
    }
    if (evento.target.closest('[data-cerrar-composicion]')) {
        composicionActiva = null;
        renderizarBuild();
        return;
    }
    if (evento.target.closest('[data-guardar-composicion]')) {
        guardarComposicion();
        return;
    }
    if (evento.target.closest('[data-completar-maximo]')) {
        completarAlMaximo();
        return;
    }
    const elegir = evento.target.closest('[data-elegir]');
    if (elegir) {
        elegirOpcionMaxima(elegir.dataset.elegir.split(','));
    }
}

function manejarCambioBuild(evento) {
    if (!composicionActiva) return;
    if (evento.target.matches('[data-enchant]')) {
        const id = evento.target.dataset.enchant;
        if (evento.target.checked) {
            const selector = document.querySelector(`[data-level="${CSS.escape(id)}"]`);
            const encantamiento = objetoPorIngles(composicionActiva.itemIngles).encantamientos.find(item => item.id === id);
            composicionActiva.seleccion.set(id, selector ? Number(selector.value) : Compatibilidad.nivelTope(encantamiento));
        } else {
            composicionActiva.seleccion.delete(id);
        }
        composicionActiva.pendientes = [];
        renderizarBuild();
        return;
    }
    if (evento.target.matches('[data-level]')) {
        const id = evento.target.dataset.level;
        if (composicionActiva.seleccion.has(id)) {
            composicionActiva.seleccion.set(id, Number(evento.target.value));
        }
    }
}

function manejarInputBuild(evento) {
    if (!composicionActiva) return;
    if (evento.target.id === 'compositionName') composicionActiva.nombre = evento.target.value;
    if (evento.target.id === 'compositionDescription') composicionActiva.descripcion = evento.target.value;
}

function completarAlMaximo() {
    const objeto = objetoPorIngles(composicionActiva.itemIngles);
    const resultado = Compatibilidad.completar(objeto.encantamientos, composicionActiva.seleccion);
    composicionActiva.seleccion = resultado.seleccion;
    composicionActiva.pendientes = resultado.pendientes;
    renderizarBuild();
}

function elegirOpcionMaxima(ids) {
    const objeto = objetoPorIngles(composicionActiva.itemIngles);
    ids.forEach(id => {
        const encantamiento = objeto.encantamientos.find(item => item.id === id);
        if (encantamiento) composicionActiva.seleccion.set(id, Compatibilidad.nivelTope(encantamiento));
    });
    completarAlMaximo();
}

async function guardarComposicion() {
    if (!composicionActiva) return;
    const objeto = objetoPorIngles(composicionActiva.itemIngles);
    const nota = document.getElementById('compositionNote');
    const erroresTexto = Compatibilidad.validarTexto(composicionActiva.nombre, composicionActiva.descripcion);
    if (erroresTexto.length) {
        if (nota) nota.textContent = erroresTexto[0];
        document.getElementById('compositionName')?.focus();
        return;
    }

    const payload = {
        nombre: composicionActiva.nombre.trim(),
        descripcion: composicionActiva.descripcion.trim(),
        itemIngles: objeto.ingles,
        encantamientos: seleccionActual()
    };
    const editando = composicionActiva.id;
    const response = await fetch(editando ? `${API_URL}/composiciones/${editando}` : `${API_URL}/composiciones`, {
        method: editando ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) {
        if (nota) nota.textContent = data.errors?.[0]?.message || data.error || 'No se pudo guardar.';
        return;
    }
    composicionActiva = null;
    vistaBuild = 'composiciones';
    await cargarComposiciones();
    actualizarVistaBuild();
}

async function cargarComposiciones() {
    try {
        const response = await fetch(`${API_URL}/composiciones`);
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        composiciones = await response.json();
        renderizarComposiciones();
    } catch (error) {
        console.error('Error al cargar composiciones:', error);
        if (elements.compositionsList) {
            elements.compositionsList.innerHTML = '<p class="build-empty">No se pudieron cargar las composiciones</p>';
        }
    }
}

function renderizarComposiciones() {
    if (!elements.compositionsList) return;
    const consulta = normalizarBusqueda(elements.filterCompositionObject ? elements.filterCompositionObject.value : '');
    const visibles = composiciones.filter(composicion => {
        const objeto = objetoPorIngles(composicion.itemIngles);
        const texto = `${composicion.nombre} ${composicion.itemIngles} ${objeto ? objeto.espanol : ''}`;
        return !consulta || normalizarBusqueda(texto).includes(consulta);
    });

    if (visibles.length === 0) {
        elements.compositionsList.innerHTML = '<p class="build-empty">No hay composiciones guardadas</p>';
        return;
    }

    elements.compositionsList.innerHTML = '';
    visibles.forEach(composicion => {
        const objeto = objetoPorIngles(composicion.itemIngles);
        const tarjeta = document.createElement('article');
        tarjeta.className = 'build-item composition-card';

        const cabecera = document.createElement('div');
        cabecera.className = 'build-heading';
        if (objeto) {
            const icono = document.createElement('img');
            icono.className = 'build-icon';
            icono.alt = '';
            icono.src = `img/objetos/${objeto.ingles.toLowerCase().replace(/ /g, '-')}.png`;
            cabecera.appendChild(icono);
        }
        const titulo = document.createElement('h3');
        titulo.className = 'build-name';
        titulo.appendChild(document.createTextNode(composicion.nombre));
        const cuenta = document.createElement('span');
        cuenta.className = 'build-count';
        cuenta.textContent = objeto ? `${objeto.espanol} · ${composicion.encantamientos.length}` : composicion.itemIngles;
        titulo.appendChild(cuenta);
        cabecera.appendChild(titulo);
        tarjeta.appendChild(cabecera);

        const lista = document.createElement('div');
        lista.className = 'composition-body';
        const chips = document.createElement('div');
        chips.className = 'build-enchants';
        composicion.encantamientos.forEach(item => {
            const encantamiento = objeto?.encantamientos.find(entrada => entrada.id === item.id);
            const chip = document.createElement('span');
            chip.className = 'build-enchant';
            if (encantamiento) chip.dataset.ficha = encantamiento.id;
            if (!encantamiento || encantamiento.disponible === false) chip.appendChild(iconoNoDisponible());
            chip.appendChild(document.createTextNode(encantamiento ? nombreVisible(encantamiento) : item.id));
            marcarSiNoDisponible(chip, encantamiento);
            if (encantamiento && encantamiento.tieneNiveles && item.nivel) {
                const nivel = document.createElement('span');
                nivel.className = 'build-level';
                nivel.textContent = Compatibilidad.romano(item.nivel);
                chip.appendChild(nivel);
            }
            chips.appendChild(chip);
        });
        lista.appendChild(chips);
        if (composicion.descripcion) {
            const descripcion = document.createElement('p');
            descripcion.className = 'composition-description';
            descripcion.textContent = composicion.descripcion;
            lista.appendChild(descripcion);
        }
        const acciones = document.createElement('div');
        acciones.className = 'build-save-actions';
        [['Editar', 'editar'], ['Duplicar', 'duplicar'], ['Eliminar', 'eliminar']].forEach(([texto, accion]) => {
            const boton = document.createElement('button');
            boton.type = 'button';
            boton.className = 'build-action';
            boton.dataset[accion] = composicion.id;
            boton.textContent = texto;
            acciones.appendChild(boton);
        });
        lista.appendChild(acciones);
        tarjeta.appendChild(lista);
        elements.compositionsList.appendChild(tarjeta);
    });
}

function actualizarVistaBuild() {
    if (elements.buildListView) elements.buildListView.hidden = vistaBuild !== 'lista';
    if (elements.buildCompositionsView) elements.buildCompositionsView.hidden = vistaBuild !== 'composiciones';
    document.querySelectorAll('[data-build-view]').forEach(boton => {
        const activo = boton.dataset.buildView === vistaBuild;
        boton.classList.toggle('active', activo);
        boton.setAttribute('aria-pressed', activo ? 'true' : 'false');
    });
    if (vistaBuild === 'composiciones') renderizarComposiciones();
}

async function manejarClickComposiciones(evento) {
    const editar = evento.target.closest('[data-editar]');
    if (editar) {
        const composicion = composiciones.find(item => item.id === editar.dataset.editar);
        if (composicion) abrirComposicion(composicion.itemIngles, composicion);
        return;
    }
    const duplicar = evento.target.closest('[data-duplicar]');
    if (duplicar) {
        await fetch(`${API_URL}/composiciones/${duplicar.dataset.duplicar}/duplicar`, { method: 'POST' });
        await cargarComposiciones();
        return;
    }
    const eliminar = evento.target.closest('[data-eliminar]');
    if (eliminar) {
        const composicion = composiciones.find(item => item.id === eliminar.dataset.eliminar);
        if (!composicion || !confirm(`¿Eliminar "${composicion.nombre}"?`)) return;
        await fetch(`${API_URL}/composiciones/${composicion.id}`, { method: 'DELETE' });
        await cargarComposiciones();
    }
}

function iniciarSugerenciasBuild() {
    iniciarSugerencias(elements.filterBuildObject, opcionesObjetos);
    iniciarSugerencias(elements.filterBuildEnchant, opcionesEncantamientos);
    iniciarSugerencias(elements.filterCompositionObject, opcionesObjetos);
}

function opcionesObjetos() {
    return objetosBuild.map(objeto => ({
        etiqueta: objeto.espanol,
        detalle: objeto.ingles,
        valor: objeto.espanol,
        claves: [objeto.espanol, objeto.ingles, objeto.id]
    }));
}

function opcionesEncantamientos() {
    const unicos = new Map();
    objetosBuild.forEach(objeto => {
        objeto.encantamientos.forEach(encantamiento => {
            if (!unicos.has(encantamiento.id)) unicos.set(encantamiento.id, encantamiento);
        });
    });
    return [...unicos.values()].map(encantamiento => ({
        etiqueta: nombreVisible(encantamiento),
        detalle: idiomaApp === 'en' ? encantamiento.espanol : encantamiento.ingles,
        valor: nombreVisible(encantamiento),
        claves: [encantamiento.espanol, encantamiento.ingles, encantamiento.nombreLista, ...(encantamiento.aliases || [])]
    }));
}

function iniciarSugerencias(input, obtenerOpciones) {
    if (!input || !input.parentElement) return;
    const caja = document.createElement('div');
    caja.className = 'build-suggest';
    caja.hidden = true;
    input.parentElement.classList.add('suggest-field');
    input.parentElement.appendChild(caja);
    let indice = -1;
    let suprimir = false;

    const cerrar = () => {
        caja.hidden = true;
        caja.innerHTML = '';
        indice = -1;
    };

    const pintar = () => {
        const texto = normalizarBusqueda(input.value.trim());
        if (!texto) {
            cerrar();
            return;
        }
        const opciones = obtenerOpciones()
            .filter(opcion => opcion.claves.some(clave => clave && normalizarBusqueda(clave).includes(texto)))
            .slice(0, 8);
        if (!opciones.length) {
            cerrar();
            return;
        }
        caja.hidden = false;
        caja.innerHTML = '';
        opciones.forEach((opcion, posicion) => {
            const boton = document.createElement('button');
            boton.type = 'button';
            boton.className = posicion === indice ? 'build-suggest-item is-active' : 'build-suggest-item';
            boton.appendChild(document.createTextNode(opcion.etiqueta));
            const detalle = document.createElement('small');
            detalle.textContent = opcion.detalle;
            boton.appendChild(detalle);
            boton.addEventListener('mousedown', (evento) => {
                evento.preventDefault();
                suprimir = true;
                input.value = opcion.valor;
                cerrar();
                input.dispatchEvent(new Event('input', { bubbles: true }));
            });
            caja.appendChild(boton);
        });
    };

    input.addEventListener('input', () => {
        if (suprimir) {
            suprimir = false;
            return;
        }
        indice = -1;
        pintar();
    });
    input.addEventListener('focus', pintar);
    input.addEventListener('keydown', (evento) => {
        const items = [...caja.querySelectorAll('.build-suggest-item')];
        if (caja.hidden || !items.length) return;
        if (evento.key === 'ArrowDown') {
            evento.preventDefault();
            indice = (indice + 1) % items.length;
            pintar();
        } else if (evento.key === 'ArrowUp') {
            evento.preventDefault();
            indice = (indice - 1 + items.length) % items.length;
            pintar();
        } else if (evento.key === 'Enter' && indice >= 0) {
            evento.preventDefault();
            items[indice].dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        } else if (evento.key === 'Escape') {
            cerrar();
        }
    });
    document.addEventListener('click', (evento) => {
        if (!input.parentElement.contains(evento.target)) cerrar();
    });
}

// ================================================
// AUTOCOMPLETADO DE ENCANTAMIENTOS
// ================================================
let todosLosEncantamientos = [];
let encantamientosCompletos = new Map(); // Map<nombre, {tieneNiveles, nivelMaximo}>

function actualizarSugerencias() {
    console.log('🔄 actualizarSugerencias llamada');
    console.log('📊 vendedores:', vendedores);
    
    // Obtener todos los nombres únicos de encantamientos con su info completa
    const nombresUnicos = new Set();
    const encantamientosMap = new Map();
    
    // Validar que vendedores exista y tenga elementos
    if (!vendedores || vendedores.length === 0) {
        console.log('⚠️ No hay vendedores cargados');
        encantamientosCompletos = encantamientosMap;
        todosLosEncantamientos = [];
        return;
    }
    
    vendedores.forEach(vendedor => {
        // Validar que el vendedor tenga encantamientos
        if (!vendedor.encantamientos || !Array.isArray(vendedor.encantamientos)) {
            return;
        }
        
        vendedor.encantamientos.forEach(enc => {
            if (!enc || !enc.nombre) return;
            
            nombresUnicos.add(enc.nombre);
            
            // Si no existe, agregarlo al mapa
            if (!encantamientosMap.has(enc.nombre)) {
                encantamientosMap.set(enc.nombre, {
                    tieneNiveles: enc.tieneNiveles || false,
                    nivelesMaximos: [], // Array para guardar todos los niveles máximos encontrados
                    cantidadVendedores: 0 // Contador de vendedores que tienen este encantamiento
                });
            }
            
            const info = encantamientosMap.get(enc.nombre);
            info.cantidadVendedores++;
            
            // Agregar nivelMaximo si existe
            if (enc.nivelMaximo) {
                info.nivelesMaximos.push(enc.nivelMaximo);
            }
        });
    });
    
    // Calcular el nivel máximo más común para cada encantamiento
    encantamientosMap.forEach((info, nombre) => {
        if (info.nivelesMaximos.length > 0) {
            // Encontrar el nivel máximo más común
            const frecuencias = {};
            info.nivelesMaximos.forEach(nivel => {
                frecuencias[nivel] = (frecuencias[nivel] || 0) + 1;
            });
            
            // Obtener el más frecuente
            let maxFrecuencia = 0;
            let nivelMasComun = null;
            Object.entries(frecuencias).forEach(([nivel, frecuencia]) => {
                if (frecuencia > maxFrecuencia) {
                    maxFrecuencia = frecuencia;
                    nivelMasComun = parseInt(nivel);
                }
            });
            
            info.nivelMaximo = nivelMasComun;
        }
        delete info.nivelesMaximos; // Limpiar array temporal
    });
    
    encantamientosCompletos = encantamientosMap;
    todosLosEncantamientos = Array.from(nombresUnicos).sort();
    
    console.log('✅ actualizarSugerencias completada');
    console.log('📋 todosLosEncantamientos:', todosLosEncantamientos);
    console.log('📦 encantamientosCompletos:', encantamientosCompletos);
}

function fichaDesdeSugerencia(item) {
    return buscarFicha(item.dataset.value) || { espanol: item.dataset.value, personalizado: true };
}

function coincidenciasCatalogo(query) {
    const consulta = normalizarBusqueda(query);
    if (!consulta) return [];
    if (!catalogoBase.length) {
        return todosLosEncantamientos
            .filter(nombre => normalizarBusqueda(nombre).includes(consulta))
            .map(nombre => ({ espanol: nombre, ingles: '', personalizado: true, aliases: [] }));
    }
    const fichas = catalogoBase.filter(ficha => clavesFicha(ficha).some(clave => clave.includes(consulta)));
    const cubiertas = new Set(fichas.flatMap(clavesFicha));
    const extras = todosLosEncantamientos
        .filter(nombre => normalizarBusqueda(nombre).includes(consulta) && !cubiertas.has(normalizarBusqueda(nombre)))
        .map(nombre => ({ espanol: nombre, ingles: '', personalizado: true, aliases: [] }));
    return [...fichas, ...extras];
}

function aplicarFichaPrincipal(ficha) {
    elements.nombreEncantamiento.value = ficha.espanol;
    const guardado = encantamientosCompletos.get(ficha.espanol);
    const tieneNiveles = ficha.personalizado ? !!(guardado && guardado.tieneNiveles) : ficha.tieneNiveles === true;
    const maximo = ficha.personalizado ? guardado && guardado.nivelMaximo : ficha.nivelMaximo;
    elements.tieneNiveles.checked = tieneNiveles;
    if (tieneNiveles) {
        elements.levelControls.style.display = 'flex';
        elements.levelControls.classList.remove('hidden');
        if (maximo) {
            elements.nivelMaximo.value = maximo;
            elements.nivelEncantamiento.value = maximo;
        }
    } else {
        elements.levelControls.style.display = 'none';
        elements.levelControls.classList.add('hidden');
    }
}

function aplicarFichaInline(ficha, vendedorId) {
    const nombreInput = document.getElementById(`inlineNombre-${vendedorId}`);
    if (nombreInput) nombreInput.value = ficha.espanol;
    const guardado = encantamientosCompletos.get(ficha.espanol);
    const tieneNiveles = ficha.personalizado ? !!(guardado && guardado.tieneNiveles) : ficha.tieneNiveles === true;
    const maximo = ficha.personalizado ? guardado && guardado.nivelMaximo : ficha.nivelMaximo;
    const checkbox = document.getElementById(`inlineTieneNiveles-${vendedorId}`);
    const nivelInput = document.getElementById(`inlineNivel-${vendedorId}`);
    const maxInput = document.getElementById(`inlineMax-${vendedorId}`);
    if (!checkbox) return;
    checkbox.checked = tieneNiveles;
    toggleInlineLevels(vendedorId);
    if (tieneNiveles && maximo && nivelInput && maxInput) {
        maxInput.value = maximo;
        nivelInput.value = maximo;
    }
}

function renderSugerencias(contenedor, query, alElegir) {
    if (!contenedor) return;
    if (!query) {
        contenedor.classList.remove('active');
        contenedor.innerHTML = '';
        return;
    }
    const coincidencias = coincidenciasCatalogo(query);
    contenedor.replaceChildren();
    if (!coincidencias.length) {
        contenedor.innerHTML = '<div class="autocomplete-empty">No hay coincidencias. Escribe un nuevo nombre para crearlo.</div>';
        contenedor.classList.add('active');
        return;
    }
    const header = document.createElement('div');
    header.className = 'autocomplete-header';
    header.textContent = `${coincidencias.length} encantamiento${coincidencias.length === 1 ? '' : 's'}`;
    contenedor.appendChild(header);
    coincidencias.forEach(ficha => {
        const item = document.createElement('div');
        item.className = 'autocomplete-item';
        item.dataset.value = ficha.espanol;
        const nombre = document.createElement('div');
        nombre.className = 'autocomplete-item-name';
        const icono = document.createElement('span');
        const enLista = estaEnLista(ficha);
        icono.className = enLista ? 'list-state is-in' : 'list-state is-out';
        icono.textContent = enLista ? '✓' : '+';
        icono.title = enLista ? 'En la lista' : 'No está en la lista';
        nombre.appendChild(icono);
        nombre.appendChild(document.createTextNode(nombreVisible(ficha)));
        item.appendChild(nombre);
        const detalle = document.createElement('span');
        detalle.className = 'autocomplete-detail';
        const otro = idiomaApp === 'en' ? ficha.espanol : ficha.ingles;
        const estado = enLista ? 'En la lista' : 'No está en la lista';
        detalle.textContent = [otro, ficha.tieneNiveles ? `Máx ${ficha.nivelMaximo}` : '', estado].filter(Boolean).join(' · ');
        item.appendChild(detalle);
        item.addEventListener('mousedown', (evento) => {
            evento.preventDefault();
            alElegir(ficha);
        });
        contenedor.appendChild(item);
    });
    contenedor.classList.add('active');
}

function mostrarSugerencias(query) {
    renderSugerencias(elements.autocompleteList, query, (ficha) => {
        aplicarFichaPrincipal(ficha);
        cerrarAutocomplete();
        elements.nombreEncantamiento.focus();
    });
}

function cerrarAutocomplete() {
    elements.autocompleteList.classList.remove('active');
}

function mostrarSugerenciasInline(query, vendedorId) {
    const autocompleteList = document.getElementById(`inlineAutocompleteList-${vendedorId}`);
    renderSugerencias(autocompleteList, query, (ficha) => {
        aplicarFichaInline(ficha, vendedorId);
        autocompleteList.classList.remove('active');
        document.getElementById(`inlineNombre-${vendedorId}`)?.focus();
    });
}

// Cerrar dropdowns inline cuando se hace click fuera
document.addEventListener('click', (e) => {
    // Cerrar todos los dropdowns inline
    const allInlineDropdowns = document.querySelectorAll('[id^="inlineAutocompleteList-"]');
    allInlineDropdowns.forEach(dropdown => {
        const isClickInside = dropdown.parentElement.contains(e.target);
        if (!isClickInside) {
            dropdown.classList.remove('active');
        }
    });
});

// ================================================
// API - FETCH VENDEDORES
// ================================================
async function cargarVendedores(filtros = null) {
    try {
        let url = `${API_URL}/vendedores`;
        
        if (filtros) {
            const params = new URLSearchParams();
            if (filtros.piso) params.append('piso', filtros.piso);
            if (filtros.numero) params.append('numero', filtros.numero);
            
            if (params.toString()) {
                url = `${API_URL}/vendedores/buscar/filtros?${params.toString()}`;
            }
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        vendedores = await response.json();
        renderizarVendedores();
        actualizarContador();
        actualizarSugerencias();
        await cargarNombresEnLista();
        
        // Si no hay filtros, también actualizar la tabla de encantamientos
        if (!filtros) {
            await cargarTablaEncantamientos();
        }
        
    } catch (error) {
        console.error('❌ Error al cargar vendedores:', error);
        mostrarError('No se pudieron cargar los vendedores. Verifica que el servidor esté corriendo.');
    }
}

// ================================================
// API - CREAR VENDEDOR
// ================================================
async function crearVendedor(vendedor) {
    try {
        const response = await fetch(`${API_URL}/vendedores`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(vendedor)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al crear vendedor');
        }
        
        const nuevoVendedor = await response.json();
        console.log('✅ Vendedor creado:', nuevoVendedor);
        return nuevoVendedor;
        
    } catch (error) {
        console.error('❌ Error al crear vendedor:', error);
        throw error;
    }
}

// ================================================
// API - ACTUALIZAR VENDEDOR
// ================================================
async function actualizarVendedor(id, vendedor) {
    try {
        const response = await fetch(`${API_URL}/vendedores/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(vendedor)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al actualizar vendedor');
        }
        
        const vendedorActualizado = await response.json();
        console.log('✅ Vendedor actualizado:', vendedorActualizado);
        return vendedorActualizado;
        
    } catch (error) {
        console.error('❌ Error al actualizar vendedor:', error);
        throw error;
    }
}

// ================================================
// API - ELIMINAR VENDEDOR
// ================================================
async function eliminarVendedor(id) {
    try {
        const response = await fetch(`${API_URL}/vendedores/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Error al eliminar vendedor');
        }
        
        const resultado = await response.json();
        console.log('✅ Vendedor eliminado:', resultado);
        return resultado;
        
    } catch (error) {
        console.error('❌ Error al eliminar vendedor:', error);
        throw error;
    }
}

// ================================================
// MANEJO DE FORMULARIO
// ================================================
async function handleSubmit(e) {
    e.preventDefault();
    
    // Validar que haya al menos un encantamiento
    if (encantamientosTemp.length === 0) {
        mostrarError('❌ Debes agregar al menos un encantamiento');
        return;
    }
    
    const vendedor = {
        numero: parseInt(elements.numero.value),
        piso: parseInt(elements.piso.value),
        encantamientos: encantamientosTemp
    };
    
    // Validar número de vendedor
    if (!vendedor.numero || vendedor.numero < 1) {
        mostrarError('❌ El número del vendedor debe ser válido');
        return;
    }
    
    // Validar piso
    if (!vendedor.piso || vendedor.piso < 1) {
        mostrarError('❌ El piso debe ser válido');
        return;
    }
    
    try {
        if (vendedorEditando) {
            // Actualizar
            await actualizarVendedor(vendedorEditando.id, vendedor);
            mostrarExito('✅ Vendedor actualizado correctamente');
        } else {
            // Crear nuevo
            await crearVendedor(vendedor);
            mostrarExito('✅ Vendedor creado correctamente');
        }
        
        // Recargar lista y limpiar formulario
        await cargarVendedores();
        await cargarTablaEncantamientos();
        limpiarFormulario();
        
        // Colapsar el formulario después de guardar
        const arrow = document.querySelector('.dropdown-arrow');
        elements.form.classList.add('collapsed');
        elements.formToggle.classList.add('collapsed');
        arrow.textContent = '▼';
        
    } catch (error) {
        mostrarError('❌ ' + error.message);
    }
}

function cancelarEdicion() {
    limpiarFormulario();
}

function limpiarFormulario() {
    const numeroActual = elements.numero.value;
    const pisoActual = elements.piso.value;
    
    elements.form.reset();
    elements.vendedorId.value = '';
    
    // Mantener numero y piso para facilitar ingreso continuo
    elements.numero.value = numeroActual;
    elements.piso.value = pisoActual;
    
    elements.nivelEncantamiento.value = '1';
    elements.nivelMaximo.value = '5';
    elements.tieneNiveles.checked = true;
    elements.levelControls.classList.remove('hidden');
    encantamientosTemp = [];
    vendedorEditando = null;
    renderizarEncantamientos();
    elements.submitBtn.textContent = '💾 Guardar Vendedor';
    elements.numero.disabled = false;
}

// ================================================
// GESTIÓN DE ENCANTAMIENTOS
// ================================================
function agregarEncantamiento() {
    const nombre = elements.nombreEncantamiento.value.trim();
    const tieneNiveles = elements.tieneNiveles.checked;
    
    if (!nombre) {
        mostrarError('Por favor, ingresa un nombre válido');
        return;
    }
    
    let encantamiento = { nombre };
    
    if (tieneNiveles) {
        const nivel = parseInt(elements.nivelEncantamiento.value) || 1;
        const nivelMaximo = parseInt(elements.nivelMaximo.value) || 5;
        
        if (nivel < 1 || nivel > nivelMaximo) {
            mostrarError(`El nivel debe estar entre 1 y ${nivelMaximo}`);
            return;
        }
        
        encantamiento.nivel = nivel;
        encantamiento.nivelMaximo = nivelMaximo;
    } else {
        encantamiento.tieneNiveles = false;
    }
    
    // Verificar que no exista el mismo encantamiento
    const existe = encantamientosTemp.some(e => 
        e.nombre.toLowerCase() === nombre.toLowerCase()
    );
    
    if (existe) {
        mostrarError('Este encantamiento ya fue agregado');
        return;
    }
    
    encantamientosTemp.push(encantamiento);
    renderizarEncantamientos();
    
    // Limpiar campos
    elements.nombreEncantamiento.value = '';
    elements.nivelEncantamiento.value = '1';
    elements.nivelMaximo.value = '5';
    elements.tieneNiveles.checked = true;
    elements.levelControls.classList.remove('hidden');
    elements.nombreEncantamiento.focus();
}

function eliminarEncantamiento(index) {
    encantamientosTemp.splice(index, 1);
    renderizarEncantamientos();
}

function renderizarEncantamientos() {
    if (encantamientosTemp.length === 0) {
        elements.enchantmentsList.innerHTML = `
            <div style="width: 100%; text-align: center; padding: 20px;">
                <div style="font-size: 24px; margin-bottom: 10px;">⬆️</div>
                <p style="color: #FFD700; font-size: 11px; margin: 0;">
                    Presiona el botón <strong>"+ AGREGAR"</strong> para añadir encantamientos
                </p>
            </div>
        `;
        return;
    }
    
    elements.enchantmentsList.innerHTML = encantamientosTemp
        .map((enc, index) => {
            const tieneNiveles = enc.tieneNiveles !== false && enc.nivel !== undefined;
            const classExtra = tieneNiveles ? '' : 'no-level';
            
            let contenido = `<span class="name">${enc.nombre}</span>`;
            
            if (tieneNiveles) {
                contenido += `<span class="level">Nv. ${enc.nivel}</span>`;
                if (enc.nivelMaximo) {
                    contenido += `<span class="max-level">Máx: ${enc.nivelMaximo}</span>`;
                }
            }
            
            return `
                <div class="enchantment-tag ${classExtra}">
                    ${contenido}
                    <span class="remove" onclick="eliminarEncantamiento(${index})">✖</span>
                </div>
            `;
        })
        .join('');
}

// ================================================
// RENDERIZADO DE VENDEDORES
// ================================================
function renderizarVendedores() {
    if (vendedores.length === 0) {
        elements.vendorsList.innerHTML = `
            <div class="empty-state">
                <p>📦 No hay vendedores registrados</p>
                <p style="margin-top: 10px; font-size: 9px;">Agrega tu primer vendedor usando el formulario de arriba</p>
            </div>
        `;
        paginationState.vendors.totalItems = 0;
        paginationState.vendors.totalPages = 1;
        actualizarPaginadorVendedores();
        return;
    }
    
    // Actualizar estado de paginación
    paginationState.vendors.totalItems = vendedores.length;
    paginationState.vendors.totalPages = Math.ceil(vendedores.length / paginationState.vendors.itemsPerPage);
    
    // Calcular índices de paginación
    const startIndex = (paginationState.vendors.currentPage - 1) * paginationState.vendors.itemsPerPage;
    const endIndex = startIndex + paginationState.vendors.itemsPerPage;
    const vendedoresPaginados = vendedores.slice(startIndex, endIndex);
    
    elements.vendorsList.innerHTML = vendedoresPaginados
        .map(vendedor => crearTarjetaVendedor(vendedor))
        .join('');
    
    // Actualizar paginador
    actualizarPaginadorVendedores();
}

function crearTarjetaVendedor(vendedor) {
    const encantamientos = vendedor.encantamientos && vendedor.encantamientos.length > 0
        ? vendedor.encantamientos.map((enc, index) => {
            const tieneNiveles = enc.tieneNiveles !== false && enc.nivel !== undefined;
            const classExtra = tieneNiveles ? '' : 'no-level';
            
            let contenido = `<span class="name">${enc.nombre}</span>`;
            
            if (tieneNiveles) {
                contenido += `<span class="level">Nv. ${enc.nivel}</span>`;
                if (enc.nivelMaximo) {
                    contenido += `<span class="max-level">Máx: ${enc.nivelMaximo}</span>`;
                }
            }
            
            return `
                <div class="enchantment-tag in-card ${classExtra}" data-vendedor-id="${vendedor.id}" data-relacion-id="${enc.relacionId}">
                    ${contenido}
                    <span class="remove-enchantment" onclick="eliminarEncantamientoDeVendedor(${vendedor.id}, ${enc.relacionId})">✖</span>
                </div>
            `;
        }).join('')
        : '<p style="color: #999; font-size: 8px;">Sin encantamientos</p>';
    
    // Formulario inline para agregar encantamientos
    const formularioAgregar = `
        <div class="add-enchantment-inline" id="addEnchForm-${vendedor.id}">
            <div class="inline-form-header" onclick="toggleInlineForm(${vendedor.id})">
                <span>➕ Agregar encantamiento</span>
                <span class="toggle-arrow">▼</span>
            </div>
            <div class="inline-form-body collapsed" id="inlineFormBody-${vendedor.id}">
                <div class="autocomplete-wrapper">
                    <input type="text" 
                        id="inlineNombre-${vendedor.id}" 
                        placeholder="Nombre" 
                        class="inline-input"
                        autocomplete="off">
                    <div id="inlineAutocompleteList-${vendedor.id}" class="autocomplete-list"></div>
                </div>
                
                <label class="inline-checkbox">
                    <input type="checkbox" 
                        id="inlineTieneNiveles-${vendedor.id}" 
                        checked 
                        onchange="toggleInlineLevels(${vendedor.id})">
                    <span>Niveles</span>
                </label>
                
                <div class="inline-levels" id="inlineLevels-${vendedor.id}">
                    <div class="inline-level-group">
                        <button type="button" class="btn-mini" onclick="adjustInlineLevel(${vendedor.id}, 'nivel', -1)">-</button>
                        <input type="number" 
                            id="inlineNivel-${vendedor.id}" 
                            value="1" 
                            min="1" 
                            max="6" 
                            class="inline-input-small">
                        <button type="button" class="btn-mini" onclick="adjustInlineLevel(${vendedor.id}, 'nivel', 1)">+</button>
                    </div>
                    <div class="inline-level-group">
                        <span class="label-mini">Máx:</span>
                        <button type="button" class="btn-mini" onclick="adjustInlineLevel(${vendedor.id}, 'max', -1)">-</button>
                        <input type="number" 
                            id="inlineMax-${vendedor.id}" 
                            value="5" 
                            min="1" 
                            max="6" 
                            class="inline-input-small">
                        <button type="button" class="btn-mini" onclick="adjustInlineLevel(${vendedor.id}, 'max', 1)">+</button>
                    </div>
                </div>
                
                <button class="btn btn-add-inline" onclick="agregarEncantamientoInline(${vendedor.id})">
                    ✓ Agregar
                </button>
            </div>
        </div>
    `;
    
    return `
        <div class="vendor-card">
            <div class="vendor-header">
                <div class="vendor-number">#${vendedor.numero}</div>
            </div>
            <div class="vendor-piso">📍 ${vendedor.piso}</div>
            <div class="vendor-enchantments">
                <div class="vendor-enchantments-title">✨ Encantamientos:</div>
                <div class="vendor-enchantments-list">
                    ${encantamientos}
                </div>
            </div>
            ${formularioAgregar}
            <div class="vendor-actions">
                <button class="btn btn-primary" onclick="editarVendedor(${vendedor.id})">
                    ✏️ Editar
                </button>
                <button class="btn btn-danger" onclick="abrirModalEliminar(${vendedor.id})">
                    🗑️ Eliminar
                </button>
            </div>
        </div>
    `;
}

function actualizarContador() {
    elements.vendorCount.textContent = vendedores.length;
}

// ================================================
// EDICIÓN DE VENDEDOR
// ================================================
function editarVendedor(id) {
    const vendedor = vendedores.find(v => v.id === id);
    if (!vendedor) return;
    
    vendedorEditando = vendedor;
    encantamientosTemp = [...vendedor.encantamientos];
    
    elements.vendedorId.value = vendedor.id;
    elements.numero.value = vendedor.numero;
    elements.piso.value = vendedor.piso;
    elements.numero.disabled = true; // No permitir cambiar el número
    
    renderizarEncantamientos();
    
    elements.submitBtn.textContent = '💾 Actualizar Vendedor';
    
    // Expandir formulario si está colapsado
    expandirFormulario();
    
    // Scroll al formulario
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ================================================
// AGREGAR ENCANTAMIENTO INLINE
// ================================================
function toggleInlineForm(vendedorId) {
    const formBody = document.getElementById(`inlineFormBody-${vendedorId}`);
    const arrow = document.querySelector(`#addEnchForm-${vendedorId} .toggle-arrow`);
    
    formBody.classList.toggle('collapsed');
    if (formBody.classList.contains('collapsed')) {
        arrow.textContent = '▼';
    } else {
        arrow.textContent = '▲';
    }
}

function toggleInlineLevels(vendedorId) {
    const checkbox = document.getElementById(`inlineTieneNiveles-${vendedorId}`);
    const levelsDiv = document.getElementById(`inlineLevels-${vendedorId}`);
    
    if (checkbox.checked) {
        levelsDiv.style.display = 'flex';
    } else {
        levelsDiv.style.display = 'none';
    }
}

function adjustInlineLevel(vendedorId, tipo, cambio) {
    const inputId = tipo === 'nivel' ? `inlineNivel-${vendedorId}` : `inlineMax-${vendedorId}`;
    const input = document.getElementById(inputId);
    let valor = parseInt(input.value) || 1;
    
    valor += cambio;
    
    if (valor < 1) valor = 1;
    if (valor > 6) valor = 6;
    
    // Si es nivel, no puede superar el máximo
    if (tipo === 'nivel') {
        const maxInput = document.getElementById(`inlineMax-${vendedorId}`);
        const maxValor = parseInt(maxInput.value) || 6;
        if (valor > maxValor) valor = maxValor;
    }
    
    // Si es máximo, ajustar el nivel si es necesario
    if (tipo === 'max') {
        const nivelInput = document.getElementById(`inlineNivel-${vendedorId}`);
        const nivelValor = parseInt(nivelInput.value) || 1;
        if (nivelValor > valor) {
            nivelInput.value = valor;
        }
    }
    
    input.value = valor;
}

async function agregarEncantamientoInline(vendedorId) {
    const vendedor = vendedores.find(v => v.id === vendedorId);
    if (!vendedor) return;
    
    const nombreInput = document.getElementById(`inlineNombre-${vendedorId}`);
    const tieneNivelesCheckbox = document.getElementById(`inlineTieneNiveles-${vendedorId}`);
    const nivelInput = document.getElementById(`inlineNivel-${vendedorId}`);
    const maxInput = document.getElementById(`inlineMax-${vendedorId}`);
    
    const nombre = nombreInput.value.trim();
    
    if (!nombre) {
        mostrarError('Por favor, ingresa un nombre válido');
        return;
    }
    
    // Verificar que no exista ya
    const existe = vendedor.encantamientos.some(e => 
        e.nombre.toLowerCase() === nombre.toLowerCase()
    );
    
    if (existe) {
        mostrarError('Este encantamiento ya existe en este vendedor');
        return;
    }
    
    let nuevoEncantamiento = { nombre };
    
    if (tieneNivelesCheckbox.checked) {
        const nivel = parseInt(nivelInput.value) || 1;
        const nivelMaximo = parseInt(maxInput.value) || 5;
        
        nuevoEncantamiento.nivel = nivel;
        nuevoEncantamiento.nivelMaximo = nivelMaximo;
    } else {
        nuevoEncantamiento.tieneNiveles = false;
    }
    
    try {
        // Agregar el nuevo encantamiento a la lista existente
        const encantamientosActualizados = [...vendedor.encantamientos, nuevoEncantamiento];
        
        await actualizarVendedor(vendedorId, {
            numero: vendedor.numero,
            piso: vendedor.piso,
            encantamientos: encantamientosActualizados
        });
        
        mostrarExito('✅ Encantamiento agregado correctamente');
        
        // Limpiar formulario inline
        nombreInput.value = '';
        nivelInput.value = '1';
        maxInput.value = '5';
        tieneNivelesCheckbox.checked = true;
        document.getElementById(`inlineLevels-${vendedorId}`).style.display = 'flex';
        
        // Recargar ambas listas
        await cargarVendedores();
        await cargarTablaEncantamientos();
        
    } catch (error) {
        mostrarError('Error al agregar el encantamiento');
    }
}

// ================================================
// ELIMINACIÓN DE ENCANTAMIENTO DE VENDEDOR
// ================================================
async function eliminarEncantamientoDeVendedor(vendedorId, relacionId) {
    const vendedor = vendedores.find(v => v.id === vendedorId);
    if (!vendedor) return;
    
    // Buscar el encantamiento por relacionId
    const encantamiento = vendedor.encantamientos.find(e => e.relacionId === relacionId);
    if (!encantamiento) return;
    
    const descripcion = encantamiento.nivel !== undefined 
        ? `${encantamiento.nombre} Nv. ${encantamiento.nivel}` 
        : encantamiento.nombre;
    
    if (!confirm(`¿Eliminar ${descripcion} de este vendedor?`)) {
        return;
    }
    
    try {
        // Llamar al nuevo endpoint de eliminación
        const response = await fetch(`${API_URL}/vendedores/${vendedorId}/encantamientos/${relacionId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Error al eliminar encantamiento');
        }
        
        mostrarExito('✅ Encantamiento eliminado correctamente');
        
        // Recargar ambas listas
        await cargarVendedores();
        await cargarTablaEncantamientos();
        
    } catch (error) {
        mostrarError('❌ Error al eliminar el encantamiento');
    }
}

// ================================================
// ELIMINACIÓN DE VENDEDOR
// ================================================
function abrirModalEliminar(id) {
    vendedorAEliminar = id;
    elements.deleteModal.classList.add('active');
}

function cerrarModal() {
    vendedorAEliminar = null;
    elements.deleteModal.classList.remove('active');
}

async function confirmarEliminacion() {
    if (!vendedorAEliminar) return;
    
    try {
        await eliminarVendedor(vendedorAEliminar);
        mostrarExito('✅ Vendedor eliminado correctamente');
        await cargarVendedores();
        await cargarTablaEncantamientos();
        cerrarModal();
    } catch (error) {
        mostrarError('❌ Error al eliminar el vendedor');
    }
}

// ================================================
// FILTROS
// ================================================
async function aplicarFiltros() {
    const filtros = {
        piso: elements.filterPiso.value.trim(),
        numero: elements.filterNumero.value.trim()
    };
    
    // Verificar si hay algún filtro activo
    const hayFiltros = Object.values(filtros).some(v => v);
    
    if (!hayFiltros) {
        mostrarError('Ingresa al menos un filtro');
        return;
    }
    
    await cargarVendedores(filtros);
}

async function limpiarFiltros() {
    elements.filterPiso.value = '';
    elements.filterNumero.value = '';
    await cargarVendedores();
}

async function aplicarFiltrosEncantamientos() {
    const filtros = {};
    
    // Solo agregar filtros que tengan valores
    const nombre = elements.filterEnchName.value.trim();
    const nivel = elements.filterEnchNivel.value.trim();
    const piso = elements.filterEnchPiso.value.trim();
    const vendedor = elements.filterEnchVendor.value.trim();
    
    if (nombre) filtros.nombre = nombre;
    if (nivel) filtros.nivel = nivel;
    if (piso) filtros.piso = piso;
    if (vendedor) filtros.vendedor = vendedor;
    
    // Verificar si hay algún filtro activo
    const hayFiltros = Object.keys(filtros).length > 0;
    
    reiniciarVentanaEncantamientos();

    if (!hayFiltros) {
        await cargarTablaEncantamientos();
        return;
    }
    
    await cargarTablaEncantamientos(filtros);
}

async function limpiarFiltrosEncantamientos() {
    elements.filterEnchName.value = '';
    elements.filterEnchNivel.value = '';
    elements.filterEnchPiso.value = '';
    elements.filterEnchVendor.value = '';
    reiniciarVentanaEncantamientos();
    await cargarTablaEncantamientos();
}

// ================================================
// CARGAR TABLA DE ENCANTAMIENTOS
// ================================================
async function cargarTablaEncantamientos(filtros = null) {
    try {
        const response = await fetch(`${API_URL}/vendedores`);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const vendedoresData = await response.json();
        
        // Crear array de encantamientos con información del vendedor
        let encantamientos = [];
        vendedoresData.forEach(vendedor => {
            vendedor.encantamientos.forEach(enc => {
                encantamientos.push({
                    nombre: enc.nombre,
                    nivel: enc.nivel,
                    nivelMaximo: enc.nivelMaximo,
                    tieneNiveles: enc.tieneNiveles,
                    vendedorNumero: vendedor.numero,
                    piso: vendedor.piso,
                    vendedorId: vendedor.id
                });
            });
        });
        
        // Aplicar filtros si existen
        if (filtros && Object.keys(filtros).length > 0) {
            console.log('🔍 Aplicando filtros:', filtros);
            console.log('📊 Total encantamientos antes de filtrar:', encantamientos.length);
            
            encantamientos = encantamientos.filter(enc => {
                let cumple = true;
                
                if (filtros.nombre !== undefined) {
                    const nombreEnc = (enc.nombre || '').toLowerCase();
                    const nombreFiltro = filtros.nombre.toLowerCase();
                    cumple = cumple && nombreEnc.includes(nombreFiltro);
                }
                
                if (filtros.nivel !== undefined) {
                    cumple = cumple && enc.nivel && String(enc.nivel) === String(filtros.nivel);
                }
                
                if (filtros.piso !== undefined) {
                    cumple = cumple && String(enc.piso) === String(filtros.piso);
                }
                
                if (filtros.vendedor !== undefined) {
                    cumple = cumple && String(enc.vendedorNumero) === String(filtros.vendedor);
                }
                
                return cumple;
            });
            
            console.log('✅ Total encantamientos después de filtrar:', encantamientos.length);
        }
        
        if (sortState.column) {
            encantamientos.sort((a, b) => compararEncantamientos(a, b, sortState.column));
        } else {
            encantamientos.sort((a, b) => a.nombre.localeCompare(b.nombre));
        }
        
        // Renderizar tabla
        renderizarTablaEncantamientos(encantamientos);
        
    } catch (error) {
        console.error('Error al cargar encantamientos:', error);
        mostrarError('Error al cargar la lista de encantamientos');
    }
}

// ================================================
// ORDENAMIENTO DE TABLA
// ================================================
function compararEncantamientos(a, b, column) {
    let valA;
    let valB;

    switch (column) {
        case 'nombre':
            valA = (a.nombre || '').toLowerCase();
            valB = (b.nombre || '').toLowerCase();
            break;
        case 'nivel':
            valA = a.tieneNiveles === false || a.nivel == null ? -1 : Number(a.nivel);
            valB = b.tieneNiveles === false || b.nivel == null ? -1 : Number(b.nivel);
            break;
        case 'vendedor':
            valA = Number(a.vendedorNumero);
            valB = Number(b.vendedorNumero);
            break;
        case 'piso':
            valA = Number(a.piso);
            valB = Number(b.piso);
            break;
        default:
            return 0;
    }

    if (valA < valB) return sortState.direction === 'asc' ? -1 : 1;
    if (valA > valB) return sortState.direction === 'asc' ? 1 : -1;
    return 0;
}

function ordenarTabla(column) {
    if (encantamientosListaActual.length === 0) return;

    if (sortState.column === column) {
        sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';
    } else {
        sortState.column = column;
        sortState.direction = 'asc';
    }

    encantamientosListaActual.sort((a, b) => compararEncantamientos(a, b, column));
    reiniciarVentanaEncantamientos();
    renderizarTablaEncantamientos(encantamientosListaActual);
    actualizarIndicadoresOrdenamiento();
}

function actualizarIndicadoresOrdenamiento() {
    const headers = document.querySelectorAll('.enchantments-table th.sortable');
    headers.forEach(header => {
        const arrow = header.querySelector('.sort-arrow');
        const column = header.dataset.sort;
        
        if (column === sortState.column) {
            arrow.textContent = sortState.direction === 'asc' ? '↑' : '↓';
            header.style.color = 'var(--minecraft-gold)';
        } else {
            arrow.textContent = '⇅';
            header.style.color = '';
        }
    });
}

function crearFilaEncantamiento(enc) {
    const tr = document.createElement('tr');

    const tdNombre = document.createElement('td');
    tdNombre.className = 'ench-name';
    tdNombre.dataset.label = 'Encantamiento';
    const ficha = buscarFicha(enc.nombre);
    tdNombre.textContent = ficha ? nombreVisible(ficha) : enc.nombre;
    if (ficha) tdNombre.dataset.ficha = ficha.id;
    tr.appendChild(tdNombre);

    const tdNivel = document.createElement('td');
    tdNivel.className = 'ench-level';
    tdNivel.dataset.label = 'Nivel';
    if (enc.tieneNiveles === false) {
        tdNivel.textContent = '—';
    } else {
        tdNivel.textContent = `${enc.nivel}/${enc.nivelMaximo}`;
        const porcentaje = enc.nivel / enc.nivelMaximo;
        if (porcentaje === 1) {
            tdNivel.classList.add('level-max');
        } else if (porcentaje >= 0.5) {
            tdNivel.classList.add('level-mid');
        } else {
            tdNivel.classList.add('level-low');
        }
    }
    tr.appendChild(tdNivel);

    const tdVendor = document.createElement('td');
    tdVendor.className = 'ench-vendor';
    tdVendor.dataset.label = 'Vendedor';
    tdVendor.textContent = `#${enc.vendedorNumero}`;
    tr.appendChild(tdVendor);

    const tdPiso = document.createElement('td');
    tdPiso.className = 'ench-floor';
    tdPiso.dataset.label = 'Piso';
    tdPiso.textContent = `Piso ${enc.piso}`;
    tr.appendChild(tdPiso);

    return tr;
}

function agregarFilasEncantamientos(encantamientos) {
    const tbody = elements.enchantmentsTableBody;
    encantamientos.forEach(enc => tbody.appendChild(crearFilaEncantamiento(enc)));
}

function renderizarTablaEncantamientos(encantamientos) {
    encantamientosListaActual = encantamientos;
    const tbody = elements.enchantmentsTableBody;
    const state = paginationState.enchantments;
    tbody.innerHTML = '';

    if (encantamientos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 30px; color: var(--minecraft-gold);">No se encontraron encantamientos</td></tr>';
        state.totalItems = 0;
        state.totalPages = 1;
        state.currentPage = 1;
        actualizarVistaModoLista();
        return;
    }

    state.totalItems = encantamientos.length;
    state.totalPages = Math.max(1, Math.ceil(encantamientos.length / state.itemsPerPage));
    if (state.currentPage > state.totalPages) state.currentPage = state.totalPages;
    if (state.currentPage < 1) state.currentPage = 1;
    if (state.visibleCount < state.itemsPerPage) state.visibleCount = state.itemsPerPage;
    if (state.visibleCount > encantamientos.length) state.visibleCount = encantamientos.length;

    const visibles = enchantmentsListMode === 'infinite'
        ? encantamientos.slice(0, state.visibleCount)
        : encantamientos.slice(
            (state.currentPage - 1) * state.itemsPerPage,
            state.currentPage * state.itemsPerPage
        );

    agregarFilasEncantamientos(visibles);
    actualizarVistaModoLista();
    if (enchantmentsListMode === 'infinite') solicitarMasEncantamientos();
}

function textoNivelExportacion(enc) {
    if (enc.tieneNiveles === false || enc.nivel == null || enc.nivelMaximo == null) {
        return { texto: '—', color: '#bbbbbb' };
    }
    const porcentaje = Number(enc.nivelMaximo) === 0 ? 0 : Number(enc.nivel) / Number(enc.nivelMaximo);
    let color = '#DC143C';
    if (porcentaje >= 1) color = '#50C878';
    else if (porcentaje >= 0.5) color = '#FFD700';
    return { texto: `${enc.nivel}/${enc.nivelMaximo}`, color };
}

function textoQueEntra(ctx, texto, anchoMaximo) {
    const valor = String(texto ?? '');
    if (ctx.measureText(valor).width <= anchoMaximo) return valor;
    let recortado = valor;
    while (recortado.length > 1 && ctx.measureText(`${recortado}…`).width > anchoMaximo) {
        recortado = recortado.slice(0, -1);
    }
    return `${recortado}…`;
}

function disenoExportacionEncantamientos(cantidad) {
    const ancho = 920;
    const margenX = 16;
    const margenY = 14;
    const maxAlto = 1600;
    let fuente = 11;

    const armar = (tamano) => {
        const altoFila = tamano + 7;
        const altoEncabezado = tamano + 10;
        const altoTitulo = tamano + 16;
        const alto = margenY + altoTitulo + altoEncabezado + (cantidad * altoFila) + margenY;
        return { fuente: tamano, altoFila, altoEncabezado, altoTitulo, alto };
    };

    let diseno = armar(fuente);
    while (diseno.alto > maxAlto && fuente > 7) {
        fuente -= 1;
        diseno = armar(fuente);
    }

    return { ancho, margenX, margenY, ...diseno };
}

function cerrarMenuExportacion() {
    const menu = document.getElementById('exportOptions');
    const boton = document.getElementById('exportEnchantments');
    if (menu) menu.hidden = true;
    if (boton) boton.setAttribute('aria-expanded', 'false');
}

function nombreArchivoExportacion(extension) {
    const fecha = new Date().toISOString().slice(0, 10);
    return `encantamientos-${fecha}.${extension}`;
}

function descargarContenido(nombre, contenido, tipo) {
    const blob = new Blob([contenido], { type: tipo });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombre;
    enlace.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function escaparHtml(valor) {
    return String(valor ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function filasParaExportar() {
    return encantamientosListaActual.map(enc => {
        const nivel = textoNivelExportacion(enc);
        const sinNiveles = enc.tieneNiveles === false || enc.nivel == null || enc.nivelMaximo == null;
        return {
            nombre: enc.nombre,
            nivel: sinNiveles ? null : enc.nivel,
            nivelMaximo: sinNiveles ? null : enc.nivelMaximo,
            nivelTexto: nivel.texto,
            colorNivel: nivel.color,
            tieneNiveles: !sinNiveles,
            vendedor: enc.vendedorNumero,
            piso: enc.piso
        };
    });
}

function exportarJsonEncantamientos(filas) {
    const datos = {
        total: filas.length,
        encantamientos: filas.map(fila => ({
            nombre: fila.nombre,
            nivel: fila.nivel,
            nivelMaximo: fila.nivelMaximo,
            tieneNiveles: fila.tieneNiveles,
            vendedor: fila.vendedor,
            piso: fila.piso
        }))
    };
    descargarContenido(
        nombreArchivoExportacion('json'),
        JSON.stringify(datos, null, 2),
        'application/json;charset=utf-8'
    );
}

function exportarTextoEncantamientos(filas) {
    const encabezados = ['Encantamiento', 'Nivel/Máx', 'Vendedor', 'Piso'];
    const lineas = filas.map(fila => [
        fila.nombre,
        fila.nivelTexto,
        `#${fila.vendedor}`,
        `Piso ${fila.piso}`
    ]);
    const anchos = encabezados.map((titulo, indice) => {
        return lineas.reduce((maximo, linea) => Math.max(maximo, linea[indice].length), titulo.length);
    });
    const formatear = (celdas) => celdas.map((celda, indice) => celda.padEnd(anchos[indice])).join('  ');
    const contenido = [
        `Encantamientos (${filas.length})`,
        '',
        formatear(encabezados),
        formatear(anchos.map(ancho => '-'.repeat(ancho))),
        ...lineas.map(formatear)
    ].join('\n');
    descargarContenido(nombreArchivoExportacion('txt'), `\uFEFF${contenido}`, 'text/plain;charset=utf-8');
}

function claseNivelExportacion(fila) {
    if (!fila.tieneNiveles) return 'nivel-sin';
    if (fila.colorNivel === '#50C878') return 'nivel-max';
    if (fila.colorNivel === '#FFD700') return 'nivel-medio';
    return 'nivel-bajo';
}

function exportarHtmlEncantamientos(filas) {
    const cuerpo = filas.map(fila => `
        <tr>
            <td class="nombre">${escaparHtml(fila.nombre)}</td>
            <td class="${claseNivelExportacion(fila)}">${escaparHtml(fila.nivelTexto)}</td>
            <td class="vendedor">#${escaparHtml(fila.vendedor)}</td>
            <td>Piso ${escaparHtml(fila.piso)}</td>
        </tr>`).join('');
    const html = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>Encantamientos (${filas.length})</title>
    <style>
        body { margin: 16px; background: #1a1a1a; color: #f5f5f5; font-family: "Segoe UI", Arial, sans-serif; font-size: 12px; }
        h1 { margin: 0 0 12px; color: #ffd700; font-size: 16px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 3px 6px; border: 1px solid #4a4a4a; line-height: 1.3; }
        th { background: #2c2c2c; color: #50c878; text-align: left; font-size: 11px; }
        tr:nth-child(even) { background: #2a2a2a; }
        tr:nth-child(odd) { background: #232323; }
        .nombre { color: #50c878; }
        .vendedor { color: #5dade2; }
        .nivel-max { color: #50c878; text-align: center; }
        .nivel-medio { color: #ffd700; text-align: center; }
        .nivel-bajo { color: #dc143c; text-align: center; }
        .nivel-sin { color: #bbbbbb; text-align: center; }
    </style>
</head>
<body>
    <h1>Encantamientos (${filas.length})</h1>
    <table>
        <thead>
            <tr>
                <th>Encantamiento</th>
                <th>Nivel/Máx</th>
                <th>Vendedor</th>
                <th>Piso</th>
            </tr>
        </thead>
        <tbody>${cuerpo}
        </tbody>
    </table>
</body>
</html>`;
    descargarContenido(nombreArchivoExportacion('html'), html, 'text/html;charset=utf-8');
}

function exportarImagenEncantamientos(filas) {
    const diseno = disenoExportacionEncantamientos(filas.length);
    const escala = 2;
    const canvas = document.createElement('canvas');
    canvas.width = diseno.ancho * escala;
    canvas.height = diseno.alto * escala;
    const ctx = canvas.getContext('2d');
    ctx.scale(escala, escala);
    ctx.fillStyle = '#1A1A1A';
    ctx.fillRect(0, 0, diseno.ancho, diseno.alto);

    const columnas = [
        { titulo: 'Encantamiento', peso: 0.46 },
        { titulo: 'Nivel/Máx', peso: 0.18 },
        { titulo: 'Vendedor', peso: 0.18 },
        { titulo: 'Piso', peso: 0.18 }
    ];
    const anchoTabla = diseno.ancho - (diseno.margenX * 2);
    let cursorX = diseno.margenX;
    columnas.forEach(columna => {
        columna.x = cursorX;
        columna.ancho = Math.floor(anchoTabla * columna.peso);
        cursorX += columna.ancho;
    });
    columnas[columnas.length - 1].ancho = diseno.margenX + anchoTabla - columnas[columnas.length - 1].x;

    ctx.textBaseline = 'middle';
    ctx.font = `bold ${diseno.fuente + 1}px "Segoe UI", Arial, sans-serif`;
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'left';
    ctx.fillText(`Encantamientos (${filas.length})`, diseno.margenX, diseno.margenY + (diseno.altoTitulo / 2));

    const yEncabezado = diseno.margenY + diseno.altoTitulo;
    ctx.fillStyle = '#2C2C2C';
    ctx.fillRect(diseno.margenX, yEncabezado, anchoTabla, diseno.altoEncabezado);
    ctx.font = `bold ${diseno.fuente}px "Segoe UI", Arial, sans-serif`;
    ctx.fillStyle = '#50C878';
    columnas.forEach((columna, indice) => {
        ctx.textAlign = indice === 0 ? 'left' : 'center';
        const x = indice === 0 ? columna.x + 6 : columna.x + (columna.ancho / 2);
        ctx.fillText(columna.titulo, x, yEncabezado + (diseno.altoEncabezado / 2));
    });

    ctx.font = `${diseno.fuente}px "Segoe UI", Arial, sans-serif`;
    filas.forEach((enc, indice) => {
        const y = yEncabezado + diseno.altoEncabezado + (indice * diseno.altoFila);
        ctx.fillStyle = indice % 2 === 0 ? '#2A2A2A' : '#232323';
        ctx.fillRect(diseno.margenX, y, anchoTabla, diseno.altoFila);

        const centro = y + (diseno.altoFila / 2);
        ctx.textAlign = 'left';
        ctx.fillStyle = '#50C878';
        ctx.fillText(
            textoQueEntra(ctx, enc.nombre, columnas[0].ancho - 12),
            columnas[0].x + 6,
            centro
        );

        ctx.textAlign = 'center';
        ctx.fillStyle = enc.colorNivel;
        ctx.fillText(enc.nivelTexto, columnas[1].x + (columnas[1].ancho / 2), centro);

        ctx.fillStyle = '#5DADE2';
        ctx.fillText(`#${enc.vendedor}`, columnas[2].x + (columnas[2].ancho / 2), centro);

        ctx.fillStyle = '#F5F5F5';
        ctx.fillText(`Piso ${enc.piso}`, columnas[3].x + (columnas[3].ancho / 2), centro);
    });

    ctx.strokeStyle = '#4A4A4A';
    ctx.lineWidth = 1;
    ctx.strokeRect(diseno.margenX + 0.5, yEncabezado + 0.5, anchoTabla - 1, diseno.altoEncabezado + (filas.length * diseno.altoFila) - 1);

    const enlace = document.createElement('a');
    enlace.href = canvas.toDataURL('image/png');
    enlace.download = nombreArchivoExportacion('png');
    enlace.click();
}

function exportarTablaEncantamientos(formato) {
    const filas = filasParaExportar();
    if (!filas.length) {
        mostrarError('No hay encantamientos para exportar');
        return;
    }

    if (formato === 'json') exportarJsonEncantamientos(filas);
    else if (formato === 'texto') exportarTextoEncantamientos(filas);
    else if (formato === 'html') exportarHtmlEncantamientos(filas);
    else exportarImagenEncantamientos(filas);
}

// ================================================
// NOTIFICACIONES
// ================================================
function mostrarExito(mensaje) {
    console.log('✅', mensaje);
    // Podrías implementar un sistema de notificaciones toast aquí
    alert(mensaje);
}

function mostrarError(mensaje) {
    console.error('❌', mensaje);
    alert('❌ ' + mensaje);
}

// ================================================
// FUNCIONES GLOBALES (para onclick en HTML)
// ================================================
window.editarVendedor = editarVendedor;
window.abrirModalEliminar = abrirModalEliminar;
window.eliminarEncantamiento = eliminarEncantamiento;
window.eliminarEncantamientoDeVendedor = eliminarEncantamientoDeVendedor;
window.toggleInlineForm = toggleInlineForm;
window.toggleInlineLevels = toggleInlineLevels;
window.adjustInlineLevel = adjustInlineLevel;
window.agregarEncantamientoInline = agregarEncantamientoInline;

// ================================================
// PAGINACIÓN
// ================================================
function reiniciarVentanaEncantamientos() {
    paginationState.enchantments.currentPage = 1;
    paginationState.enchantments.visibleCount = paginationState.enchantments.itemsPerPage;
}

function actualizarVistaModoLista() {
    const paginador = document.getElementById('enchantmentsPagination');
    const pieInfinito = document.getElementById('enchantmentsInfiniteFooter');
    const info = document.getElementById('enchantmentsInfiniteInfo');
    const esInfinita = enchantmentsListMode === 'infinite';

    document.querySelectorAll('#enchantmentsListMode .btn-mode').forEach(btn => {
        const activo = btn.dataset.mode === enchantmentsListMode;
        btn.classList.toggle('active', activo);
        btn.setAttribute('aria-pressed', activo ? 'true' : 'false');
    });

    if (paginador) paginador.hidden = esInfinita;
    if (pieInfinito) pieInfinito.hidden = !esInfinita || paginationState.enchantments.totalItems === 0;

    if (esInfinita && info) {
        const total = paginationState.enchantments.totalItems;
        const mostrados = Math.min(paginationState.enchantments.visibleCount, total);
        info.textContent = mostrados >= total
            ? `Mostrando ${total} de ${total}`
            : `Mostrando ${mostrados} de ${total} · baja para ver más`;
    }

    if (!esInfinita) actualizarPaginadorEncantamientos();
}

function cambiarModoListaEncantamientos(modo) {
    if (modo !== 'paginated' && modo !== 'infinite') return;
    if (modo === enchantmentsListMode) return;

    enchantmentsListMode = modo;
    localStorage.setItem(MODO_LISTA_KEY, modo);
    reiniciarVentanaEncantamientos();
    renderizarTablaEncantamientos(encantamientosListaActual);
    actualizarIndicadoresOrdenamiento();
}

function cargarMasEncantamientos() {
    if (enchantmentsListMode !== 'infinite') return;
    if (!elements.enchantmentsTab.classList.contains('active')) return;

    const state = paginationState.enchantments;
    if (state.visibleCount >= encantamientosListaActual.length) return;

    const desde = state.visibleCount;
    state.visibleCount = Math.min(
        encantamientosListaActual.length,
        state.visibleCount + state.itemsPerPage
    );
    agregarFilasEncantamientos(encantamientosListaActual.slice(desde, state.visibleCount));
    actualizarVistaModoLista();
}

function llenarVistaInfinita() {
    if (enchantmentsListMode !== 'infinite') return;
    if (!elements.enchantmentsTab.classList.contains('active')) return;

    const sentinel = document.getElementById('enchantmentsScrollSentinel');
    const pie = document.getElementById('enchantmentsInfiniteFooter');
    if (!sentinel || !pie || pie.hidden) return;

    const quedan = paginationState.enchantments.visibleCount < encantamientosListaActual.length;
    const rect = sentinel.getBoundingClientRect();
    if (quedan && rect.top <= window.innerHeight + 240) {
        cargarMasEncantamientos();
        requestAnimationFrame(llenarVistaInfinita);
    }
}

function solicitarMasEncantamientos() {
    if (rellenandoListaInfinita) return;
    rellenandoListaInfinita = true;
    requestAnimationFrame(() => {
        rellenandoListaInfinita = false;
        llenarVistaInfinita();
    });
}

function iniciarScrollInfinito() {
    const sentinel = document.getElementById('enchantmentsScrollSentinel');
    if (!sentinel || observadorListaInfinita) return;

    observadorListaInfinita = new IntersectionObserver((entries) => {
        if (entries.some(entry => entry.isIntersecting)) {
            solicitarMasEncantamientos();
        }
    }, { root: null, rootMargin: '240px 0px', threshold: 0 });

    observadorListaInfinita.observe(sentinel);
}

function actualizarPaginadorEncantamientos() {
    const prevBtn = document.getElementById('enchPrevPage');
    const nextBtn = document.getElementById('enchNextPage');
    const pageInfo = document.getElementById('enchPageInfo');
    
    if (!prevBtn || !nextBtn || !pageInfo) return;
    
    const { currentPage, totalPages } = paginationState.enchantments;
    
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;
    pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
}

function cambiarPaginaEncantamientos(direccion) {
    const { currentPage, totalPages } = paginationState.enchantments;
    const paginaAnterior = currentPage;
    
    if (direccion === 'prev' && currentPage > 1) {
        paginationState.enchantments.currentPage--;
    } else if (direccion === 'next' && currentPage < totalPages) {
        paginationState.enchantments.currentPage++;
    }

    if (paginationState.enchantments.currentPage === paginaAnterior) return;

    renderizarTablaEncantamientos(encantamientosListaActual);
    actualizarIndicadoresOrdenamiento();
    document.querySelector('#enchantments-tab .table-wrapper')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function actualizarPaginadorVendedores() {
    const prevBtn = document.getElementById('vendorPrevPage');
    const nextBtn = document.getElementById('vendorNextPage');
    const pageInfo = document.getElementById('vendorPageInfo');
    
    if (!prevBtn || !nextBtn || !pageInfo) return;
    
    const { currentPage, totalPages } = paginationState.vendors;
    
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;
    pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
}

function cambiarPaginaVendedores(direccion) {
    const { currentPage, totalPages } = paginationState.vendors;
    
    if (direccion === 'prev' && currentPage > 1) {
        paginationState.vendors.currentPage--;
    } else if (direccion === 'next' && currentPage < totalPages) {
        paginationState.vendors.currentPage++;
    }
    
    cargarVendedores();
}

// Inicializar eventos de paginación
document.addEventListener('DOMContentLoaded', () => {
    const enchPrevBtn = document.getElementById('enchPrevPage');
    const enchNextBtn = document.getElementById('enchNextPage');
    const vendorPrevBtn = document.getElementById('vendorPrevPage');
    const vendorNextBtn = document.getElementById('vendorNextPage');
    
    if (enchPrevBtn) enchPrevBtn.addEventListener('click', () => cambiarPaginaEncantamientos('prev'));
    if (enchNextBtn) enchNextBtn.addEventListener('click', () => cambiarPaginaEncantamientos('next'));
    if (vendorPrevBtn) vendorPrevBtn.addEventListener('click', () => cambiarPaginaVendedores('prev'));
    if (vendorNextBtn) vendorNextBtn.addEventListener('click', () => cambiarPaginaVendedores('next'));
});
