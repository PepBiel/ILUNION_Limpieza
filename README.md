# ILUNION Limpieza

Repositorio del dashboard local y backend de generación de cuadrantes para el servicio de limpieza hospitalaria.

## Contexto del proyecto

Este proyecto nace de un reto planteado dentro de un concurso organizado por `Hunger4Innovation` para `ILUNION`.

El objetivo del reto era abordar un problema real de planificación operativa en el servicio de limpieza hospitalaria de Santiago de Compostela. En concreto, el caso se centraba en la construcción y gestión de los cuadrantes de trabajo de dos centros:

- `Hospital Clínico`
- `Hospital Gil Casares`

La dificultad del reto no estaba solo en mostrar un calendario, sino en automatizar una planificación compleja con muchas restricciones reales de negocio.

## En qué consistía el reto

El reto consistía en ayudar a generar y gestionar los calendarios de los trabajadores de limpieza teniendo en cuenta, entre otros factores:

- turnos de mañana, tarde, noche y descanso,
- jornada anual objetivo por trabajador,
- coberturas mínimas por hospital, categoría y turno,
- observaciones individuales y restricciones específicas,
- rotaciones y descansos,
- cambios diarios provocados por bajas, permisos, sustituciones o incidencias,
- necesidad de mantener edición manual por parte de la persona encargada del servicio.

En la práctica, el problema combinaba dos necesidades:

1. Generar cuadrantes de forma automática con un algoritmo.
2. Permitir revisarlos y ajustarlos de forma visual desde una interfaz operativa.

## Qué resuelve este repositorio

La parte operativa del proyecto ya es autocontenida dentro de:

- [Front Limpieza](</Front Limpieza>)

Esa carpeta incluye:

- frontend React + Vite,
- API local en Node,
- integración Python con el algoritmo,
- ficheros base de entrada,
- datos consumidos por el dashboard,
- Exceles generados.

Actualmente el repositorio cubre estas dos piezas:

1. `Dashboard`
   Permite visualizar el cuadrante, revisar cobertura, consultar plantilla, observar restricciones y editar turnos manualmente.
2. `Backend local de generación`
   Permite ejecutar el algoritmo, regenerar los cuadrantes y actualizar los datos que consume el dashboard.

## Estado actual

El proyecto está preparado para funcionar en local como una herramienta operativa autocontenida.

El flujo actual permite:

- arrancar el dashboard en local,
- generar cuadrantes desde la interfaz,
- visualizar los datos por hospital,
- consultar cobertura, plantilla y cómputo anual,
- descargar los Exceles generados.

## Carpeta principal que debes conservar

Si quieres dejar el repositorio limpio para uso real, la carpeta importante es:

- [Front Limpieza](</Front Limpieza>)

Dentro de ella están:

- [README.md](</Front Limpieza/README.md>)
  Manual completo de uso, arquitectura, entradas, salidas y flujo interno.
- [server](</Front Limpieza/server>)
  Backend Node que expone la API local.
- [backend](</Front Limpieza/backend>)
  Wrapper Python del algoritmo y assets base.
- [src](</Front Limpieza/src>)
  Dashboard.

## Cómo arrancarlo

Desde `Front Limpieza`:

```bash
npm install
npm run setup:backend
npm run dev:full
```

Entornos:

- frontend: `http://127.0.0.1:5173`
- API local: `http://127.0.0.1:8787`

## Autores

Proyecto desarrollado por **Jorge Elías García**, **Sara Fernández Malvido**, **Jordi Florit Ensenyat** y **Josep Gabriel Fornes Reynes**.
