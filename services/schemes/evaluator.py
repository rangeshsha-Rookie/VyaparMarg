"""Deterministic Scheme Eligibility & Subsidy Scoring Engine."""

from __future__ import annotations

from typing import Any


def _normalise(value: Any) -> Any:
    return value.lower().strip() if isinstance(value, str) else value


def _matches(value: Any, operator: str, expected: Any) -> bool:
    value = _normalise(value)
    expected = [_normalise(item) for item in expected] if isinstance(expected, list) else _normalise(expected)
    if operator == "exists":
        return value is not None
    if value is None:
        return False
    if operator == "equals":
        return value == expected
    if operator == "not_equals":
        return value != expected
    if operator == "in":
        return value in expected
    if operator == "contains":
        return expected in value if isinstance(value, str) else expected in value
    if operator in {"gte", "lte"}:
        try:
            return value >= expected if operator == "gte" else value <= expected
        except TypeError:
            return False
    raise ValueError(f"Unsupported scheme rule operator: {operator}")


def calculate_subsidy_percentage(scheme_slug: str, profile: dict[str, Any]) -> float:
    """Calculate the exact financial subsidy percentage based on gender, location, and category."""
    is_rural = not profile.get("is_urban", False)
    gender = str(profile.get("gender", "")).lower()
    category = str(profile.get("category", "")).lower()
    is_special_category = (
        gender == "female"
        or category in {"sc", "st", "obc", "minority", "ph"}
        or is_rural
    )

    if scheme_slug in {"pmegp", "cmegp-mah"}:
        # Rural / Special Category receives 35%, Urban General receives 15-25%
        return 35.0 if (is_special_category and is_rural) else (25.0 if is_rural else 15.0)
    elif scheme_slug == "pmsvanidhi":
        return 7.0  # 7% interest subsidy
    elif scheme_slug == "mahadbt-agro-processing":
        return 50.0 if (gender == "female" or category in {"sc", "st"}) else 40.0
    return 20.0


def evaluate_scheme_advanced(
    scheme: dict[str, Any],
    profile: dict[str, Any],
    district_clusters: list[dict[str, Any]] | None = None
) -> dict[str, Any]:
    """Evaluate scheme eligibility with strict rule matching and district cluster contextual scoring."""
    rules = sorted(scheme.get("rules", []), key=lambda r: r.get("priority", 100))
    requirements = scheme.get("requirements", [])

    missing = [
        req["requirement_key"]
        for req in requirements
        if req.get("required") and profile.get(req["requirement_key"]) in (None, "")
    ]
    reasons: list[str] = []
    failed = False
    matched = 0

    for rule in rules:
        key = rule["rule_key"]
        val = profile.get(key)
        if val is None:
            if key not in missing:
                missing.append(key)
            continue
        if _matches(val, rule["operator"], rule["expected_value"]):
            matched += 1
            reasons.append(rule["explanation"])
        else:
            failed = True
            reasons.append(f"Does not match: {rule['explanation']}")

    if failed:
        status = "ineligible"
    elif missing:
        status = "needs_information"
    else:
        status = "eligible"

    base_score = round(matched / len(rules), 2) if rules else 0.5

    # Check for cluster bonus in entrepreneur's district
    district = profile.get("district")
    biz_type = str(profile.get("business_type", "")).lower()
    cluster_boost = False
    cluster_name = None

    if district and district_clusters:
        for c in district_clusters:
            c_dist = c.get("district", "")
            c_val = str(c.get("indicator_value", "")).lower()
            if c_dist.lower() == str(district).lower() and any(k in c_val for k in [biz_type, "agro", "jaggery", "dairy"]):
                cluster_boost = True
                cluster_name = c.get("cluster_name")
                break

    if cluster_boost and status == "eligible":
        reasons.append(f"District Cluster Priority: Approved '{cluster_name}' identified in {district}.")
        base_score = min(1.0, round(base_score + 0.15, 2))

    subsidy_rate = calculate_subsidy_percentage(scheme.get("slug", ""), profile)

    return {
        "eligibility_status": status,
        "score": base_score,
        "reasons": reasons,
        "missing_requirements": missing,
        "subsidy_percentage": subsidy_rate,
        "cluster_match": cluster_name,
    }
