# ILUNION Limpieza

Repositorio del dashboard local y backend de generacion de cuadrantes para el servicio de limpieza hospitalaria.

## Estado actual

La parte operativa del proyecto ya es autocontenida dentro de:

- [Front Limpieza](</Front Limpieza>)

Esa carpeta incluye:

- frontend React + Vite,
- API local en Node,
- integracion Python con el algoritmo,
- ficheros base de entrada,
- datos consumidos por el dashboard,
- Excel generados.

## Carpeta principal que debes conservar

Si quieres dejar el repositorio limpio para uso real, la carpeta importante es:

- [Front Limpieza](</Front Limpieza>)

Dentro de ella estan:

- [README.md](</Front Limpieza/README.md>)
  Manual completo de uso, arquitectura, entradas, salidas y flujo interno.
- [server](</Front Limpieza/server>)
  Backend Node que expone la API local.
- [backend](</Front Limpieza/backend>)
  Wrapper Python del algoritmo y assets base.
- [src](</Front Limpieza/src>)
  Dashboard.

## Como arrancarlo

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
