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


def evaluate_scheme(scheme: dict[str, Any], profile: dict[str, Any]) -> dict[str, Any]:
    rules = sorted(scheme.get("rules", []), key=lambda rule: rule.get("priority", 100))
    requirements = scheme.get("requirements", [])
    missing = [
        requirement["requirement_key"]
        for requirement in requirements
        if requirement.get("required") and profile.get(requirement["requirement_key"]) in (None, "")
    ]
    reasons: list[str] = []
    failed = False
    matched = 0

    for rule in rules:
        key = rule["rule_key"]
        value = profile.get(key)
        if value is None:
            if key not in missing:
                missing.append(key)
            continue
        if _matches(value, rule["operator"], rule["expected_value"]):
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

    return {
        "eligibility_status": status,
        "score": round(matched / len(rules), 2) if rules else 0.5,
        "reasons": reasons,
        "missing_requirements": missing,
    }
