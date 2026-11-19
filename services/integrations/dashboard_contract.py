"""Integration Contract with Student 3: Shruti (Rural Business Growth Dashboard).

Defines the contract to connect sales, payments, and scheme benefits to
provide business suggestions without absorbing the dashboard module.
"""

from __future__ import annotations

from typing import Any


def generate_growth_dashboard_summary(
    profile: dict[str, Any],
    applications: list[dict[str, Any]],
    recommendations: list[dict[str, Any]],
) -> dict[str, Any]:
    """Aggregate business metrics, subsidy pipeline, and digital readiness for growth dashboard."""
    turnover = float(profile.get("annual_turnover") or 0)

    # Calculate potential unlocked subsidy
    potential_subsidy_inr = 0.0
    for r in recommendations:
        if r.get("eligibility_status") == "eligible":
            # 35% margin money on loans up to 25-50L
            potential_subsidy_inr = max(potential_subsidy_inr, min(turnover * 0.35, 875_000.0))

    # Digital readiness score (out of 100)
    readiness_factors = []
    score = 40  # baseline for registration
    if profile.get("registration_status"):
        score += 20
        readiness_factors.append("Business Registration (Udyam/Shop Act) Completed (+20)")
    if turnover > 0:
        score += 20
        readiness_factors.append("Recorded Financial Turnover History (+20)")
    if len(applications) > 0:
        score += 20
        readiness_factors.append("Active Scheme Application Plan Initiated (+20)")

    return {
        "business_name": profile.get("business_name") or "Rural Enterprise",
        "district": profile.get("district") or "Maharashtra",
        "annual_turnover_inr": turnover,
        "digital_readiness_score": min(100, score),
        "readiness_factors": readiness_factors,
        "potential_subsidy_inr": round(potential_subsidy_inr, 2),
        "active_applications_count": len(applications),
        "suggested_actions": [
            "Complete Udyam registration to unlock priority bank lending.",
            "List on ONDC or GeM to access government and nationwide buyer demand.",
            "Adopt Khatabook / Vyapar app for daily bookkeeping to build formal credit history.",
        ],
        "integrated_module": "Student 3 — Shruti (Rural Business Growth Dashboard)",
    }
