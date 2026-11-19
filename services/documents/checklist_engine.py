"""Document Checklist Engine for Rural Business Schemes."""

from __future__ import annotations

from typing import Any


DOCUMENT_CATALOG = {
    "aadhaar": {
        "key": "aadhaar",
        "name_en": "Aadhaar Card",
        "name_mr": "आधार कार्ड",
        "issuing_portal": "https://myaadhaar.uidai.gov.in/",
        "authority": "UIDAI",
        "help_text": "Must be linked to active mobile number for OTP verification.",
        "mandatory": True,
    },
    "pan": {
        "key": "pan",
        "name_en": "PAN Card",
        "name_mr": "पॅन कार्ड",
        "issuing_portal": "https://onlineservices.nsdl.com/",
        "authority": "Income Tax Department",
        "help_text": "Required for loan disbursement and tax verification.",
        "mandatory": True,
    },
    "udyam": {
        "key": "udyam",
        "name_en": "Udyam Registration Certificate",
        "name_mr": "उद्यम नोंदणी प्रमाणपत्र",
        "issuing_portal": "https://udyamregistration.gov.in/",
        "authority": "Ministry of MSME",
        "help_text": "100% free online certificate. Instant download with QR code.",
        "mandatory": True,
    },
    "domicile": {
        "key": "domicile",
        "name_en": "Maharashtra Domicile Certificate",
        "name_mr": "महाराष्ट्र अधिवास दाखला (Domicile)",
        "issuing_portal": "https://aaplesarkar.mahaonline.gov.in/",
        "authority": "Revenue Department, Govt of Maharashtra",
        "help_text": "Mandatory for state schemes like CMEGP and MahaDBT.",
        "mandatory": False,
    },
    "caste_cert": {
        "key": "caste_cert",
        "name_en": "Caste Certificate",
        "name_mr": "जात प्रमाणपत्र",
        "issuing_portal": "https://aaplesarkar.mahaonline.gov.in/",
        "authority": "Sub-Divisional Magistrate / Aaple Sarkar",
        "help_text": "Required to claim special 35% margin money subsidy.",
        "mandatory": False,
    },
    "dpr": {
        "key": "dpr",
        "name_en": "Detailed Project Report (DPR)",
        "name_mr": "प्रकल्प अहवाल (DPR)",
        "issuing_portal": "VyaparMarg DPR Assistant",
        "authority": "Chartered Accountant / District Industries Centre (DIC)",
        "help_text": "Summary of capital cost, working capital, and 3-year projected cash flow.",
        "mandatory": True,
    },
    "bank_passbook": {
        "key": "bank_passbook",
        "name_en": "Bank Passbook / Cancelled Cheque",
        "name_mr": "बँक पासबुक / कॅन्सल्ड चेक",
        "issuing_portal": "Your Bank Branch / Mobile Banking",
        "authority": "Commercial / Rural Regional Bank (RRB)",
        "help_text": "Account must be mapped to NPCI for direct DBT subsidy.",
        "mandatory": True,
    },
    "land_7_12": {
        "key": "land_7_12",
        "name_en": "7/12 & 8A Land Record Extract",
        "name_mr": "डिजिटल ७/१२ व ८-अ उतारा",
        "issuing_portal": "https://digitalsatbara.mahabhumi.gov.in/",
        "authority": "Revenue & Land Records Dept, Maharashtra",
        "help_text": "Essential for agro-processing and MahaDBT farm subsidies.",
        "mandatory": False,
    },
}

# Scheme to document key mappings
SCHEME_DOCUMENT_RULES: dict[str, list[str]] = {
    "pmegp": ["aadhaar", "pan", "udyam", "dpr", "bank_passbook"],
    "cmegp-mah": ["aadhaar", "pan", "udyam", "domicile", "dpr", "bank_passbook"],
    "pmsvanidhi": ["aadhaar", "bank_passbook"],
    "mudra-shishu-kishore": ["aadhaar", "pan", "bank_passbook", "udyam"],
    "stand-up-india": ["aadhaar", "pan", "udyam", "dpr", "bank_passbook"],
    "mahadbt-agro-processing": ["aadhaar", "land_7_12", "bank_passbook", "pan"],
}


def generate_document_checklist(
    scheme_slug: str,
    profile: dict[str, Any],
    existing_documents: list[dict[str, Any]] | None = None
) -> list[dict[str, Any]]:
    """Build a personalized document readiness checklist for an entrepreneur."""
    doc_keys = list(SCHEME_DOCUMENT_RULES.get(scheme_slug, ["aadhaar", "pan", "bank_passbook"]))

    # If applicant is SC/ST/OBC or woman claiming CMEGP/PMEGP, add caste certificate
    category = str(profile.get("category", "")).lower()
    if category in {"sc", "st", "obc", "vjnt"} and "caste_cert" not in doc_keys:
        doc_keys.append("caste_cert")

    # If business type involves agriculture or agro-processing, add 7/12
    biz_type = str(profile.get("business_type", "")).lower()
    if any(k in biz_type for k in ["agro", "farming", "dairy", "jaggery"]) and "land_7_12" not in doc_keys:
        doc_keys.append("land_7_12")

    existing_map = {}
    if existing_documents:
        for d in existing_documents:
            existing_map[d.get("document_type", "")] = d.get("status", "uploaded")

    checklist = []
    for key in doc_keys:
        meta = DOCUMENT_CATALOG.get(key, {
            "key": key,
            "name_en": key.title(),
            "name_mr": key,
            "issuing_portal": "Government Portal",
            "authority": "Government of India / Maharashtra",
            "help_text": "Verify document details.",
            "mandatory": True,
        })
        current_status = existing_map.get(key, "missing")
        checklist.append({
            "key": meta["key"],
            "name_en": meta["name_en"],
            "name_mr": meta["name_mr"],
            "issuing_portal": meta["issuing_portal"],
            "authority": meta["authority"],
            "help_text": meta["help_text"],
            "mandatory": meta["mandatory"],
            "status": current_status,
            "is_ready": current_status in {"ready", "uploaded", "verified"},
        })

    return checklist
