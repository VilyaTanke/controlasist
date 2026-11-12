# ⛪ Control NVSR - Iglesia Nueva Vida de Soto del Real
### Sistema de Registro, Asistencia y Exportación a Excel

Aplicación web profesional diseñada para el control y registro de asistentes (Nuevos y Consolidados) de la **Iglesia Nueva Vida de Soto del Real**.

---

## 🌟 Características Principales

1. **Formulario Rápido y Adaptado a Móviles/Tablets**:
   - **Nombre y Apellidos**: Campo principal para el asistente.
   - **Teléfono**: Con enlace directo a llamada y botón para iniciar conversación en **WhatsApp** con saludo de bienvenida precargado.
   - **Dirección**: Dirección de domicilio del asistente o visitante.
   - **Cumpleaños**: Fecha de cumpleaños para el registro de felicitaciones.
   - **Casilla de Selección (Nuevo o Consolidado)**: Selector visual grande y táctil para clasificar rápidamente si es su primera vez (**Nuevo**) o si es un miembro en seguimiento (**Consolidado**).
   - **Fecha y Hora Automática**: Se registra de manera automática el instante exacto en que se ingresan los datos. Cuenta con botón *"Ahora"* o selector manual por si se pasan fichas físicas de cultos anteriores.
   - **Observaciones**: Campo para notas pastorales, peticiones de oración o ujier asignado.

2. **Exportación Idéntica a Excel (.xlsx)**:
   - Incorpora el encabezado institucional exacto:
     - **Título**: *Iglesia Nueva Vida de Soto del Real*
     - **Dirección**: *Calle del Prado, 15, 28791 Soto del Real, Madrid.*
     - **Horario de cultos**: *Domingos a las 18:00 h.*
     - **Pastores principales**: *Jorge Gámez Zúñiga y Carmen Vera Mendoza.*
   - **Dos formatos de descarga a un clic**:
     - 📄 **Formato Original Exacto**: Reproduce la plantilla entregada con las columnas `[Nombres, Telefono, Cumpleaños, Nuevo, Consolidado]` marcando una "X" en la casilla correspondiente.
     - 📑 **Formato Completo**: Incluye además las columnas de `[Fecha y Hora de Registro, Dirección, Observaciones]`.
   - Formato visual profesional: colores oficiales, tipografía clara, bordes definidos y celdas autoajustadas para que no se corten los textos.

3. **Panel de Métricas en Vivo**:
   - Total de personas registradas.
   - Contador de Nuevos y Consolidados con porcentaje.
   - Contador de personas registradas en el día de hoy.

4. **Gestión Completa de Datos**:
   - Búsqueda en tiempo real por nombre, teléfono, dirección o notas.
   - Filtros rápidos por botones: *Todos*, *🟢 Nuevos*, *🔵 Consolidados*, *📅 Hoy*.
   - Edición y eliminación de registros.
   - **Importador de Excel**: Permite arrastrar hojas de cálculo anteriores para cargarlas automáticamente a la base de datos local.

5. **Base de Datos Local Persistente (SQLite)**:
   - Los datos se guardan en el archivo local `data/control_nvsr.db`.
   - No requiere conexión a internet para funcionar. Funciona 100% offline.

6. **Acceso Multi-dispositivo en Red Local (Wi-Fi)**:
   - Cualquier persona del equipo de recepción / ujieres puede abrir la aplicación desde su teléfono o tablet simplemente conectándose a la misma red Wi-Fi y abriendo la dirección IP mostrada en la consola.

---

## 🚀 Cómo Iniciar la Aplicación

### Método 1: Doble Clic en Windows (El más fácil)
Simplemente haz doble clic sobre el archivo:
👉 `iniciar.bat`

Esto abrirá la consola y levantará tu navegador web automáticamente en `http://localhost:3000`.

---

### Método 2: Desde la Terminal / Consola de Comandos
```bash
npm start
```
O en modo de desarrollo con recarga automática:
```bash
npm run dev
```

---

## 📱 Acceso desde Móvil / Tablet en la Iglesia

Cuando inicies el servidor, la consola te mostrará una dirección similar a esta:
```text
====================================================
⛪  SISTEMA DE CONTROL - IGLESIA NUEVA VIDA SOTO DEL REAL
====================================================
🚀 Servidor ejecutándose en:
   ➜ Local:           http://localhost:3000
   ➜ Red Local/Móvil: http://192.168.1.160:3000
====================================================
```
Cualquier teléfono o tablet conectado a la misma red Wi-Fi puede abrir esa dirección (ej: `http://192.168.1.160:3000`) y usar la app en tiempo real.

---

## 📂 Estructura del Proyecto

```
ControlNVSR/
│
├── iniciar.bat             # Acceso directo para iniciar en Windows con 1 clic
├── package.json            # Configuración de dependencias
├── server/
│   ├── index.js            # Servidor Express y APIs REST
│   ├── db.js               # Base de datos SQLite y consultas
│   └── excelService.js     # Generador del archivo Excel (.xlsx) oficial e importador
│
├── public/
│   ├── index.html          # Interfaz web principal
│   ├── css/
│   │   └── styles.css      # Estilos visuales modernos, responsivos y modo offline
│   └── js/
│       └── app.js          # Lógica frontend, filtros, validación y llamadas API
│
└── data/
    └── control_nvsr.db     # Base de datos SQLite local persistente
```

---

## 💾 Copias de Seguridad (Backups)

Para respaldar todos los registros de la iglesia, solo necesitas copiar el archivo `data/control_nvsr.db` a una memoria USB o servicio en la nube (Google Drive, OneDrive, etc.). También puedes presionar el botón **Exportar a Excel** en cualquier momento para obtener una copia editable en formato de hoja de cálculo.
