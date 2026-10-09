from __future__ import annotations

from typing import Any
from uuid import UUID

from .recommendation import evaluate_scheme


def _rows(response: Any) -> list[dict[str, Any]]:
    return response.data or []


def _load_scheme_parts(client: Any, schemes: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if not schemes:
        return []
    scheme_ids = [scheme["id"] for scheme in schemes]
    requirements = _rows(
        client.table("scheme_requirements").select("*").in_("scheme_id", scheme_ids).execute()
    )
    rules = _rows(client.table("scheme_rules").select("*").in_("scheme_id", scheme_ids).execute())
    requirements_by_scheme: dict[str, list[dict[str, Any]]] = {}
    rules_by_scheme: dict[str, list[dict[str, Any]]] = {}
    for requirement in requirements:
        requirements_by_scheme.setdefault(requirement["scheme_id"], []).append(requirement)
    for rule in rules:
        rules_by_scheme.setdefault(rule["scheme_id"], []).append(rule)
    for scheme in schemes:
        scheme["requirements"] = requirements_by_scheme.get(scheme["id"], [])
        scheme["rules"] = rules_by_scheme.get(scheme["id"], [])
    return schemes


def list_active_schemes(client: Any) -> list[dict[str, Any]]:
    schemes = _rows(client.table("schemes").select("*").eq("active", True).order("name").execute())
    return _load_scheme_parts(client, schemes)


def get_active_scheme(client: Any, slug: str) -> dict[str, Any] | None:
    response = client.table("schemes").select("*").eq("slug", slug).eq("active", True).execute()
    schemes = _load_scheme_parts(client, _rows(response)[:1])
    return schemes[0] if schemes else None


def recommend_schemes(
    client: Any, profile_id: UUID, user_id: UUID
) -> list[dict[str, Any]]:
    profile_response = (
        client.table("business_profiles")
        .select("*")
        .eq("id", str(profile_id))
        .eq("user_id", str(user_id))
        .execute()
    )
    profiles = _rows(profile_response)
    if not profiles:
        raise LookupError("Business profile not found")
    profile = profiles[0]
    schemes = list_active_schemes(client)
    ranked = []
    for scheme in schemes:
        result = evaluate_scheme(scheme, profile)
        ranked.append({"scheme_id": scheme["id"], "scheme": scheme, **result})
    order = {"eligible": 0, "needs_information": 1, "ineligible": 2}
    ranked.sort(key=lambda item: (order[item["eligibility_status"]], -item["score"], item["scheme"]["name"]))
    for rank, item in enumerate(ranked, start=1):
        item["rank"] = rank
    return ranked
