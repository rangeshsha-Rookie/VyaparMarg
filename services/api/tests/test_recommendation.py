from services.api.app.recommendation import evaluate_scheme


def _scheme(operator: str = "in") -> dict:
    return {
        "rules": [
            {
                "rule_key": "business_type",
                "operator": operator,
                "expected_value": ["dairy", "food_processing"],
                "explanation": "The activity matches the starter catalog.",
                "priority": 10,
            }
        ],
        "requirements": [
            {
                "requirement_key": "state",
                "required": True,
            }
        ],
    }


def test_matching_profile_is_eligible() -> None:
    result = evaluate_scheme(
        _scheme(),
        {"business_type": "Dairy", "state": "Maharashtra"},
    )
    assert result["eligibility_status"] == "eligible"
    assert result["score"] == 1.0
    assert result["missing_requirements"] == []


def test_missing_required_profile_data_needs_information() -> None:
    result = evaluate_scheme(_scheme(), {"business_type": "dairy"})
    assert result["eligibility_status"] == "needs_information"
    assert result["missing_requirements"] == ["state"]


def test_non_matching_profile_is_ineligible() -> None:
    result = evaluate_scheme(
        _scheme(),
        {"business_type": "retail", "state": "Maharashtra"},
    )
    assert result["eligibility_status"] == "ineligible"
    assert result["score"] == 0.0
