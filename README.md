# Chronos

Una aplicación web para ayudar a los estudiantes de la Universidad Nacional de
Colombia, Sede Medellín, a armar su horario de clases.

La universidad no expone una API pública para los datos de cursos/horarios,
así que este proyecto incluye un scraper que los extrae del portal SIA
(Catálogo de Asignaturas), cubriendo los tres niveles de estudio ofrecidos:
Pregrado, Doctorado, y Postgrados y másteres.

## Stack

- **Backend**: FastAPI + PostgreSQL
- **Frontend**: React + Vite + TypeScript
- **Scraper**: Python + Playwright

## Estructura del proyecto

```
backend/   Aplicación FastAPI
frontend/  Aplicación React
scraper/   Scraper con Playwright para el catálogo de asignaturas del SIA
```

## Estado

Etapa temprana — la navegación del formulario en cascada del scraper ya está
validada; la API, el esquema de base de datos y el frontend aún no están
construidos.

## Licencia

MIT
