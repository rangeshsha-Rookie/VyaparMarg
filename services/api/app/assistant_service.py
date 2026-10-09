from __future__ import annotations

from typing import Any


def build_assistant_text(recommendations: list[dict[str, Any]]) -> str:
    eligible = [
        item["scheme"]["name"]
        for item in recommendations
        if item["eligibility_status"] == "eligible"
    ]
    needs_information = [
        item["scheme"]["name"]
        for item in recommendations
        if item["eligibility_status"] == "needs_information"
    ]
    if eligible:
        return "Based on your business profile, these schemes may fit: " + ", ".join(eligible) + "."
    if needs_information:
        return "I need more information before confirming eligibility for: " + ", ".join(needs_information) + "."
    return "I did not find a matching scheme in the current verified catalog."
