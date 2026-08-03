from fastapi import FastAPI

app = FastAPI(title="Chronos API")


@app.get("/health")
def health():
    return {"status": "ok"}
