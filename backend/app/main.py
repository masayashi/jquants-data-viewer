from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import compare, financials, indices, sectors, stocks

app = FastAPI(
    title="J-Quants Viewer API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(stocks.router, prefix="/v1")
app.include_router(sectors.router, prefix="/v1")
app.include_router(compare.router, prefix="/v1")
app.include_router(financials.router, prefix="/v1")
app.include_router(indices.router, prefix="/v1")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
