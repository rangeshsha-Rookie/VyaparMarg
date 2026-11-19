"""Maharashtra Government & Business Portals Step-by-Step Guidance Service."""

from __future__ import annotations

from typing import Any


DEFAULT_PORTAL_GUIDES: dict[str, dict[str, Any]] = {
    "aaple-sarkar": {
        "portal_slug": "aaple-sarkar",
        "portal_name": "Aaple Sarkar Portal (आपले सरकार)",
        "official_url": "https://aaplesarkar.mahaonline.gov.in/",
        "department": "Revenue & Industries Department, Maharashtra",
        "state": "Maharashtra",
        "description": "Unified citizen portal for Maharashtra domicile, caste certificates, and business permits.",
        "steps": [
            {
                "step_number": 1,
                "title": "Registration / Login (नोंदणी / लॉगिन)",
                "description": "Visit aaplesarkar.mahaonline.gov.in, choose 'New User? Register Here' using your Aadhaar-linked mobile number.",
                "tip": "Keep your Aadhaar OTP ready.",
            },
            {
                "step_number": 2,
                "title": "Select Revenue / Industries Department",
                "description": "Choose Revenue Department to apply for Domicile or Caste Certificate, or Industries Dept for NOC.",
                "tip": "Check the processing timeline (typically 15 to 21 days under Right to Public Service).",
            },
            {
                "step_number": 3,
                "title": "Fill Details & Verify Marathi Text",
                "description": "Fill applicant details. Use the in-built transliteration tool to ensure English and Marathi names match your official documents.",
                "tip": "Check name spelling carefully against Aadhaar.",
            },
            {
                "step_number": 4,
                "title": "Upload Documents",
                "description": "Upload scanned PDF of address proof, photo (under 50KB), and self-declaration form.",
                "tip": "Files must be clear and under 256KB for PDFs.",
            },
            {
                "step_number": 5,
                "title": "Fee Payment & Application Token",
                "description": "Pay the statutory fee (₹23.60) via UPI or Net Banking. Note your Application ID.",
                "tip": "Download the acknowledgment receipt immediately.",
            },
        ],
        "prerequisites": ["Aadhaar linked mobile", "Ration card or Electricity bill", "School Leaving Certificate", "Passport photo"],
        "helpdesk_contact": "1800-120-8040 (Toll Free 24x7)",
    },
    "mahadbt": {
        "portal_slug": "mahadbt",
        "portal_name": "MahaDBT Farmer & Agro Portal (महाडीबीटी शेतकरी योजना)",
        "official_url": "https://mahadbt.maharashtra.gov.in/",
        "department": "Department of Agriculture, Maharashtra",
        "state": "Maharashtra",
        "description": "Direct Benefit Transfer portal for Maharashtra agricultural mechanization, agro-processing, and micro-irrigation subsidies.",
        "steps": [
            {
                "step_number": 1,
                "title": "Farmer Aadhaar Login",
                "description": "Login using Aadhaar authentication and OTP on the MahaDBT Farmer Schemes portal.",
                "tip": "Bank account must be seeded with Aadhaar on NPCI mapper.",
            },
            {
                "step_number": 2,
                "title": "Fetch Land Record (7/12 & 8A)",
                "description": "Enter your Village, Taluka, and Survey Number. The portal synchronizes with MahaBhulekh digitally.",
                "tip": "Ensure your name matches the land title holder.",
            },
            {
                "step_number": 3,
                "title": "Apply for Agro-Processing / Machinery",
                "description": "Select Krushi Yantrikikaran or Post-Harvest Processing unit. Submit application with nominal ₹23 fee.",
                "tip": "Applications enter a transparent computerized lottery system.",
            },
            {
                "step_number": 4,
                "title": "Pre-Sanction & Equipment Purchase",
                "description": "After selection, upload quotation from an empaneled authorized vendor and receive Pre-Sanction (पूर्वसंमती पत्र).",
                "tip": "Do NOT purchase before pre-sanction is issued.",
            },
            {
                "step_number": 5,
                "title": "Physical Verification & Subsidy Credit",
                "description": "Agriculture officer conducts geo-tagged inspection; subsidy is directly credited to your Aadhaar-linked bank account.",
                "tip": "Save geo-tagged photo with officer.",
            },
        ],
        "prerequisites": ["Digital 7/12 & 8A Extract", "Aadhaar seeded bank passbook", "Quotation from approved dealer"],
        "helpdesk_contact": "022-49150800",
    },
    "udyam": {
        "portal_slug": "udyam",
        "portal_name": "Udyam Registration (उद्यम नोंदणी)",
        "official_url": "https://udyamregistration.gov.in/",
        "department": "Ministry of Micro, Small & Medium Enterprises, Govt of India",
        "state": "All India",
        "description": "Official free portal for MSME certificate with QR code, mandatory for all government subsidies, bank loans, and GeM procurement.",
        "steps": [
            {
                "step_number": 1,
                "title": "Aadhaar & PAN Validation",
                "description": "Enter proprietor Aadhaar number and PAN. The portal validates with CBDT online.",
                "tip": "No documents need to be uploaded; verification is completely paperless.",
            },
            {
                "step_number": 2,
                "title": "Enter Unit Address & Taluka",
                "description": "Provide the manufacturing or retail address where your enterprise operates.",
                "tip": "Make sure pincode matches your postal area.",
            },
            {
                "step_number": 3,
                "title": "Select 5-Digit NIC Activity Code",
                "description": "Search by keyword (e.g. jaggery, dairy, garment) to pick your National Industrial Classification code.",
                "tip": "You can add multiple NIC codes for manufacturing + service.",
            },
            {
                "step_number": 4,
                "title": "Employment & Bank Account",
                "description": "Enter employee count, bank account number, and IFSC code.",
                "tip": "Double-check IFSC to ensure accuracy.",
            },
            {
                "step_number": 5,
                "title": "Final OTP & Instant Certificate",
                "description": "Submit final OTP. Your official Udyam Certificate with permanent registration number is generated.",
                "tip": "Udyam registration is 100% free; beware of fake fee-charging portals.",
            },
        ],
        "prerequisites": ["Aadhaar number with mobile", "PAN card", "Bank IFSC and account number"],
        "helpdesk_contact": "011-23063800",
    },
}


def get_portal_guide(slug: str) -> dict[str, Any] | None:
    return DEFAULT_PORTAL_GUIDES.get(slug)


def list_portal_guides() -> list[dict[str, Any]]:
    return list(DEFAULT_PORTAL_GUIDES.values())
