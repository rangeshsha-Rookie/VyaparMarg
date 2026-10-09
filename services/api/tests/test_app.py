from types import SimpleNamespace
from datetime import datetime, timezone
from uuid import UUID, uuid4

from fastapi.testclient import TestClient

from services.api.app.auth import AuthenticatedUser, get_current_user
from services.api.app.dependencies import get_supabase_client
from services.api.app.main import app


client = TestClient(app)


def test_health() -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "vyaparmarg-api",
        "version": "0.1.0",
    }


def test_business_profile_requires_bearer_auth() -> None:
    response = client.post(
        "/api/v1/business-profiles",
        json={
            "business_name": "Shree Dairy",
            "business_type": "dairy",
            "state": "Maharashtra",
            "district": "Thane",
        },
    )
    assert response.status_code == 401


class FakeBusinessProfileQuery:
    def __init__(self) -> None:
        self.inserted: dict | None = None

    def insert(self, row: dict) -> "FakeBusinessProfileQuery":
        self.inserted = row
        return self

    def select(self, _columns: str) -> "FakeBusinessProfileQuery":
        return self

    def execute(self) -> SimpleNamespace:
        assert self.inserted is not None
        return SimpleNamespace(
            data=[
                {
                    "id": str(uuid4()),
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                    **self.inserted,
                }
            ]
        )


class FakeSupabaseClient:
    def __init__(self) -> None:
        self.query = FakeBusinessProfileQuery()

    def table(self, _table_name: str) -> FakeBusinessProfileQuery:
        return self.query


def test_create_business_profile_persists_for_authenticated_user() -> None:
    user_id = UUID("00000000-0000-0000-0000-000000000123")
    fake_client = FakeSupabaseClient()
    app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(
        id=user_id,
        access_token="test-token",
    )
    app.dependency_overrides[get_supabase_client] = lambda: fake_client

    try:
        response = client.post(
            "/api/v1/business-profiles",
            json={
                "business_name": "Shree Dairy",
                "business_type": "dairy",
                "state": "Maharashtra",
                "district": "Thane",
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 201
    assert response.json()["business_type"] == "dairy"
    assert fake_client.query.inserted is not None
    assert fake_client.query.inserted["user_id"] == str(user_id)


def test_assistant_requires_bearer_auth() -> None:
    response = client.post(
        "/api/v1/assistant/messages",
        json={
            "business_profile_id": "00000000-0000-0000-0000-000000000001",
            "message": "mala dairy business expand karaycha aahe",
            "language": "mr",
        },
    )
    assert response.status_code == 401
