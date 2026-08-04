from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import FRONTEND_ORIGINS
from app.routers import catalogo, historia, horario, perfil

app = FastAPI(title="Chronos API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(catalogo.router)
app.include_router(horario.router)
app.include_router(perfil.router)
app.include_router(historia.router)


@app.get("/health")
def health():
    return {"status": "ok"}
