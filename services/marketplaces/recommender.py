"""Marketplace & Digital Tool Opportunity Recommendation Engine."""

from __future__ import annotations

from typing import Any


DEFAULT_MARKETPLACES: list[dict[str, Any]] = [
    {
        "id": "mkt-ondc-01",
        "slug": "ondc",
        "name": "Open Network for Digital Commerce (ONDC)",
        "category": "b2c",
        "description": "Government-backed open e-commerce protocol allowing rural sellers to sell across multiple buyer apps with low fees.",
        "target_sectors": ["retail", "grocery", "agro_processing", "handicraft", "food_processing", "dairy"],
        "onboarding_url": "https://ondc.org/seller-network/",
        "commission_model": "1-3% network fee",
        "benefits": ["Zero platform lock-in", "Direct customer access", "Integrated logistics"],
        "required_documents": ["Udyam Registration", "PAN Card", "Bank Account"],
        "active": True,
    },
    {
        "id": "mkt-gem-02",
        "slug": "gem",
        "name": "Government e-Marketplace (GeM)",
        "category": "government_procurement",
        "description": "Direct selling to central and state government departments under mandatory MSME procurement quota.",
        "target_sectors": ["manufacturing", "furniture", "handicraft", "textile", "agro_products"],
        "onboarding_url": "https://gem.gov.in/",
        "commission_model": "0% transaction fee up to 20 Lakh INR",
        "benefits": ["Mandatory 25% government MSME quota", "Direct online payment", "National reach"],
        "required_documents": ["Udyam Certificate", "PAN Card", "GSTIN or Declaration"],
        "active": True,
    },
    {
        "id": "mkt-amazon-karigar-03",
        "slug": "amazon-karigar",
        "name": "Amazon Karigar & Saheli",
        "category": "handicrafts_rural",
        "description": "Dedicated storefront for rural artisans, handloom weavers, and women-led enterprises.",
        "target_sectors": ["handicraft", "handloom", "textile", "pottery", "organic_food"],
        "onboarding_url": "https://www.amazon.in/b?node=12415848031",
        "commission_model": "Subsidized referral fee for 12 months",
        "benefits": ["Access to 100M+ customers", "Cataloging and photography support"],
        "required_documents": ["Artisan Card or Udyam", "Bank Account", "PAN Card"],
        "active": True,
    },
    {
        "id": "mkt-indiamart-04",
        "slug": "indiamart",
        "name": "IndiaMART Rural Wholesale B2B",
        "category": "b2b",
        "description": "B2B platform connecting rural manufacturers and agro-processors with bulk wholesalers and retail buyers across India.",
        "target_sectors": ["manufacturing", "agro_processing", "jaggery", "spices", "dairy", "packaging"],
        "onboarding_url": "https://seller.indiamart.com/",
        "commission_model": "Free basic listing; premium leads available",
        "benefits": ["High-volume bulk orders", "Direct buyer phone inquiries"],
        "required_documents": ["Business PAN", "Bank Details"],
        "active": True,
    },
]

