from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Parquet data root — defaults to ../data relative to repo root
    data_root: Path = Path(__file__).parent.parent.parent / "data"

    # CORS origins allowed in development
    cors_origins: list[str] = ["http://localhost:5173"]

    model_config = {"env_prefix": "JQUANTS_"}


settings = Settings()
