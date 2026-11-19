#!/usr/bin/env python3
"""Ingest Maharashtra Open Government Data (data/data.json) into normalized district indicators.

Parses MSICDP (Micro and Small Enterprises Cluster Development Programme) cluster data,
extracts Maharashtra districts, and produces structured district indicator records.
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any


KNOWN_MAHARASHTRA_DISTRICTS = [
    "Ahmednagar", "Akola", "Amravati", "Aurangabad", "Beed", "Bhandara",
    "Buldhana", "Chandrapur", "Dhule", "Gadchiroli", "Gondia", "Hingoli",
    "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai City", "Mumbai Suburban",
    "Nagpur", "Nanded", "Nandurbar", "Nashik", "Osmanabad", "Palghar",
    "Parbhani", "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara",
    "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal",
    "Chhatrapati Sambhajinagar", "Dharashiv", "Ahilyanagar"
]


def extract_district(location: str) -> str:
    """Extract and normalize district name from raw location string."""
    loc_clean = location.strip()
    # Check for "Dist. <Name>" or "Dist.<Name>" or "Dist <Name>"
    dist_match = re.search(r"Dist\.?\s*([A-Za-z\s]+)", loc_clean, re.IGNORECASE)
    if dist_match:
        cand = dist_match.group(1).strip()
        for d in KNOWN_MAHARASHTRA_DISTRICTS:
            if d.lower() in cand.lower():
                return d

    # Direct substring match
    for d in KNOWN_MAHARASHTRA_DISTRICTS:
        if re.search(r"\b" + re.escape(d) + r"\b", loc_clean, re.IGNORECASE):
            return d

    # Handle Osmanabad -> Dharashiv, Aurangabad -> Chhatrapati Sambhajinagar
    if "aurangabad" in loc_clean.lower():
        return "Aurangabad"
    if "osmanabad" in loc_clean.lower():
        return "Osmanabad"

    return "Maharashtra (State Level)"


def parse_clusters(json_path: Path) -> list[dict[str, Any]]:
    """Parse data.json and emit list of normalized cluster records."""
    if not json_path.exists():
        raise FileNotFoundError(f"Missing {json_path}")

    with open(json_path, "r", encoding="utf-8") as f:
        payload = json.load(f)

    rows = payload.get("data", [])
    results: list[dict[str, Any]] = []
    current_year = "2015-16"

    for row in rows:
        if len(row) < 4:
            continue
        year, count, cluster_name, location = row[0], row[1], row[2], row[3]
        if year != "NA" and year.strip():
            current_year = year.strip()

        cluster_clean = cluster_name.strip()
        district = extract_district(location)

        results.append({
            "state": "Maharashtra",
            "district": district,
            "cluster_name": cluster_clean,
            "period": current_year,
            "raw_location": location.strip(),
            "indicator_key": "approved_industrial_cluster",
            "indicator_name": f"{district} {cluster_clean}",
            "indicator_value": cluster_clean,
            "unit": "cluster",
        })

    return results


def main() -> None:
    repo_root = Path(__file__).resolve().parent.parent
    data_file = repo_root / "data" / "data.json"
    output_file = repo_root / "data" / "normalized_clusters.json"

    records = parse_clusters(data_file)
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2, ensure_ascii=False)

    print(f"Successfully processed {len(records)} cluster records from {data_file.name}.")
    print(f"Output saved to {output_file.relative_to(repo_root)}.")


if __name__ == "__main__":
    main()
