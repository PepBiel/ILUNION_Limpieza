# Front Limpieza

Aplicación local para visualizar, revisar, editar y regenerar los cuadrantes del servicio de limpieza hospitalaria de Santiago de Compostela.

El proyecto está pensado para trabajar de forma autocontenida dentro de esta carpeta, sin depender ya de material externo del reto para su ejecución diaria.

## 1. Qué incluye este proyecto

Esta carpeta concentra dos piezas:

1. Dashboard operativo.
2. Backend local de generación.

El dashboard permite:

- cambiar entre `Hospital Clínico` y `Hospital Gil Casares`,
- ver el cuadrante mensual,
- editar turnos manualmente desde la interfaz,
- medir el impacto de esos cambios sobre la cobertura,
- revisar plantilla, plazas y observaciones,
- consultar el cómputo anual de horas,
- lanzar una nueva generación del cuadrante con el algoritmo.

El backend permite:

- exponer una API local,
- ejecutar el algoritmo Python encapsulado desde el notebook original,
- leer los Excel de trabajadores y presencias,
- generar el Excel anual del hospital,
- reconstruir el JSON que consume el dashboard.

## 2. Estructura del proyecto

- [src](</Front Limpieza/src>)
  Frontend React + Vite.
- [server](</Front Limpieza/server>)
  API local en Node.
- [backend](</Front Limpieza/backend>)
  Integración Python con el algoritmo.
- [backend/assets/inputs](</Front Limpieza/backend/assets/inputs>)
  Excel base de entrada.
- [backend/assets/algorithm](</Front Limpieza/backend/assets/algorithm>)
  Copia local del notebook original.
- [public/data/dashboard-data.json](</Front Limpieza/public/data/dashboard-data.json>)
  Datos que consume el frontend.
- [generated](</Front Limpieza/generated>)
  Excel generados por el algoritmo.
- [docs/DOMAIN.md](</Front Limpieza/docs/DOMAIN.md>)
  Resumen funcional del dominio y restricciones principales.

## 3. Ficheros de entrada y salida

### Entradas del algoritmo

El generador usa estos dos ficheros:

- [Listado de Trabajadores.xlsx](</Front Limpieza/backend/assets/inputs/Listado de Trabajadores.xlsx>)
- [PRESENCIAS.xlsx](</Front Limpieza/backend/assets/inputs/PRESENCIAS.xlsx>)

### Salidas generadas

Cada generación actualiza:

- [dashboard-data.json](</Front Limpieza/public/data/dashboard-data.json>)
- la carpeta [generated](</Front Limpieza/generated>)

Ejemplos de salida:

- `clinico_cuadrante_anual_2026.xlsx`
- `gil_cuadrante_anual_2026.xlsx`

## 4. Requisitos

- Node.js instalado.
- npm disponible.
- Python disponible en Windows.

El proyecto prioriza el Python del entorno virtual `backend/.venv` cuando existe.

## 5. Cómo arrancar el proyecto

Abre una terminal en [Front Limpieza](</Front Limpieza>).

### 5.1 Instalar dependencias de Node

```bash
npm install
```

### 5.2 Preparar el backend Python

```bash
npm run setup:backend
```

Este comando:

- crea `backend/.venv/`,
- instala `pandas`, `numpy`, `scipy` y `openpyxl`,
- deja listo el Python que usará el generador.

### 5.3 Levantar frontend y backend a la vez

```bash
npm run dev:full
```

Esto arranca:

- frontend Vite en `http://127.0.0.1:5173`
- API local en `http://127.0.0.1:8787`

## 6. Scripts disponibles

- `npm run dev`
  Arranca solo el frontend.
- `npm run dev:server`
  Arranca solo la API local Node.
- `npm run dev:full`
  Arranca frontend y backend a la vez.
- `npm run build`
  Genera la build del frontend.
- `npm run start`
  Arranca el servidor Node para servir la app ya construida.
- `npm run preview`
  Previsualiza la build con Vite.
- `npm run check`
  Verificación rápida basada en build.
- `npm run setup:backend`
  Prepara el entorno Python.

