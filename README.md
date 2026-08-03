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

```text
shared/    Modelos de datos (SQLModel), compartidos por backend y scraper
alembic/   Migraciones de base de datos
backend/   Aplicación FastAPI
frontend/  Aplicación React
scraper/   Scraper con Playwright para el catálogo de asignaturas del SIA
```

## Estado

Etapa temprana. Ya funciona de punta a punta para un plan de estudios:
scraping con Playwright, parseo de asignaturas y grupos/horarios, y
persistencia en Postgres con el esquema versionado por Alembic. Falta
recorrer automáticamente todas las facultades/planes, y construir la API y
el frontend.

## Cómo correrlo

```bash
cp .env.example .env
docker compose up -d db
docker compose run --rm backend alembic upgrade head
docker compose up backend frontend
```

Para correr el scraper (apunta a un plan de estudios fijo por ahora, ver
`scraper/scrape.py`):

```bash
docker compose --profile scraper run --rm scraper
```

## Licencia

MIT
