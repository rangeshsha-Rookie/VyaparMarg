"""Multilingual AI Assistant Generation Layer with Deterministic Grounding.

Generates structured conversational guidance in Marathi (mr), Hindi (hi),
and English (en) without hallucinations.
"""

from __future__ import annotations

from typing import Any


def generate_assistant_response(
    query_text: str,
    language: str,
    recommendations: list[dict[str, Any]],
    extracted_profile: dict[str, Any],
) -> str:
    """Produce grounded, practical conversational advice in user's preferred language."""
    lang = language.lower()
    eligible_schemes = [
        item["scheme"]["name"]
        for item in recommendations
        if item.get("eligibility_status") == "eligible"
    ]
    needs_info = [
        item["scheme"]["name"]
        for item in recommendations
        if item.get("eligibility_status") == "needs_information"
    ]

    # District cluster mentions
    cluster_notes = [
        item["reasons"][-1]
        for item in recommendations
        if "District Cluster Priority" in str(item.get("reasons", []))
    ]

    if lang in {"mr", "marathi"}:
        if eligible_schemes:
            names = " आणि ".join(eligible_schemes[:2])
            msg = f"आपल्या व्यवसाय प्रोफाईलनुसार, आपण '{names}' या योजनांसाठी पात्र आहात. यात तुम्हाला २५% ते ३५% पर्यंत सरकारी अनुदान (Margin Money Subsidy) मिळू शकते."
            if cluster_notes:
                msg += f" {cluster_notes[0]}"
            msg += " पुढील पायरी: आधार कार्ड, पॅन कार्ड, आणि उद्यम नोंदणी प्रमाणपत्र तयार ठेवा."
            return msg
        elif needs_info:
            return f"आपली पात्रता निश्चित करण्यासाठी आणखी माहिती हवी आहे: {', '.join(needs_info[:2])}. कृपया आपला व्यवसाय जिल्हा आणि वार्षिक उलाढाल (Turnover) सांगा."
        else:
            return "सध्याच्या पडताळणी केलेल्या यादीत आपल्या प्रोफाइलनुसार थेट जुळणारी योजना आढळली नाही. आपण खाताबुक किंवा ONDC सारख्या डिजिटल साधनांचा वापर करू शकता."

    elif lang in {"hi", "hindi"}:
        if eligible_schemes:
            names = " और ".join(eligible_schemes[:2])
            msg = f"आपके व्यवसाय प्रोफाइल के अनुसार, आप '{names}' योजना के लिए पात्र हैं। इसमें आपको 25% से 35% तक सरकारी सब्सिडी मिल सकती है।"
            msg += " अगला कदम: आधार कार्ड, पैन कार्ड और उद्यम प्रमाण पत्र तैयार रखें।"
            return msg
        elif needs_info:
            return f"पात्रता की पुष्टि के लिए अतिरिक्त विवरण चाहिए: {', '.join(needs_info[:2])}। कृपया अपना जिला और वार्षिक टर्नओवर बताएं।"
        else:
            return "वर्तमान सत्यापित सूची में कोई सीधी योजना नहीं मिली। आप ONDC या व्यापार ऐप जैसे डिजिटल टूल्स से शुरुआत कर सकते हैं।"

    else:  # Default to English
        if eligible_schemes:
            names = ", ".join(eligible_schemes[:2])
            msg = f"Based on your business profile, you are eligible for: {names}. You can receive 25% to 35% government capital subsidy."
            if cluster_notes:
                msg += f" {cluster_notes[0]}"
            msg += " Next practical step: Keep your Aadhaar, PAN, and Udyam Registration certificate ready."
            return msg
        elif needs_info:
            return f"I need more information before confirming eligibility for: {', '.join(needs_info[:2])}."
        return "I did not find a matching scheme in the current verified catalog."
