"""Application configuration, loaded from the environment."""
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    """Runtime settings. Every value can be overridden by an env var."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Fireflies Clone API"
    api_prefix: str = "/api"

    # SQLite lives beside the backend package by default so a fresh clone runs
    # with zero configuration.
    database_url: str = f"sqlite:///{BASE_DIR / 'fireflies.db'}"

    # Comma-separated list of allowed browser origins.
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    # Seed the database on first boot when it is empty.
    auto_seed: bool = True

    # Optional LLM summarisation. When no key is present the deterministic
    # extractive summariser is used instead, so the app never hard-depends on a
    # third-party service.
    anthropic_api_key: str | None = None
    anthropic_model: str = "claude-sonnet-5"

    max_upload_bytes: int = 5 * 1024 * 1024

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
