# ILUNION Limpieza

Repositorio del dashboard local y backend de generacion de cuadrantes para el servicio de limpieza hospitalaria.

## Estado actual

La parte operativa del proyecto ya es autocontenida dentro de:

- [Front Limpieza](</C:/Users/Pep Biel/Documents/GitHub/ILUNION_Limpieza/Front Limpieza>)

Esa carpeta incluye:

- frontend React + Vite,
- API local en Node,
- integracion Python con el algoritmo,
- ficheros base de entrada,
- datos consumidos por el dashboard,
- Excel generados.

## Carpeta principal que debes conservar

Si quieres dejar el repositorio limpio para uso real, la carpeta importante es:

- [Front Limpieza](</C:/Users/Pep Biel/Documents/GitHub/ILUNION_Limpieza/Front Limpieza>)

Dentro de ella estan:

- [README.md](</C:/Users/Pep Biel/Documents/GitHub/ILUNION_Limpieza/Front Limpieza/README.md>)
  Manual completo de uso, arquitectura, entradas, salidas y flujo interno.
- [server](</C:/Users/Pep Biel/Documents/GitHub/ILUNION_Limpieza/Front Limpieza/server>)
  Backend Node que expone la API local.
- [backend](</C:/Users/Pep Biel/Documents/GitHub/ILUNION_Limpieza/Front Limpieza/backend>)
  Wrapper Python del algoritmo y assets base.
- [src](</C:/Users/Pep Biel/Documents/GitHub/ILUNION_Limpieza/Front Limpieza/src>)
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

## Que se puede borrar de la raiz

Ahora mismo no son necesarios para ejecutar el sistema:

- `1. Santiago - Limpieza/`
- `__MACOSX/`
- `ilunion.ipynb`
- `.idea/` si no quieres archivos del IDE

El motivo es que el proyecto ya usa sus propias copias internas en:

- `Front Limpieza/backend/assets/algorithm/`
- `Front Limpieza/backend/assets/inputs/`

## Nota

Si quieres dejar el repositorio minimo, el siguiente paso natural es borrar esas carpetas historicas y quedarte solo con `Front Limpieza` y este `README.md`.
