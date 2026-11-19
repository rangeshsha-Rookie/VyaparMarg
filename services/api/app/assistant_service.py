from __future__ import annotations

from typing import Any
from services.ai.assistant_llm import generate_assistant_response


def build_assistant_text(recommendations: list[dict[str, Any]]) -> str:
    """Standard English assistant response builder (backward compatible)."""
    eligible = [
        item["scheme"]["name"]
        for item in recommendations
        if item.get("eligibility_status") == "eligible"
    ]
    needs_information = [
        item["scheme"]["name"]
        for item in recommendations
        if item.get("eligibility_status") == "needs_information"
    ]
    if eligible:
        return "Based on your business profile, these schemes may fit: " + ", ".join(eligible) + "."
    if needs_information:
        return "I need more information before confirming eligibility for: " + ", ".join(needs_information) + "."
    return "I did not find a matching scheme in the current verified catalog."


def build_multilingual_assistant_text(
    recommendations: list[dict[str, Any]],
    language: str,
    extracted_profile: dict[str, Any] | None = None,
    query_text: str = "",
) -> str:
    """Generate culturally nuanced, multilingual assistant response for Marathi, Hindi, English."""
    if language in {"mr", "marathi", "hi", "hindi"}:
        return generate_assistant_response(
            query_text=query_text,
            language=language,
            recommendations=recommendations,
            extracted_profile=extracted_profile or {},
        )
    return build_assistant_text(recommendations)
