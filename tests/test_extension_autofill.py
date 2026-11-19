"""Automated Validation & Unit Tests for VyaparMarg Browser Extension and Portal Autofill."""

from html.parser import HTMLParser
from typing import Any


class FormInputParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.inputs: list[dict[str, str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in {"input", "select"}:
            attr_dict = {k.lower(): (v or "") for k, v in attrs}
            self.inputs.append(attr_dict)


FIELD_GUIDES = {
    "turnover": {
        "labels": ["turnover", "उलाढाल", "टर्नओवर", "annual turnover", "gross sales"],
        "tip_mr": "💡 व्यापारमार्ग टीप: मागील आर्थिक वर्षातील एकूण वार्षिक उलाढाल भरा.",
    },
    "category": {
        "labels": ["category", "प्रवर्ग", "जात", "caste", "social category"],
        "tip_mr": "💡 व्यापारमार्ग टीप: ३५% अनुदानासाठी जात प्रमाणपत्र आवश्यक आहे.",
    },
    "udyam": {
        "labels": ["udyam", "उद्यम", "registration no", "msme no"],
        "tip_mr": "💡 व्यापारमार्ग टीप: UDYAM-MH-XX-XXXXXXX हा १२ अंकी नंबर भरा.",
    },
    "district": {
        "labels": ["district", "जिल्हा", "district name"],
        "tip_mr": "💡 व्यापारमार्ग टीप: उद्योग ज्या जिल्ह्यात स्थित आहे तो जिल्हा निवडा.",
    },
}


def detect_portal(url: str) -> str:
    if "aaplesarkar" in url:
        return "aaple-sarkar"
    elif "mahadbt" in url:
        return "mahadbt"
    elif "udyamregistration" in url:
        return "udyam"
    elif "kviconline" in url:
        return "pmegp"
    elif "mahadiscom" in url:
        return "cmegp"
    return "unknown"


def find_autofill_candidates(html: str, profile: dict[str, Any]) -> list[dict[str, str]]:
    """Scan HTML form for safe autofill candidates, strictly protecting sensitive fields."""
    parser = FormInputParser()
    parser.feed(html)
    candidates = []

    for inp in parser.inputs:
        inp_type = inp.get("type", "text").lower()
        inp_name = (inp.get("name") or inp.get("id") or "").lower()

        # Strict Security Rules: Never touch passwords, OTPs, or CAPTCHA
        if inp_type == "password" or "otp" in inp_name or "captcha" in inp_name:
            continue

        val = inp.get("value", "").strip()
        if val:  # Do not overwrite already filled fields
            continue

        if any(k in inp_name for k in ["business", "enterprise", "unit_name"]):
            if profile.get("business_name"):
                candidates.append({"field": inp_name, "value": profile["business_name"], "label": "Business Name"})
        elif any(k in inp_name for k in ["district", "jilha"]):
            if profile.get("district"):
                candidates.append({"field": inp_name, "value": profile["district"], "label": "District"})
        elif any(k in inp_name for k in ["turnover", "sales"]):
            if profile.get("annual_turnover"):
                candidates.append({"field": inp_name, "value": str(profile["annual_turnover"]), "label": "Turnover"})

    return candidates


def test_portal_url_detection() -> None:
    assert detect_portal("https://aaplesarkar.mahaonline.gov.in/en/Application/Index") == "aaple-sarkar"
    assert detect_portal("https://mahadbt.maharashtra.gov.in/Farmer/Scheme") == "mahadbt"
    assert detect_portal("https://udyamregistration.gov.in/Udyam_Registration.aspx") == "udyam"
    assert detect_portal("https://www.kviconline.gov.in/pmegpeportal/pmegphome/index.jsp") == "pmegp"
    assert detect_portal("https://google.com") == "unknown"


def test_sensitive_fields_are_never_autofilled() -> None:
    html = """
    <form>
      <input type="text" name="business_name" value="" />
      <input type="password" name="user_password" value="" />
      <input type="text" name="otp_input" value="" />
      <input type="text" id="captcha_code" value="" />
      <input type="text" name="district_name" value="" />
    </form>
    """
    profile = {
        "business_name": "Shree Agro",
        "district": "Kolhapur",
        "annual_turnover": 2500000,
    }
    candidates = find_autofill_candidates(html, profile)
    field_names = [c["field"] for c in candidates]

    # Safe fields should be included
    assert "business_name" in field_names
    assert "district_name" in field_names

    # Sensitive fields MUST NEVER be included
    assert "user_password" not in field_names
    assert "otp_input" not in field_names
    assert "captcha_code" not in field_names


def test_prefilled_inputs_are_not_overwritten() -> None:
    html = """
    <form>
      <input type="text" name="business_name" value="Existing Enterprise" />
      <input type="text" name="district_name" value="" />
    </form>
    """
    profile = {"business_name": "New Enterprise", "district": "Pune"}
    candidates = find_autofill_candidates(html, profile)
    assert len(candidates) == 1
    assert candidates[0]["field"] == "district_name"
    assert candidates[0]["value"] == "Pune"


def test_aaple_sarkar_mock_form_autofill() -> None:
    aaple_sarkar_html = """
    <div class="form-group">
      <label>Enterprise / Business Name</label>
      <input type="text" id="txt_enterprise_name" name="enterprise_name" />
    </div>
    <div class="form-group">
      <label>District / जिल्हा</label>
      <input type="text" id="txt_district" name="txt_district" />
    </div>
    <div class="form-group">
      <label>Annual Gross Turnover</label>
      <input type="text" id="txt_annual_turnover" name="txt_annual_turnover" />
    </div>
    <div class="form-group">
      <label>Security CAPTCHA</label>
      <input type="text" id="txt_captcha" name="txt_captcha" />
    </div>
    """
    profile = {
        "business_name": "Swami Samarth Jaggery Processing",
        "district": "Gondia",
        "annual_turnover": 1800000,
    }
    candidates = find_autofill_candidates(aaple_sarkar_html, profile)
    assert len(candidates) == 3
    labels = [c["label"] for c in candidates]
    assert "Business Name" in labels
    assert "District" in labels
    assert "Turnover" in labels
