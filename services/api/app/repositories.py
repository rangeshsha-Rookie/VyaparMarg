from __future__ import annotations

from typing import Any
from uuid import UUID


def _first_row(response: Any, missing_message: str) -> dict[str, Any]:
    data = response.data or []
    row = data[0] if isinstance(data, list) else data
    if not row:
        raise LookupError(missing_message)
    return row


def list_business_profiles(client: Any, user_id: UUID) -> list[dict[str, Any]]:
    response = (
        client.table("business_profiles")
        .select("*")
        .eq("user_id", str(user_id))
        .order("created_at")
        .execute()
    )
    return response.data or []


def create_business_profile(
    client: Any, user_id: UUID, payload: dict[str, Any]
) -> dict[str, Any]:
    row = {**payload, "user_id": str(user_id)}
    response = client.table("business_profiles").insert(row).select("*").execute()
    try:
        return _first_row(response, "Supabase did not return the created business profile")
    except LookupError as exc:
        raise RuntimeError(str(exc)) from exc


def update_business_profile(
    client: Any, user_id: UUID, profile_id: UUID, payload: dict[str, Any]
) -> dict[str, Any]:
    response = (
        client.table("business_profiles")
        .update(payload)
        .eq("id", str(profile_id))
        .eq("user_id", str(user_id))
        .select("*")
        .execute()
    )
    return _first_row(response, "Business profile not found")


def list_applications(client: Any, user_id: UUID) -> list[dict[str, Any]]:
    response = (
        client.table("applications")
        .select("*")
        .eq("user_id", str(user_id))
        .order("created_at", desc=True)
        .execute()
    )
    return response.data or []


def create_application(
    client: Any, user_id: UUID, business_profile_id: UUID, scheme_id: UUID
) -> dict[str, Any]:
    profile = (
        client.table("business_profiles")
        .select("id")
        .eq("id", str(business_profile_id))
        .eq("user_id", str(user_id))
        .execute()
    )
    if not profile.data:
        raise LookupError("Business profile not found")

    scheme = (
        client.table("schemes")
        .select("official_portal_url")
        .eq("id", str(scheme_id))
        .eq("active", True)
        .execute()
    )
    scheme_row = _first_row(scheme, "Scheme not found")
    response = client.table("applications").insert(
        {
            "user_id": str(user_id),
            "business_profile_id": str(business_profile_id),
            "scheme_id": str(scheme_id),
            "portal_url": scheme_row["official_portal_url"],
        }
    ).select("*").execute()
    return _first_row(response, "Supabase did not return the created application")


def update_application(
    client: Any, user_id: UUID, application_id: UUID, payload: dict[str, Any]
) -> dict[str, Any]:
    response = (
        client.table("applications")
        .update(payload)
        .eq("id", str(application_id))
        .eq("user_id", str(user_id))
        .select("*")
        .execute()
    )
    return _first_row(response, "Application not found")
