# Chronos

A web app to help students at Universidad Nacional de Colombia, Sede Medellín,
build their class schedule.

The university doesn't expose a public API for course/schedule data, so this
project includes a scraper that extracts it from the SIA portal (Catálogo de
Asignaturas), covering all three study levels offered: Pregrado, Doctorado,
and Postgrados y másteres.

## Stack

- **Backend**: FastAPI + PostgreSQL
- **Frontend**: React + Vite + TypeScript
- **Scraper**: Python + Playwright

## Project structure

```
backend/   FastAPI application
frontend/  React application
scraper/   Playwright-based scraper for the SIA course catalog
```

## Status

Early stage — the scraper's cascading-form navigation is validated; the API,
database schema, and frontend are not yet built.

## License

MIT
