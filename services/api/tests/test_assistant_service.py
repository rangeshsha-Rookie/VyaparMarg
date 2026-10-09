from services.api.app.assistant_service import build_assistant_text


def test_assistant_text_reports_eligible_schemes() -> None:
    result = build_assistant_text(
        [
            {"scheme": {"name": "PMEGP"}, "eligibility_status": "eligible"},
            {"scheme": {"name": "PMFME"}, "eligibility_status": "ineligible"},
        ]
    )
    assert result == "Based on your business profile, these schemes may fit: PMEGP."


def test_assistant_text_reports_missing_information() -> None:
    result = build_assistant_text(
        [{"scheme": {"name": "PMFME"}, "eligibility_status": "needs_information"}]
    )
    assert result == "I need more information before confirming eligibility for: PMFME."
