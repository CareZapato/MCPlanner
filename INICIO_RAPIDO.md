# GUÍA RÁPIDA - Minecraft Vendedores Manager

## 🚀 Inicio Rápido

### Opción 1: Doble clic en el archivo
Simplemente haz doble clic en `START_SERVER.bat` y la aplicación completa se iniciará automáticamente (frontend y backend).

### Opción 2: Desde la terminal
```bash
npm start
```

Esto iniciará automáticamente:
- Backend API (puerto 3000)
- Frontend (puerto 8080) - se abre automáticamente en el navegador

## 🌐 Acceder a la aplicación

### Desde este equipo:
**http://localhost:8080**

### Desde otros dispositivos en la red:
**http://192.168.1.239:8080**

_(Tu IP puede cambiar si tu router la asigna dinámicamente)_

**Nota:** El backend API corre en el puerto 3000, pero no necesitas acceder directamente a él.

## 📱 Para usar desde el celular:

1. Conecta tu celular a la **misma 808 WiFi** que este equipo
2. Abre el navegador en el celular
3. Ingresa: **http://192.168.1.239:3000**
4. ¡Listo! La interfaz se adaptará automáticamente

## 🔍 Verificar tu IP actual

En PowerShell o CMD:
```powershell
ipconfig
```
Busca "Dirección IPv4" en la sección de tu adaptador de red activo (WiFi o Ethernet).

## 🛠️ Comandos útiles

### Instalar todas las dependencias (primera vez):
```bash
npm run install-all
```

### Iniciar la aplicación:
```bash
npm start
```

### Detener el servidor:
Presiona `Ctrl + C` en la terminal donde se está ejecutando

## 📊 Estructura de datos

Los vendedores se guardan en: `backend/data/vendedores.json`

Puedes hacer backup de este archivo para no perder tus datos.

## ⚠️ Solución de problemas

### No puedo acceder desde otro dispositivo
1. Verifica que ambos dispositivos estén en la misma red WiFi
2. Desactiva temporalmente el firewall de Windows o agrega una excepción para el puerto 3000
3. Verifica tu IP local con `ipconfig`

### El servidor no inicia
```bash
# Reinstala las dependencias
npm run install-all
```

## 📝 Características principales

✅ **Agregar vendedores** con número, piso y encantamientos
✅ **Ver todos los vendedores** en tarjetas visuales
✅ **Buscar y filtrar** por piso, encantamiento o nivel
✅ **Editar vendedores** existentes
✅ **Eliminar vendedores** con confirmación
✅ **Diseño responsive** que funciona en celular
✅ **Tema de Minecraft** con colores y fuentes pixel

---

**¡Disfruta gestionando tus vendedores! ⛏️**