## 7. Modo desarrollo y modo local tipo producto

### Desarrollo

Usa:

```bash
npm run dev:full
```

### Ejecución local más parecida a entrega

Usa:

```bash
npm run build
npm run start
```

En este modo:

- el frontend se sirve desde `dist/`,
- la API sigue estando en el mismo servidor Node,
- la generación continúa disponible.

## 8. API local disponible

La API vive en [server/index.mjs](</Front Limpieza/server/index.mjs>).

Rutas actuales:

- `GET /api/status`
  Estado del backend y Python detectado.
- `GET /api/data`
  Devuelve el JSON actual del dashboard.
- `POST /api/generate`
  Ejecuta el algoritmo y actualiza los datos.
- `GET /api/exports/:fileName`
  Descarga un Excel generado.

Payload esperado para `POST /api/generate`:

```json
{
  "hospital": "clinico",
  "year": 2026
}
```

Valores de `hospital` admitidos:

- `clinico`
- `gil`

## 9. Flujo interno de generación

Cuando pulsas `Generar con algoritmo` en la vista de cuadrante:

1. El frontend hace `POST /api/generate`.
2. [server/index.mjs](</Front Limpieza/server/index.mjs>) lanza Python.
3. Python ejecuta [generate_dashboard.py](</Front Limpieza/backend/generate_dashboard.py>).
4. Ese script carga la copia local de [ilunion.ipynb](</Front Limpieza/backend/assets/algorithm/ilunion.ipynb>).
5. Se reutiliza la lógica del solver contenida en el notebook.
6. Se genera el Excel anual del hospital seleccionado.
7. Se regenera el bloque correspondiente dentro de `dashboard-data.json`.
8. El frontend recarga los datos y refresca la vista.

Importante:

- La generación actual usa el notebook como fuente de verdad del algoritmo.
- Si cambia la estructura interna del notebook, puede ser necesario ajustar el wrapper Python.

## 10. Cómo funciona el dashboard

### Vista Inicio

Muestra:

- plantilla activa cargada,
- cobertura estimada,
- faltas de cobertura,
- desvío medio anual,
- accesos rápidos al resto de vistas.

### Vista Cuadrante

Permite:

- navegar por meses,
- buscar trabajadores,
- filtrar por categoría,
- filtrar por turno base,
- abrir el detalle de un trabajador,
- editar celdas una a una,
- ver un resumen de cobertura del mes,
- exportar el estado visible del mes a CSV,
- lanzar una nueva generación,
- descargar el Excel generado más reciente.

### Vista Cobertura

Permite:

- ver por día y categoría el asignado frente al mínimo,
- detectar déficits,
- comprobar el efecto inmediato de los cambios manuales,
- medir la cobertura mensual agregada.

### Vista Plantilla

Permite:

- buscar por nombre,
- buscar por plaza,
- buscar por observación,
- filtrar por categoría,
- abrir el detalle individual de la persona.

### Vista Cómputo anual

Permite:

- ver objetivo anual,
- ver horas asignadas,
- ver desvío,
- ordenar por nombre,
- ordenar por desvío,
- ordenar por porcentaje de cumplimiento.

## 11. Cómo se añaden trabajadores

Los trabajadores no se añaden desde la interfaz.  
Se añaden modificando el Excel base:

- [Listado de Trabajadores.xlsx](</Front Limpieza/backend/assets/inputs/Listado de Trabajadores.xlsx>)

### Columnas que el sistema espera

Como mínimo deben mantenerse correctamente estas columnas:

- `TRABAJADOR`
- `CENTRO`
- `TURNO`
- `PUESTO`
- `PLAZAS`
- `categoria`
- `HORAS/AÑO`
- `observaciones`

### Recomendación práctica

La forma más segura de añadir una persona es:

1. Duplicar una fila válida de un trabajador similar.
2. Cambiar sus datos.
3. Mantener intactos los nombres de las columnas.
4. Guardar el Excel.
5. Volver al dashboard.
6. Pulsar `Generar con algoritmo`.

### Reglas prácticas al cargar un nuevo trabajador

