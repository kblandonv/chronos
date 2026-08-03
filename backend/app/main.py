from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import FRONTEND_ORIGIN
from app.routers import catalogo, horario

app = FastAPI(title="Chronos API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(catalogo.router)
app.include_router(horario.router)


@app.get("/health")
def health():
    return {"status": "ok"}
