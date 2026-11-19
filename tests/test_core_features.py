from uuid import UUID, uuid4
from fastapi.testclient import TestClient

from services.api.app.auth import AuthenticatedUser, get_current_user
from services.api.app.main import app
from services.schemes.evaluator import evaluate_scheme_advanced, calculate_subsidy_percentage
from services.documents.checklist_engine import generate_document_checklist
from services.marketplaces.recommender import (
    recommend_marketplaces_for_profile,
    recommend_digital_tools_for_profile,
)
from services.ai.profile_extractor import extract_profile_from_text, extract_turnover_inr
from services.ai.assistant_llm import generate_assistant_response
from services.portals.portal_service import get_portal_guide, list_portal_guides
from services.integrations.logistics_contract import calculate_logistics_quote
from services.integrations.dashboard_contract import generate_growth_dashboard_summary

client = TestClient(app)


def test_calculate_subsidy_percentage_rules() -> None:
    # Rural Woman in Maharashtra on PMEGP receives 35%
    p1 = {"gender": "female", "is_urban": False, "category": "General"}
    assert calculate_subsidy_percentage("pmegp", p1) == 35.0

    # Urban General Male receives 15%
    p2 = {"gender": "male", "is_urban": True, "category": "General"}
    assert calculate_subsidy_percentage("pmegp", p2) == 15.0

    # PM SVANidhi has 7% interest subsidy
    assert calculate_subsidy_percentage("pmsvanidhi", p2) == 7.0


def test_evaluate_scheme_advanced_with_cluster_bonus() -> None:
    scheme = {
        "slug": "cmegp-mah",
        "rules": [
            {
                "rule_key": "business_type",
                "operator": "in",
                "expected_value": ["dairy", "food_processing"],
                "explanation": "Valid activity",
            }
        ],
        "requirements": [{"requirement_key": "business_type", "required": True}],
    }
    profile = {
        "business_type": "dairy",
        "district": "Osmanabad",
        "gender": "female",
        "is_urban": False,
    }
    clusters = [
        {
            "district": "Osmanabad",
            "indicator_value": "Khawa (Dairy Product) Cluster",
            "cluster_name": "Khawa Dairy Cluster",
        }
    ]
    res = evaluate_scheme_advanced(scheme, profile, clusters)
    assert res["eligibility_status"] == "eligible"
    assert res["subsidy_percentage"] == 35.0
    assert res["cluster_match"] == "Khawa Dairy Cluster"
    assert any("District Cluster Priority" in r for r in res["reasons"])


def test_document_checklist_generation() -> None:
    profile = {"business_type": "agro_processing", "category": "OBC"}
    checklist = generate_document_checklist("cmegp-mah", profile)
    keys = [item["key"] for item in checklist]

    # Required base documents
    assert "aadhaar" in keys
    assert "pan" in keys
    assert "udyam" in keys
    assert "domicile" in keys
    assert "dpr" in keys
    # Dynamic additions based on profile
    assert "caste_cert" in keys
    assert "land_7_12" in keys


def test_marketplace_and_digital_tools_recommendation() -> None:
    profile = {
        "business_type": "handicraft",
        "gender": "female",
        "annual_turnover": 450000,
    }
    mkt_recs = recommend_marketplaces_for_profile(profile)
    assert len(mkt_recs) >= 3
    # Amazon Karigar / Saheli receives boost for rural female artisan
    karigar = next(r for r in mkt_recs if r["marketplace"]["slug"] == "amazon-karigar")
    assert karigar["score"] > 0.8

    tool_recs = recommend_digital_tools_for_profile(profile)
    assert len(tool_recs) >= 3
    # Khatabook high score for micro turnover under 10 Lakh
    khatabook = next(t for t in tool_recs if t["tool"]["slug"] == "khatabook")
    assert khatabook["score"] >= 0.9


def test_multilingual_profile_extraction() -> None:
    # Marathi text test
    mr_text = "माझा कोल्हापुरात गुळाचा कारखाना आहे, वार्षिक टर्नओव्हर २५ लाख आहे आणि मी OBC प्रवर्गात येतो."
    extracted_mr = extract_profile_from_text(mr_text)
    assert extracted_mr.get("district") == "Kolhapur"
    assert extracted_mr.get("business_type") == "agro_processing"
    assert extracted_mr.get("annual_turnover") == 2500000.0
    assert extracted_mr.get("category") == "OBC"

    # Hindi text test
    hi_text = "पुणे में हमारी दूध डेअरी है, टर्नओवर 10 लाख है, महिला बचतगट चलाते हैं।"
    extracted_hi = extract_profile_from_text(hi_text)
    assert extracted_hi.get("district") == "Pune"
    assert extracted_hi.get("business_type") == "dairy"
    assert extracted_hi.get("annual_turnover") == 1000000.0
    assert extracted_hi.get("gender") == "female"


