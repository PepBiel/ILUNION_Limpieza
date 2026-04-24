# Reglas del dominio

Resumen funcional consolidado dentro del propio proyecto.

## Alcance operativo

- Servicio de limpieza hospitalaria para dos centros:
  `Hospital Clinico` y `Hospital Gil Casares`.
- Plantilla fija total indicada en el reto:
  216 personas.
- Categorias operativas principales:
  `LIMPIADOR` y `PEON`.

## Tipos de planificacion

- Cuadrante anual:
  base de rotaciones y jornadas.
- Cuadrante mensual:
  detalle diario por trabajador.
- Planillas diarias:
  ajustes ante bajas, permisos, sustituciones y urgencias.

## Restricciones declaradas

- Cumplimiento del convenio y normativa laboral.
- Jornada anual por trabajador.
- Descansos y limites de turnos.
- Coberturas minimas por categoria y turno.
- Variabilidad diaria alta:
  alrededor del 30% del cuadrante puede cambiar en un dia.
- Necesidad de mantener edicion manual para encargados del servicio.

## Turnos e incidencias

- Turnos:
  `M`, `T`, `N`, `D`.
- Incidencias mencionadas:
  `PS`, `PF`, `A`, `RJ`, `PSS`, `E`, `B`, `PR`, `L`, `AV`, `V26`, `V25`, `V24`.
- Computo de horas segun el reto:
  suman 7 horas `M`, `T`, `N`, `PF`, `B`, `PS`, `L`, `PR`.
- Observacion operativa del reto:
  el turno `N` se describe como jornada de 10 horas.
  Esto debe revisarse con el algoritmo antes de automatizar el computo final para evitar inconsistencias entre fuente funcional y fuente tecnica.

## Cobertura

- Las presencias minimas vienen del Excel `backend/assets/inputs/PRESENCIAS.xlsx`.
- Cambian por:
  hospital,
  dia de la semana,
  festivo,
  categoria,
  turno.
- Ejemplo del Clinico:
  lunes-viernes con necesidades muy superiores a fin de semana y festivos.

## Observaciones individuales importantes

- Fines de semana alternos.
- Festivos alternos.
- Noche si / noche no.
- Correturnos.
- Puestos con plaza concreta.
- Cristaleros de lunes a viernes.
- Encargadas fuera de cuadrante.

## Consecuencia para el frontend

El dashboard no debe asumir reglas simplificadas.
Debe ser capaz de:

- visualizar cobertura minima real,
- reflejar incidencias y ajustes manuales,
- mostrar observaciones por trabajador,
- y dejar un punto de entrada claro para el generador automatico.
