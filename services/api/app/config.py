from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache

from dotenv import load_dotenv
from supabase import Client, create_client


load_dotenv()


@dataclass(frozen=True)
class Settings:
    supabase_url: str | None
    supabase_publishable_key: str | None

    @property
    def supabase_configured(self) -> bool:
        return bool(self.supabase_url and self.supabase_publishable_key)


@lru_cache
def get_settings() -> Settings:
    return Settings(
        supabase_url=os.getenv("SUPABASE_URL"),
        supabase_publishable_key=(
            os.getenv("SUPABASE_PUBLISHABLE_KEY")
            or os.getenv("SUPABASE_ANON_KEY")
        ),
    )


def create_user_client(access_token: str) -> Client:
    settings = get_settings()
    if not settings.supabase_configured:
        raise RuntimeError("Supabase environment variables are not configured")

    client = create_client(settings.supabase_url, settings.supabase_publishable_key)
    client.postgrest.auth(access_token)
    return client