DEFAULT_DIGITAL_TOOLS: list[dict[str, Any]] = [
    {
        "id": "tool-khatabook-01",
        "slug": "khatabook",
        "name": "Khatabook (खाताबुक)",
        "tool_type": "accounting_invoicing",
        "pricing_tier": "freemium",
        "description": "Digital ledger app for micro-merchants and rural shopkeepers to manage customer credit and WhatsApp reminders.",
        "best_for": "Managing daily Udhar ledger, customer balance tracking, and automatic WhatsApp reminders.",
        "official_url": "https://khatabook.com/",
        "supported_languages": ["mr", "hi", "en"],
        "features": ["WhatsApp payment reminders", "Offline recording", "Customer balance statement PDF"],
        "offline_support": True,
        "active": True,
    },
    {
        "id": "tool-vyapar-02",
        "slug": "vyapar-app",
        "name": "Vyapar App (व्यापार)",
        "tool_type": "accounting_invoicing",
        "pricing_tier": "freemium",
        "description": "Simplified billing, inventory stock management, and GST invoicing software tailored for Indian small enterprises.",
        "best_for": "Thermal billing printouts, low stock alerts, and offline inventory tracking.",
        "official_url": "https://vyaparapp.in/",
        "supported_languages": ["mr", "hi", "en"],
        "features": ["Thermal printing support", "Stock low-inventory warning", "Offline bill creation"],
        "offline_support": True,
        "active": True,
    },
    {
        "id": "tool-gpay-03",
        "slug": "google-pay-business",
        "name": "Google Pay for Business",
        "tool_type": "digital_payments",
        "pricing_tier": "free",
        "description": "Zero-cost QR payment acceptance for micro-retailers with instant regional audio soundbox confirmation.",
        "best_for": "Instant contactless QR payments and daily automatic bank settlement at 0% MDR fee.",
        "official_url": "https://pay.google.com/intl/en_in/about/business/",
        "supported_languages": ["mr", "hi", "en"],
        "features": ["Soundbox voice confirmation in Marathi/Hindi", "0% UPI transaction fees", "Daily automatic settlement"],
        "offline_support": False,
        "active": True,
    },
    {
        "id": "tool-shiprocket-04",
        "slug": "shiprocket",
        "name": "Shiprocket Rural Shipping",
        "tool_type": "logistics_shipping",
        "pricing_tier": "freemium",
        "description": "Automated courier rate comparison (Delhivery, India Post Speed Post) with door pickup in rural talukas.",
        "best_for": "Direct-to-consumer parcel shipping across India with Cash on Delivery (COD) collection.",
        "official_url": "https://www.shiprocket.in/",
        "supported_languages": ["hi", "en"],
        "features": ["Multiple carrier comparison", "Cash on Delivery (COD) reconciliation", "Rural doorstep pickup"],
        "offline_support": False,
        "active": True,
    },
]


def recommend_marketplaces_for_profile(
    profile: dict[str, Any],
    catalog: list[dict[str, Any]] | None = None
) -> list[dict[str, Any]]:
    """Match business profile against e-commerce and wholesale marketplaces."""
    marketplaces = catalog if catalog is not None else DEFAULT_MARKETPLACES
    biz_type = str(profile.get("business_type", "")).lower()
    gender = str(profile.get("gender", "")).lower()

    ranked = []
    for mkt in marketplaces:
        if not mkt.get("active", True):
            continue
        sectors = [s.lower() for s in mkt.get("target_sectors", [])]
        score = 0.5
        reasons = []

        if any(s in biz_type for s in sectors) or not sectors:
            score += 0.35
            reasons.append(f"Target sector '{biz_type}' aligns with this marketplace.")
        else:
            reasons.append("Available for broader product catalog expansion.")

        if mkt["slug"] == "amazon-karigar" and gender == "female":
            score += 0.15
            reasons.append("Special Amazon Saheli benefit for women-owned enterprises.")

        score = min(1.0, round(score, 2))
        ranked.append({
            "marketplace": mkt,
            "score": score,
            "reasons": reasons,
            "onboarding_url": mkt["onboarding_url"],
        })

    ranked.sort(key=lambda x: -x["score"])
    return ranked


def recommend_digital_tools_for_profile(
    profile: dict[str, Any],
    catalog: list[dict[str, Any]] | None = None
) -> list[dict[str, Any]]:
    """Recommend accounting, payments, and shipping tools for micro-entrepreneurs."""
    tools = catalog if catalog is not None else DEFAULT_DIGITAL_TOOLS
    biz_type = str(profile.get("business_type", "")).lower()
    turnover = float(profile.get("annual_turnover") or 0)

    ranked = []
    for tool in tools:
        if not tool.get("active", True):
            continue
        score = 0.6
        reasons = []

        if tool["tool_type"] == "accounting_invoicing":
            if turnover < 1_000_000:
                reasons.append("Ideal for daily cash and customer credit (Udhar) tracking.")
                score = 0.95
            else:
                reasons.append("Provides GST-ready invoices and inventory management.")
                score = 0.90
        elif tool["tool_type"] == "digital_payments":
            reasons.append("0% fee UPI payment acceptance with regional voice confirmation.")
            score = 0.88
        elif tool["tool_type"] == "logistics_shipping":
            if any(k in biz_type for k in ["manufacturing", "agro_processing", "handicraft"]):
                reasons.append("Essential for shipping packaged products outside your taluka.")
                score = 0.85
            else:
                score = 0.60

        ranked.append({
            "tool": tool,
            "score": score,
            "reasons": reasons,
            "official_url": tool["official_url"],
        })

    ranked.sort(key=lambda x: -x["score"])
    return ranked