- `CENTRO` debe corresponder al hospital correcto.
- `TURNO` debe seguir el mismo formato que las filas ya existentes.
- `categoria` debe usar los mismos valores que ya conoce el algoritmo.
- `PLAZAS` y `PUESTO` deben mantenerse consistentes con el resto del Excel.
- `observaciones` debe escribirse en el mismo lenguaje operativo que ya usa el fichero.

Ejemplos de observaciones típicas que el algoritmo ya contempla a nivel operativo:

- `DE LUNES A VIERNES`
- `UN FIN DE SEMANA SÍ Y UNO NO`
- `UN FIN DE SEMANA SÍ Y DOS FINES DE SEMANA NO`
- `TRABAJAN UNA NOCHE SÍ Y UNA NOCHE NO`
- `15 DÍAS MAÑANA / 15 DÍAS TARDE`

## 12. Cómo cambiar las necesidades mínimas

Las presencias mínimas salen de:

- [PRESENCIAS.xlsx](</Front Limpieza/backend/assets/inputs/PRESENCIAS.xlsx>)

Si cambias ese Excel:

1. guarda el fichero,
2. vuelve a lanzar la generación,
3. la vista de cobertura se recalculará con esos nuevos mínimos.

## 13. Qué pasa con los cambios manuales

Esto es importante para operar bien el dashboard:

- Los cambios manuales del cuadrante se aplican en memoria dentro de la sesión actual.
- Esos cambios afectan inmediatamente a la vista de cobertura.
- Esos cambios no se escriben ahora mismo de vuelta al Excel anual ni al JSON base.
- Si recargas la página o regeneras, el cuadrante vuelve al estado generado por el algoritmo.
- Si quieres sacar una foto del estado visible tras tus cambios, usa `Exportar CSV`.

En otras palabras:

- `Generar con algoritmo` recalcula desde las fuentes base.
- `Exportar CSV` exporta el estado visible del mes con tus ediciones temporales.

## 14. Componentes principales

- [src/App.jsx](</Front Limpieza/src/App.jsx>)  
  Estado global, hospital activo, vista activa y recarga de datos.
- [src/views/ScheduleView.jsx](</Front Limpieza/src/views/ScheduleView.jsx>)  
  Cuadrante mensual, edición y generación.
- [src/views/CoverageView.jsx](</Front Limpieza/src/views/CoverageView.jsx>)  
  Cobertura diaria real frente a mínimos.
- [src/views/WorkersView.jsx](</Front Limpieza/src/views/WorkersView.jsx>)  
  Plantilla, observaciones y detalle de personas.
- [src/views/HoursView.jsx](</Front Limpieza/src/views/HoursView.jsx>)  
  Cómputo anual.
- [src/services/dataService.js](</Front Limpieza/src/services/dataService.js>)  
  Lectura y normalización de datos.
- [src/services/schedulerGateway.js](</Front Limpieza/src/services/schedulerGateway.js>)  
  Cliente de la API del generador.
- [backend/generate_dashboard.py](</Front Limpieza/backend/generate_dashboard.py>)  
  Wrapper Python que une notebook, Excel y dashboard.

## 15. Qué se usa realmente para ejecutar el sistema

Necesario para funcionamiento:

- `src/`
- `server/`
- `backend/`
- `public/`
- `package.json`
- `package-lock.json`
- `vite.config.js`
- `index.html`

Recreable o regenerable:

- `node_modules/`
- `backend/.venv/`
- `dist/`
- `generated/`

## 16. Limitaciones actuales

- El motor de generación sigue acoplado al notebook original.
- Las ediciones manuales no se persisten aún como nueva fuente de verdad.
- El dashboard está preparado para producto local, pero no para despliegue multiusuario ni concurrencia.
- El año operativo está fijado en la integración actual a `2026`.

## 17. Siguiente evolución natural

Los siguientes pasos técnicos más razonables son:

1. extraer el notebook a un módulo Python limpio,
2. persistir cambios manuales con un flujo controlado,
3. permitir configuración de año y fuentes desde la interfaz,
4. preparar empaquetado más estable para entrega a terceros.
