"""Multilingual Natural Language Profile Entity Extractor.

Extracts structured business profile fields from Marathi, Hindi, Hinglish,
and English user queries.
"""

from __future__ import annotations

import re
from typing import Any


DISTRICT_ALIASES: list[tuple[list[str], str]] = [
    (["ahmednagar", "अहमदनगर", "अहिल्यानगर"], "Ahmednagar"),
    (["akola", "अकोला"], "Akola"),
    (["amravati", "अमरावती"], "Amravati"),
    (["aurangabad", "औरंगाबाद", "संभाजीनगर", "chhatrapati sambhajinagar"], "Aurangabad"),
    (["beed", "बीड"], "Beed"),
    (["bhandara", "भंडारा"], "Bhandara"),
    (["buldhana", "बुलढाणा"], "Buldhana"),
    (["chandrapur", "चंद्रपूर"], "Chandrapur"),
    (["dhule", "धुळे"], "Dhule"),
    (["gadchiroli", "गडचिरोली"], "Gadchiroli"),
    (["gondia", "गोंदिया"], "Gondia"),
    (["hingoli", "हिंगोली"], "Hingoli"),
    (["jalgaon", "जळगाव"], "Jalgaon"),
    (["jalna", "जालना"], "Jalna"),
    (["kolhapur", "कोल्हापूर", "कोल्हापुरात"], "Kolhapur"),
    (["latur", "लातूर"], "Latur"),
    (["mumbai", "मुंबई"], "Mumbai"),
    (["nagpur", "नागपूर"], "Nagpur"),
    (["nanded", "नांदेड"], "Nanded"),
    (["nandurbar", "नंदुरबार"], "Nandurbar"),
    (["nashik", "नाशिक"], "Nashik"),
    (["osmanabad", "उस्मानाबाद", "धाराशिव"], "Osmanabad"),
    (["palghar", "पालघर"], "Palghar"),
    (["parbhani", "परभणी"], "Parbhani"),
    (["pune", "पुणे", "पुण्यात"], "Pune"),
    (["raigad", "रायगड"], "Raigad"),
    (["ratnagiri", "रत्नागिरी"], "Ratnagiri"),
    (["sangli", "सांगली", "सांगलीत"], "Sangli"),
    (["satara", "सातारा"], "Satara"),
    (["sindhudurg", "सिंधुदुर्ग"], "Sindhudurg"),
    (["solapur", "सोलापूर", "सोलापुरात"], "Solapur"),
    (["thane", "ठाणे", "ठाण्यात"], "Thane"),
    (["wardha", "वर्धा"], "Wardha"),
    (["washim", "वाशिम"], "Washim"),
    (["yavatmal", "यवतमाळ"], "Yavatmal"),
]

BUSINESS_TYPE_PATTERNS = [
    (r"\b(dairy|दूध|दुग्ध|दही|तूप|खवा)\b", "dairy"),
    (r"(jaggery|गूळ|गुळाचा|गुळ|गुळाची)", "agro_processing"),
    (r"\b(kirana|किराणा|दुकान|retail|विक्री|vending|vendor|गाडा)\b", "retail"),
    (r"\b(garment|कापड|शिलाई|सिलाई|textile|हातमाग|weaver)\b", "textile"),
    (r"\b(food|खाद्य|मसाले|लोणचे|पापड|bakery|शेवई|बेकरी)\b", "food_processing"),
    (r"\b(farm|शेती|कृषी|agro|tractors|avjare|बियाणे)\b", "agriculture"),
    (r"\b(manufacturing|उत्पादन|कारखाना|factory)\b", "manufacturing"),
    (r"\b(service|सेवा|reparation|वर्कशॉप|salon|पार्लर)\b", "service"),
]


def extract_turnover_inr(text: str) -> float | None:
    """Extract annual turnover in INR from expressions like '25 lakh', '10 लाखांपर्यंत', '50,000'."""
    lower = text.lower()
    # Check for crore / कोटी
    cr_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:cr|crore|कोटी)", lower)
    if cr_match:
        return float(cr_match.group(1)) * 10_000_000

    # Check for lakh / लाख
    lakh_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:lakh|lac|लाख)", lower)
    if lakh_match:
        return float(lakh_match.group(1)) * 100_000

    # Check for plain numbers e.g. 50000 or 50,000
    num_match = re.search(r"\b(\d{1,3}(?:,\d{3})+|\d{4,8})\b", lower)
    if num_match:
        cleaned = num_match.group(1).replace(",", "")
        return float(cleaned)

    return None


def extract_profile_from_text(text: str) -> dict[str, Any]:
    """Parse raw conversational text into structured business profile fields."""
    lower = text.lower()
    extracted: dict[str, Any] = {}

    # 1. District extraction
    for aliases, standard_name in DISTRICT_ALIASES:
        if any(alias in lower for alias in aliases):
            extracted["district"] = standard_name
            extracted["state"] = "Maharashtra"
            break

    # 2. Business type extraction
    for pattern, b_type in BUSINESS_TYPE_PATTERNS:
        if re.search(pattern, lower, re.IGNORECASE):
            extracted["business_type"] = b_type
            break

    # 3. Turnover extraction
    turnover = extract_turnover_inr(text)
    if turnover is not None:
        extracted["annual_turnover"] = turnover

    # 4. Gender / Women-owned enterprise
    if any(w in lower for w in ["महिला", "स्त्री", "woman", "women", "ladies", "बचतगट"]):
        extracted["gender"] = "female"
    elif any(w in lower for w in ["पुरुष", "male", "man"]):
        extracted["gender"] = "male"

    # 5. Social category
    if re.search(r"\b(sc|अनुसूचित जाती)\b", lower):
        extracted["category"] = "SC"
    elif re.search(r"\b(st|अनुसूचित जमाती|आदिवासी)\b", lower):
        extracted["category"] = "ST"
    elif re.search(r"\b(obc|इतर मागासवर्गीय)\b", lower):
        extracted["category"] = "OBC"
    elif re.search(r"\b(general|खुला प्रवर्ग)\b", lower):
        extracted["category"] = "General"

    # 6. Rural indicator
    if any(w in lower for w in ["गावात", "ग्रामीण", "खेडेगाव", "rural", "village"]):
        extracted["is_urban"] = False
    elif any(w in lower for w in ["शहरात", "शहर", "urban", "city"]):
        extracted["is_urban"] = True

    return extracted
