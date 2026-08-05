# Chronos

Una aplicación web para ayudar a los estudiantes de la Universidad Nacional
de Colombia a armar su horario de clases.

**La app está en línea: [chronosun.app](https://chronosun.app)** — no
necesitas instalar nada para usarla.

La universidad no expone una API pública para los datos de cursos/horarios,
así que este proyecto incluye un scraper que los extrae del portal SIA
(Catálogo de Asignaturas), cubriendo las nueve sedes y los tres niveles de
estudio que ofrece: Pregrado, Doctorado, y Postgrados y másteres.

**Este es un proyecto de código abierto y se aceptan contribuciones.** Si
quieres ayudar, revisa la sección [Contribuir](#contribuir) más abajo.

## Funcionalidades

- **Explorar el catálogo**: sede → nivel de estudio → facultad → plan de
  estudios → asignaturas → grupos (horario, aula, profesor, cupos), con
  buscador por nombre.
- **Armar tu horario**: agrega grupos y Chronos avisa si hay cruce de
  horario con algo que ya tengas, con una vista previa del calendario antes
  de confirmar.
- **Mi perfil**: guarda el/los plan(es) de estudio en los que estás
  (pregrado, posgrado, o ambos), distinguiendo el plan nuevo del viejo
  cuando el programa tiene los dos.
- **Mi historia académica**: pega el contenido de tu Historia Académica del
  SIA (Select All + copiar) y Chronos te muestra tu avance, promedio,
  P.A.P.A y créditos por tipología, con un gráfico de progreso.
- **Registro opcional**: toda la app funciona sin cuenta (los datos quedan
  en tu navegador). Iniciar sesión con Auth0 es solo para no perderlos y
  tenerlos en cualquier dispositivo.

## Stack

- **Backend**: FastAPI + PostgreSQL + Alembic
- **Frontend**: React + Vite + TypeScript + Tailwind CSS + Auth0
- **Scraper**: Python + Playwright
- **Despliegue**: Render (backend) + Cloudflare (frontend) + Neon
  (PostgreSQL) — todo en capas gratuitas.

## Estructura del proyecto

```text
shared/              Modelos de datos (SQLModel), compartidos por backend y scraper
alembic/             Migraciones de base de datos
backend/             Aplicación FastAPI
frontend/            Aplicación React
scraper/             Scraper con Playwright para el catálogo de asignaturas del SIA
.github/workflows/   CI (GitHub Actions)
```

## Cómo correrlo

```bash
cp .env.example .env
docker compose up -d db
docker compose run --rm backend alembic upgrade head
docker compose up backend frontend
```

Para correr el scraper completo (recorre todas las facultades y planes de
las tres niveles de estudio; ver `scraper/crawl.py`):

```bash
docker compose --profile scraper run --rm scraper
```

El login usa Auth0 — necesitas tu propio tenant configurado (ver
`CLAUDE.md` para los detalles de configuración si estás desarrollando
localmente).

## Tests

```bash
# backend
cd backend && pytest

# frontend
cd frontend && npm run test
```

Son tests enfocados en la lógica más delicada: el parser de la historia
académica y la detección de cruces de horario. El CI corre esto en cada
push, junto con lint y build.

## Contribuir

Las contribuciones son bienvenidas: reportar bugs, proponer mejoras, o
mandar un pull request directamente. Todavía no hay una guía formal de
contribución, así que por ahora:

1. Abre un issue si encuentras un bug o quieres proponer un cambio grande
   antes de ponerte a programar.
2. Para cambios chicos, un pull request directo está bien.
3. El proyecto vive en la rama `dev`; los PRs deberían apuntar ahí.

## Licencia

MIT — libre para usar, modificar y distribuir.