def test_multilingual_assistant_generation() -> None:
    recs = [
        {
            "scheme": {"name": "PMEGP"},
            "eligibility_status": "eligible",
            "reasons": ["Valid activity", "District Cluster Priority: Approved 'Jaggery Cluster'"],
        }
    ]
    # Marathi response
    reply_mr = generate_assistant_response("योजना सांगा", "mr", recs, {})
    assert "PMEGP" in reply_mr
    assert "अनुदान" in reply_mr
    assert "आधार कार्ड" in reply_mr

    # Hindi response
    reply_hi = generate_assistant_response("योजना बताइए", "hi", recs, {})
    assert "PMEGP" in reply_hi
    assert "सब्सिडी" in reply_hi


def test_portal_guides_service() -> None:
    guides = list_portal_guides()
    assert len(guides) >= 3
    slugs = [g["portal_slug"] for g in guides]
    assert "aaple-sarkar" in slugs
    assert "mahadbt" in slugs
    assert "udyam" in slugs

    aaple_sarkar = get_portal_guide("aaple-sarkar")
    assert aaple_sarkar is not None
    assert len(aaple_sarkar["steps"]) == 5


def test_student_2_logistics_contract() -> None:
    quote = calculate_logistics_quote(
        origin_district="Kolhapur",
        destination_district="Pune",
        weight_kg=250.0,
        cargo_type="jaggery_boxes",
    )
    assert quote["origin_district"] == "Kolhapur"
    assert quote["destination_district"] == "Pune"
    assert len(quote["available_carriers"]) == 3
    assert "Shivam" in quote["integrated_module"]
    assert quote["available_carriers"][0]["estimated_cost_inr"] > 0


def test_student_3_growth_dashboard_contract() -> None:
    profile = {
        "business_name": "Kolhapur Organic Jaggery",
        "district": "Kolhapur",
        "annual_turnover": 2000000,
        "registration_status": "Udyam Registered",
    }
    apps = [{"id": "app-1", "scheme_id": "s-1", "status": "submitted"}]
    recs = [{"eligibility_status": "eligible", "scheme": {"name": "CMEGP"}}]

    summary = generate_growth_dashboard_summary(profile, apps, recs)
    assert summary["business_name"] == "Kolhapur Organic Jaggery"
    assert summary["digital_readiness_score"] >= 80
    assert summary["potential_subsidy_inr"] > 0
    assert "Shruti" in summary["integrated_module"]


def test_marketplaces_and_portals_api_endpoints() -> None:
    user_id = UUID("00000000-0000-0000-0000-000000000999")
    app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(
        id=user_id,
        access_token="test-token",
    )

    try:
        # 1. Marketplaces endpoint
        mkt_res = client.get("/api/v1/marketplaces")
        assert mkt_res.status_code == 200
        assert any(m["slug"] == "ondc" for m in mkt_res.json())

        # 2. Digital tools endpoint
        tool_res = client.get("/api/v1/digital-tools")
        assert tool_res.status_code == 200
        assert any(t["slug"] == "khatabook" for t in tool_res.json())

        # 3. Portals endpoint
        portal_res = client.get("/api/v1/portals")
        assert portal_res.status_code == 200
        assert any(p["portal_slug"] == "aaple-sarkar" for p in portal_res.json())

        # 4. Document checklist endpoint
        checklist_res = client.get("/api/v1/schemes/pmegp/document-checklist")
        assert checklist_res.status_code == 200
        doc_keys = [d["key"] for d in checklist_res.json()]
        assert "aadhaar" in doc_keys
        assert "udyam" in doc_keys

        # 5. Logistics quote endpoint (Student 2 contract)
        logistics_res = client.post(
            "/api/v1/integrations/logistics/quote",
            json={
                "origin_district": "Sangli",
                "destination_district": "Mumbai",
                "weight_kg": 150.0,
            },
        )
        assert logistics_res.status_code == 200
        assert "available_carriers" in logistics_res.json()
    finally:
        app.dependency_overrides.clear()
